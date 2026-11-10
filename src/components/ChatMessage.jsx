import React, { useState } from 'react';
import ChatImage from '@/components/ChatImage';
import CopyResponseButton from '@/components/CopyResponseButton';
import ReadAloud from '@/components/ReadAloud';
import { User, Sparkles, FileText, Check, Download, Share2, Link2, MoreHorizontal, Pencil, RotateCcw } from 'lucide-react';
import MarkdownText from '@/components/MarkdownText';
import {
  copyText,
  downloadImage,
  shareImage
} from '@/lib/shareUtils';

// One chat bubble. User messages stay plain text; AI messages render markdown.
// Each AI message has copy + listen; image messages add download/share/copy-link.
function ChatMessage({ message, onEdit, onRegenerate }) {
  const isUser = message.role === 'user';
  const [imgCopied, setImgCopied] = useState(false);

  const handleCopyImageLink = async () => {
    const ok = await copyText(message.image_url || '');
    if (ok) {
      setImgCopied(true);
      setTimeout(() => setImgCopied(false), 1600);
    }
  };

  const handleDownloadImage = () => {
    if (message.image_url) downloadImage(message.image_url, 'sk-gpt-image.png');
  };

  const handleShareImage = async () => {
    if (!message.image_url) return;
    const prompt = (message.content || '').replace(/^Here's the image I created for:\s*/i, '');
    const res = await shareImage(message.image_url, prompt || 'Made with SK GPT');
    if (res === 'unsupported') {
      const ok = await copyText(message.image_url);
      alert(ok ? 'Image link copied!' : 'Sharing not supported on this browser.');
    }
  };

  const handleShareMessage = async () => {
    // Share this single message (with branding) as a snippet.
    const text = `${isUser ? 'You' : 'SK GPT'}: ${message.content || ''}\n\n— Powered by SK GPT`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SK GPT', text });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    const ok = await copyText(text);
    alert(ok ? 'Message copied!' : 'Sharing not supported on this browser.');
  };

  return (
    <div data-chat-message className={`flex min-w-0 gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>
      <div className={`flex min-w-0 flex-col gap-2 ${isUser ? 'max-w-[85%]' : 'flex-1'}`}>
        <span className="px-1 text-[11px] font-medium text-muted-foreground">{isUser ? 'You' : 'SK GPT'}</span>
        <div className={`min-w-0 max-w-full text-[17px] leading-[1.75] sm:text-lg [overflow-wrap:anywhere] ${isUser ? 'rounded-2xl bg-primary px-4 py-3 text-primary-foreground' : 'py-2 text-foreground'}`}>
          {message.content && (isUser
            ? <p className="whitespace-pre-wrap break-words">{message.content}</p>
            : <MarkdownText>{message.content}</MarkdownText>
          )}
          {message.image_url && <ChatImage src={message.image_url} />}
          {message.file_name && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2 text-xs">
              <FileText size={14} />
              <span className="truncate">{message.file_name}</span>
            </div>
          )}
        </div>

        {/* Message actions and three-dot menu */}
        <div className="flex items-center gap-1">
          {!isUser && <ReadAloud text={message.content} />}
          {message.content && <CopyResponseButton text={message.content} />}
          <details className="relative">
            <summary
              aria-label="More message actions"
              title="More actions"
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
            >
              <MoreHorizontal size={18} />
            </summary>
            <div className="absolute left-0 top-9 z-50 min-w-44 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg">
              {isUser && (
                <button onClick={() => onEdit?.(message)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                  <Pencil size={14} /> Edit & resend
                </button>
              )}
              {!isUser && (
                <button onClick={onRegenerate} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                  <RotateCcw size={14} /> Regenerate
                </button>
              )}
              {message.content && (
                <button onClick={handleShareMessage} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                  <Share2 size={14} /> Share message
                </button>
              )}
              {message.image_url && (
                <>
                  <button onClick={handleDownloadImage} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                    <Download size={14} /> Save image
                  </button>
                  <button onClick={handleShareImage} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                    <Share2 size={14} /> Share image
                  </button>
                  <button onClick={handleCopyImageLink} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                    {imgCopied ? <Check size={14} /> : <Link2 size={14} />}
                    {imgCopied ? 'Copied link' : 'Copy image link'}
                  </button>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ChatMessage);