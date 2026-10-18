import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Globe, Image as ImageIcon, FileText, Zap, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare, title: 'Multilingual AI chat', desc: 'Natural conversations in 20+ languages, with context that remembers.' },
  { icon: ImageIcon, title: 'AI photo generation', desc: 'Turn a sentence into a picture — bring your ideas to life in seconds.' },
  { icon: FileText, title: 'PDF & file analysis', desc: 'Upload a document and get summaries, answers, and insights instantly.' },
  { icon: Zap, title: 'Fast, priority responses', desc: 'Upgrade for quicker replies, scheduled chats, and higher limits.' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={16} />
            </div>
            <span className="font-display text-base font-semibold tracking-tight">SK GPT</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="text-sm">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Globe size={12} /> Fast multilingual AI chat
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Your intelligent assistant, <span className="text-primary">in every language</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Chat, generate images, and analyze files with SK GPT — a multilingual AI built for speed, privacy, and creativity.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/register">Start free <ArrowRight size={16} className="ml-1" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/login">Log in</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">No credit card needed to explore · 7-day free trial on every plan</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 pb-14">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 pb-14">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Every plan starts with a 7-day free trial. Choose monthly or yearly — yearly saves around 17%.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              { name: 'Starter', price: 9, tag: 'For getting started', feats: ['Multilingual AI chat', 'Up to 50 images / mo', 'PDF file analysis'], hot: false },
              { name: 'Pro', price: 29, tag: 'For power users', feats: ['Everything in Starter', 'Up to 300 images / mo', 'Priority response speed'], hot: true },
              { name: 'Advanced', price: 59, tag: 'For teams & creators', feats: ['Everything in Pro', 'Unlimited images', 'Early access features'], hot: false }
            ].map((p) => (
              <div key={p.name} className={`relative flex flex-col rounded-2xl border p-5 ${p.hot ? 'border-primary shadow-sm ring-1 ring-primary' : 'bg-card'}`}>
                {p.hot && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>
                )}
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.tag}</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-3xl font-bold tracking-tight">${p.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">/month</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={p.hot ? 'default' : 'outline'} size="sm" className="mt-5 w-full">
                  <Link to="/register">Start free trial</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-5 pb-16">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 rounded-2xl border bg-card px-5 py-4 text-sm text-muted-foreground">
          <ShieldCheck size={18} className="text-emerald-500" />
          Secure checkout powered by Paddle. Cancel anytime.
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-5 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={14} />
            </div>
            <span className="font-display text-sm font-semibold">SK GPT</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Log in</Link>
            <Link to="/register" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Notice</Link>
          <Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
        </div>
        <div className="mt-3 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-3">
          <span>Support: <a href="mailto:khnsalman198@gmail.com" className="text-foreground hover:underline">khnsalman198@gmail.com</a></span>
          <span className="hidden sm:inline">·</span>
          <span>+92 3041913835</span>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} SK GPT. All rights reserved.</p>
      </footer>
    </div>
  );
}