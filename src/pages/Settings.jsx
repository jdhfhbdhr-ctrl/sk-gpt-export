import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, doc, deleteDoc
} from "firebase/firestore";
import {
  UserRound, Sparkles, Languages, Palette, Mic2, ShieldCheck,
  Download, Trash2, Volume2, Crown, MessageCircle, LifeBuoy,
  Check, ChevronRight, Zap, SlidersHorizontal
} from "lucide-react";

const ACCENTS = [
  { name: "Violet", value: "263 84% 58%" },
  { name: "Blue", value: "221 83% 53%" },
  { name: "Sky", value: "199 89% 48%" },
  { name: "Teal", value: "173 80% 35%" },
  { name: "Emerald", value: "152 65% 38%" },
  { name: "Rose", value: "343 78% 52%" },
  { name: "Orange", value: "25 90% 48%" },
  { name: "Amber", value: "38 92% 45%" },
];

const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch { return fallback; }
};

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={19} />
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

const selectClass = "w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-accent disabled:opacity-50";

export default function Settings() {
  const { user } = useAuth();

  const [language, setLanguage] = useState(() => localStorage.getItem("sk-gpt-language") || "en");
  const [theme, setTheme] = useState(() => localStorage.getItem("sk-gpt-theme") || "system");
  const [accent, setAccent] = useState(() => localStorage.getItem("sk-gpt-accent") || "263 84% 58%");
  const [style, setStyle] = useState(() => localStorage.getItem("sk-gpt-response-style") || "friendly");
  const [truth, setTruth] = useState(() => read("sk-gpt-truth-meter", false));
  const [voice, setVoice] = useState(() => localStorage.getItem("sk-gpt-voice") || "female");
  const [speed, setSpeed] = useState(() => Number(localStorage.getItem("sk-gpt-speech-speed") || 1));
  const [autoRead, setAutoRead] = useState(() => read("sk-gpt-auto-read", false));
  const [saveHistory, setSaveHistory] = useState(() => read("sk-gpt-save-history", true));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [usage, setUsage] = useState({ chat: null, image: null, pdf: null, advanced: null });

  useEffect(() => {
    const apply = () => {
      const dark = theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener?.("change", apply);
    return () => media.removeEventListener?.("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", accent);
    document.documentElement.style.setProperty("--ring", accent);
    document.documentElement.style.setProperty("--sidebar-primary", accent);
  }, [accent]);

  const save = () => {
    localStorage.setItem("sk-gpt-language", language);
    localStorage.setItem("sk-gpt-theme", theme);
    localStorage.setItem("sk-gpt-accent", accent);
    localStorage.setItem("sk-gpt-response-style", style);
    localStorage.setItem("sk-gpt-truth-meter", JSON.stringify(truth));
    localStorage.setItem("sk-gpt-voice", voice);
    localStorage.setItem("sk-gpt-speech-speed", String(speed));
    localStorage.setItem("sk-gpt-auto-read", JSON.stringify(autoRead));
    localStorage.setItem("sk-gpt-save-history", JSON.stringify(saveHistory));
    setSaved(true);
    setNotice("Your preferences have been saved on this device.");
    setTimeout(() => setSaved(false), 2500);
  };

  const getConversations = async () => {
    if (!user?.uid) throw new Error("Please sign in to access your chat history.");
    const ref = collection(db, "users", user.uid, "conversations");
    const snap = await getDocs(ref);
    const rows = [];
    for (const conversation of snap.docs) {
      const messagesSnap = await getDocs(
        collection(db, "users", user.uid, "conversations", conversation.id, "messages")
      );
      rows.push({
        id: conversation.id,
        ...conversation.data(),
        messages: messagesSnap.docs.map(m => ({ id: m.id, ...m.data() }))
      });
    }
    return rows;
  };

  const exportData = async (format) => {
    try {
      setBusy("export");
      setNotice("Preparing your account data…");
      const conversations = await getConversations();
      const payload = {
        app: "SK GPT",
        exportedAt: new Date().toISOString(),
        account: { name: user?.displayName || "", email: user?.email || "" },
        conversations
      };
      const content = format === "json"
        ? JSON.stringify(payload, null, 2)
        : conversations.map(c =>
            `CHAT: ${c.title || c.name || c.id}\n` +
            (c.messages || []).map(m =>
              `${m.role || "message"}: ${m.content || m.text || JSON.stringify(m)}`
            ).join("\n")
          ).join("\n\n--------------------\n\n");
      const blob = new Blob([content], {
        type: format === "json" ? "application/json" : "text/plain"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sk-gpt-data-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice(`Your ${format.toUpperCase()} export is ready.`);
    } catch (e) {
      setNotice(e.message || "Could not export account data.");
    } finally { setBusy(""); }
  };

  const clearHistory = async () => {
    if (!window.confirm("Permanently delete ALL your SK GPT conversations and their messages? This cannot be undone.")) return;
    try {
      setBusy("clear");
      const conversations = await getConversations();
      for (const c of conversations) {
        for (const m of c.messages || []) {
          await deleteDoc(doc(db, "users", user.uid, "conversations", c.id, "messages", m.id));
        }
        await deleteDoc(doc(db, "users", user.uid, "conversations", c.id));
      }
      setNotice(`Deleted ${conversations.length} conversation(s) from your account.`);
    } catch (e) {
      setNotice(e.message || "Could not clear chat history. Check Firestore permissions.");
    } finally { setBusy(""); }
  };

  const testVoice = () => {
    if (!("speechSynthesis" in window)) {
      setNotice("Speech playback is not supported by this browser.");
      return;
    }
    const samples = {
      en: ["Hello! This is your SK GPT voice preview.", "en-US"],
      ur: ["السلام علیکم! یہ ایس کے جی پی ٹی کی آواز کا نمونہ ہے۔", "ur-PK"],
      "roman-ur": ["Assalam o alaikum! Yeh SK GPT ki awaaz ka namoona hai.", "ur-PK"],
      hi: ["नमस्ते! यह SK GPT की आवाज़ का नमूना है।", "hi-IN"],
      ar: ["مرحباً! هذه معاينة صوت SK GPT.", "ar-SA"],
      es: ["¡Hola! Esta es una prueba de voz de SK GPT.", "es-ES"],
      fr: ["Bonjour ! Ceci est un aperçu vocal de SK GPT.", "fr-FR"],
      de: ["Hallo! Dies ist eine SK-GPT-Stimmprobe.", "de-DE"],
      ru: ["Здравствуйте! Это голосовой пример SK GPT.", "ru-RU"],
      bn: ["হ্যালো! এটি SK GPT-এর কণ্ঠের নমুনা।", "bn-BD"],
      zh: ["你好！这是 SK GPT 的语音预览。", "zh-CN"],
      ja: ["こんにちは！SK GPTの音声プレビューです。", "ja-JP"],
      pt: ["Olá! Esta é uma prévia de voz do SK GPT.", "pt-BR"],
      tr: ["Merhaba! Bu SK GPT ses önizlemesidir.", "tr-TR"]
    };
    window.speechSynthesis.cancel();
    const [sample, lang] = samples[language] || samples.en;
    const utterance = new SpeechSynthesisUtterance(sample);
    utterance.lang = lang;
    utterance.rate = speed;
    const voices = window.speechSynthesis.getVoices();
    const matching = voices.filter(v => v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
    const preferred = matching.find(v => voice === "female"
      ? /female|zira|samantha|susan|google.*female/i.test(v.name)
      : /male|david|mark|daniel|google.*male/i.test(v.name));
    if (preferred || matching[0]) utterance.voice = preferred || matching[0];
    window.speechSynthesis.speak(utterance);
  };

  const upgrade = () => { window.location.href = "/pricing"; };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-7 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <SlidersHorizontal size={25} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">SK GPT AI</p>
              <h1 className="text-2xl font-bold sm:text-3xl">Your Settings</h1>
              <p className="mt-1 text-sm text-white/80">Make your AI experience yours.</p>
            </div>
          </div>
        </div>

        <Section icon={UserRound} title="Account & Subscription" subtitle="Your profile and plan overview">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
              {(user?.displayName || user?.email || "S").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user?.displayName || "SK GPT User"}</p>
              <p className="break-all text-sm text-muted-foreground">{user?.email || "No email available"}</p>
              <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Account</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Free plan</p>
                <p className="text-xs text-muted-foreground">Daily plan limits</p>
              </div>
              <Crown className="text-primary" size={23} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Chats","20/day"],["Images","2/day"],["PDFs","2/day"],["Think","3/day"]].map(([n,v]) => (
                <div key={n} className="rounded-xl bg-background p-3">
                  <p className="text-xs text-muted-foreground">{n}</p>
                  <p className="mt-1 font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Live remaining usage is not available from the current usage API.</p>
            <button onClick={upgrade} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
              <Zap size={16} /> Explore Upgrade Plans <ChevronRight size={16} />
            </button>
          </div>
          <Field label="Accent colour" hint="Choose the highlight colour used across the app.">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {ACCENTS.map(c => (
                <button key={c.name} onClick={() => setAccent(c.value)} title={c.name}
                  aria-label={c.name} aria-pressed={accent === c.value}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-2 ${accent === c.value ? "border-primary bg-primary/5" : "border-transparent hover:bg-accent"}`}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
                    style={{ background: `hsl(${c.value})` }}>
                    {accent === c.value && <Check size={16} className="text-white" />}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{c.name}</span>
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section icon={Sparkles} title="AI Behaviour & Language" subtitle="Choose how SK GPT responds">
          <Field label="Default language">
            <select className={selectClass} value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="ur">Urdu</option>
              <option value="roman-ur">Roman Urdu</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
              <option value="bn">Bengali</option>
              <option value="fa">Persian</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="tr">Turkish</option>
              <option value="id">Indonesian</option>
              <option value="ru">Russian</option>
            </select>
          </Field>
          <Field label="Appearance">
            <select className={selectClass} value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="system">Follow device</option>
              <option value="light">Light mode</option>
              <option value="dark">Dark mode</option>
            </select>
          </Field>
          <Field label="AI response style" hint="Saved as your preferred response style.">
            <select className={selectClass} value={style} onChange={e => setStyle(e.target.value)}>
              <option value="friendly">Friendly & Helpful</option>
              <option value="professional">Professional & Formal</option>
              <option value="short">Short & Direct</option>
              <option value="desi">Desi Casual</option>
            </select>
          </Field>
          <Toggle label="Truth Meter preference" description="Save your preference for evidence-aware answers." checked={truth} onChange={setTruth} />
        </Section>

        <Section icon={Mic2} title="Voice & Audio" subtitle="Configure and preview speech playback">
          <Field label="Preferred voice">
            <select className={selectClass} value={voice} onChange={e => setVoice(e.target.value)}>
              <option value="female">Female voice (when available)</option>
              <option value="male">Male voice (when available)</option>
            </select>
          </Field>
          <Field label={`Speech speed · ${speed.toFixed(1)}x`}>
            <input type="range" min="0.8" max="1.5" step="0.1" value={speed}
              onChange={e => setSpeed(Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>0.8x</span><span>1.5x</span></div>
          </Field>
          <Toggle label="Auto-read replies preference" description="Store your choice for automatic spoken replies." checked={autoRead} onChange={setAutoRead} />
          <button className={buttonClass} onClick={testVoice}><Volume2 size={16} /> Preview voice</button>
        </Section>

        <Section icon={ShieldCheck} title="Privacy & Storage" subtitle="Manage your account data">
          <Toggle label="Save chat history preference" description="Remember your choice. Existing chat saving behaviour may require app-wide integration." checked={saveHistory} onChange={setSaveHistory} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button className={buttonClass} disabled={!!busy} onClick={() => exportData("json")}>
              <Download size={16} /> {busy === "export" ? "Preparing…" : "Export JSON"}
            </button>
            <button className={buttonClass} disabled={!!busy} onClick={() => exportData("txt")}>
              <Download size={16} /> Export TXT
            </button>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 text-red-500" size={19} />
              <div className="flex-1">
                <p className="text-sm font-semibold">Clear all chat history</p>
                <p className="mt-1 text-xs text-muted-foreground">Permanently deletes your conversations and their messages from your account.</p>
                <button disabled={!!busy} onClick={clearHistory}
                  className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                  {busy === "clear" ? "Deleting…" : "Clear all history"}
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section icon={ShieldCheck} title="Legal & Policies" subtitle="Review SK GPT policies">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <a href="/privacy" className={buttonClass}>Privacy Policy <ChevronRight size={16} /></a>
            <a href="/refund-policy" className={buttonClass}>Refund Policy <ChevronRight size={16} /></a>
            <a href="/terms" className={buttonClass}>Terms & Conditions <ChevronRight size={16} /></a>
          </div>
        </Section>

        <Section icon={LifeBuoy} title="Support & App Info" subtitle="We're here to help">
          <a href="mailto:support@sk-gpt.com?subject=SK%20GPT%20Help" className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-accent">
            <span className="flex items-center gap-3 text-sm font-medium"><MessageCircle size={18} className="text-primary" /> Help & support</span>
            <ChevronRight size={17} className="text-muted-foreground" />
          </a>
          <a href="mailto:support@sk-gpt.com?subject=SK%20GPT%20Feedback" className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-accent">
            <span className="flex items-center gap-3 text-sm font-medium"><LifeBuoy size={18} className="text-primary" /> Report a bug / Feedback</span>
            <ChevronRight size={17} className="text-muted-foreground" />
          </a>
          <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Application</span>
            <span className="font-semibold">SK GPT · Version 1.0</span>
          </div>
        </Section>

        {notice && <p role="status" className="rounded-xl border border-border bg-muted/40 p-3 text-sm">{notice}</p>}
        <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
          <span className="text-xs text-muted-foreground">{saved ? "Preferences saved ✓" : "Your changes are ready"}</span>
          <button onClick={save} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm">
            {saved ? "Saved" : "Save preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
