import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { Conversation, Message, Profile } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';
import { MessageCircle, X, Send, ArrowLeft, Minimize2 } from 'lucide-react';
import Avatar from './Avatar';

export default function ChatWidget() {
  const { user, unreadCount, refreshUnread } = useAuth();
  const { showToast } = useNotification();
  const { path } = useRouter();
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

  const isMessagesPage = path === '/messages' || path.startsWith('/chat/');

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

  // Load conversations when widget opens
  useEffect(() => {
    if (!user || !open) return;
    fetchConversations();
  }, [user, open, fetchConversations]);

  // Realtime subscription for incoming messages
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

        // If widget is open and this is the active conversation, append message
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
          // Show toast notification for message in another conversation
          await refreshUnread();
          setConversations((prev) => prev.map((c) =>
            c.id === msg.conversation_id
              ? { ...c, last_message_at: msg.created_at }
              : c
          ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));

          if (!open) {
            // Find sender name
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

  if (!user || isMessagesPage) return null;

  const otherUser = activeConv
    ? (user.id === activeConv.buyer_id ? activeConv.seller : activeConv.buyer)
    : null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 glass-strong rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
        >
          <MessageCircle className="w-6 h-6 text-emerald-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Widget window */}
      {open && (
        <div className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-[340px] md:w-[380px] glass-strong rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${minimized ? 'h-14' : 'h-[520px]'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              {activeConv && !minimized && (
                <button onClick={() => setActiveConv(null)} className="p-1 glass-pill rounded-lg text-zinc-400 hover:text-zinc-200 mr-1">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-sm">
                {activeConv && !minimized
                  ? (otherUser?.full_name || otherUser?.username || 'Üzenet')
                  : 'Üzenetek'}
              </span>
              {unreadCount > 0 && !activeConv && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(!minimized)} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setOpen(false); setActiveConv(null); }} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {!activeConv && (
                <div className="flex-1 overflow-y-auto h-[calc(520px-56px)]">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                      <MessageCircle className="w-10 h-10 text-zinc-700 mb-3" />
                      <p className="text-zinc-500 text-sm">Még nincs beszélgetésed</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const other = user.id === conv.buyer_id ? conv.seller : conv.buyer;
                      return (
                        <button key={conv.id} onClick={() => openConversation(conv)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors border-b border-white/3 text-left">
                          <Avatar src={other?.avatar_url} name={other?.full_name || other?.username} size="md" rounded="full" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-200 text-sm truncate">
                              {other?.full_name || other?.username || 'Felhasználó'}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">{conv.listing?.title}</p>
                          </div>
                          <span className="text-xs text-zinc-600 flex-shrink-0">
                            {formatRelativeTime(conv.last_message_at)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {activeConv && (
                <div className="flex flex-col h-[calc(520px-56px)]">
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {messages.length === 0 && (
                      <p className="text-center text-zinc-600 text-xs py-4">Kezdd el a beszélgetést!</p>
                    )}
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isOwn ? 'glass-pill-active text-emerald-200 rounded-br-sm' : 'glass-pill text-zinc-200 rounded-bl-sm'}`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-emerald-400/60' : 'text-zinc-600'}`}>
                              {formatRelativeTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={sendMessage} className="p-3 border-t border-white/5 flex gap-2">
                    <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Írj üzenetet..."
                      className="flex-1 px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all" />
                    <button type="submit" disabled={sending || !newMsg.trim()}
                      className="px-3 py-2.5 glass-pill-active text-emerald-300 rounded-xl transition-all disabled:opacity-50 hover:scale-105">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
