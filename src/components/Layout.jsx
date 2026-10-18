import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, History as HistoryIcon, Settings as SettingsIcon, Sparkles, Crown, LogOut, Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/upgrade', label: 'Upgrade', icon: Crown }
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const NavItems = () => (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Icon className="h-4.5 w-4.5" size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-dvh w-full min-w-0 overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar/40 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles size={18} />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-semibold tracking-tight">SK GPT</p>
            <p className="text-xs text-muted-foreground">Fast multilingual chat</p>
          </div>
        </div>
        <div className="mt-2 flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <div className="border-t p-3">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground">
            <LogOut size={18} />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={16} />
            </div>
            <span className="font-display font-semibold">SK GPT</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </Button>
        </header>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-background shadow-xl">
              <div className="flex items-center justify-between px-5 py-5">
                <span className="font-display font-semibold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X size={18} />
                </Button>
              </div>
              <NavItems />
              <div className="mt-auto p-3">
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground">
                  <LogOut size={18} />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}