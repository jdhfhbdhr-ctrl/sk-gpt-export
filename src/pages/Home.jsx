import { apiUrl } from "@/lib/apiBase";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { listConversations, createConversation, updateConversation, deleteConversation, listMessages, saveMessage, clearMessages, deleteMessagesFrom } from '@/lib/chatStore';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import requestReply from '@/components/chat/requestReply';
import ChatMessage from '@/components/ChatMessage';
import PlusToolsSheet from '@/components/PlusToolsSheet';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { LANGUAGES, RECOGNITION_LANG } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Send, Square, Plus, Mic, Sparkles, Clock, Trash2, FileText, Brain, Globe, X, Share2, Copy, Download, Eraser, Check, Link2 } from 'lucide-react';
import { buildConversationText, copyText, downloadTextFile, nativeShare, safeFilename, SK_GPT_NAME, SK_GPT_TAGLINE } from '@/lib/shareUtils';

const langLabel = (code) => (LANGUAGES.find((l) => l.code === code) || {}).label || 'English';



export default function Home() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [chatType, setChatType] = useState('permanent');
  const [photoMode, setPhotoMode] = useState(false);
  const [thinkHarder, setThinkHarder] = useState(false);
  const [specialMode, setSpecialMode] = useState(null);
  const [councilMode, setCouncilMode] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsView, setToolsView] = useState('main');
  const [converting, setConverting] = useState(false);
  const [copiedConv, setCopiedConv] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const messagesEndRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const voiceBaseRef = useRef('');
  const voiceCaptureRef = useRef(false);
  const sendingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const [chatError, setChatError] = useState('');
  const [messageCursor, setMessageCursor] = useState(null);
  const [moreMessages, setMoreMessages] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [convCursor, setConvCursor] = useState(null);
  const [moreConvs, setMoreConvs] = useState(false);
  const selectionRef = useRef(null);
  const lastScrolledRef = useRef(null);

  const voice = useSpeechRecognition();

  const loadConversations = useCallback(async () => {
    if (!user?.uid) return;
    setLoadingConvs(true);
    try {
      const list = await listConversations(50);
      setConversations(list);
      setConvCursor(null); setMoreConvs(false);
    } catch (error) { setChatError(error.message || 'Could not load conversations.'); }
    finally { setLoadingConvs(false); }
  }, [user?.uid]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (convId) => {
    if (!convId) { setMessages([]); return; }
    setLoadingMessages(true);
    try {
      const list = await listMessages(convId, 1000);
      if (selectionRef.current !== convId) return;
      setMessages(list);
      setMessageCursor(null); setMoreMessages(false);
    } catch (error) { setChatError(error.message || 'Could not load messages.'); }
    finally { setLoadingMessages(false); }
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || lastScrolledRef.current === last.id) return;
    lastScrolledRef.current = last.id;
    if (last.role === 'user') messagesEndRef.current?.scrollIntoView({ block: 'end' });
    else {
      const rows = messagesEndRef.current?.parentElement?.querySelectorAll('[data-chat-message]');
      rows?.[rows.length - 1]?.scrollIntoView({ block: 'start' });
    }
  }, [messages]);

  // Live-update the composer while voice recognition is running.
  useEffect(() => {
    if (voiceCaptureRef.current && voice.transcript) {
      const base = voiceBaseRef.current;
      setInput((base ? base.replace(/\s+$/, '') + ' ' : '') + voice.transcript);
    }
  }, [voice.transcript]);

  const startNewChat = () => {
    if (sendingRef.current) return;
    selectionRef.current = null; voiceCaptureRef.current = false; voice.stop();
    setChatError(''); setShared(false); setMoreMessages(false);
    setActiveId(null);
    setMessages([]);
    setInput('');
    setAttachedFile(null);
    setPhotoMode(false);
    setSpecialMode(null);
  };

  const handleSelectConv = async (conv) => {
    if (sendingRef.current) return;
    selectionRef.current = conv.id;
    setMessages([]); setChatError(''); setMoreMessages(false);
    setActiveId(conv.id);
    setLanguage(conv.language || 'en');
    setChatType(conv.type || 'permanent');
    setShared(Boolean(conv.shared));
    await loadMessages(conv.id);
  };

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const createShareLink = async () => {
    if (!activeId || !auth.currentUser) {
      throw new Error('Please sign in and open a conversation first.');
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(apiUrl(`/api/share/${encodeURIComponent(activeId)}`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Could not create a share link.');
    }

    const publicUrl = data.shareUrl || `${window.location.origin}/share/${data.shareId}`;

    await updateConversation(activeId, {
      shared: true,
      shareId: data.shareId
    });

    setShared(true);
    setConversations((cs) => cs.map((c) =>
      c.id === activeId
        ? { ...c, shared: true, shareId: data.shareId }
        : c
    ));

    return publicUrl;
  };

  const handleShareConversation = async () => {
    if (!activeId || !activeConversation) {
      alert('Start or open a conversation first, then share it.');
      return;
    }

    try {
      const publicUrl = await createShareLink();
      const text = buildConversationText(activeConversation, messages);
      const result = await nativeShare({
        title: activeConversation.title || 'SK GPT conversation',
        text,
        url: publicUrl
      });

      if (result === 'unsupported') {
        const ok = await copyText(`${text}\\n\\n${publicUrl}`);
        alert(ok ? 'Conversation + public link copied!' : 'Sharing not supported on this browser.');
      }
    } catch (error) {
      alert(error.message || 'Could not share this conversation.');
    }
  };

  const handleCopyConversation = async () => {
    if (!activeId || messages.length === 0) return;
    const text = buildConversationText(activeConversation, messages);
    const ok = await copyText(text);
    if (ok) {
      setCopiedConv(true);
      setTimeout(() => setCopiedConv(false), 1800);
    } else setChatError('Copy Failed. Your browser could not access the clipboard.');
  };

  const handleDownloadConversation = () => {
    if (!activeId || messages.length === 0) return;
    const text = buildConversationText(activeConversation, messages);
    downloadTextFile(text, `${safeFilename(activeConversation?.title)}.txt`);
  };

  const handleCopyShareLink = async () => {
    if (!activeId) return;

    try {
      const publicUrl = await createShareLink();
      const ok = await copyText(publicUrl);

      if (ok) {
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 1800);
      } else {
        setChatError('Could not copy the share link.');
      }
    } catch (error) {
      alert(error.message || 'Could not create a share link.');
    }
  };

  const handleClearConversation = () => {
    if (sendingRef.current || !activeId || messages.length === 0) return;
    if (!confirm('Clear all messages in this conversation? This cannot be undone.')) return;
    clearMessages(activeId)
      .then(() => { setMessages([]); })
      .catch(() => { /* ignore */ });
  };

  const handleDeleteConv = async (e, conv) => {
    e.stopPropagation();
    if (sendingRef.current) return;
    try {
      await deleteConversation(conv.id);
      if (activeId === conv.id) startNewChat();
      loadConversations();
    } catch (err) { /* ignore */ }
  };

  const handleAttach = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert('File is too large (max 25 MB).');
      return;
    }
    try {
      setAttachedFile({ name: file.name, type: file.type, file });
      setPhotoMode(false);
    } catch (err) {
      alert('Could not upload the file.');
    }
  };

  const convertPdfToText = async () => {
    if (!attachedFile || attachedFile.type !== 'application/pdf' || converting) return;
    setConverting(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const form = new FormData();
      form.append('file', attachedFile.file);
      form.append('action', 'extract_text');
      const response = await fetch(apiUrl('/api/pdf/analyze'), {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'PDF conversion failed');
      const text = result.text || result.content || '';
      if (!text) { alert('Could not extract text from this PDF.'); return; }
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachedFile.name.replace(/\.pdf$/i, '') + '.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not convert this PDF.');
    } finally {
      setConverting(false);
    }
  };

  const openTools = (view = 'main') => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    setToolsView(view);
    setToolsOpen(true);
  };

  const startVoice = () => {
    if (voice.listening || voice.starting || sendingRef.current) return;
    voiceCaptureRef.current = true;
    voiceBaseRef.current = input;
    voice.start(RECOGNITION_LANG[language] || 'en-US');
  };

  const stopGeneration = () => abortControllerRef.current?.abort();

  const send = async () => {
    if (sendingRef.current || loadingMessages) return;
    const text = input.trim();
    if (!text && !attachedFile) return;
    sendingRef.current = true; setLoading(true); setChatError('');
  abortControllerRef.current = new AbortController();
    voiceCaptureRef.current = false; voice.stop();
    const pendingFile = attachedFile;
    const wasPhotoMode = photoMode;
    const modeForRequest = specialMode;
    const userContent = text || (pendingFile?.type === 'application/pdf' ? `Analyze this PDF: ${pendingFile.name}` : pendingFile?.type?.startsWith('image/') ? 'Please analyze this image.' : '(attachment)');
    const history = [...messages];
    let convId = activeId;
    let persisted = false;
    let completed = false;
    try {
      if (!convId) {
        const conv = await createConversation({ title: (text || pendingFile?.name || 'New chat').slice(0, 40), type: chatType, language });
        convId = conv.id; selectionRef.current = convId;
        setActiveId(convId); setShared(false);
        setConversations((previous) => [conv, ...previous]);
      }
      const saved = await saveMessage(convId, { role: 'user', content: userContent, file_name: pendingFile?.name || '' });
      persisted = true;
      setMessages((previous) => [...previous, saved]);
      setInput(''); setAttachedFile(null); setPhotoMode(false); setSpecialMode(null);
      const reply = await requestReply({ text, userContent, pendingFile, photoMode: wasPhotoMode, messages: history, language, thinkHarder, specialMode: modeForRequest, councilMode, signal: abortControllerRef.current?.signal });
      const savedReply = await saveMessage(convId, { role: 'assistant', ...reply });
      setMessages((previous) => [...previous, savedReply]); completed = true;
      await updateConversation(convId, { last_message_at: new Date().toISOString() });
      const updated = { ...conversations.find(c => c.id === convId), id: convId, updatedAt: new Date().toISOString() };
      setConversations((previous) => [updated, ...previous.filter((conversation) => conversation.id !== convId)]);
    } catch (error) {
      if (error.name === 'AbortError') {
        setChatError('Generation stopped. You can send another message.');
        return;
      }
      const reason = error.response?.data?.error || error.data?.error || error.message || 'Unknown request failure';
      setChatError(`${completed ? 'Your response was saved, but the conversation timestamp could not be updated.' : persisted ? 'Your message was saved, but the response did not finish.' : 'Your message could not be saved.'} ${reason}`);
    } finally { abortControllerRef.current = null; sendingRef.current = false; setLoading(false); }
  };

  const regenerateMessage = async (assistantIndex) => {
    if (sendingRef.current || loadingMessages || !activeId) return;

    const assistant = messages[assistantIndex];
    if (!assistant || assistant.role !== 'assistant') return;

    let userIndex = assistantIndex - 1;
    while (userIndex >= 0 && messages[userIndex].role !== 'user') userIndex--;

    if (userIndex < 0) {
      setChatError('The original user message could not be found.');
      return;
    }

    const originalUser = messages[userIndex];
    if (originalUser.file_name) {
      setChatError('Regenerating file-based answers requires attaching the original file again.');
      return;
    }

    sendingRef.current = true;
    setLoading(true);
    setChatError('');
    abortControllerRef.current = new AbortController();

    try {
      const history = messages.slice(0, userIndex);
      const text = originalUser.content || '';

      await deleteMessagesFrom(activeId, assistantIndex);
      setMessages(messages.slice(0, assistantIndex));

      const reply = await requestReply({
        text,
        userContent: text,
        pendingFile: null,
        photoMode: false,
        messages: history,
        language,
        thinkHarder,
        signal: abortControllerRef.current.signal
      });

      const savedReply = await saveMessage(activeId, { role: 'assistant', ...reply });
      setMessages(previous => [...previous, savedReply]);
      await updateConversation(activeId, { last_message_at: new Date().toISOString() });
    } catch (error) {
      if (error.name === 'AbortError') {
        setChatError('Regeneration stopped.');
      } else {
        setChatError(error.message || 'Could not regenerate this response.');
      }
    } finally {
      abortControllerRef.current = null;
      sendingRef.current = false;
      setLoading(false);
    }
  };

  const editMessage = (message) => {
    if (loading || !message || message.role !== 'user') return;
    setInput(message.content || '');
    setChatError('Edit your message in the composer, then press Send.');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0">
      {/* Conversation list (desktop) */}
      <div className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar/30">
        <div className="p-3">
          <Button onClick={startNewChat} disabled={loading} className="w-full justify-center gap-2">
            <Plus size={16} /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {loadingConvs ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectConv(c)}
                disabled={loading}
                className={`group mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${activeId === c.id ? 'bg-accent' : 'hover:bg-accent/60'}`}
              >
                <span className="flex-1 truncate">{c.title}</span>
                {c.type === 'temporary' && <Clock size={13} className="text-muted-foreground" />}
                {c.type === 'scheduled' && <Clock size={13} className="text-amber-500" />}
                <Trash2 size={13} className="opacity-0 group-hover:opacity-100 text-muted-foreground" onClick={(e) => handleDeleteConv(e, c)} />
              </button>
            ))
          )}
          {moreConvs && <Button variant="ghost" className="w-full" onClick={() => loadConversations(convCursor)} disabled={loadingConvs}>Load more conversations</Button>}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Chat action toolbar — brand lives in the app shell (sidebar / mobile header),
            so it is never duplicated here. */}
        <div className="border-b px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => openTools('language')}
              className="flex items-center gap-1 rounded-full border border-input bg-background px-2.5 py-1 text-xs hover:bg-accent"
              title="Change language"
            >
              <Globe size={12} /> {langLabel(language)}
            </button>
            <div className="ml-auto flex items-center gap-0.5">
              <Button variant="ghost" size="icon" onClick={handleShareConversation} title="Share conversation" disabled={!activeId}>
                <Share2 size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCopyConversation} title="Copy conversation" disabled={!activeId || messages.length === 0}>
                {copiedConv ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDownloadConversation} title="Download conversation" disabled={!activeId || messages.length === 0}>
                <Download size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClearConversation} title="Clear conversation" disabled={loading || !activeId || messages.length === 0}>
                <Eraser size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={startNewChat} disabled={loading} className="gap-1.5">
                <Plus size={15} /> New
              </Button>
            </div>
          </div>
          {activeId && (
            <div className="mt-1.5 flex items-center gap-2">
              {shared && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <Link2 size={11} /> Public share link
                </span>
              )}
              <button onClick={handleCopyShareLink} className="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent">
                {shareLinkCopied ? <Check size={11} className="text-emerald-500" /> : <Link2 size={11} />}
                {shareLinkCopied ? 'Link copied' : shared ? 'Copy share link' : 'Create share link'}
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
            {loadingMessages && <p role="status" className="text-sm text-muted-foreground">Loading messages…</p>}
            {moreMessages && <Button variant="outline" onClick={() => loadMessages(activeId, messageCursor)} disabled={loadingMessages || loading}>Load earlier messages</Button>}

            {messages.map((m, i) => <ChatMessage key={m.id || i} message={m} onEdit={editMessage} onRegenerate={() => regenerateMessage(i)} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Sparkles size={16} /></div>
                <div role="status" aria-live="polite" className="rounded-2xl bg-muted px-4 py-3 text-sm">Generating response…</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-4xl">
            {chatError && <p role="alert" className="mb-2 text-sm text-destructive">{chatError}</p>}
            {voice.error && <p role="alert" className="mb-2 text-sm text-destructive">{voice.error}</p>}
            {(voice.starting || voice.listening) && <p role="status" className="mb-2 text-sm text-muted-foreground">{voice.starting ? 'Requesting microphone access…' : 'Listening — tap the microphone to stop.'}</p>}
            {!voice.supported && <p className="mb-2 text-xs text-muted-foreground">Voice input is unavailable in this browser.</p>}
            {/* Mode / attachment chips */}
            {(photoMode || thinkHarder) && (
              <div className="mb-2 flex flex-wrap gap-2">
                {photoMode && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                    <Sparkles size={12} /> Creating photo
                    <button onClick={() => setPhotoMode(false)} className="ml-0.5"><X size={12} /></button>
                  </span>
                )}
                {thinkHarder && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                    <Brain size={12} /> Think harder
                    <button onClick={() => setThinkHarder(false)} className="ml-0.5"><X size={12} /></button>
                  </span>
                )}
              </div>
            )}

            {/* Attachment preview */}
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <FileText size={14} />
                <span className="flex-1 truncate">{attachedFile.name}</span>
                {attachedFile.type === 'application/pdf' && (
                  <button
                    onClick={convertPdfToText}
                    disabled={converting}
                    className="rounded-md border border-input bg-background px-2 py-0.5 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    {converting ? 'Converting…' : 'Convert to .txt'}
                  </button>
                )}
                <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleAttach} className="hidden" />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleAttach} className="hidden" />
            <input ref={fileInputRef} type="file" onChange={handleAttach} className="hidden" />
            <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handleAttach} className="hidden" />

            {/* SK GPT AI Council */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <button type="button" role="switch" aria-checked={councilMode}
                onClick={() => setCouncilMode(v => !v)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold ${councilMode ? "border-violet-600 bg-violet-600 text-white" : "border-violet-500/40 bg-violet-500/5 text-violet-700"}`}>
                🧠 Council Mode (3 Experts) {councilMode ? "ON" : "OFF"}
              </button>
            </div>
            {/* SK GPT consumer superpowers */}
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setSpecialMode(specialMode === "truthRadar" ? null : "truthRadar"); setPhotoMode(false); }}
                aria-pressed={specialMode === "truthRadar"}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${specialMode === "truthRadar" ? "border-red-500 bg-red-500 text-white" : "border-red-500/40 bg-red-500/5 text-red-600 hover:bg-red-500/10"}`}
              >
                🛡️ Lie & Scam Radar
              </button>
              <button
                type="button"
                onClick={() => { setSpecialMode(specialMode === "bargain" ? null : "bargain"); setPhotoMode(false); }}
                aria-pressed={specialMode === "bargain"}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${specialMode === "bargain" ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-600/40 bg-emerald-600/5 text-emerald-700 hover:bg-emerald-600/10"}`}
              >
                💰 Bargain & Save Money
              </button>
            </div>
            {specialMode && (
              <p className="mb-2 text-xs text-muted-foreground">
                {specialMode === "truthRadar"
                  ? "Paste a suspicious message or attach a screenshot for an AI scam-risk assessment."
                  : "Describe an item/deal or attach its photo to get ready-to-copy negotiation messages."}
                <button type="button" onClick={() => setSpecialMode(null)} className="ml-2 underline">Turn off</button>
              </p>
            )}

            {/* Composer row: [+] [textarea] [mic] [send] */}
            <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm">
              <Button variant="ghost" size="icon" onClick={() => openTools('main')} title="Tools" aria-label="Attachments and tools">
                <Plus size={18} />
              </Button>
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`; }}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder={photoMode ? 'Describe the image to create…' : voice.listening ? 'Listening…' : 'Type your message…'}
                aria-label="Message SK Chat"
                className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-base outline-none placeholder:text-muted-foreground"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => ((voice.listening || voice.starting) ? voice.stop() : startVoice())}
                disabled={!voice.supported || loading}
                aria-label={voice.listening || voice.starting ? 'Stop voice input' : 'Start voice input'}
                title="Voice input"
                className={voice.listening ? 'text-primary' : ''}
              >
                <Mic size={18} />
              </Button>
              {loading ? (
                <Button onClick={stopGeneration} aria-label="Stop generation" title="Stop generation" size="icon" variant="destructive">
                  <Square size={14} fill="currentColor" />
                </Button>
              ) : (
                <Button onClick={send} aria-label="Send message" disabled={loadingMessages || (!input.trim() && !attachedFile)} size="icon">
                  <Send size={18} />
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>

      <PlusToolsSheet
        open={toolsOpen}
        initialView={toolsView}
        onClose={() => setToolsOpen(false)}
        language={language}
        onSetLanguage={(code) => { setLanguage(code); setToolsOpen(false); }}
        chatType={chatType}
        onSetChatType={(t) => { setChatType(t); setToolsOpen(false); }}
        thinkHarder={thinkHarder}
        onToggleThinkHarder={() => setThinkHarder((v) => !v)}
        onCamera={() => { setToolsOpen(false); cameraInputRef.current?.click(); }}
        onPhotosGallery={() => { setToolsOpen(false); galleryInputRef.current?.click(); }}
        onGeneratePhoto={() => { setPhotoMode(true); setToolsOpen(false); }}
        onFiles={() => { setToolsOpen(false); fileInputRef.current?.click(); }}
        onPdf={() => { setToolsOpen(false); pdfInputRef.current?.click(); }}
        onVoice={() => { setToolsOpen(false); startVoice(); }}
      />
    </div>
  );
}