import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Image as ImageIcon, Paperclip, FileText, Mic, Globe, Plug,
  Brain, Clock, ChevronLeft, Check, Sparkles
} from 'lucide-react';
import { LANGUAGES } from '@/lib/languages';

// A compact bottom-sheet of chat tools. Opens above the composer on mobile,
// centered on larger screens. Closes on backdrop tap. Sub-views for Photos,
// Language, Chat type and Plugins.
export default function PlusToolsSheet({
  open, initialView = 'main', onClose,
  language, onSetLanguage,
  chatType, onSetChatType,
  thinkHarder, onToggleThinkHarder,
  onCamera, onPhotosGallery, onGeneratePhoto, onFiles, onPdf, onVoice
}) {
  const [view, setView] = useState('main');

  useEffect(() => {
    if (open) setView(initialView || 'main');
  }, [open, initialView]);

  const ToolButton = ({ icon: Icon, label, onClick, active }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background hover:bg-accent'}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  const SubView = ({ title, onBack, children }) => (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button onClick={onBack} className="rounded-lg p-1 hover:bg-accent" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-display text-sm font-semibold">{title}</h3>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-md rounded-t-2xl border bg-background p-4 shadow-xl sm:rounded-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {view === 'main' && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold">Tools</h3>
                  <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ToolButton icon={Camera} label="Camera" onClick={onCamera} />
                  <ToolButton icon={ImageIcon} label="Photos" onClick={() => setView('photos')} />
                  <ToolButton icon={Paperclip} label="Files" onClick={onFiles} />
                  <ToolButton icon={FileText} label="PDF" onClick={onPdf} />
                  <ToolButton icon={Mic} label="Voice" onClick={onVoice} />
                  <ToolButton icon={Globe} label="Language" onClick={() => setView('language')} />
                  <ToolButton icon={Plug} label="Plugins" onClick={() => setView('plugins')} />
                  <ToolButton icon={Brain} label="Think harder" onClick={onToggleThinkHarder} active={thinkHarder} />
                  <ToolButton icon={Clock} label="Chat type" onClick={() => setView('chatType')} active={chatType !== 'permanent'} />
                </div>
              </>
            )}

            {view === 'photos' && (
              <SubView title="Photos" onBack={() => setView('main')}>
                <button onClick={onPhotosGallery} className="flex w-full items-center gap-3 rounded-xl border p-3 text-sm hover:bg-accent">
                  <ImageIcon size={18} /> Choose from gallery
                </button>
                <button onClick={onGeneratePhoto} className="flex w-full items-center gap-3 rounded-xl border p-3 text-sm hover:bg-accent">
                  <Sparkles size={18} /> Generate image with AI
                </button>
              </SubView>
            )}

            {view === 'language' && (
              <SubView title="Language" onBack={() => setView('main')}>
                <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => onSetLanguage(l.code)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${language === l.code ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                    >
                      {l.label}
                      {language === l.code && <Check size={15} />}
                    </button>
                  ))}
                </div>
              </SubView>
            )}

            {view === 'chatType' && (
              <SubView title="Chat type" onBack={() => setView('main')}>
                {[
                  { v: 'permanent', l: 'Permanent' },
                  { v: 'temporary', l: 'Temporary' },
                  { v: 'scheduled', l: 'Scheduled' }
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => onSetChatType(o.v)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-sm ${chatType === o.v ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                  >
                    {o.l}
                    {chatType === o.v && <Check size={15} />}
                  </button>
                ))}
              </SubView>
            )}

            {view === 'plugins' && (
              <SubView title="Plugins" onBack={() => setView('main')}>
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No plugins connected yet. Connect integrations from your workspace to enable plugins here.
                </p>
              </SubView>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}