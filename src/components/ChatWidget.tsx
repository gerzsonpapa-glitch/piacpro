import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import { getChatMountNode, pinChatToViewport, computeChatBottomPx } from '../lib/chatPortalRoot';
import { useIsMobile } from '../hooks/useMediaQuery';
import type { Conversation, Message, Profile } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';
import { X, Send, ArrowLeft, Minimize2, Store } from 'lucide-react';
import Avatar from './Avatar';

export default function ChatWidget() {
  const { user, unreadCount, refreshUnread } = useAuth();
  const { devModeActive } = useSiteCustomization();
  const { showToast } = useNotification();
  const { path } = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvRef = useRef<Conversation | null>(null);

  activeConvRef.current = activeConv;

  useEffect(() => {
    setMounted(true);
    setMountNode(getChatMountNode());
  }, []);

  const isMessagesPage = path === '/messages' || path.startsWith('/chat/');
  const isMobile = useIsMobile();
  const bottomPx = computeChatBottomPx({ path, devModeActive, isMobile });

  useLayoutEffect(() => {
    const node = anchorRef.current;
    if (!node || !user || isMessagesPage) return;

    const apply = () => pinChatToViewport(node, bottomPx);

    apply();
    window.addEventListener('scroll', apply, { passive: true, capture: true });
    window.addEventListener('resize', apply, { passive: true });
    document.addEventListener('scroll', apply, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', apply, true);
      window.removeEventListener('resize', apply);
      document.removeEventListener('scroll', apply, true);
    };
  }, [bottomPx, user, isMessagesPage, mounted, open, minimized, path]);

  const anchorStyle = useMemo(
    (): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'flex-end',
    }),
    [],
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversations')
      .select('*, listing:listings(id, title, images, price)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      const profileIds = data.flatMap((c: Conversation) => [c.buyer_id, c.seller_id]);
      const { data: profiles } = await supabase
        .from('profiles').select('*').in('id', [...new Set(profileIds)]);
      const pm = new Map<string, Profile>();
      profiles?.forEach((p: Profile) => pm.set(p.id, p));
      setConversations(data.map((c: Conversation) => ({ ...c, buyer: pm.get(c.buyer_id), seller: pm.get(c.seller_id) })));
    } else {
      setConversations(data || []);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !open) return;
    fetchConversations();
  }, [user, open, fetchConversations]);

  useEffect(() => {
    if (!user || isMessagesPage) return;

    const channel = supabase
      .channel(`chat-widget-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id) return;

        if (open && activeConvRef.current && msg.conversation_id === activeConvRef.current.id) {
          const { data: full } = await supabase
            .from('messages')
            .select('*, sender:profiles(*)')
            .eq('id', msg.id)
            .maybeSingle();
          if (full) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === full.id)) return prev;
              return [...prev, full];
            });
            scrollToBottom();
            await supabase.from('messages').update({ is_read: true, seen_at: new Date().toISOString() }).eq('id', msg.id);
            await refreshUnread();
          }
        } else {
          await refreshUnread();
          setConversations((prev) => prev.map((c) =>
            c.id === msg.conversation_id
              ? { ...c, last_message_at: msg.created_at }
              : c
          ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));

          if (!open) {
            const conv = conversations.find((c) => c.id === msg.conversation_id);
            const sender = conv
              ? (user.id === conv.buyer_id ? conv.seller : conv.buyer)
              : null;
            showToast('message', 'Új üzenet érkezett', sender?.full_name || sender?.username || 'Valakitől');
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, open, isMessagesPage, refreshUnread, scrollToBottom, showToast, conversations]);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(50);
    setMessages(data || []);

    if (user) {
      await supabase.from('messages').update({ is_read: true })
        .eq('conversation_id', convId).neq('sender_id', user.id).eq('is_read', false);
      await refreshUnread();
    }
  }, [user, refreshUnread]);

  async function openConversation(conv: Conversation) {
    setActiveConv(conv);
    await fetchMessages(conv.id);
    scrollToBottom();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv || !user) return;
    setSending(true);
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: activeConv.id, sender_id: user.id, content: newMsg.trim() })
      .select('*, sender:profiles(*)').single();
    if (data) {
      setMessages((prev) => [...prev, data]);
      setNewMsg('');
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeConv.id);
      scrollToBottom();
    }
    setSending(false);
  }

  if (!mounted || !mountNode || !user || isMessagesPage) return null;

  const otherUser = activeConv
    ? (user.id === activeConv.buyer_id ? activeConv.seller : activeConv.buyer)
    : null;

  const ui = (
    <div ref={anchorRef} className="piac-chat-anchor" style={anchorStyle} data-piac-chat-anchor>
      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="piac-chat-launcher"
          aria-label="PiacPro üzenetek megnyitása"
        >
          <span className="piac-chat-launcher__awning" aria-hidden />
          <Store className="w-5 h-5 text-amber-300 relative z-[1]" />
          {unreadCount > 0 && (
            <span className="piac-chat-launcher__badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className={`piac-chat-panel ${minimized ? 'piac-chat-panel--min' : ''}`}>
          <div className="piac-chat-panel__awning" aria-hidden />
          <header className="piac-chat-header">
            <div className="flex items-center gap-2 min-w-0">
              {activeConv && !minimized && (
                <button type="button" onClick={() => setActiveConv(null)} className="piac-chat-icon-btn" aria-label="Vissza">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-400/90">PiacPro Csengő</p>
                <p className="text-sm font-bold text-zinc-100 truncate">
                  {activeConv && !minimized
                    ? (otherUser?.full_name || otherUser?.username || 'Partner')
                    : 'Kapcsolataid'}
                </p>
              </div>
              {unreadCount > 0 && !activeConv && (
                <span className="piac-chat-launcher__badge piac-chat-launcher__badge--inline">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setMinimized(!minimized)} className="piac-chat-icon-btn" aria-label="Minimalizálás">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => { setOpen(false); setActiveConv(null); }} className="piac-chat-icon-btn" aria-label="Bezárás">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {!minimized && (
            <>
              {!activeConv && (
                <div className="piac-chat-list">
                  {conversations.length === 0 ? (
                    <div className="piac-chat-empty">
                      <Store className="w-10 h-10 text-amber-500/40 mb-3" />
                      <p className="text-zinc-400 text-sm font-medium">Még nincs beszélgetésed</p>
                      <p className="text-zinc-600 text-xs mt-1">Csak meglévő kapcsolataid jelennek meg itt.</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const other = user.id === conv.buyer_id ? conv.seller : conv.buyer;
                      return (
                        <button key={conv.id} type="button" onClick={() => openConversation(conv)} className="piac-chat-conv-row">
                          <Avatar src={other?.avatar_url} name={other?.full_name || other?.username} size="md" rounded="full" />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-semibold text-zinc-100 text-sm truncate">
                              {other?.full_name || other?.username || 'Felhasználó'}
                            </p>
                            <p className="text-[11px] text-amber-400/70 truncate">{conv.listing?.title || 'Általános üzenet'}</p>
                          </div>
                          <span className="text-[10px] text-zinc-600 flex-shrink-0 tabular-nums">
                            {formatRelativeTime(conv.last_message_at)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {activeConv && (
                <div className="piac-chat-thread">
                  {activeConv.listing?.title && (
                    <div className="piac-chat-listing-tag">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00C896]">Hirdetés</span>
                      <p className="text-xs text-zinc-300 truncate">{activeConv.listing.title}</p>
                    </div>
                  )}
                  <div className="piac-chat-messages">
                    {messages.length === 0 && (
                      <p className="text-center text-zinc-600 text-xs py-6">Írd meg az első sort a standon!</p>
                    )}
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`piac-chat-msg ${isOwn ? 'piac-chat-msg--own' : 'piac-chat-msg--them'}`}>
                          {!isOwn && (
                            <Avatar
                              src={msg.sender?.avatar_url}
                              name={msg.sender?.full_name || msg.sender?.username}
                              size="sm"
                              rounded="full"
                            />
                          )}
                          <div className="piac-chat-ticket">
                            <p className="text-sm text-zinc-100 leading-snug">{msg.content}</p>
                            <time className="piac-chat-ticket__time">{formatRelativeTime(msg.created_at)}</time>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={sendMessage} className="piac-chat-compose">
                    <input
                      type="text"
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Üzenet a piaci standra…"
                      className="piac-chat-compose__input"
                    />
                    <button type="submit" disabled={sending || !newMsg.trim()} className="piac-chat-compose__send" aria-label="Küldés">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  return createPortal(ui, mountNode);
}
