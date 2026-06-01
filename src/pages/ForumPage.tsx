import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatRelativeTime } from '../lib/utils';
import type {
  ForumCategory, ForumThread, ForumReply, ForumReaction,
  BugReport, BugReportType, ReactionType
} from '../lib/types';
import {
  MessageCircle, HelpCircle, ShoppingBag, Lightbulb, Megaphone, Bug,
  ArrowLeft, PlusCircle, Pin, Lock, CheckCircle2, Eye, ThumbsUp,
  Heart, Laugh, Star, Send, Pencil, Trash2, X, AlertCircle,
  Search, TrendingUp, Clock, Filter, ChevronRight, Shield,
  CornerDownRight, AlertTriangle, Zap, CheckCheck
} from 'lucide-react';
import Avatar from '../components/Avatar';
import { useSEO, SEO_PAGES } from '../lib/seo';

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'message-circle': MessageCircle,
  'help-circle': HelpCircle,
  'shopping-bag': ShoppingBag,
  'lightbulb': Lightbulb,
  'megaphone': Megaphone,
  'bug': Bug,
};

const CATEGORY_COLORS: Record<string, { pill: string; text: string; bg: string; border: string }> = {
  emerald: { pill: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  sky:     { pill: 'text-sky-400 bg-sky-500/10 border-sky-500/20',             text: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
  amber:   { pill: 'text-amber-400 bg-amber-500/10 border-amber-500/20',       text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  teal:    { pill: 'text-teal-400 bg-teal-500/10 border-teal-500/20',          text: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20' },
  rose:    { pill: 'text-rose-400 bg-rose-500/10 border-rose-500/20',          text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
  red:     { pill: 'text-red-400 bg-red-500/10 border-red-500/20',             text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
};

const REACTIONS: { type: ReactionType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { type: 'like',    icon: ThumbsUp, label: 'Tetszik' },
  { type: 'heart',   icon: Heart,    label: 'Szuper' },
  { type: 'laugh',   icon: Laugh,    label: 'Vicces' },
  { type: 'helpful', icon: Star,     label: 'Hasznos' },
];

const BUG_TYPES: { value: BugReportType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'bug',         label: 'Hiba',               icon: Bug,           color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { value: 'suggestion',  label: 'Fejlesztési ötlet',  icon: Lightbulb,     color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'improvement', label: 'Javítási javaslat',  icon: Zap,           color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { value: 'question',    label: 'Kérdés a csapatnak', icon: HelpCircle,    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
];

const BUG_STATUSES: Record<string, { label: string; color: string }> = {
  open:        { label: 'Nyitott',      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  in_progress: { label: 'Folyamatban', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  resolved:    { label: 'Megoldva',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  closed:      { label: 'Lezárva',     color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' },
  duplicate:   { label: 'Duplikált',   color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryColor(color: string) {
  return CATEGORY_COLORS[color] ?? CATEGORY_COLORS.emerald;
}

function generateSlug(title: string): string {
  const base = title.toLowerCase()
    .replace(/[^a-z0-9\sáéíóöőüűÁÉÍÓÖŐÜŰ-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 10);
  return (base || 'tema') + '-' + rand;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Ic = CATEGORY_ICONS[icon] ?? MessageCircle;
  return <Ic className={className} />;
}

function ReactionBar({ reactions, onReact, myReactions, threadId, replyId }: {
  reactions: ForumReaction[];
  onReact: (type: ReactionType) => void;
  myReactions: ReactionType[];
  threadId?: string;
  replyId?: string;
}) {
  const counts: Partial<Record<ReactionType, number>> = {};
  for (const r of reactions) counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;

  return (
    <div className="flex gap-1 flex-wrap">
      {REACTIONS.map(({ type, icon: Ic, label }) => {
        const count = counts[type] || 0;
        const active = myReactions.includes(type);
        if (count === 0 && !active) return null;
        return (
          <button
            key={type}
            onClick={() => onReact(type)}
            title={label}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-all border ${
              active ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'glass-pill text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Ic className="w-3 h-3" />{count > 0 && <span>{count}</span>}
          </button>
        );
      })}
      <div className="flex gap-0.5 ml-auto">
        {REACTIONS.map(({ type, icon: Ic, label }) => {
          const active = myReactions.includes(type);
          if (counts[type]) return null;
          return (
            <button key={type} onClick={() => onReact(type)} title={label}
              className="p-1 glass-pill rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors">
              <Ic className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-sm space-y-4">
        <div className="w-12 h-12 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-zinc-100 mb-1">Törlés megerősítése</h3>
          <p className="text-zinc-400 text-sm">Ez a művelet nem vonható vissza.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium text-sm hover:bg-red-500/30 transition-colors">Törlés</button>
          <button onClick={onCancel} className="flex-1 py-3 glass-pill text-zinc-400 rounded-xl font-medium text-sm hover:text-zinc-200 transition-colors">Mégse</button>
        </div>
      </div>
    </div>
  );
}

// ── Forum home view ────────────────────────────────────────────────────────────

function ForumHome({ categories, threads, onSelectCategory, onSelectThread, onNewThread, search, setSearch }: {
  categories: ForumCategory[];
  threads: ForumThread[];
  onSelectCategory: (cat: ForumCategory) => void;
  onSelectThread: (t: ForumThread) => void;
  onNewThread: () => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'popular' | 'fresh'>('fresh');

  const popular = [...threads].sort((a, b) => (b.reply_count + b.reaction_count) - (a.reply_count + a.reaction_count)).slice(0, 8);
  const fresh = [...threads].sort((a, b) => new Date(b.last_reply_at || b.created_at).getTime() - new Date(a.last_reply_at || a.created_at).getTime()).slice(0, 8);
  const displayed = tab === 'popular' ? popular : fresh;

  const filtered = search
    ? threads.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase()))
    : displayed;

  return (
    <div className="space-y-6">
      {/* City Hero — Közösségi Tér */}
      <section className="page-hero rounded-3xl overflow-hidden" style={{ height: 'clamp(180px, 28vh, 260px)' }}>
        <img
          src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Közösségi Tér"
          className="page-hero-bg"
          style={{ objectPosition: 'center 40%' }}
        />
        <div className="page-hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(7,17,31,0.35) 0%, rgba(7,17,31,0.2) 40%, rgba(7,17,31,0.88) 100%)' }} />
        <div className="absolute inset-0 grid-overlay opacity-40" />
        <div className="scan-line" />
        <div className="page-hero-content h-full flex flex-col justify-end px-6 pb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#38bdf8' }} />
                <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#38bdf8' }}>Közösségi Tér</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight" style={{ textShadow: '0 0 30px rgba(56,189,248,0.3)' }}>
                Közösségi Fórum
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <MessageCircle className="w-3 h-3" style={{ color: '#38bdf8' }} />
                  <span><strong className="text-zinc-200">{threads.length}</strong> téma</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Eye className="w-3 h-3 text-zinc-500" />
                  <span><strong className="text-zinc-200">{categories.length}</strong> kategória</span>
                </div>
              </div>
            </div>
            {user && (
              <button
                onClick={onNewThread}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.03] whitespace-nowrap"
                style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.35)', color: '#7dd3fc' }}
              >
                <PlusCircle className="w-4 h-4" />
                Új téma
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés a témák között..."
          className="w-full pl-10 pr-10 py-3 glass-input rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories */}
      {!search && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Kategóriák</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const col = getCategoryColor(cat.color);
              const catThreads = threads.filter((t) => t.category_id === cat.id);
              const latest = catThreads.sort((a, b) => new Date(b.last_reply_at || b.created_at).getTime() - new Date(a.last_reply_at || a.created_at).getTime())[0];
              return (
                <button key={cat.id} onClick={() => onSelectCategory(cat)}
                  className={`w-full text-left glass rounded-2xl p-4 group hover:border-white/8 border transition-all duration-200 ${cat.is_bug_tracker ? 'border-red-500/10 hover:border-red-500/20' : 'border-transparent'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${col.bg} border ${col.border}`}>
                      <CategoryIcon icon={cat.icon} className={`w-5 h-5 ${col.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm group-hover:${col.text} transition-colors text-zinc-200`}>{cat.name}</p>
                        {cat.is_bug_tracker && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-medium">DEV</span>}
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{cat.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{catThreads.length}</span>
                        {latest && <span className="truncate">{formatRelativeTime(latest.last_reply_at || latest.created_at)}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Thread list */}
      <div>
        {!search ? (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Témák</h2>
            <div className="flex gap-1">
              <button onClick={() => setTab('fresh')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tab === 'fresh' ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-500 hover:text-zinc-300'}`}>
                <Clock className="w-3 h-3" />Friss
              </button>
              <button onClick={() => setTab('popular')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tab === 'popular' ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-500 hover:text-zinc-300'}`}>
                <TrendingUp className="w-3 h-3" />Népszerű
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 mb-3"><span className="text-zinc-200 font-semibold">{filtered.length}</span> találat</p>
        )}

        {(search ? filtered : displayed).length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <MessageCircle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">{search ? 'Nem található egyező téma.' : 'Még nincs téma. Legyél az első!'}</p>
            {!search && user && (
              <button onClick={onNewThread} className="mt-3 glass-pill-active text-emerald-300 px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />Első téma létrehozása
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {(search ? filtered : displayed).map((thread) => (
              <ThreadRow key={thread.id} thread={thread} categories={categories} onClick={() => onSelectThread(thread)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Thread row ────────────────────────────────────────────────────────────────

function ThreadRow({ thread, categories, onClick }: { thread: ForumThread; categories: ForumCategory[]; onClick: () => void }) {
  const cat = categories.find((c) => c.id === thread.category_id);
  const col = cat ? getCategoryColor(cat.color) : getCategoryColor('emerald');

  return (
    <button onClick={onClick}
      className="w-full text-left glass rounded-2xl p-4 group hover:bg-white/[0.02] hover:border-white/8 border border-transparent transition-all">
      <div className="flex items-start gap-3">
        <Avatar
          src={thread.author?.avatar_url}
          name={thread.author?.full_name || thread.author?.username || '?'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {thread.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              {thread.is_solved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
              {thread.is_locked && <Lock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />}
              <h3 className="font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors text-sm line-clamp-1">{thread.title}</h3>
            </div>
            {cat && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border flex-shrink-0 ${col.pill}`}>
                {cat.name}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{thread.content.replace(/\n/g, ' ')}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
            <span>{thread.author?.full_name || thread.author?.username}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{thread.reply_count}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.view_count}</span>
            <span className="ml-auto">{formatRelativeTime(thread.last_reply_at || thread.created_at)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Category view ─────────────────────────────────────────────────────────────

function CategoryView({ category, threads, onBack, onSelectThread, onNewThread }: {
  category: ForumCategory;
  threads: ForumThread[];
  onBack: () => void;
  onSelectThread: (t: ForumThread) => void;
  onNewThread: () => void;
}) {
  const { user } = useAuth();
  const col = getCategoryColor(category.color);
  const catThreads = threads.filter((t) => t.category_id === category.id)
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.last_reply_at || b.created_at).getTime() - new Date(a.last_reply_at || a.created_at).getTime();
    });

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />Vissza
      </button>

      <div className={`glass rounded-3xl p-5 border ${col.border}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${col.bg} border ${col.border}`}>
              <CategoryIcon icon={category.icon} className={`w-6 h-6 ${col.text}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">{category.name}</h1>
              <p className="text-zinc-500 text-sm mt-0.5">{category.description}</p>
            </div>
          </div>
          {user && !category.is_bug_tracker && (
            <button onClick={onNewThread}
              className="glass-pill-active text-emerald-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all flex items-center gap-2 flex-shrink-0">
              <PlusCircle className="w-4 h-4" />Új téma
            </button>
          )}
        </div>
      </div>

      {catThreads.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl space-y-3">
          <MessageCircle className="w-8 h-8 text-zinc-700 mx-auto" />
          <p className="text-zinc-500 text-sm">Ebben a kategóriában még nincs téma.</p>
          {user && !category.is_bug_tracker && (
            <button onClick={onNewThread} className="glass-pill-active text-emerald-300 px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />Első téma
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {catThreads.map((t) => <ThreadRow key={t.id} thread={t} categories={[category]} onClick={() => onSelectThread(t)} />)}
        </div>
      )}
    </div>
  );
}

// ── Thread detail view ────────────────────────────────────────────────────────

function ThreadDetail({ thread: initialThread, categories, allThreads, onBack, onRefresh }: {
  thread: ForumThread;
  categories: ForumCategory[];
  allThreads: ForumThread[];
  onBack: () => void;
  onRefresh: () => void;
}) {
  const { user, profile } = useAuth();
  const { showToast } = useNotification();

  const [thread, setThread] = useState<ForumThread>(initialThread);
  const [loadingThread, setLoadingThread] = useState(!initialThread.author);

  const cat = categories.find((c) => c.id === thread.category_id);
  const col = cat ? getCategoryColor(cat.color) : getCategoryColor('emerald');

  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [reactions, setReactions] = useState<ForumReaction[]>([]);
  const [myReactions, setMyReactions] = useState<ForumReaction[]>([]);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ForumReply | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = user?.id === thread.author_id;
  const isAdmin = profile?.is_admin || profile?.is_super_admin;

  useEffect(() => {
    // If the thread was just created and author data isn't loaded, fetch it fresh
    if (!initialThread.author) {
      supabase
        .from('forum_threads')
        .select('*, author:profiles!forum_threads_author_id_fkey(id, username, full_name, avatar_url), category:forum_categories(*)')
        .eq('id', initialThread.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setThread(data as ForumThread);
          setLoadingThread(false);
        });
    }
    loadReplies();
    incrementView();
  }, [initialThread.id]);

  async function incrementView() {
    await supabase.from('forum_threads').update({ view_count: (thread.view_count || 0) + 1 }).eq('id', thread.id);
  }

  async function loadReplies() {
    const { data } = await supabase
      .from('forum_replies')
      .select('*, author:profiles!forum_replies_author_id_fkey(id, username, full_name, avatar_url)')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });
    const loaded = (data || []) as ForumReply[];
    setReplies(loaded);
    await loadReactions(loaded);
  }

  async function loadReactions(currentReplies?: ForumReply[]) {
    const replyIds = (currentReplies ?? replies).map((r) => r.id);
    let data: ForumReaction[] = [];
    if (replyIds.length > 0) {
      const { data: d } = await supabase
        .from('forum_reactions')
        .select('*')
        .or(`thread_id.eq.${thread.id},reply_id.in.(${replyIds.join(',')})`);
      data = (d || []) as ForumReaction[];
    } else {
      const { data: d } = await supabase
        .from('forum_reactions')
        .select('*')
        .eq('thread_id', thread.id);
      data = (d || []) as ForumReaction[];
    }
    setReactions(data);
    if (user) setMyReactions(data.filter((r) => r.user_id === user.id));
  }

  async function handleReact(type: ReactionType, replyId?: string) {
    if (!user) { showToast('error', 'Bejelentkezés szükséges', ''); return; }
    const existing = replyId
      ? myReactions.find((r) => r.reply_id === replyId && r.reaction_type === type)
      : myReactions.find((r) => r.thread_id === thread.id && r.reaction_type === type);
    if (existing) {
      await supabase.from('forum_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('forum_reactions').insert({
        user_id: user.id,
        thread_id: replyId ? null : thread.id,
        reply_id: replyId || null,
        reaction_type: type,
      });
    }
    await loadReactions();
  }

  async function handleReply() {
    if (!user || !replyText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('forum_replies').insert({
      thread_id: thread.id,
      author_id: user.id,
      content: replyText.trim(),
      parent_reply_id: replyingTo?.id || null,
    });
    if (error) { showToast('error', 'Hiba', 'Válasz küldése sikertelen.'); }
    else { setReplyText(''); setReplyingTo(null); await loadReplies(); onRefresh(); }
    setSubmitting(false);
  }

  async function handleEditSave(replyId: string) {
    if (!editText.trim()) return;
    await supabase.from('forum_replies').update({ content: editText.trim(), is_edited: true }).eq('id', replyId);
    setEditingReplyId(null);
    await loadReplies();
  }

  async function handleDelete(replyId: string) {
    await supabase.from('forum_replies').delete().eq('id', replyId);
    setDeletingId(null);
    await loadReplies();
    onRefresh();
  }

  async function markSolution(replyId: string, isSolution: boolean) {
    await supabase.from('forum_replies').update({ is_solution: isSolution }).eq('id', replyId);
    await supabase.from('forum_threads').update({ is_solved: isSolution }).eq('id', thread.id);
    await loadReplies();
    onRefresh();
  }

  const threadReactions = reactions.filter((r) => r.thread_id === thread.id);
  const myThreadReactions = myReactions.filter((r) => r.thread_id === thread.id).map((r) => r.reaction_type);

  if (loadingThread) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="glass rounded-3xl h-12 w-28 animate-pulse" />
        <div className="glass rounded-3xl h-56 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />Vissza
      </button>

      {/* Thread */}
      <div className="glass rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Avatar src={thread.author?.avatar_url} name={thread.author?.full_name || thread.author?.username || '?'} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {thread.is_pinned && <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400"><Pin className="w-2.5 h-2.5" />Kitűzött</span>}
                {thread.is_solved && <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><CheckCircle2 className="w-2.5 h-2.5" />Megoldva</span>}
                {thread.is_locked && <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-500/10 border border-zinc-500/20 text-zinc-500"><Lock className="w-2.5 h-2.5" />Zárt</span>}
              </div>
              <h1 className="text-lg md:text-xl font-bold text-zinc-100 mt-1 leading-snug">{thread.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                <span className="font-medium text-zinc-400">{thread.author?.full_name || thread.author?.username}</span>
                <span>{formatRelativeTime(thread.created_at)}</span>
                {cat && <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${col.pill}`}>{cat.name}</span>}
              </div>
            </div>
          </div>

          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{thread.content}</p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <ReactionBar reactions={threadReactions} onReact={(t) => handleReact(t)} myReactions={myThreadReactions} threadId={thread.id} />
            <div className="flex items-center gap-3 text-xs text-zinc-600">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.view_count}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{thread.reply_count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">{replies.length} válasz</p>
          {replies.map((reply) => {
            const parent = reply.parent_reply_id ? replies.find((r) => r.id === reply.parent_reply_id) : null;
            const replyReactions = reactions.filter((r) => r.reply_id === reply.id);
            const myReplyReactions = myReactions.filter((r) => r.reply_id === reply.id).map((r) => r.reaction_type);
            const canEdit = user?.id === reply.author_id;
            const canDelete = canEdit || isAdmin;

            return (
              <div key={reply.id} className={`glass rounded-2xl p-4 ${reply.is_solution ? 'border border-emerald-500/25' : 'border border-transparent'}`}>
                {reply.is_solution && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-3 pb-2 border-b border-emerald-500/15">
                    <CheckCheck className="w-4 h-4" />Elfogadott megoldás
                  </div>
                )}
                {parent && (
                  <div className="flex items-center gap-2 mb-3 pl-3 border-l-2 border-zinc-700">
                    <CornerDownRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                    <p className="text-xs text-zinc-600 line-clamp-1">
                      <span className="text-zinc-500 font-medium">{parent.author?.username}</span>: {parent.content}
                    </p>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Avatar src={reply.author?.avatar_url} name={reply.author?.full_name || reply.author?.username || '?'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-zinc-300">{reply.author?.full_name || reply.author?.username}</span>
                        <span className="text-zinc-600">{formatRelativeTime(reply.created_at)}</span>
                        {reply.is_edited && <span className="text-zinc-700">(szerkesztve)</span>}
                      </div>
                      <div className="flex gap-1">
                        {user && !thread.is_locked && (
                          <button onClick={() => { setReplyingTo(reply); replyRef.current?.focus(); }}
                            className="p-1 glass-pill rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors" title="Válasz">
                            <CornerDownRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isOwner && !reply.is_solution && !thread.is_solved && (
                          <button onClick={() => markSolution(reply.id, true)}
                            className="p-1 glass-pill rounded-lg text-zinc-600 hover:text-emerald-400 transition-colors" title="Megoldásnak jelöl">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isOwner && reply.is_solution && (
                          <button onClick={() => markSolution(reply.id, false)}
                            className="p-1 glass-pill rounded-lg text-emerald-400 hover:text-zinc-400 transition-colors" title="Megoldás visszavonása">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => { setEditingReplyId(reply.id); setEditText(reply.content); }}
                            className="p-1 glass-pill rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeletingId(reply.id)}
                            className="p-1 glass-pill rounded-lg text-zinc-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {editingReplyId === reply.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}
                          className="w-full px-3 py-2 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => handleEditSave(reply.id)} className="px-3 py-1.5 glass-pill-active text-emerald-300 rounded-xl text-xs font-medium">Mentés</button>
                          <button onClick={() => setEditingReplyId(null)} className="px-3 py-1.5 glass-pill text-zinc-400 rounded-xl text-xs font-medium">Mégse</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400 mt-1 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                    )}

                    <div className="mt-2">
                      <ReactionBar reactions={replyReactions} onReact={(t) => handleReact(t, reply.id)} myReactions={myReplyReactions} replyId={reply.id} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply composer */}
      {user && !thread.is_locked ? (
        <div className="glass rounded-3xl p-5 space-y-3">
          {replyingTo && (
            <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-3 py-2">
              <p className="text-xs text-zinc-500 line-clamp-1">
                <CornerDownRight className="w-3 h-3 inline mr-1 text-zinc-600" />
                Válasz: <span className="text-zinc-400">{replyingTo.author?.username}</span>
              </p>
              <button onClick={() => setReplyingTo(null)} className="text-zinc-600 hover:text-zinc-400"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <textarea
            ref={replyRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder="Írd meg válaszod..."
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none leading-relaxed"
          />
          <div className="flex justify-end">
            <button onClick={handleReply} disabled={!replyText.trim() || submitting}
              className="flex items-center gap-2 glass-pill-active text-emerald-300 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-all">
              <Send className="w-4 h-4" />{submitting ? 'Küldés...' : 'Válasz küldése'}
            </button>
          </div>
        </div>
      ) : thread.is_locked ? (
        <div className="glass rounded-2xl p-4 text-center">
          <Lock className="w-5 h-5 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">Ez a téma zárva van, nem lehet hozzászólni.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-zinc-500 text-sm">Válaszoláshoz be kell jelentkezni.</p>
        </div>
      )}

      {deletingId && <DeleteConfirm onConfirm={() => handleDelete(deletingId)} onCancel={() => setDeletingId(null)} />}
    </div>
  );
}

// ── New thread form ────────────────────────────────────────────────────────────

function NewThreadForm({ categories, defaultCategory, onBack, onCreated }: {
  categories: ForumCategory[];
  defaultCategory?: ForumCategory;
  onBack: () => void;
  onCreated: (t: ForumThread) => void;
}) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [catId, setCatId] = useState(defaultCategory?.id || categories[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);

  const selCat = categories.find((c) => c.id === catId);
  const canSubmit = title.trim().length >= 5 && content.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !canSubmit || submitting) return;
    setSubmitting(true);
    const slug = generateSlug(title);
    // Insert first
    const { data: inserted, error: insertError } = await supabase
      .from('forum_threads')
      .insert({
        category_id: catId,
        author_id: user.id,
        title: title.trim(),
        slug,
        content: content.trim(),
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      showToast('error', 'Hiba', insertError?.message || 'Téma létrehozása sikertelen.');
      setSubmitting(false);
      return;
    }
    // Then fetch with joins separately
    const { data, error: fetchError } = await supabase
      .from('forum_threads')
      .select('*, author:profiles!forum_threads_author_id_fkey(id, username, full_name, avatar_url), category:forum_categories(*)')
      .eq('id', inserted.id)
      .maybeSingle();
    showToast('success', 'Létrehozva', 'Témád megjelent a fórumon.');
    onCreated((data ?? { id: inserted.id, title: title.trim(), slug, content: content.trim(), category_id: catId, author_id: user.id, is_pinned: false, is_locked: false, is_solved: false, view_count: 0, reply_count: 0, reaction_count: 0, last_reply_at: null, last_reply_by: null, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }) as ForumThread);
    setSubmitting(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />Vissza
      </button>
      <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
        <PlusCircle className="w-5 h-5 text-emerald-400" />Új téma
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="glass rounded-3xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Kategória</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.filter((c) => !c.is_bug_tracker).map((cat) => {
                const col = getCategoryColor(cat.color);
                return (
                  <button type="button" key={cat.id} onClick={() => setCatId(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all text-sm ${catId === cat.id ? `${col.bg} ${col.border} ${col.text}` : 'border-transparent glass-bubble text-zinc-400 hover:text-zinc-200'}`}>
                    <CategoryIcon icon={cat.icon} className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium line-clamp-1">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Cím *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150}
              placeholder="Mi a kérdésed vagy témád?"
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Tartalom *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} maxLength={5000}
              placeholder="Írd le részletesen a kérdésed vagy témádat..."
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none leading-relaxed" />
            <p className="text-xs text-zinc-700 mt-1 text-right">{content.length}/5000</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={!canSubmit || submitting}
            className="flex-1 py-4 glass-pill-active text-emerald-300 font-semibold rounded-2xl hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />{submitting ? 'Küldés...' : 'Téma létrehozása'}
          </button>
          <button type="button" onClick={onBack}
            className="px-6 py-4 glass-pill text-zinc-400 font-medium rounded-2xl hover:text-zinc-200 transition-colors">
            Mégse
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Bug report form ────────────────────────────────────────────────────────────

function BugReportForm({ onBack, onSubmitted }: { onBack: () => void; onSubmitted: () => void }) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [type, setType] = useState<BugReportType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [myReports, setMyReports] = useState<BugReport[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'form' | 'list'>('form');

  useEffect(() => { if (user) loadMyReports(); }, [user]);

  async function loadMyReports() {
    const { data } = await supabase.from('bug_reports').select('*').eq('reporter_id', user!.id).order('created_at', { ascending: false });
    setMyReports((data || []) as BugReport[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || title.trim().length < 5 || description.trim().length < 10) return;
    setSubmitting(true);
    const { error } = await supabase.from('bug_reports').insert({
      reporter_id: user.id,
      type,
      title: title.trim(),
      description: description.trim(),
      steps_to_reproduce: steps.trim(),
      status: 'open',
      priority: type === 'bug' ? 'medium' : 'low',
    });
    if (error) { showToast('error', 'Hiba', 'Beküldés sikertelen.'); setSubmitting(false); return; }
    showToast('success', 'Beküldve', 'Köszönjük a visszajelzést!');
    setTitle(''); setDescription(''); setSteps('');
    await loadMyReports();
    setView('list');
    setSubmitting(false);
  }

  const typeInfo = BUG_TYPES.find((t) => t.value === type)!;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />Vissza
      </button>

      <div className="glass rounded-3xl p-5 border border-red-500/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Bug className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="font-bold text-zinc-100">Hibajelentés & Fejlesztési ötletek</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Segíts jobbá tenni a platformot!</p>
          </div>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        <button onClick={() => setView('form')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === 'form' ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>Új beküldés</button>
        <button onClick={() => setView('list')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === 'list' ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>Előzményeim ({myReports.length})</button>
      </div>

      {view === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass rounded-3xl p-5 space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Típus</label>
              <div className="grid grid-cols-2 gap-2">
                {BUG_TYPES.map((bt) => {
                  const Ic = bt.icon;
                  return (
                    <button type="button" key={bt.value} onClick={() => setType(bt.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${type === bt.value ? bt.color : 'border-transparent glass-bubble text-zinc-400 hover:text-zinc-200'}`}>
                      <Ic className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium">{bt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Cím *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150}
                placeholder={type === 'bug' ? 'Röviden: mi a hiba?' : 'Mi az ötleted?'}
                className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Leírás *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={2000}
                placeholder={type === 'bug' ? 'Mi történt? Mit vártál el? Melyik böngészőt / eszközt használod?' : 'Írd le részletesen az ötleted...'}
                className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none" />
            </div>
            {type === 'bug' && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Lépések a hiba reprodukálásához (opcionális)</label>
                <textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={3} maxLength={1000}
                  placeholder="1. Menj erre az oldalra&#10;2. Kattints erre&#10;3. Hiba jelenik meg"
                  className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none" />
              </div>
            )}
          </div>
          <button type="submit" disabled={title.trim().length < 5 || description.trim().length < 10 || submitting || !user}
            className="w-full py-4 glass-pill-active text-emerald-300 font-semibold rounded-2xl hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />{submitting ? 'Küldés...' : 'Beküldés'}
          </button>
          {!user && <p className="text-xs text-zinc-500 text-center">Bejelentkezés szükséges a beküldéshez.</p>}
        </form>
      ) : (
        <div className="space-y-3">
          {myReports.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl">
              <Bug className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Még nem küldtél be visszajelzést.</p>
            </div>
          ) : (
            myReports.map((r) => {
              const st = BUG_STATUSES[r.status] ?? BUG_STATUSES.open;
              const bt = BUG_TYPES.find((b) => b.value === r.type)!;
              const Ic = bt.icon;
              return (
                <div key={r.id} className="glass rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Ic className={`w-4 h-4 flex-shrink-0 ${bt.color.split(' ')[0]}`} />
                      <p className="font-medium text-zinc-200 text-sm line-clamp-1">{r.title}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border flex-shrink-0 ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">{r.description}</p>
                  {r.admin_note && (
                    <div className="flex items-start gap-2 bg-zinc-800/50 rounded-xl px-3 py-2">
                      <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-zinc-400">{r.admin_note}</p>
                    </div>
                  )}
                  <p className="text-xs text-zinc-700">{formatRelativeTime(r.created_at)}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ForumPage ─────────────────────────────────────────────────────────────

type ForumView = 'home' | 'category' | 'thread' | 'new-thread' | 'bug-report';

export default function ForumPage() {
  useSEO(SEO_PAGES.forum);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [view, setView] = useState<ForumView>('home');
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [newThreadCategory, setNewThreadCategory] = useState<ForumCategory | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setFetchError(null);
    try {
      const [catsRes, thsRes] = await Promise.all([
        supabase.from('forum_categories').select('*').order('sort_order'),
        supabase.from('forum_threads')
          .select('*, author:profiles!forum_threads_author_id_fkey(id, username, full_name, avatar_url), category:forum_categories(*)')
          .eq('status', 'active')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(200),
      ]);
      if (catsRes.error) {
        setFetchError('Kategóriák betöltése sikertelen: ' + catsRes.error.message);
      } else {
        setCategories((catsRes.data ?? []) as ForumCategory[]);
      }
      if (thsRes.error) {
        setFetchError('Témák betöltése sikertelen: ' + thsRes.error.message);
      } else {
        setThreads((thsRes.data ?? []) as ForumThread[]);
      }
    } catch (e: unknown) {
      setFetchError('Ismeretlen hiba: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  async function refreshSilent() {
    try {
      const [catsRes, thsRes] = await Promise.all([
        supabase.from('forum_categories').select('*').order('sort_order'),
        supabase.from('forum_threads')
          .select('*, author:profiles!forum_threads_author_id_fkey(id, username, full_name, avatar_url), category:forum_categories(*)')
          .eq('status', 'active')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(200),
      ]);
      if (!catsRes.error) setCategories((catsRes.data ?? []) as ForumCategory[]);
      if (!thsRes.error) setThreads((thsRes.data ?? []) as ForumThread[]);
    } catch (_) { /* silent */ }
  }

  function openCategory(cat: ForumCategory) {
    if (cat.is_bug_tracker) { setView('bug-report'); return; }
    setSelectedCategory(cat);
    setView('category');
  }

  function openThread(t: ForumThread) {
    setSelectedThread(t);
    setView('thread');
  }

  function openNewThread(cat?: ForumCategory) {
    setNewThreadCategory(cat || null);
    setView('new-thread');
  }

  function goHome() {
    setView('home');
    setSelectedCategory(null);
    setSelectedThread(null);
    setSearch('');
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass rounded-3xl h-40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="glass rounded-2xl h-24 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="glass rounded-3xl p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-zinc-300 font-medium">Hiba a betöltés során</p>
        <p className="text-zinc-500 text-sm">{fetchError}</p>
        <button onClick={() => fetchAll()} className="glass-pill-active text-emerald-300 px-4 py-2 rounded-xl text-sm font-medium">
          Újrapróbálás
        </button>
      </div>
    );
  }

  if (view === 'thread' && selectedThread) {
    return (
      <ThreadDetail
        thread={selectedThread}
        categories={categories}
        allThreads={threads}
        onBack={() => {
          refreshSilent();
          if (selectedCategory) setView('category');
          else goHome();
        }}
        onRefresh={refreshSilent}
      />
    );
  }

  if (view === 'new-thread') {
    return (
      <NewThreadForm
        categories={categories}
        defaultCategory={newThreadCategory || undefined}
        onBack={() => {
          if (selectedCategory) setView('category');
          else goHome();
        }}
        onCreated={async (newThread) => {
          await refreshSilent();
          setSelectedThread(newThread);
          setView('thread');
        }}
      />
    );
  }

  if (view === 'bug-report') {
    return <BugReportForm onBack={goHome} onSubmitted={goHome} />;
  }

  if (view === 'category' && selectedCategory) {
    return (
      <CategoryView
        category={selectedCategory}
        threads={threads}
        onBack={() => { refreshSilent(); goHome(); }}
        onSelectThread={openThread}
        onNewThread={() => openNewThread(selectedCategory)}
      />
    );
  }

  return (
    <ForumHome
      categories={categories}
      threads={threads}
      onSelectCategory={openCategory}
      onSelectThread={openThread}
      onNewThread={() => openNewThread()}
      search={search}
      setSearch={setSearch}
    />
  );
}
