import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyText } from '@/lib/shareUtils';

export default function CopyResponseButton({ text }) {
  const [status, setStatus] = useState('Copy');
  const copy = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = await copyText(text || '');
    setStatus(ok ? 'Copied' : 'Copy Failed');
  };
  return <button type="button" onClick={copy} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-accent" aria-label="Copy entire response">
    {status === 'Copied' ? <Check size={14} /> : <Copy size={14} />}
    <span role="status" aria-live="polite">{status}</span>
  </button>;
}