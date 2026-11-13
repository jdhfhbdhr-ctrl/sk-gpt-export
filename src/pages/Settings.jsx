import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { SK_SETTINGS } from '@/lib/skSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('sk-gpt-theme') || 'system';
    } catch {
      return 'system';
    }
  });
  const ACCENTS = [
    { name: 'Violet', value: '263 84% 58%' },
    { name: 'Blue', value: '221 83% 53%' },
    { name: 'Sky', value: '199 89% 48%' },
    { name: 'Teal', value: '173 80% 35%' },
    { name: 'Emerald', value: '152 65% 38%' },
    { name: 'Green', value: '142 71% 35%' },
    { name: 'Rose', value: '343 78% 52%' },
    { name: 'Red', value: '0 75% 50%' },
    { name: 'Orange', value: '25 90% 48%' },
    { name: 'Amber', value: '38 92% 45%' },
  ];

  const [accent, setAccent] = useState(() => {
    try { return localStorage.getItem('sk-gpt-accent') || '263 84% 58%'; }
    catch { return '263 84% 58%'; }
  });

  const [values, setValues] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [saved, setSaved] = useState(false);

  const categories = useMemo(
    () => ['All', ...new Set(SK_SETTINGS.map(item => item.category))],
    []
  );

  useEffect(() => {
    setLanguage(localStorage.getItem('sk-gpt-language') || 'en');

    try {
      setValues(JSON.parse(localStorage.getItem('sk-gpt-settings') || '{}'));
    } catch {
      setValues({});
    }
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const dark = theme === 'dark' ||
        (theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    };

    applyTheme();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', applyTheme);

    return () => media.removeEventListener?.('change', applyTheme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', accent);
    root.style.setProperty('--ring', accent);
    root.style.setProperty('--sidebar-primary', accent);
    try { localStorage.setItem('sk-gpt-accent', accent); } catch {}
  }, [accent]);

  const updateSetting = (id, checked) => {
    setValues(previous => {
      const next = { ...previous, [id]: checked };
      localStorage.setItem('sk-gpt-settings', JSON.stringify(next));
      return next;
    });
  };

  const save = () => {
    localStorage.setItem('sk-gpt-language', language);
    localStorage.setItem('sk-gpt-theme', theme);
    localStorage.setItem('sk-gpt-accent', accent);
    localStorage.setItem('sk-gpt-settings', JSON.stringify(values));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const filtered = SK_SETTINGS.filter(item => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalize your SK GPT experience.
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Name</span>
              <span>{user?.displayName || '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Email</span>
              <span className="break-all">{user?.email || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span>user</span>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium">Accent colour</label>
              <div className="grid grid-cols-5 gap-3">
                {ACCENTS.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setAccent(color.value)}
                    aria-label={`${color.name} accent colour`}
                    aria-pressed={accent === color.value}
                    title={color.name}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${
                      accent === color.value ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-accent'
                    }`}
                  >
                    <span
                      className="h-8 w-8 rounded-full shadow-sm"
                      style={{ backgroundColor: `hsl(${color.value})` }}
                    />
                    <span className="text-[11px] text-muted-foreground">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Basic Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Default language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="en">English</option>
                <option value="ur">Urdu</option>
                <option value="ar">Arabic</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="bn">Bengali</option>
                <option value="fa">Persian</option>
                <option value="tr">Turkish</option>
                <option value="id">Indonesian</option>
                <option value="ru">Russian</option>
                <option value="he">Hebrew</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Theme</label>
              <select value={theme} onChange={e => setTheme(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">125 Advanced Settings</h2>
            <p className="text-sm text-muted-foreground">
              {SK_SETTINGS.length} preferences across {categories.length - 1} categories.
              Changes are saved automatically on this device.
            </p>
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search settings..."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm"
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(item => (
              <button key={item} onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium ${
                  category === item
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background'
                }`}>
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} settings shown</span>
            <span>{Object.values(values).filter(Boolean).length} enabled</span>
          </div>

          <Card>
            <CardContent className="divide-y divide-border p-0">
              {filtered.map(item => (
                <label key={item.id}
                  className="flex cursor-pointer items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(values[item.id])}
                    onChange={e => updateSetting(item.id, e.target.checked)}
                    className="h-5 w-5 shrink-0 accent-current"
                  />
                </label>
              ))}
              {filtered.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No settings found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">Subscription system is the next development step.</p>
            <p className="text-muted-foreground">
              Starter, Pro and Advanced plans, monthly/yearly billing,
              payment gateway, billing history and cancellation will be built next.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pb-6">
          <Button onClick={save}>Save preferences</Button>
          {saved && <span className="text-sm text-emerald-600">Saved successfully!</span>}
        </div>
      </div>
    </div>
  );
}
