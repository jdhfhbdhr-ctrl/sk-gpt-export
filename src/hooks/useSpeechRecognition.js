import { useEffect, useRef, useState } from 'react';

// Wraps the browser Web Speech API (SpeechRecognition) for voice input.
// No backend/credits — uses the device's native speech-to-text.
export function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [starting, setStarting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);
  useEffect(() => { setSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition)); return () => recRef.current?.abort(); }, []);
  const start = (lang) => {
    setError('');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Voice input is unavailable in this browser. Try a browser with speech recognition.'); return; }
    if (!window.isSecureContext) { setError('Microphone access requires a secure HTTPS connection.'); return; }
    if (recRef.current) return;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = lang || 'en-US'; rec.interimResults = true; rec.continuous = false;
    setTranscript(''); setStarting(true);
    rec.onstart = () => { setStarting(false); setListening(true); };
    rec.onresult = (event) => setTranscript(Array.from(event.results, (result) => result[0].transcript).join(' '));
    rec.onerror = (event) => {
      const errors = { 'not-allowed': 'Microphone permission denied. Allow microphone access in browser settings.', 'service-not-allowed': 'The browser speech service is unavailable or blocked.', 'audio-capture': 'No working microphone was found.', network: 'Speech recognition network failure. Check your connection.', 'no-speech': 'No speech detected. Please try again.', 'language-not-supported': 'This speech service does not support the selected language.' };
      if (event.error !== 'aborted') setError(errors[event.error] || `Voice input failed (${event.error}).`);
      setListening(false); setStarting(false);
    };
    rec.onend = () => { if (recRef.current === rec) recRef.current = null; setListening(false); setStarting(false); };
    try { rec.start(); } catch (err) { recRef.current = null; setStarting(false); setError(`Could not start voice input: ${err.message}`); }
  };
  const stop = () => { try { recRef.current?.stop(); } catch (err) { setError(`Could not stop voice input: ${err.message}`); } };
  return { listening, starting, supported, transcript, error, start, stop };
}