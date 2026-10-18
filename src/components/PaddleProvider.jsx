import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const PaddleContext = createContext({ ready: false, error: null, openCheckout: async () => {} });

export function usePaddle() {
  return useContext(PaddleContext);
}

const SCRIPT_ID = 'paddle-js-loader';

function loadPaddleScript() {
  return new Promise((resolve, reject) => {
    if (window.Paddle) return resolve();
    if (document.getElementById(SCRIPT_ID)) {
      const check = setInterval(() => {
        if (window.Paddle) { clearInterval(check); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paddle.js'));
    document.head.appendChild(script);
  });
}

export default function PaddleProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('getPaddleConfig', {});
        if (!res || !res.data || !res.data.clientToken) {
          if (active) setError('Paddle is not configured. Add your live client token in Settings → Secrets.');
          return;
        }
        const { clientToken, environment } = res.data;
        const tokenPrefix = typeof clientToken === 'string' ? clientToken.slice(0, 5) : '';
        console.log('[Paddle] config received', { environment, tokenPrefix, hasToken: Boolean(clientToken) });
        await loadPaddleScript();
        if (!window.Paddle) {
          if (active) setError('Could not load the Paddle checkout script.');
          return;
        }
        // Live tokens run in Paddle's production environment (the script default);
        // sandbox tokens switch the SDK into sandbox mode.
        if (environment === 'sandbox') {
          console.log('[Paddle] switching SDK to sandbox environment');
          window.Paddle.Environment.set('sandbox');
        } else {
          console.log('[Paddle] using production (live) environment');
        }
        window.Paddle.Initialize({
          token: clientToken,
          eventCallback: (e) => {
            if (!e || !e.name) return;
            if (e.name === 'checkout.error') {
              // Extract the real Paddle error code/detail so the page can show
              // a meaningful reason instead of the generic event name.
              const err = (e.data && e.data.error) || {};
              const code = err.code || err.type || 'unknown';
              const detail = err.detail || err.message || '';
              console.error('[Paddle] checkout.error', { name: e.name, code, detail, data: e.data });
              const msg = detail ? `${code}: ${detail}` : code;
              setError(typeof msg === 'string' ? `Checkout error (${msg})` : 'Checkout error from Paddle.');
            } else {
              console.log('[Paddle] event:', e.name, e.data || '');
            }
          }
        });
        console.log('[Paddle] Initialize completed for', tokenPrefix, 'environment');
        if (active) setReady(true);
      } catch (err) {
        console.error('Paddle init failed', err);
        if (active) setError(err?.message || 'Failed to initialize Paddle checkout.');
      }
    })();
    return () => { active = false; };
  }, []);

  const openCheckout = useCallback(async ({ priceId, customerEmail, successUrl, customData }) => {
    if (!window.Paddle || !ready) throw new Error('Paddle is not ready yet');
    setError(null);
    const items = [{ priceId, quantity: 1 }];
    console.log('[Paddle] opening checkout', { priceId, hasEmail: Boolean(customerEmail), successUrl, items });
    try {
      window.Paddle.Checkout.open({
        items,
        customer: customerEmail ? { email: customerEmail } : undefined,
        settings: successUrl ? { successUrl } : undefined,
        ...(customData ? { custom_data: customData } : {})
      });
    } catch (err) {
      console.error('[Paddle] Checkout.open threw', err);
      setError(err?.message || 'Checkout could not be opened.');
      throw err;
    }
  }, [ready]);

  return (
    <PaddleContext.Provider value={{ ready, error, openCheckout }}>
      {children}
    </PaddleContext.Provider>
  );
}