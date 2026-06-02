import { Sparkles } from 'lucide-react';
import { useRouter } from '../../lib/router';

export default function PiacAIHomeWidget() {
  const { navigate } = useRouter();

  return (
    <div className="piac-ai-home-widget piac-glass-panel p-4 max-w-[280px] pointer-events-auto">
      <div className="flex items-start gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border border-amber-400/35"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(249,115,22,0.15))',
            boxShadow: '0 0 24px rgba(245,158,11,0.2)',
          }}
        >
          <Sparkles className="w-7 h-7 text-amber-200" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-amber-200 uppercase tracking-wide">PiacAI</p>
          <p className="text-[12px] text-zinc-300 leading-snug mt-1">
            Szia! Segítek megtalálni, amit keresel a városban.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate('/piac-ai')}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black text-[#07111f] transition-transform hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, #00E676, #00C853)',
          boxShadow: '0 0 18px rgba(0,230,118,0.4)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Kérdezz tőlem valamit!
      </button>
    </div>
  );
}
