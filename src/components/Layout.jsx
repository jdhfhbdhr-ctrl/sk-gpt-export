import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare, History as HistoryIcon, Settings as SettingsIcon,
  Sparkles, Crown, LogOut, Menu, X, Brain, ShieldCheck,
  Wallet, Palette, GraduationCap, ChefHat, NotebookPen
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

const NAV = [
  { section: 'MAIN' },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/chat', label: '3-Expert Council', icon: Brain, mode: 'council' },
  { to: '/chat', label: 'Scam & Lie Radar', icon: ShieldCheck, mode: 'truthRadar' },
  { to: '/chat', label: 'Smart Bargain', icon: Wallet, mode: 'bargain' },
  { section: 'EXPLORE HUBS' },
  { to: '/features', label: 'Special Features', icon: Sparkles },
  { to: '/features', label: 'Design Studio', icon: Palette },
  { to: '/features', label: 'Student Library', icon: GraduationCap },
  { to: '/features', label: 'Kitchen & Family', icon: ChefHat },
  { to: '/features', label: 'My AI Notebook', icon: NotebookPen },
  { section: 'YOUR ACCOUNT' },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/upgrade', label: 'Upgrade Plan', icon: Crown }
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to sign out?')) return;
    try {
      await logout(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const NavItems = () => {
    let lastSection = '';
    return (
      <nav className="flex flex-col gap-1 px-3 pb-4">
        {NAV.map((item, index) => {
          if (item.section) {
            lastSection = item.section;
            return (
              <p key={item.section} className="px-3 pt-5 pb-2 text-[10px] font-bold tracking-[0.16em] text-muted-foreground/70">
                {item.section}
              </p>
            );
          }
          const { to, label, icon: Icon, mode } = item;
          const active = location.pathname === to &&
            (mode ? location.state?.skMode === mode : !location.state?.skMode && to !== '/chat');
          return (
            <Link
              key={`${label}-${index}`}
              to={to}
              state={mode ? { skMode: mode } : null}
              onClick={() => setOpen(false)}
              className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
              <span>{label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="flex h-dvh w-full min-w-0 overflow-hidden bg-background">
      <aside className="hidden md:flex w-[270px] shrink-0 flex-col border-r border-border/70 bg-sidebar/70 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles size={21} />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="font-display text-lg font-bold tracking-tight">SK GPT AI</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Your intelligent assistant</p>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto"><NavItems /></div>
        <div className="border-t border-border/70 p-3">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 rounded-xl text-muted-foreground">
            <LogOut size={18} /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="font-display font-bold">SK GPT AI</span>
              <p className="text-[10px] text-muted-foreground">Your intelligent assistant</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu size={21} />
          </Button>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close menu" />
            <div className="absolute left-0 top-0 flex h-full w-[min(86vw,310px)] flex-col border-r border-border bg-background shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                <div className="flex items-center gap-2 font-display font-bold">
                  <Sparkles size={19} /> SK GPT AI
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setOpen(false)} aria-label="Close navigation">
                  <X size={19} />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pt-1"><NavItems /></div>
              <div className="border-t border-border/70 p-3">
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 rounded-xl text-muted-foreground">
                  <LogOut size={18} /> Sign out
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden"><Outlet /></main>
      </div>
    </div>
  );
}
