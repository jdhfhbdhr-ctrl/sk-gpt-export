import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { listConversations, deleteConversation } from '@/lib/chatStore';
import { Button } from '@/components/ui/button';
import { Clock, MessageSquare, Trash2, Calendar, Zap } from 'lucide-react';

const TYPE_META = {
  permanent: { label: 'Permanent', icon: MessageSquare },
  temporary: { label: 'Temporary', icon: Clock },
  scheduled: { label: 'Scheduled', icon: Calendar }
};

export default function History() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!user?.uid) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try { setItems(await listConversations(100)); }
    catch (_e) { setItems([]); }
    finally { setLoading(false); }
  }, [user?.uid]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (conv) => {
    try {
      await deleteConversation(conv.id);
      setItems((previous) => previous.filter((item) => item.id !== conv.id));
    } catch (_e) { /* show no destructive success if deletion fails */ }
  };

  const filtered = filter === 'all' ? items : items.filter((c) => c.type === filter);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">All your conversations, including temporary and scheduled chats.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {[{ k: 'all', label: 'All' }, { k: 'permanent', label: 'Permanent' }, { k: 'temporary', label: 'Temporary' }, { k: 'scheduled', label: 'Scheduled' }].map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${filter === f.k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
            filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <p className="text-sm text-muted-foreground">No conversations found.</p>
                <Link to="/"><Button className="mt-4">Start a new chat</Button></Link>
              </div>
            ) : filtered.map((c) => {
              const meta = TYPE_META[c.type] || TYPE_META.permanent;
              const Icon = meta.icon;
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Icon size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{meta.label} · {c.language || 'en'}</p>
                  </div>
                  {c.type === 'scheduled' && c.scheduled_for && (
                    <span className="hidden items-center gap-1 text-xs text-amber-600 sm:flex"><Zap size={12} />{new Date(c.scheduled_for).toLocaleString()}</span>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} title="Delete"><Trash2 size={16} /></Button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
