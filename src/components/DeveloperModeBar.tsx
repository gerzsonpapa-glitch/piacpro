import { useEffect, useState } from 'react';
import {
  Code2, ChevronDown, ChevronUp, ExternalLink, Eye, EyeOff, MousePointer2, Save, X, Map, LayoutGrid,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import DevPageStudioDrawer from './dev/DevPageStudioDrawer';

const COLLAPSE_KEY = 'piac_dev_panel_collapsed';
const HINT_KEY = 'piac_dev_hint_hidden';

export default function DeveloperModeBar() {
  const { navigate, path } = useRouter();
  const { canEdit, devModeActive, setDevModeActive } = useSiteCustomization();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const [hintHidden, setHintHidden] = useState(() => {
    try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return false; }
  });
  const [studioOpen, setStudioOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem(HINT_KEY, hintHidden ? '1' : '0'); } catch { /* ignore */ }
  }, [hintHidden]);

  if (!canEdit) return null;

  const onAdmin = path.startsWith('/admin');
  const isHome = path === '/';

  const topOffset = 'top-[52px]';

  if (collapsed) {
    return (
      <div className={`piac-dev-top-bar piac-dev-top-bar--collapsed sticky ${topOffset} z-[220] px-3 py-1`}>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="mx-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold text-[#00d084] border border-[#00d084]/30 bg-[#07111f]/95 backdrop-blur-md"
        >
          <Code2 className="w-3.5 h-3.5" />
          Fejlesztői mód {devModeActive ? '· aktív' : ''}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`piac-dev-top-bar sticky ${topOffset} z-[220] px-2 sm:px-3 pb-2 space-y-1.5`}>
        {devModeActive && !hintHidden && (
          <div
            className="flex items-start gap-2 px-3 py-2 rounded-xl text-[10px] sm:text-[11px] leading-snug"
            style={{ background: 'rgba(124,58,237,0.9)', color: '#fff' }}
          >
            <MousePointer2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="flex-1">
              {isHome
                ? 'Lila keret = kattintható elem · sárga fogantyú = zóna húzás · alsó sáv = térkép eszközök'
                : 'Kattints a lila keretes elemre · jobb felső panel nyílik szerkesztéshez'}
            </span>
            <button type="button" onClick={() => setHintHidden(true)} className="p-0.5 hover:opacity-70" aria-label="Hint elrejtése">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div
          className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-2xl shadow-xl"
          style={{
            background: 'rgba(7,17,31,0.96)',
            border: '1px solid rgba(0,208,132,0.35)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Code2 className="w-4 h-4 text-[#00d084] flex-shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-200 hidden sm:inline">Fejlesztői mód</span>

          <button
            type="button"
            onClick={() => setDevModeActive(!devModeActive)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-semibold ${
              devModeActive ? 'bg-[#00d084]/20 text-[#00d084] border border-[#00d084]/40' : 'glass-pill text-zinc-400'
            }`}
          >
            {devModeActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {devModeActive ? 'Aktív' : 'Ki'}
          </button>

          {devModeActive && isHome && (
            <span className="hidden md:inline text-[10px] text-zinc-500 px-1">|</span>
          )}

          {devModeActive && (
            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-semibold bg-violet-500/15 text-violet-200 border border-violet-500/30"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Oldal studio
            </button>
          )}

          {!onAdmin && (
            <button
              type="button"
              onClick={() => navigate('/admin?tab=developer')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-semibold bg-[#00d084]/15 text-[#00d084] border border-[#00d084]/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Szerkesztő</span>
            </button>
          )}

          {devModeActive && isHome && (
            <button
              type="button"
              onClick={() => document.querySelector('[data-dev-map-tool]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] sm:text-[11px] text-amber-200 border border-amber-500/30 bg-amber-500/10"
            >
              <Map className="w-3.5 h-3.5" />
              Térkép
            </button>
          )}

          {devModeActive && path !== '/' && (
            <button type="button" onClick={() => navigate('/')} className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] text-zinc-400 hover:text-zinc-200">
              <ExternalLink className="w-3 h-3" /> Főoldal
            </button>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              aria-label="Panel összecsukása"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <DevPageStudioDrawer open={studioOpen} onClose={() => setStudioOpen(false)} />
    </>
  );
}
