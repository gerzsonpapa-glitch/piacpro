import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { Send, ArrowLeft, Sparkles, RotateCcw, Lock } from 'lucide-react';
import WorldZonePageHeader from '../components/world/WorldZonePageHeader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const SUGGESTIONS = [
  'Hogyan adhatok fel hirdetést?',
  'Hogyan működnek az aukciók?',
  'Hol találok állásajánlatokat?',
  'Mi az az Adomány Központ?',
  'Hogyan lehetek termelő?',
  'Mik a fizetési lehetőségek?',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: '#00d084',
            animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function PiacAIChatPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const hasAccess = profile?.ai_access === true;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Szia! Én vagyok PiacAI, a PiacPro asszisztense. Segíthetek hirdetéseket találni, megmagyarázom hogyan működik a platform, vagy bármilyen kérdésre válaszolok. Mit tehetek érted?',
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed, ts: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/piac-ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            messages: newMessages.map(({ role, content }) => ({ role, content })),
          }),
        }
      );

      const json = await res.json();
      if (json.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: json.reply, ts: Date.now() }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Sajnálom, nem tudok most válaszolni. Próbáld újra!', ts: Date.now() }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Hálózati hiba. Ellenőrizd a kapcsolatot és próbáld újra!', ts: Date.now() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    setMessages([{
      role: 'assistant',
      content: 'Szia! Én vagyok PiacAI, a PiacPro asszisztense. Segíthetek hirdetéseket találni, megmagyarázom hogyan működik a platform, vagy bármilyen kérdésre válaszolok. Mit tehetek érted?',
      ts: Date.now(),
    }]);
    setInput('');
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.2)' }}>
          <Lock className="w-8 h-8" style={{ color: '#00d084' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Bejelentkezés szükséges</h2>
          <p className="text-zinc-400 text-sm">A PiacAI chathez be kell jelentkezned.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/login')}
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #00d084, #059669)', color: '#07111f' }}>
            Bejelentkezés
          </button>
          <button onClick={() => navigate('/register')}
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] text-zinc-300"
            style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Regisztráció
          </button>
        </div>
      </div>
    );
  }

  // No AI access
  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Hozzáférés szükséges</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            A PiacAI chathez admin engedély szükséges.<br />
            Kérd meg a platform adminisztrátorát, hogy adja meg a hozzáférést.
          </p>
        </div>
        <button onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] text-zinc-300"
          style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Vissza a főoldalra
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col space-y-4" style={{ height: 'calc(100dvh - 8rem)', minHeight: '420px' }}>
      <WorldZonePageHeader
        zoneId="piac-ai"
        title="PiacAI asszisztens"
        subtitle="Online — kész segíteni"
        showLiveCount={false}
        compact
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              style={{ background: 'rgba(13,27,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Vissza
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200"
              style={{ background: 'rgba(13,27,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Újra
            </button>
          </div>
        }
      />

      <div className="flex flex-col flex-1 min-h-0 glass rounded-2xl overflow-hidden p-4" style={{ border: '1px solid rgba(0,208,132,0.12)' }}>
      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2 min-h-0"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,208,132,0.15) transparent' }}
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' && (
              <img
                src="/kell.png"
                alt="PiacAI"
                className="w-8 h-8 rounded-xl object-cover flex-shrink-0 mt-1"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                }}
              />
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'
              }`}
              style={msg.role === 'user' ? {
                background: 'linear-gradient(135deg, rgba(0,208,132,0.2), rgba(0,208,132,0.1))',
                border: '1px solid rgba(0,208,132,0.3)',
                color: '#e4faf3',
              } : {
                background: 'rgba(13,27,42,0.85)',
                border: '1px solid rgba(0,208,132,0.12)',
                color: '#d1d5db',
              }}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 flex-row">
            <img
              src="/kell.png"
              alt="PiacAI"
              className="w-8 h-8 rounded-xl object-cover flex-shrink-0 mt-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div
              className="rounded-2xl rounded-tl-md"
              style={{ background: 'rgba(13,27,42,0.85)', border: '1px solid rgba(0,208,132,0.12)' }}
            >
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips — only show when chat is fresh */}
      {messages.length === 1 && !loading && (
        <div className="flex flex-wrap gap-2 py-3 flex-shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3.5 py-2 rounded-xl transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(13,27,42,0.7)',
                border: '1px solid rgba(0,208,132,0.15)',
                color: '#9ca3af',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex gap-2 items-end pt-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(0,208,132,0.1)' }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Írj PiacAI-nak... (Enter = küldés)"
          rows={1}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none transition-all"
          style={{
            background: 'rgba(13,27,42,0.8)',
            border: '1px solid rgba(0,208,132,0.2)',
            maxHeight: '120px',
          }}
          onInput={(e) => {
            const el = e.target as HTMLTextAreaElement;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.05] active:scale-95"
          style={{
            background: input.trim() && !loading
              ? 'linear-gradient(135deg, #00d084, #059669)'
              : 'rgba(0,208,132,0.1)',
            border: '1px solid rgba(0,208,132,0.3)',
            boxShadow: input.trim() && !loading ? '0 0 16px rgba(0,208,132,0.35)' : 'none',
          }}
        >
          <Send className="w-4 h-4 text-[#07111f]" style={{ color: input.trim() && !loading ? '#07111f' : '#00d084' }} />
        </button>
      </div>
      </div>
    </div>
  );
}
