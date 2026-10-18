import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setLanguage(me?.language || 'en');
        setTheme(me?.theme || 'light');
      } catch (_e) { /* ignore */ }
    })();
  }, []);

  const save = async () => {
    try {
      await base44.auth.updateMe({ language, theme });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_e) { /* ignore */ }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>

        <Card className="mt-6">
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{user?.full_name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="capitalize">{user?.role || 'user'}</span></div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Default language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option>
                <option value="de">German</option><option value="ar">Arabic</option><option value="zh">Chinese</option>
                <option value="ja">Japanese</option><option value="hi">Hindi</option><option value="ur">Urdu</option>
                <option value="bn">Bengali</option><option value="fa">Persian</option><option value="he">Hebrew</option>
                <option value="tr">Turkish</option><option value="id">Indonesian</option><option value="ru">Russian</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Theme</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={save}>Save changes</Button>
              {saved && <span className="text-sm text-emerald-600">Saved</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Manage your plan and billing</span>
            <a href="/upgrade"><Button variant="outline">View plans</Button></a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}