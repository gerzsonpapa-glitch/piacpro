import { Code2, ExternalLink, Eye, EyeOff, Save } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';

export default function DeveloperModeBar() {
  const { navigate, path } = useRouter();
  const { canEdit, devModeActive, setDevModeActive } = useSiteCustomization();

  if (!canEdit) return null;

  const onAdmin = path.startsWith('/admin');

  return (
    <div
      className="piac-dev-toolbar fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-2xl shadow-2xl max-w-[min(100vw-1rem,520px)]"
      style={{
        background: 'rgba(7,17,31,0.95)',
        border: '1px solid rgba(0,208,132,0.35)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 24px rgba(0,208,132,0.12)',
      }}
    >
      <Code2 className="w-4 h-4 text-[#00d084] flex-shrink-0" />
      <span className="text-xs font-semibold text-zinc-200 hidden sm:inline">Fejlesztői mód</span>

      <button
        type="button"
        onClick={() => setDevModeActive(!devModeActive)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
          devModeActive
            ? 'bg-[#00d084]/20 text-[#00d084] border border-[#00d084]/40'
            : 'glass-pill text-zinc-400'
        }`}
      >
        {devModeActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {devModeActive ? 'Aktív' : 'Ki'}
      </button>

      {devModeActive && (
        <span className="text-[10px] text-violet-300/90 hidden sm:inline max-w-[140px] leading-tight">
          Kattints a kiemelt elemre
        </span>
      )}

      {!onAdmin && (
        <button
          type="button"
          onClick={() => navigate('/admin?tab=developer')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-[#00d084]/15 text-[#00d084] border border-[#00d084]/30 hover:bg-[#00d084]/25 transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          Szerkesztő
        </button>
      )}

      {devModeActive && path !== '/' && (
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Főoldal
        </button>
      )}
    </div>
  );
}
