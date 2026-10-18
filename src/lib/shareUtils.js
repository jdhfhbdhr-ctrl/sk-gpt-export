// Shared helpers for SK GPT conversation sharing, copying, and downloading.

export const SK_GPT_NAME = 'SK GPT';
export const SK_GPT_TAGLINE = 'SK GPT — Your intelligent assistant, in every language.';
export const SK_GPT_FOOTER = '\n\n— Powered by SK GPT';

// Build plain-text version of a full conversation with SK GPT branding.
export function buildConversationText(conversation, messages) {
  const title = conversation?.title || conversation?.shared_title || 'SK GPT conversation';
  const lines = [title, ''];
  (messages || []).forEach((m) => {
    const who = m.role === 'user' ? 'You' : 'SK GPT';
    let body = m.content || '';
    if (m.image_url) body += (body ? '\n' : '') + `[image] ${m.image_url}`;
    if (m.file_name) body += (body ? '\n' : '') + `[file] ${m.file_name}`;
    lines.push(`${who}: ${body}`, '');
  });
  lines.push(SK_GPT_TAGLINE, SK_GPT_FOOTER.trim());
  return lines.join('\n');
}

// Copy any text to the clipboard, with a legacy fallback.
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_e) { /* fall through to legacy */ }
  const previous = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
  const ta = document.createElement('textarea');
  try {
    ta.value = String(text || '');
    ta.readOnly = true;
    Object.assign(ta.style, { position: 'fixed', top: '0', left: '0', opacity: '0', fontSize: '16px' });
    document.body.appendChild(ta);
    ta.focus({ preventScroll: true });
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    return document.execCommand('copy');
  } catch (_e) {
    return false;
  } finally {
    ta.remove();
    previous?.focus?.({ preventScroll: true });
    if (selection) { selection.removeAllRanges(); ranges.forEach((range) => selection.addRange(range)); }
  }
}

// Use the native Web Share API when available, sharing the full conversation text.
export async function nativeShare({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      return 'error';
    }
  }
  return 'unsupported';
}

// Download a text blob as a file.
export function downloadTextFile(text, filename = 'sk-gpt-conversation.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Download an image URL as a file (works for remote images via fetch blob).
export async function downloadImage(imageUrl, filename = 'sk-gpt-image.png') {
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (_e) {
    // Fallback: open in a new tab so the user can save manually.
    window.open(imageUrl, '_blank', 'noopener');
    return false;
  }
}

// Share a generated image via the native share API (files when supported, else URL).
export async function shareImage(imageUrl, prompt = '') {
  if (navigator.share) {
    // Try sharing as a file first (works on most mobile browsers).
    try {
      const res = await fetch(imageUrl, { mode: 'cors' });
      const blob = await res.blob();
      const file = new File([blob], 'sk-gpt-image.png', { type: blob.type || 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'SK GPT image', text: prompt || 'Made with SK GPT' });
        return 'shared';
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
    // Fall back to sharing the link.
    try {
      await navigator.share({ title: 'SK GPT image', text: prompt || 'Made with SK GPT', url: imageUrl });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      return 'error';
    }
  }
  return 'unsupported';
}

export function safeFilename(s) {
  return String(s || 'sk-gpt').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'sk-gpt';
}