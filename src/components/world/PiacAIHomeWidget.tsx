import { Sparkles } from 'lucide-react';
import { useRouter } from '../../lib/router';

/** Másodlagos AI segítő — nem a főoldal fókusza. */
export default function PiacAIHomeWidget({ compact = false }: { compact?: boolean }) {
  const { navigate } = useRouter();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => navigate('/piac-ai')}
        className="piac-ai-home-widget piac-ai-home-widget--compact group w-11 h-11 rounded-full flex items-center justify-center pointer-events-auto transition-all hover:scale-105"
        style={{
          background: 'rgba(7, 17, 31, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.35)',
        }}
        aria-label="PiacAI asszisztens megnyitása"
      >
        <Sparkles className="w-4 h-4 text-zinc-400 group-hover:text-amber-200/90 transition-colors" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/piac-ai')}
      className="piac-ai-home-widget group flex items-center gap-2.5 pl-2.5 pr-3.5 py-2 rounded-full pointer-events-auto transition-all hover:scale-[1.02]"
      style={{
        background: 'rgba(7, 17, 31, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.35)',
      }}
      aria-label="PiacAI asszisztens megnyitása"
    >
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Sparkles className="w-4 h-4 text-zinc-400 group-hover:text-amber-200/90 transition-colors" />
      </span>
      <span className="text-left min-w-0">
        <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">PiacAI</span>
        <span className="block text-[11px] text-zinc-300 truncate max-w-[140px]">Segítek, ha kell</span>
      </span>
    </button>
  );
}
