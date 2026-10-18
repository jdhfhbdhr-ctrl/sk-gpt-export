import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Globe, MessageSquare, PenLine, Code, Image as ImageIcon, FileText, CreditCard, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: Globe, title: 'Multilingual AI chat', desc: 'Natural conversations in 20+ languages, with context that remembers across your session.' },
  { icon: PenLine, title: 'Writing & brainstorming', desc: 'Draft emails, essays, and ideas, or brainstorm with an assistant that adapts to your tone.' },
  { icon: Code, title: 'Coding assistance', desc: 'Get help writing, explaining, and debugging code across popular languages and frameworks.' },
  { icon: ImageIcon, title: 'Image generation', desc: 'Turn a sentence into a picture and bring your ideas to life in seconds.' },
  { icon: FileText, title: 'PDF & file analysis', desc: 'Upload a document or image and get summaries, answers, and insights instantly.' }
];

const PLANS = [
  { name: 'Starter', monthly: 9, desc: 'Fast multilingual AI chat, image generation, and PDF analysis.', features: ['Up to 50 images / mo', 'PDF file analysis', 'Conversation history'] },
  { name: 'Pro', monthly: 29, highlighted: true, desc: 'For power users who need more speed, images, and scheduled chats.', features: ['Up to 300 images / mo', 'Scheduled & temporary chats', 'Priority response speed'] },
  { name: 'Advanced', monthly: 59, desc: 'For teams and creators who want the highest limits and features.', features: ['Unlimited image generation', 'Advanced document tools', 'Early access to new features'] }
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={16} />
            </div>
            <span className="font-display text-base font-semibold tracking-tight">SK GPT</span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="text-sm">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </header>

      {/* Intro */}
      <section className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <MessageSquare size={26} />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            About <span className="text-primary">SK GPT</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            SK GPT is an AI-powered assistant that helps you chat, write, brainstorm, code, generate images,
            and analyze files — in over 20 languages. It is built for speed, privacy, and creativity, with
            plans for everyone from casual users to teams and creators.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/register">Get started <ArrowRight size={16} className="ml-1" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="px-5 pb-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight">What SK GPT does</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            SK GPT brings together several AI tools in one place, so you can move between conversation,
            creation, and analysis without switching apps.
          </p>
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
      <section className="px-5 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Plans &amp; pricing</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Every plan starts with a 7-day free trial. Choose monthly or yearly billing — yearly saves around 17%.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border p-5 ${p.highlighted ? 'border-primary shadow-sm ring-1 ring-primary' : 'bg-card'}`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-3xl font-bold tracking-tight">${p.monthly}</span>
                  <span className="mb-1 text-sm text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Sparkles size={15} className="mt-0.5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <CreditCard size={15} className="text-emerald-500" />
            Billing is handled securely by Paddle. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Customer Support */}
      <section className="px-5 pb-16">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Customer support</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We're here to help with billing, subscriptions, refunds, and any questions about using
            SK GPT. SK GPT is operated by Salman Khan, an individual sole proprietor based in
            Pakistan. You can reach us directly using the details below.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-6">
            <a href="mailto:khnsalman198@gmail.com" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Globe size={16} /> khnsalman198@gmail.com
            </a>
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <MessageSquare size={16} /> +92 3041913835
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-5 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy Notice</Link>
            <Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} SK GPT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}