import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Pause, Play, Square } from 'lucide-react';

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
      const utterance = new SpeechSynthesisUtterance(chunks[index]); currentUtterance.current = utterance;
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