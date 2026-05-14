import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { Conversation, Message, Profile } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';
import ReportModal from '../components/ReportModal';
import { MessageCircle, Send, ArrowLeft, CheckCheck, Flag, Shield } from 'lucide-react';
import Avatar from '../components/Avatar';

export default function MessagesPage() {
  const { user, refreshUnread } = useAuth();
  const { showToast } = useNotification();
  const { params, navigate } = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ userId?: string; listingId?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvRef = useRef<Conversation | null>(null);
  const chatId = params.id;

  activeConvRef.current = activeConversation;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversations')
      .select('*, listing:listings(id, title, images, price)')
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

  // Initial load
  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  // Open conversation from URL param
  useEffect(() => {
    if (chatId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === chatId);
      if (conv && activeConvRef.current?.id !== conv.id) openConversation(conv);
    }
  }, [chatId, conversations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: subscribe to new messages in active conversation
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-page-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const msg = payload.new as Message;
        // If message is in active conversation, append it
        if (activeConvRef.current && msg.conversation_id === activeConvRef.current.id) {
          // Fetch with sender profile
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
            // Mark as read immediately if we're the recipient
            if (msg.sender_id !== user.id) {
              await supabase.from('messages').update({ is_read: true, seen_at: new Date().toISOString() }).eq('id', msg.id);
              await refreshUnread();
            }
          }
        } else if (msg.sender_id !== user.id) {
          // Message in another conversation — update unread badge + conversation list
          await refreshUnread();
          setConversations((prev) => prev.map((c) =>
            c.id === msg.conversation_id
              ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message_at: msg.created_at }
              : c
          ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, async () => {
        await refreshUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, refreshUnread, scrollToBottom]);

  // Realtime: subscribe to new conversations
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `buyer_id=eq.${user.id}`,
      }, () => { fetchConversations(); })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `seller_id=eq.${user.id}`,
      }, () => { fetchConversations(); })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
      }, () => { fetchConversations(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  async function openConversation(conv: Conversation) {
    setActiveConversation(conv);
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    await fetchMessages(conv.id);
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
                    <div className="flex items-center justify-between">
                      <p className={`font-medium truncate text-sm ${unread > 0 ? 'text-zinc-100' : 'text-zinc-300'}`}>
                        {other?.full_name || other?.username || 'Felhasználó'}
                      </p>
                      <span className="text-xs text-zinc-600 flex-shrink-0 ml-1">
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{conv.listing?.title || 'Hirdetés'}</p>
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
      <div className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1 glass rounded-3xl overflow-hidden`}>
        {activeConversation ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <button onClick={() => { setActiveConversation(null); navigate('/messages'); }}
                className="md:hidden p-1 glass-pill rounded-lg text-zinc-400 hover:text-zinc-200">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)} className="flex-shrink-0">
                <Avatar src={otherUser?.avatar_url} name={otherUser?.full_name || otherUser?.username} size="sm" rounded="full" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)}
                    className="font-medium text-zinc-200 text-sm hover:text-emerald-400 transition-colors"
                  >
                    {otherUser?.full_name || otherUser?.username || 'Felhasználó'}
                  </button>
                  {otherUser?.verified && <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-xs text-zinc-500 truncate">{activeConversation.listing?.title || 'Hirdetés'}</p>
              </div>
              <div className="flex items-center gap-1">
                {otherUser && (
                  <button onClick={() => setReportTarget({ userId: otherUser.id })}
                    className="p-2 glass-pill rounded-xl text-zinc-500 hover:text-red-400 transition-colors" title="Felhasználó bejelentése">
                    <Flag className="w-4 h-4" />
                  </button>
                )}
                {activeConversation.listing && (
                  <button onClick={() => setReportTarget({ listingId: activeConversation.listing?.id })}
                    className="p-2 glass-pill rounded-xl text-zinc-500 hover:text-red-400 transition-colors" title="Hirdetés bejelentése">
                    <Shield className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-zinc-600 text-sm py-8">Kezdd el a beszélgetést!</p>
              )}
              {messages.map((msg, i) => {
                const isOwn = msg.sender_id === user.id;
                const isLast = i === messages.length - 1;
                const showSeen = isOwn && isLast && !!msg.seen_at;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%]">
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isOwn ? 'glass-pill-active text-emerald-200 rounded-br-md' : 'glass-pill text-zinc-200 rounded-bl-md'}`}>
                        <p>{msg.content}</p>
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

            <form onSubmit={sendMessage} className="p-4 border-t border-white/5">
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

      {reportTarget && (
        <ReportModal userId={reportTarget.userId} listingId={reportTarget.listingId} onClose={() => setReportTarget(null)} />
      )}
    </div>
  );
}
