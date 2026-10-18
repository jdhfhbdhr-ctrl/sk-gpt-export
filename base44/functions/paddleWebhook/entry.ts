import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';

function hexFromBytes(bytes) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Map Paddle subscription statuses to our Subscription.status enum.
function mapSubStatus(s) {
  const m = {
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    paused: 'paused',
    canceled: 'canceled',
    deleted: 'canceled'
  };
  return m[s] || 'active';
}

// Best-effort plan/billing-cycle detection from a Paddle price id (used only when
// the checkout did not pass custom_data). These are the sandbox catalog ids;
// live ids are handled via custom_data set by the checkout.
function planFromPriceId(priceId) {
  const known = {
    pri_01m2t6ratvvbpankhe6hgyr8t6: ['starter', 'monthly'],
    pri_01m2t71s7hy8n2y1y07g46sdkv: ['starter', 'yearly'],
    pri_01m2t73s0578h572bxsb2ryj4x: ['pro', 'monthly'],
    pri_01m2t785wc1n59b8mj1nx3e5mx: ['pro', 'yearly'],
    pri_01m2t79pxv1ktqhwvdr433zvjs: ['advanced', 'monthly'],
    pri_01m2t7b37kwf93ehfhfjz59z8b: ['advanced', 'yearly']
  };
  return known[priceId] || null;
}

function resolvePlanCycle(customData, items) {
  let plan = 'starter';
  let billingCycle = 'monthly';
  if (customData && customData.plan) plan = customData.plan;
  if (customData && customData.billing_cycle) {
    billingCycle = customData.billing_cycle;
  } else if (Array.isArray(items) && items[0] && items[0].price) {
    const guess = planFromPriceId(items[0].price.id || '');
    if (guess) { plan = guess[0]; billingCycle = guess[1]; }
  }
  return { plan, billingCycle };
}

export default async function(req) {
  try {
    const secret = secrets.get('PADDLE_WEBHOOK_SECRET');
    console.log('[paddleWebhook] secret_present=', !!secret, 'secret_len=', secret ? secret.length : 0);
    if (!secret) return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });

    const signature = req.headers.get('Paddle-Signature') || req.headers.get('paddle-signature') || '';
    console.log('[paddleWebhook] signature_present=', !!signature);
    if (!signature) return Response.json({ error: 'Missing signature' }, { status: 401 });

    const rawBody = await req.text();
    const parts = Object.fromEntries(signature.split(';').map((p) => p.split('=')));
    const ts = parts.ts;
    const h1 = parts.h1;
    console.log('[paddleWebhook] ts_present=', !!ts, 'h1_present=', !!h1, 'raw_body_len=', rawBody.length);
    if (!ts || !h1) return Response.json({ error: 'Invalid signature format' }, { status: 401 });

    // HMAC-SHA256 verification of the Paddle signature.
    // A valid HMAC proves authenticity regardless of the ts age, so we do NOT
    // reject old timestamps — Paddle retries failed deliveries using the original
    // ts, and idempotent upsert below safely handles replays. Returning 401 for a
    // valid-but-old signature would block Paddle's retry queue (root cause of the
    // 401s). 401 is returned only for missing/invalid signatures (below).
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signed = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}:${rawBody}`));
    const computed = hexFromBytes(signed);
    const hmacMatch = computed === h1;
    console.log('[paddleWebhook] hmac_match=', hmacMatch);
    if (!hmacMatch) return Response.json({ error: 'Invalid signature' }, { status: 401 });

    const event = JSON.parse(rawBody);
    const base44 = createClientFromRequest(req);
    const type = event.event_type || '';
    console.log('[paddleWebhook] event_type=', type);
    const d = event.data || {};

    // --- Subscription lifecycle events ---
    // subscription.created / subscription.updated / subscription.canceled
    if (type.startsWith('subscription.')) {
      const subId = d.id;
      if (!subId) return Response.json({ received: true, type });

      const { plan, billingCycle } = resolvePlanCycle(d.custom_data, d.items);
      const status = mapSubStatus(d.status);

      const record = {
        paddle_subscription_id: subId,
        paddle_customer_id: d.customer_id || '',
        user_id: (d.custom_data && d.custom_data.user_id) || '',
        plan,
        billing_cycle: billingCycle,
        status,
        current_period_end: (d.current_billing_period && d.current_billing_period.ends_at) || ''
      };

      // Idempotent upsert by paddle_subscription_id — no duplicate subscriptions.
      const existing = await base44.asServiceRole.entities.Subscription.filter({ paddle_subscription_id: subId });
      if (existing && existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, record);
      } else {
        await base44.asServiceRole.entities.Subscription.create(record);
      }
      return Response.json({ received: true, type, subscription_id: subId, status });
    }

    // --- Transaction (payment) events ---
    // transaction.completed / transaction.paid → activate the subscription.
    // Access is activated ONLY after a valid successful payment event.
    if (type.startsWith('transaction.')) {
      const subId = d.subscription_id;
      if (!subId) return Response.json({ received: true, type });

      const paid = (d.status === 'completed' || d.status === 'paid');
      const existing = await base44.asServiceRole.entities.Subscription.filter({ paddle_subscription_id: subId });

      if (existing && existing.length > 0) {
        const patch = {};
        if (paid) patch.status = 'active';
        if (d.custom_data && d.custom_data.user_id) patch.user_id = d.custom_data.user_id;
        if (d.custom_data && d.custom_data.plan) patch.plan = d.custom_data.plan;
        if (Object.keys(patch).length) {
          await base44.asServiceRole.entities.Subscription.update(existing[0].id, patch);
        }
      } else if (paid) {
        // Payment confirmed before the subscription event arrived — create the record
        // so activation isn't lost; subscription.* events will update it.
        const { plan, billingCycle } = resolvePlanCycle(d.custom_data, d.items);
        await base44.asServiceRole.entities.Subscription.create({
          paddle_subscription_id: subId,
          paddle_customer_id: d.customer_id || '',
          user_id: (d.custom_data && d.custom_data.user_id) || '',
          plan,
          billing_cycle: billingCycle,
          status: 'active',
          current_period_end: ''
        });
      }
      return Response.json({ received: true, type, subscription_id: subId, paid });
    }

    return Response.json({ received: true, type });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}