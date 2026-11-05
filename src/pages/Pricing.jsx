import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';

const PLANS = [
  { name: 'Starter', monthly: 7, yearly: 70, features: ['Multilingual AI chat', 'Up to 50 images / month', 'PDF file analysis'] },
  { name: 'Pro', monthly: 18, yearly: 180, popular: true, features: ['Everything in Starter', 'Up to 300 images / month', 'Priority response speed'] },
  { name: 'Advanced', monthly: 98, yearly: 980, features: ['Everything in Pro', 'Unlimited images', 'Early access features'] }
];

export default function Pricing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Sparkles size={20} /> SK GPT
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft size={16} /> Home
          </Link>
        </div>
      </header>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">SK GPT Pricing Plans</h1>
            <p className="mt-3 text-muted-foreground">
              Choose the plan that fits your needs. Monthly and yearly billing available. No free trial.
            </p>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => (
              <article key={plan.name} className={`relative rounded-2xl border bg-card p-6 ${plan.popular ? 'border-primary ring-1 ring-primary' : ''}`}>
                {plan.popular && <span className="text-xs font-semibold text-primary">MOST POPULAR</span>}
                <h2 className="mt-2 text-xl font-bold">{plan.name}</h2>
                <div className="mt-5">
                  <p className="text-3xl font-bold">${plan.monthly}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
                  <p className="mt-2 text-sm text-muted-foreground">${plan.yearly} / year</p>
                </div>
                <ul className="my-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm">
                      <ShieldCheck size={17} className="shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  <Link to="/register">Choose {plan.name}</Link>
                </Button>
              </article>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Secure checkout powered by Paddle. Cancel anytime.
          </p>
        </div>
      </section>

      <footer className="border-t px-5 py-6 text-center text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-5">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/about">About</Link>
        </div>
        <p className="mt-4">Support: khnsalman198@gmail.com</p>
        <p className="mt-2">© {new Date().getFullYear()} SK GPT. All rights reserved.</p>
      </footer>
    </main>
  );
}
