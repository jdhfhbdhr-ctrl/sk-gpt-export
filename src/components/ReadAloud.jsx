import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Pause, Play, Square } from 'lucide-react';

const detectSpeechLanguage = (text, fallback = "en") => {
  const value = String(text || "");
  if (/[\\u0600-\\u06FF]/.test(value)) {
    return /[ٹڈڑںھہےں]/.test(value) ? "ur-PK" : "ar-SA";
  }
  if (/[\\u0900-\\u097F]/.test(value)) return "hi-IN";
  if (/[\\u0980-\\u09FF]/.test(value)) return "bn-BD";
  if (/[\\u4E00-\\u9FFF]/.test(value)) return "zh-CN";
  if (/[\\u3040-\\u30FF]/.test(value)) return "ja-JP";
  if (/[\\uAC00-\\uD7AF]/.test(value)) return "ko-KR";
  if (/[\\u0400-\\u04FF]/.test(value)) return "ru-RU";
  const map = {
    en: "en-US", ur: "ur-PK", "roman-ur": "ur-PK", hi: "hi-IN",
    ar: "ar-SA", es: "es-ES", fr: "fr-FR", de: "de-DE",
    ru: "ru-RU", bn: "bn-BD", zh: "zh-CN", ja: "ja-JP",
    ko: "ko-KR", pt: "pt-BR", tr: "tr-TR", it: "it-IT",
    nl: "nl-NL", id: "id-ID"
  };
  return map[fallback] || fallback || "en-US";
};


export default function ReadAloud({ text }) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const active = useRef(false);
  const session = useRef(0);
  const currentUtterance = useRef(null);
  const stop = () => { active.current = false; session.current++; window.speechSynthesis?.cancel(); currentUtterance.current = null; setState('idle'); };
  useEffect(() => {
    window.addEventListener('sk-gpt-read-aloud', stop);
    return () => { window.removeEventListener('sk-gpt-read-aloud', stop); if (active.current) window.speechSynthesis?.cancel(); };
  }, []);
  const start = () => {
    setError('');
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { setError('Read Aloud is unavailable in this browser.'); return; }
    window.dispatchEvent(new Event('sk-gpt-read-aloud'));
    window.speechSynthesis.cancel();
    const chunks = (text || '').match(/[\s\S]{1,220}(?:\s|$)|[\s\S]{1,220}/g) || [];
    if (!chunks.length) return;
    active.current = true; setState('starting');
    const sessionId = ++session.current;
    const next = (index) => {
      if (!active.current || session.current !== sessionId) return;
      if (index === chunks.length) { active.current = false; setState('idle'); return; }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      const getPref = (key, fallback) => {
        try {
          const value = localStorage.getItem(key);
          return value === null ? fallback : JSON.parse(value);
        } catch { return fallback; }
      };
      const language = getPref("sk-gpt-language", "en");
      const voiceType = getPref("sk-gpt-voice", "female");
      utterance.lang = detectSpeechLanguage(text, language);
      utterance.rate = Math.min(1.5, Math.max(0.8, Number(getPref("sk-gpt-speech-speed", 1)) || 1));
      const matchingVoices = window.speechSynthesis.getVoices().filter(v =>
        v.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase())
      );
      const preferredVoice = matchingVoices.find(v => voiceType === "male"
        ? /male|david|daniel|alex/i.test(v.name)
        : /female|zira|samantha|karen/i.test(v.name)
      );
      if (preferredVoice || matchingVoices[0]) utterance.voice = preferredVoice || matchingVoices[0];
      currentUtterance.current = utterance;
      const timer = window.setTimeout(() => { if (active.current && session.current === sessionId) { stop(); setError('The device speech service did not start. Check your speech settings.'); } }, 15000);
      utterance.onstart = () => { window.clearTimeout(timer); if (active.current && session.current === sessionId) setState('speaking'); };
      utterance.onend = () => { window.clearTimeout(timer); next(index + 1); };
      utterance.onerror = (event) => { window.clearTimeout(timer); if (!active.current || session.current !== sessionId) return; active.current = false; setState('idle'); setError(`Read Aloud failed (${event.error || 'speech service unavailable'}). Check device speech settings.`); };
      window.speechSynthesis.speak(utterance);
    };
    next(0);
  };
  const togglePause = () => {
    if (state === 'paused') { window.speechSynthesis.resume(); setState('speaking'); }
    else { window.speechSynthesis.pause(); setState('paused'); }
  };
  return <div className="flex flex-wrap items-center gap-1">
    {state === 'idle' ? <button type="button" onClick={start} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-accent"><Volume2 size={14} /> Read Aloud</button> : <>
      <button type="button" disabled={state === 'starting'} onClick={togglePause} className="flex items-center gap-1 px-2 py-2 text-xs">{state === 'paused' ? <Play size={14} /> : <Pause size={14} />}{state === 'starting' ? 'Starting…' : state === 'paused' ? 'Resume' : 'Pause'}</button>
      <button type="button" onClick={stop} className="flex items-center gap-1 px-2 py-2 text-xs"><Square size={14} />Stop</button>
    </>}
    {error && <span role="alert" className="w-full text-xs text-destructive">{error}</span>}
  </div>;
}