import { Code2, ExternalLink, Eye, EyeOff, MousePointer2, Save } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';

export default function DeveloperModeBar() {
  const { navigate, path } = useRouter();
  const { canEdit, devModeActive, setDevModeActive } = useSiteCustomization();

  if (!canEdit) return null;

  const onAdmin = path.startsWith('/admin');

  return (
    <div
      className="piac-dev-toolbar fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-2 max-w-[min(100vw-1rem,560px)] px-2"
    >
      {devModeActive && (
        <div
          className="w-full px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-medium flex items-center gap-2 justify-center text-center leading-snug"
          style={{
            background: 'rgba(124,58,237,0.92)',
            color: '#fff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <MousePointer2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {path === '/'
              ? 'Lila keret = kattintható · sárga fogantyú = húzás · felső gombok = gyors szerkesztés'
              : 'Kattints a lila keretes elemre a szerkesztéshez'}
          </span>
        </div>
      )}

      <div
        className="flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-2xl shadow-2xl w-full"
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
    </div>
  );
}
