import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LegalLayout({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={16} />
            </div>
            <span className="font-display text-base font-semibold tracking-tight">SK GPT</span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-sm">
            <Link to="/"><ArrowLeft size={14} /> Back to home</Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="px-5 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          {lastUpdated && (
            <p className="mt-1.5 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          )}
          <div className="mt-7 space-y-5 text-sm leading-relaxed text-foreground/90 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-5 py-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy Notice</Link>
            <Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/" className="hover:text-foreground">Home</Link>
          </div>
          <div className="mt-3 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-3">
            <span>Support: <a href="mailto:khnsalman198@gmail.com" className="text-foreground hover:underline">khnsalman198@gmail.com</a></span>
            <span className="hidden sm:inline">·</span>
            <span>+92 3041913835</span>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} SK GPT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}