import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { usePaddle } from '@/components/PaddleProvider';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Sparkles,
    tagline: 'For getting started',
    monthly: { price: 9, priceId: 'pri_01m3njmbfvtrva67ms8aje3cja' },
    yearly: { price: 89, priceId: 'pri_01m3njsfkp8ycaznt1qw40agf' },
    features: ['Fast multilingual AI chat', 'Generate up to 50 images / mo', 'PDF file analysis', 'Conversation history', '7-day free trial']
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    tagline: 'For power users',
    highlighted: true,
    monthly: { price: 29, priceId: 'pri_01m3njwgehg568vq19xym2h4d0' },
    yearly: { price: 279, priceId: 'pri_01m3nk5jncvzpyr3bb2dkd4dw5' },
    features: ['Everything in Starter', 'Generate up to 300 images / mo', 'Scheduled & temporary chats', 'Priority response speed', 'All 20+ languages', '7-day free trial']
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: Crown,
    tagline: 'For teams & creators',
    monthly: { price: 59, priceId: 'pri_01m3njz2axr0b0qf6tjey62rpp' },
    yearly: { price: 569, priceId: 'pri_01m3nkd9md8s8867hewhsxs2f2' },
    features: ['Everything in Pro', 'Unlimited image generation', 'Advanced PDF & document tools', 'Highest priority speed', 'Early access to new features', '7-day free trial']
  }
];

const SUCCESS_URL = typeof window !== 'undefined' ? `${window.location.origin}/upgrade?status=success` : '/upgrade?status=success';

export default function Upgrade() {
  const { user } = useAuth();
  const { ready, error: paddleError, openCheckout } = usePaddle();
  const [cycle, setCycle] = useState('monthly');
  const [busy, setBusy] = useState(null);

  const handleSubscribe = async (plan) => {
    if (!ready) { alert('Payment system is still loading. Please try again in a moment.'); return; }
    const config = cycle === 'yearly' ? plan.yearly : plan.monthly;
    setBusy(plan.id);
    try {
      await openCheckout({
        priceId: config.priceId,
        customerEmail: user?.email,
        successUrl: SUCCESS_URL,
        customData: {
          user_id: user?.id || '',
          plan: plan.id,
          billing_cycle: cycle
        }
      });
    } catch (err) {
      alert('Could not open checkout. ' + (err?.message || 'Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Crown size={22} />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Upgrade your plan</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Pick a plan to unlock faster responses, image generation, and more. Every plan starts with a 7-day free trial.
          </p>
        </div>

        {paddleError && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">Checkout unavailable</p>
            <p className="mt-1 text-destructive/90">{paddleError}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              If checkout still fails, add this site's domain to Paddle → Checkout settings → Approved domains, and confirm the live price IDs are active.
            </p>
          </div>
        )}

        {/* Billing toggle */}
        <div className="mt-7 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${cycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <button
            onClick={() => setCycle((c) => (c === 'monthly' ? 'yearly' : 'monthly'))}
            className="relative h-7 w-12 rounded-full bg-primary transition-colors"
            role="switch"
            aria-checked={cycle === 'yearly'}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-background transition-all ${cycle === 'yearly' ? 'left-6' : 'left-1'}`} />
          </button>
          <span className={`text-sm font-medium ${cycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Save ~17%</span>
          </span>
        </div>

        {/* Plans */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const config = cycle === 'yearly' ? plan.yearly : plan.monthly;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${plan.highlighted ? 'border-primary shadow-lg ring-1 ring-primary' : 'bg-card'}`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${plan.highlighted ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-end gap-1">
                  <span className="font-display text-4xl font-bold tracking-tight">${config.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">/{cycle === 'yearly' ? 'year' : 'month'}</span>
                </div>
                <p className="mt-1 text-xs text-emerald-600 font-medium">7-day free trial included</p>

                <Button
                  className="mt-5 w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  disabled={busy === plan.id}
                  onClick={() => handleSubscribe(plan)}
                >
                  {busy === plan.id ? 'Opening…' : 'Subscribe'}
                </Button>

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Secure checkout powered by Paddle. Cancel anytime.
        </p>
      </div>
    </div>
  );
}