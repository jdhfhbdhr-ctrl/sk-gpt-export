import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Sparkles, User, FileText, Copy, Check, Share2, ArrowLeft, Download } from 'lucide-react';
import ChatMessageView from '@/components/ChatMessageView';
import {
  buildConversationText,
  copyText,
  downloadTextFile,
  nativeShare,
  safeFilename,
  SK_GPT_NAME,
  SK_GPT_TAGLINE
} from '@/lib/shareUtils';

export default function ShareConversation() {
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const conv = await base44.entities.Conversation.get(conversationId);
        if (!active) return;
        if (!conv || !conv.shared) {
          setError('This conversation is not publicly shared.');
          setLoading(false);
          return;
        }
        setConversation(conv);
        try {
          const list = await base44.entities.Message.filter({ conversation_id: conversationId }, 'created_date', 1000);
          if (active) setMessages(list || []);
        } catch (_e) {
          if (active) setMessages([]);
        }
      } catch (_e) {
        if (active) setError('Shared conversation not found.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [conversationId]);

  const shareText = buildConversationText(conversation, messages);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = async () => {
    const ok = await copyText(shareText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } else {
      alert('Could not copy. Long-press to select manually.');
    }
  };

  const handleShare = async () => {
    const res = await nativeShare({
      title: conversation?.title || 'SK GPT conversation',
      text: shareText,
      url: shareUrl
    });
    if (res === 'unsupported') {
      const ok = await copyText(`${shareText}\n\n${shareUrl}`);
      alert(ok ? 'Conversation + link copied!' : 'Sharing not supported on this browser.');
    }
  };

  const handleDownload = () => {
    downloadTextFile(shareText, `${safeFilename(conversation?.title)}.txt`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-5 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <Sparkles size={22} />
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="/"><ArrowLeft size={14} /> Back to SK GPT</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Branded header */}
      <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={16} />
            </div>
            <div className="leading-tight">
              <span className="block font-display text-sm font-semibold tracking-tight">{SK_GPT_NAME}</span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">{SK_GPT_TAGLINE}</span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button size="sm" onClick={handleShare} className="gap-1.5">
              <Share2 size={14} /> Share
            </Button>
          </div>
        </div>
      </header>

      {/* Conversation */}
      <main className="px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-xl font-semibold tracking-tight">
            {conversation?.title || 'Shared conversation'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            A shared SK GPT conversation · {messages.length} message{messages.length === 1 ? '' : 's'}
          </p>

          <div className="mt-6 flex flex-col gap-5">
            {messages.map((m, i) => (
              <ChatMessageView key={m.id || i} message={m} />
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-2 border-t pt-6 text-center">
            <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Sparkles size={14} /> Try SK GPT
            </Link>
            <p className="text-[11px] text-muted-foreground">Powered by SK GPT · {SK_GPT_TAGLINE}</p>
          </div>
        </div>
      </main>
    </div>
  );
}