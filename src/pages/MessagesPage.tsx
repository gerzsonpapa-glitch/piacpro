import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { Conversation, Message, Profile, ListingReview } from '../lib/types';
import { formatRelativeTime, RANK_CONFIG } from '../lib/utils';
import ReportModal from '../components/ReportModal';
import Avatar from '../components/Avatar';
import {
  MessageCircle, Send, ArrowLeft, CheckCheck, Flag, Shield,
  ShoppingBag, Tag, Star, ThumbsUp, X, CheckCircle2, Package,
  BadgeCheck, Award, ShoppingCart, Minus, Plus, Leaf,
} from 'lucide-react';
import { useSEO, SEO_PAGES } from '../lib/seo';

// ── Parsed order item ─────────────────────────────────────────────────────────
interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
}

function parseOrderMessage(content: string): OrderItem[] | null {
  if (!content.includes('Szeretnék rendelni:')) return null;
  const lines = content.split('\n').filter((l) => l.startsWith('•'));
  if (lines.length === 0) return null;
  return lines.map((line) => {
    // format: "• Termék neve: 3 kg — 1 234 Ft"
    const noPrefix = line.replace('• ', '');
    const colonIdx = noPrefix.indexOf(':');
    if (colonIdx === -1) return { name: noPrefix.trim(), quantity: 1, unit: 'db' };
    const name = noPrefix.slice(0, colonIdx).trim();
    const rest = noPrefix.slice(colonIdx + 1).trim().split('—')[0].trim(); // "3 kg"
    const parts = rest.split(' ');
    const qty = parseFloat(parts[0]) || 1;
    const unit = parts[1] ?? 'db';
    return { name, quantity: qty, unit };
  });
}

// ── Producer order confirm modal ───────────────────────────────────────────────
function ConfirmOrderModal({
  conversationId,
  producerId,
  parsedItems,
  onClose,
  onConfirmed,
}: {
  conversationId: string;
  producerId: string;
  parsedItems: OrderItem[];
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const { showToast } = useNotification();
  const { user } = useAuth();
  const [quantities, setQuantities] = useState<Record<number, string>>(
    Object.fromEntries(parsedItems.map((item, i) => [i, String(item.quantity)]))
  );
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  // Products with IDs — load from DB
  const [products, setProducts] = useState<{ id: string; name: string; unit: string; stock_quantity: number | null }[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('producer_products')
        .select('id, name, unit, stock_quantity')
        .eq('producer_id', producerId);
      setProducts(data ?? []);
      setLoadingProducts(false);
    })();
  }, [producerId]);

  // Try to match parsed item names to actual products
  function matchProduct(itemName: string) {
    const lower = itemName.toLowerCase();
    return products.find((p) => p.name.toLowerCase() === lower || p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase()));
  }

  async function confirm() {
    if (!user) return;
    setConfirming(true);

    const items = parsedItems.map((item, i) => {
      const matched = matchProduct(item.name);
      return {
        product_id: matched?.id ?? null,
        product_name: item.name,
        quantity: parseFloat(quantities[i]) || item.quantity,
        unit: matched?.unit ?? item.unit,
      };
    }).filter((it) => it.product_id !== null);

    if (items.length === 0) {
      showToast('error', 'Hiba', 'Nem sikerült azonosítani a rendelt termékeket.');
      setConfirming(false);
      return;
    }

    const { data, error } = await supabase.rpc('confirm_producer_order', {
      p_conversation_id: conversationId,
      p_producer_id: producerId,
      p_items: items,
      p_note: note.trim(),
    });

    setConfirming(false);
    if (error || data?.error) {
      showToast('error', 'Hiba', data?.error || error?.message);
      return;
    }
    showToast('success', 'Rendelés elfogadva!', 'A készlet automatikusan frissült.');
    onConfirmed();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 glass-bubble rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-zinc-100 text-lg">Rendelés elfogadása</h3>
        </div>
        <p className="text-xs text-zinc-500">A jóváhagyott mennyiségek levonódnak a készletből.</p>

        {loadingProducts ? (
          <div className="space-y-2 animate-pulse">
            {parsedItems.map((_, i) => <div key={i} className="h-12 glass rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {parsedItems.map((item, i) => {
              const matched = matchProduct(item.name);
              return (
                <div key={i} className={`p-3 rounded-xl border ${matched ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-zinc-700/50 bg-zinc-800/30'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                      {matched ? (
                        <p className="text-[10px] text-emerald-400">Azonosítva: {matched.name}
                          {matched.stock_quantity != null && ` — készlet: ${matched.stock_quantity} ${matched.unit}`}
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-400">Nem azonosítható termék</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantities((q) => ({ ...q, [i]: String(Math.max(0, (parseFloat(q[i]) || 0) - 1) )}))}
                      className="w-8 h-8 glass rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number" min="0" step="0.1"
                      value={quantities[i]}
                      onChange={(e) => setQuantities((q) => ({ ...q, [i]: e.target.value }))}
                      className="flex-1 text-center px-2 py-1.5 glass-input rounded-xl text-zinc-100 text-sm focus:outline-none"
                    />
                    <button onClick={() => setQuantities((q) => ({ ...q, [i]: String((parseFloat(q[i]) || 0) + 1)}))}
                      className="w-8 h-8 glass rounded-xl flex items-center justify-center text-zinc-400 hover:text-emerald-400 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-zinc-500 w-8 flex-shrink-0">{matched?.unit ?? item.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Megjegyzés a vevőnek (szállítási idő, átvétel helye...)"
          rows={2}
          className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none"
        />

        <button
          onClick={confirm}
          disabled={confirming || loadingProducts}
          className="w-full py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {confirming ? 'Feldolgozás...' : 'Rendelés jóváhagyása'}
        </button>
      </div>
    </div>
  );
}

// ── RankBadge ────────────────────────────────────────────────────────────────
function RankBadge({ rankLevel, rankTitle, size = 'sm' }: { rankLevel: number; rankTitle: string; size?: 'xs' | 'sm' }) {
  const cfg = RANK_CONFIG[rankLevel] ?? RANK_CONFIG[1];
  if (size === 'xs') {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
        {rankTitle}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      {rankTitle}
    </span>
  );
}

// ── StarPicker ───────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-7 h-7 ${i <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
        </button>
      ))}
    </div>
  );
}

// ── ReviewModal ───────────────────────────────────────────────────────────────
function ReviewModal({
  transactionId,
  listingId,
  reviewedId,
  reviewedName,
  listingTitle,
  onClose,
  onSubmit,
}: {
  transactionId: string;
  listingId: string;
  reviewedId: string;
  reviewedName: string;
  listingTitle: string;
  onClose: () => void;
  onSubmit: (review: { score: number; comment: string; recommended: boolean }) => void;
}) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [recommended, setRecommended] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    onSubmit({ score, comment: comment.trim(), recommended });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-md space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Értékeld az eladót</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Sikeresen megvásároltad: <span className="text-zinc-300">{listingTitle}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 glass-pill rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="glass-bubble rounded-2xl p-4 space-y-1">
          <p className="text-xs text-zinc-500">Eladó</p>
          <p className="font-semibold text-zinc-200">{reviewedName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-zinc-400 mb-2">Értékelés (1–5 csillag)</p>
            <StarPicker value={score} onChange={setScore} />
            <p className="text-xs text-zinc-600 mt-1">
              {score === 1 && 'Nagyon rossz tapasztalat'}
              {score === 2 && 'Rossz tapasztalat'}
              {score === 3 && 'Közepes, semleges'}
              {score === 4 && 'Jó, ajánlom'}
              {score === 5 && 'Kiváló, határozottan ajánlom!'}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-400 mb-2">Vélemény</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Pl. Gyors és korrekt eladó, pont olyan volt mint a képen..."
              rows={3}
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setRecommended(!recommended)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${recommended ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 bg-zinc-800/50 text-zinc-500'}`}
          >
            <ThumbsUp className={`w-4 h-4 ${recommended ? 'fill-emerald-400' : ''}`} />
            <span className="text-sm font-medium">{recommended ? 'Ajánlom ezt az eladót' : 'Nem ajánlom'}</span>
          </button>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 glass-pill rounded-xl text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors">
              Kihagyom most
            </button>
            <button type="submit" disabled={!comment.trim() || submitting}
              className="flex-1 py-3 glass-pill-active text-emerald-300 rounded-xl text-sm font-medium disabled:opacity-50 transition-all hover:scale-[1.02]">
              {submitting ? 'Küldés...' : 'Értékelés elküldése'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CloseSaleModal ─────────────────────────────────────────────────────────────
function CloseSaleModal({
  buyerName,
  listingTitle,
  onConfirm,
  onCancel,
  loading,
}: {
  buyerName: string;
  listingTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-sm space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-zinc-100">Eladás lezárása</h2>
          <p className="text-sm text-zinc-400">
            Megerősíted, hogy eladtad a <span className="text-zinc-200 font-medium">{listingTitle}</span> terméket{' '}
            <span className="text-zinc-200 font-medium">{buyerName}</span> vásárlónak?
          </p>
        </div>
        <p className="text-xs text-zinc-600 text-center glass-bubble rounded-xl p-3">
          A hirdetés „Elkelt" státuszra vált, 48 óra után eltűnik a piactérről, de megmarad a profilodon az eladott termékek közt.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 glass-pill rounded-xl text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors">
            Mégsem
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 glass-pill-active text-emerald-300 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50">
            {loading ? 'Feldolgozás...' : 'Igen, eladtam'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MessagesPage() {
  useSEO(SEO_PAGES.messages);
  const { user, refreshUnread } = useAuth();
  const { showToast } = useNotification();
  const { params, search, navigate } = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ userId?: string; listingId?: string } | null>(null);
  const [showCloseSale, setShowCloseSale] = useState(false);
  const [closingSale, setClosingSale] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ transactionId: string; listingId: string; reviewedId: string; reviewedName: string; listingTitle: string } | null>(null);
  const [myReview, setMyReview] = useState<ListingReview | null>(null);
  const [confirmOrderModal, setConfirmOrderModal] = useState<{ message: Message; producerId: string } | null>(null);
  const [myProducerId, setMyProducerId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvRef = useRef<Conversation | null>(null);
  const chatId = params.id || new URLSearchParams(search).get('conv') || undefined;

  activeConvRef.current = activeConversation;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversations')
      .select('*, listing:listings(id, title, images, price, status, condition, sold_at), shop_product:shop_products(id, name, images, price, category_tag)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (data && data.length > 0) {
      const profileIds = data.flatMap((c: Conversation) => [c.buyer_id, c.seller_id]);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', [...new Set(profileIds)]);
      const pm = new Map<string, Profile>();
      profiles?.forEach((p: Profile) => pm.set(p.id, p));

      const enriched = await Promise.all(data.map(async (c: Conversation) => {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .neq('sender_id', user.id)
          .eq('is_read', false);
        return { ...c, buyer: pm.get(c.buyer_id), seller: pm.get(c.seller_id), unread_count: count || 0 };
      }));
      setConversations(enriched);
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages(data || []);

    if (user) {
      await supabase.from('messages').update({ is_read: true })
        .eq('conversation_id', conversationId).neq('sender_id', user.id).eq('is_read', false);
      const unseenIds = (data || [])
        .filter((m: Message) => m.sender_id !== user.id && !m.seen_at)
        .map((m: Message) => m.id);
      if (unseenIds.length > 0) {
        await supabase.from('messages').update({ seen_at: new Date().toISOString() }).in('id', unseenIds);
      }
      await refreshUnread();
    }
  }, [user, refreshUnread]);

  const fetchMyReview = useCallback(async (conv: Conversation) => {
    if (!user || !conv.transaction_id) { setMyReview(null); return; }
    const { data } = await supabase
      .from('listing_reviews')
      .select('*')
      .eq('transaction_id', conv.transaction_id)
      .eq('reviewer_id', user.id)
      .maybeSingle();
    setMyReview(data);
  }, [user]);

  // Initial load + load my producer profile if any
  useEffect(() => {
    if (user) {
      fetchConversations();
      supabase.from('producers').select('id').eq('user_id', user.id).maybeSingle().then(({ data }) => {
        setMyProducerId(data?.id ?? null);
      });
    }
  }, [user, fetchConversations]);

  // Open conversation from URL param
  useEffect(() => {
    if (chatId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === chatId);
      if (conv && activeConvRef.current?.id !== conv.id) openConversation(conv);
    }
  }, [chatId, conversations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`messages-page-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const msg = payload.new as Message;
        if (activeConvRef.current && msg.conversation_id === activeConvRef.current.id) {
          const { data: full } = await supabase.from('messages').select('*, sender:profiles(*)').eq('id', msg.id).maybeSingle();
          if (full) {
            setMessages((prev) => prev.some((m) => m.id === full.id) ? prev : [...prev, full]);
            scrollToBottom();
            if (msg.sender_id !== user.id) {
              await supabase.from('messages').update({ is_read: true, seen_at: new Date().toISOString() }).eq('id', msg.id);
              await refreshUnread();
            }
          }
        } else if (msg.sender_id !== user.id) {
          await refreshUnread();
          setConversations((prev) => prev.map((c) =>
            c.id === msg.conversation_id
              ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message_at: msg.created_at }
              : c
          ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, async () => {
        await refreshUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refreshUnread, scrollToBottom]);

  // Realtime: conversations
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `buyer_id=eq.${user.id}` }, () => fetchConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `seller_id=eq.${user.id}` }, () => fetchConversations())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  async function openConversation(conv: Conversation) {
    setActiveConversation(conv);
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    await fetchMessages(conv.id);
    await fetchMyReview(conv);
    scrollToBottom();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;
    const urlPattern = /https?:\/\/|www\./i;
    if (urlPattern.test(newMessage)) {
      showToast('error', 'Linkek küldése nem engedélyezett biztonsági okokból.');
      return;
    }
    setSending(true);
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: activeConversation.id, sender_id: user.id, content: newMessage.trim() })
      .select('*, sender:profiles(*)')
      .single();
    if (data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeConversation.id);
      scrollToBottom();
    }
    setSending(false);
  }

  async function handleCloseSale() {
    if (!activeConversation || !user) return;
    const otherUser = user.id === activeConversation.buyer_id ? activeConversation.buyer : activeConversation.seller;
    const buyerId = activeConversation.buyer_id;
    setClosingSale(true);
    const { data, error } = await supabase.rpc('close_sale', {
      p_listing_id: activeConversation.listing_id,
      p_buyer_id: buyerId,
      p_conversation_id: activeConversation.id,
    });
    setClosingSale(false);
    setShowCloseSale(false);

    if (error || data?.error) {
      showToast('error', 'Hiba', data?.error || 'Az eladás lezárása sikertelen.');
      return;
    }

    showToast('success', 'Eladás lezárva!', 'A hirdetés „Elkelt" státuszra változott.');
    // Refresh conversation
    await fetchConversations();
    // Prompt buyer to review (buyer kapjon értesítést — ezt a chatben mutatjuk)
    const updatedConv = { ...activeConversation, sold_status: 'sold' as const, transaction_id: data.transaction_id };
    setActiveConversation(updatedConv);
  }

  async function handleReviewSubmit({ score, comment, recommended }: { score: number; comment: string; recommended: boolean }) {
    if (!reviewModal || !user) return;
    const { error } = await supabase.from('listing_reviews').insert({
      transaction_id: reviewModal.transactionId,
      listing_id: reviewModal.listingId,
      reviewer_id: user.id,
      reviewed_id: reviewModal.reviewedId,
      score,
      comment,
      recommended,
    });
    if (error) {
      showToast('error', 'Hiba', 'Az értékelés elküldése sikertelen.');
      return;
    }
    showToast('success', 'Köszönjük az értékelést!');
    setReviewModal(null);
    // Refresh review state
    if (activeConversation) await fetchMyReview(activeConversation);
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <MessageCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400 text-lg">Jelentkezz be az üzenetek megtekintéséhez</p>
      </div>
    );
  }

  const otherUser = activeConversation
    ? user.id === activeConversation.buyer_id ? activeConversation.seller : activeConversation.buyer
    : null;

  const isSeller = activeConversation ? user.id === activeConversation.seller_id : false;
  const isBuyer = activeConversation ? user.id === activeConversation.buyer_id : false;
  const isSold = activeConversation?.sold_status === 'sold' || activeConversation?.listing?.status === 'sold';
  const listing = activeConversation?.listing;
  const shopProduct = activeConversation?.shop_product;
  // unified product info for display
  const productPanel = listing
    ? { image: listing.images?.[0] ?? null, title: listing.title, price: listing.price, subtitle: listing.condition ?? null, isShop: false }
    : shopProduct
    ? { image: shopProduct.images?.[0] ?? null, title: shopProduct.name, price: shopProduct.price, subtitle: shopProduct.category_tag ?? null, isShop: true }
    : null;

  const canReview = isSold && isBuyer && activeConversation?.transaction_id && !myReview;

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      {/* Conversation list */}
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 glass rounded-3xl overflow-hidden flex-shrink-0`}>
        <div className="p-4 border-b border-white/5">
          <h2 className="font-bold text-lg">Üzenetek</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-white/5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((conv) => {
              const other = user.id === conv.buyer_id ? conv.seller : conv.buyer;
              const isActive = activeConversation?.id === conv.id;
              const unread = conv.unread_count || 0;
              const convSold = conv.sold_status === 'sold' || conv.listing?.status === 'sold';
              return (
                <button key={conv.id}
                  onClick={() => { openConversation(conv); navigate(`/chat/${conv.id}`); }}
                  className={`w-full flex items-center gap-3 p-4 transition-all text-left ${isActive ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'hover:bg-white/5'}`}>
                  <div className="relative flex-shrink-0">
                    <Avatar src={other?.avatar_url} name={other?.full_name || other?.username} size="md" rounded="full" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`font-medium truncate text-sm ${unread > 0 ? 'text-zinc-100' : 'text-zinc-300'}`}>
                        {other?.full_name || other?.username || 'Felhasználó'}
                      </p>
                      {convSold ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold flex-shrink-0">ELKELT</span>
                      ) : (
                        <span className="text-xs text-zinc-600 flex-shrink-0 ml-1">{formatRelativeTime(conv.last_message_at)}</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{conv.listing?.title || conv.shop_product?.name || 'Üzenet'}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <MessageCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Még nincs beszélgetésed</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1 glass rounded-3xl overflow-hidden min-w-0`}>
        {activeConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5 flex-shrink-0">
              <button onClick={() => { setActiveConversation(null); navigate('/messages'); }}
                className="md:hidden p-1 glass-pill rounded-lg text-zinc-400 hover:text-zinc-200">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)} className="flex-shrink-0">
                <Avatar src={otherUser?.avatar_url} name={otherUser?.full_name || otherUser?.username} size="sm" rounded="full" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)}
                    className="font-medium text-zinc-200 text-sm hover:text-emerald-400 transition-colors"
                  >
                    {otherUser?.full_name || otherUser?.username || 'Felhasználó'}
                  </button>
                  {otherUser?.verified && <CheckCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  {(otherUser?.rank_level ?? 1) > 1 && (
                    <RankBadge rankLevel={otherUser?.rank_level ?? 1} rankTitle={otherUser?.rank_title ?? 'Újonc'} size="xs" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate">{productPanel?.title || listing?.title || shopProduct?.name || 'Hirdetés'}</p>
              </div>
              <div className="flex items-center gap-1">
                {otherUser && (
                  <button onClick={() => setReportTarget({ userId: otherUser.id })}
                    className="p-2 glass-pill rounded-xl text-zinc-500 hover:text-red-400 transition-colors" title="Felhasználó bejelentése">
                    <Flag className="w-4 h-4" />
                  </button>
                )}
                {listing && (
                  <button onClick={() => setReportTarget({ listingId: listing.id })}
                    className="p-2 glass-pill rounded-xl text-zinc-500 hover:text-red-400 transition-colors" title="Hirdetés bejelentése">
                    <Shield className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Messages column */}
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-zinc-600 text-sm py-8">Kezdd el a beszélgetést!</p>
                  )}
                  {messages.map((msg, i) => {
                    const isOwn = msg.sender_id === user.id;
                    const isLast = i === messages.length - 1;
                    const showSeen = isOwn && isLast && !!msg.seen_at;
                    const orderItems = parseOrderMessage(msg.content);
                    const isOrderMsg = orderItems !== null && orderItems.length > 0;
                    const canConfirmOrder = isOrderMsg && !isOwn && myProducerId && isSeller;

                    if (isOrderMsg) {
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[85%] space-y-1">
                            <div className={`rounded-2xl overflow-hidden border ${isOwn ? 'border-emerald-500/30 bg-emerald-950/40 rounded-br-md' : 'border-zinc-700/50 bg-zinc-900/60 rounded-bl-md'}`}>
                              <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${isOwn ? 'border-emerald-500/20' : 'border-zinc-700/50'}`}>
                                <ShoppingCart className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span className="text-sm font-semibold text-zinc-200">Megrendelés</span>
                                <span className={`text-[10px] ml-auto ${isOwn ? 'text-emerald-400/60' : 'text-zinc-500'}`}>{formatRelativeTime(msg.created_at)}</span>
                              </div>
                              <div className="px-4 py-3 space-y-1.5">
                                {orderItems.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Leaf className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                      <span className="text-zinc-200 truncate">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-emerald-300 flex-shrink-0">{item.quantity} {item.unit}</span>
                                  </div>
                                ))}
                                {msg.content.includes('Megjegyzés:') && (
                                  <p className="text-xs text-zinc-500 pt-1 border-t border-white/5 mt-1">
                                    {msg.content.split('Megjegyzés:')[1]?.trim()}
                                  </p>
                                )}
                                {msg.content.includes('Becsült összeg:') && (
                                  <p className="text-xs font-semibold text-emerald-400 pt-1">
                                    {msg.content.match(/Becsült összeg: ([\d\s]+ Ft)/)?.[1] ?? ''}
                                  </p>
                                )}
                              </div>
                              {canConfirmOrder && (
                                <div className="px-4 pb-3">
                                  <button
                                    onClick={() => setConfirmOrderModal({ message: msg, producerId: myProducerId! })}
                                    className="w-full py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Rendelés elfogadása + készlet levonás
                                  </button>
                                </div>
                              )}
                            </div>
                            {showSeen && (
                              <p className="text-[10px] text-zinc-600 text-right flex items-center justify-end gap-1">
                                <CheckCheck className="w-3 h-3" />Megtekintve
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[75%]">
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${isOwn ? 'glass-pill-active text-emerald-200 rounded-br-md' : 'glass-pill text-zinc-200 rounded-bl-md'}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isOwn ? 'text-emerald-400/60' : 'text-zinc-500'}`}>
                              {formatRelativeTime(msg.created_at)}
                            </p>
                          </div>
                          {showSeen && (
                            <p className="text-[10px] text-zinc-600 text-right mt-0.5 flex items-center justify-end gap-1">
                              <CheckCheck className="w-3 h-3" />Megtekintve
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Review prompt for buyer */}
                {canReview && (
                  <div className="mx-4 mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">Értékeld az eladót!</p>
                      <p className="text-xs text-zinc-500">Sikeresen megvetted ezt a terméket.</p>
                    </div>
                    <button
                      onClick={() => setReviewModal({
                        transactionId: activeConversation.transaction_id!,
                        listingId: activeConversation.listing_id ?? '',
                        reviewedId: activeConversation.seller_id,
                        reviewedName: activeConversation.seller?.full_name || activeConversation.seller?.username || 'Eladó',
                        listingTitle: productPanel?.title || listing?.title || 'Termék',
                      })}
                      className="flex-shrink-0 px-3 py-1.5 glass-pill-active text-amber-300 rounded-xl text-xs font-medium hover:scale-[1.02] transition-all"
                    >
                      Értékelés
                    </button>
                  </div>
                )}

                {/* Already reviewed */}
                {isSold && isBuyer && myReview && (
                  <div className="mx-4 mb-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-zinc-400">Már értékelted ezt az eladót — köszönjük!</p>
                  </div>
                )}

                {/* Sold banner */}
                {isSold && (
                  <div className="mx-4 mb-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ez a hirdetés elkelt — az átadás részleteit itt beszélhetitek meg
                    </p>
                  </div>
                )}

                <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex-shrink-0">
                  <div className="flex gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Írj üzenetet..."
                      className="flex-1 px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all" />
                    <button type="submit" disabled={sending || !newMessage.trim()}
                      className="px-4 py-3 glass-pill-active text-emerald-300 rounded-xl transition-all hover:scale-[1.03] disabled:opacity-50">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-700 mt-1.5 text-center">Linkek küldése nem engedélyezett</p>
                </form>
              </div>

              {/* Product panel (right side) */}
              {productPanel && (
                <div className="hidden lg:flex flex-col w-64 border-l border-white/5 p-4 space-y-4 flex-shrink-0 overflow-y-auto">
                  {/* Product image */}
                  {productPanel.image ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-square">
                      <img src={productPanel.image} alt={productPanel.title} className="w-full h-full object-cover" />
                      {isSold && !productPanel.isShop && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-lg tracking-widest rotate-[-15deg] border-2 border-white/60 px-3 py-1 rounded-lg">ELKELT</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square glass-bubble rounded-2xl flex items-center justify-center">
                      <Package className="w-10 h-10 text-zinc-600" />
                    </div>
                  )}

                  {/* Product info */}
                  <div className="space-y-2">
                    {productPanel.isShop ? (
                      <p className="text-sm font-semibold text-zinc-100 leading-snug">{productPanel.title}</p>
                    ) : (
                      <button
                        onClick={() => listing && navigate(`/listing/${listing.id}`)}
                        className="text-sm font-semibold text-zinc-100 hover:text-emerald-400 transition-colors text-left leading-snug"
                      >
                        {productPanel.title}
                      </button>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-emerald-400 font-bold text-base">
                        {productPanel.price ? new Intl.NumberFormat('hu-HU').format(productPanel.price) + ' Ft' : '—'}
                      </span>
                    </div>
                    {productPanel.subtitle && (
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3 h-3 text-zinc-500" />
                        <span className="text-xs text-zinc-500">{productPanel.subtitle}</span>
                      </div>
                    )}
                  </div>

                  {/* Status — only for listings, not shop products */}
                  {!productPanel.isShop && (
                    <div className={`text-xs font-semibold px-3 py-2 rounded-xl border text-center ${isSold ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'}`}>
                      {isSold ? '✓ Elkelt' : 'Aktív hirdetés'}
                    </div>
                  )}

                  {/* Seller: close sale button — only for listings */}
                  {isSeller && !isSold && !productPanel.isShop && (
                    <button
                      onClick={() => setShowCloseSale(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 glass-pill-active text-emerald-300 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Eladás lezárása
                    </button>
                  )}

                  {/* Buyer: review button if sold */}
                  {canReview && (
                    <button
                      onClick={() => setReviewModal({
                        transactionId: activeConversation.transaction_id!,
                        listingId: activeConversation.listing_id ?? '',
                        reviewedId: activeConversation.seller_id,
                        reviewedName: activeConversation.seller?.full_name || activeConversation.seller?.username || 'Eladó',
                        listingTitle: productPanel.title,
                      })}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium hover:scale-[1.02] transition-all"
                    >
                      <Star className="w-4 h-4" />
                      Értékeld az eladót
                    </button>
                  )}

                  {/* Other user's rank */}
                  {otherUser && (otherUser.rank_level ?? 1) > 1 && (
                    <div className="glass-bubble rounded-xl p-3 space-y-1">
                      <p className="text-xs text-zinc-500">{isSeller ? 'Vásárló' : 'Eladó'} rangja</p>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <RankBadge rankLevel={otherUser.rank_level ?? 1} rankTitle={otherUser.rank_title ?? 'Újonc'} />
                      </div>
                      {(otherUser.avg_rating ?? 0) > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {[1,2,3,4,5].map((i) => (
                            <Star key={i} className={`w-3 h-3 ${i <= Math.round(otherUser.avg_rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                          ))}
                          <span className="text-xs text-zinc-400 ml-1">{(otherUser.avg_rating ?? 0).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">Válassz egy beszélgetést</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {reportTarget && (
        <ReportModal userId={reportTarget.userId} listingId={reportTarget.listingId} onClose={() => setReportTarget(null)} />
      )}

      {showCloseSale && activeConversation && (
        <CloseSaleModal
          buyerName={activeConversation.buyer?.full_name || activeConversation.buyer?.username || 'Vásárló'}
          listingTitle={listing?.title || 'Termék'}
          onConfirm={handleCloseSale}
          onCancel={() => setShowCloseSale(false)}
          loading={closingSale}
        />
      )}

      {reviewModal && (
        <ReviewModal
          {...reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
      {confirmOrderModal && activeConversation && (
        <ConfirmOrderModal
          conversationId={activeConversation.id}
          producerId={confirmOrderModal.producerId}
          parsedItems={parseOrderMessage(confirmOrderModal.message.content) ?? []}
          onClose={() => setConfirmOrderModal(null)}
          onConfirmed={async () => {
            setConfirmOrderModal(null);
            // Send a confirmation message in the chat
            await supabase.from('messages').insert({
              conversation_id: activeConversation.id,
              sender_id: user!.id,
              content: 'Rendelésedet elfogadtam! Hamarosan felveszem veled a kapcsolatot az átvétel részleteivel.',
            });
            await fetchMessages(activeConversation.id);
          }}
        />
      )}
    </div>
  );
}
