import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import { ensureChatMount, syncChatViewportOffset, computeChatBottomPx } from '../lib/chatPortalRoot';
import { useIsMobile } from '../hooks/useMediaQuery';
import type { Conversation, Message, Profile } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';
import { X, Send, ArrowLeft, Minimize2, MessageCircle, ExternalLink } from 'lucide-react';
import Avatar from './Avatar';
import PiacChatBrand from './chat/PiacChatBrand';

export default function ChatWidget() {
  const { user, unreadCount, refreshUnread } = useAuth();
  const { devModeActive } = useSiteCustomization();
  const { showToast } = useNotification();
  const { path, navigate } = useRouter();
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
    setMountNode(ensureChatMount());
  }, []);

  const isMessagesPage = path === '/messages' || path.startsWith('/chat/');
  const isMobile = useIsMobile();
  const bottomPx = computeChatBottomPx({ path, devModeActive, isMobile });

  useLayoutEffect(() => {
    if (!user || isMessagesPage) return;
    syncChatViewportOffset(bottomPx);
    ensureChatMount();
  }, [bottomPx, user, isMessagesPage, path, open, minimized]);

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
            showToast('message', 'Új üzenet — PiacPro Chat', sender?.full_name || sender?.username || 'Valakitől');
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

  function openFullMessages() {
    setOpen(false);
    setActiveConv(null);
    if (activeConv) navigate(`/chat/${activeConv.id}`);
    else navigate('/messages');
  }

  if (!mounted || !mountNode || !user || isMessagesPage) return null;

  const otherUser = activeConv
    ? (user.id === activeConv.buyer_id ? activeConv.seller : activeConv.buyer)
    : null;

  const headerSubtitle = activeConv && !minimized
    ? (otherUser?.full_name || otherUser?.username || 'Partner')
    : 'Gyors üzenetek';

  const ui = (
    <div ref={anchorRef} className="piac-chat-anchor" style={anchorStyle} data-piac-chat-anchor>
      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="piac-chat-launcher"
          aria-label="PiacPro Chat megnyitása"
        >
          <MessageCircle className="piac-chat-launcher__icon" strokeWidth={2.25} />
          <span className="piac-chat-launcher__label">Chat</span>
          {unreadCount > 0 && (
            <span className="piac-chat-launcher__badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className={`piac-chat-panel ${minimized ? 'piac-chat-panel--min' : ''}`}>
          <header className="piac-chat-header">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {activeConv && !minimized && (
                <button type="button" onClick={() => setActiveConv(null)} className="piac-chat-icon-btn" aria-label="Vissza">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <PiacChatBrand size="sm" subtitle={minimized ? undefined : headerSubtitle} />
              {unreadCount > 0 && !activeConv && !minimized && (
                <span className="piac-chat-launcher__badge piac-chat-launcher__badge--inline">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!minimized && (
                <button
                  type="button"
                  onClick={openFullMessages}
                  className="piac-chat-icon-btn piac-chat-icon-btn--accent hidden sm:flex"
                  title="Teljes PiacPro Chat"
                  aria-label="Teljes nézet megnyitása"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
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
                  <div className="piac-chat-list__toolbar">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Beszélgetések</p>
                    <button type="button" onClick={openFullMessages} className="piac-chat-link-btn">
                      Teljes nézet
                    </button>
                  </div>
                  {conversations.length === 0 ? (
                    <div className="piac-chat-empty">
                      <div className="piac-chat-empty__icon">
                        <MessageCircle className="w-8 h-8 text-[#00E676]/70" />
                      </div>
                      <p className="text-zinc-300 text-sm font-semibold">Még nincs üzeneted</p>
                      <p className="text-zinc-500 text-xs mt-1 max-w-[14rem] leading-relaxed">
                        Ha valaki ír neked egy hirdetésről, itt jelenik meg a beszélgetés.
                      </p>
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
                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                              {conv.listing?.title || 'Általános üzenet'}
                            </p>
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00E676]">Kapcsolódó hirdetés</span>
                      <p className="text-xs text-zinc-300 truncate mt-0.5">{activeConv.listing.title}</p>
                    </div>
                  )}
                  <div className="piac-chat-messages">
                    {messages.length === 0 && (
                      <p className="text-center text-zinc-500 text-xs py-8 px-4 leading-relaxed">
                        Írd meg az első üzeneted — a partner azonnal értesítést kap.
                      </p>
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
                          <div className="piac-chat-bubble">
                            <p className="text-sm text-zinc-100 leading-snug whitespace-pre-wrap">{msg.content}</p>
                            <time className="piac-chat-bubble__time">{formatRelativeTime(msg.created_at)}</time>
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
                      placeholder="Írj üzenetet…"
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
