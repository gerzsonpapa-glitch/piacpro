import { X, Globe, Palette, Type, Image as ImageIcon, MapPin, Sparkles, Layers } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { APP_PAGE_OPTIONS, CITY_CARD_STYLES, CITY_PIN_SIZES, CITY_PIN_VARIANTS } from '../../lib/cityMapPages';

const QUICK_EDITS = [
  { key: 'hero.title', label: 'Főoldal cím', icon: Type },
  { key: 'hero.subtitle', label: 'Főoldal alcím', icon: Type },
  { key: 'hero.imageUrl', label: 'Városkép URL', icon: ImageIcon },
  { key: 'theme.accentColor', label: 'Accent szín', icon: Palette },
  { key: 'nav.searchPlaceholder', label: 'Kereső szöveg', icon: Globe },
];

const DEV_CATALOG = [
  { label: 'Pin stílusok', count: CITY_PIN_VARIANTS.length, desc: 'icon → portal (10 db)' },
  { label: 'Kártya stílusok', count: CITY_CARD_STYLES.length, desc: 'glass → royal (10 db)' },
  { label: 'Pin méretek', count: CITY_PIN_SIZES.length, desc: '2XS → Mega + skála 50–200%' },
  { label: 'Ikonok', count: 15, desc: 'Piac, licit, AI, védelem…' },
];

export default function DevPageStudioDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { navigate, path } = useRouter();
  const { setDevModeActive } = useSiteCustomization();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md h-full overflow-y-auto shadow-2xl p-5 space-y-5"
        style={{ background: 'rgba(7,17,31,0.98)', borderLeft: '1px solid rgba(0,208,132,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Oldal Studio Pro
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Fejlesztői mód · prémium pin/kártya katalógus</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Prémium katalógus
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEV_CATALOG.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2">
                <p className="text-[10px] font-bold text-zinc-200">{item.label}</p>
                <p className="text-lg font-black text-amber-400 leading-none mt-0.5">{item.count}×</p>
                <p className="text-[9px] text-zinc-600 mt-1 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#00C896]/80">Gyors mezők (kattints fejlesztői módban)</p>
          <div className="grid gap-2">
            {QUICK_EDITS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/8 bg-white/[0.03] text-xs text-zinc-300"
                >
                  <Icon className="w-3.5 h-3.5 text-[#00C896]" />
                  <span className="font-medium">{item.label}</span>
                  <code className="ml-auto text-[9px] text-zinc-600">{item.key}</code>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-600">Kapcsold be a fejlesztői módot, majd kattints a lila keretes elemre.</p>
        </section>

        <section className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#00C896]/80">Oldal navigáció</p>
          <div className="grid gap-1 max-h-48 overflow-y-auto scrollbar-none">
            {APP_PAGE_OPTIONS.filter((p) => !p.path.includes('login') && !p.path.includes('register')).map((p) => (
              <button
                key={p.path}
                type="button"
                onClick={() => { navigate(p.path); onClose(); setDevModeActive(true); }}
                className={`text-left px-3 py-2 rounded-xl text-xs transition-colors ${path === p.path ? 'bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30' : 'text-zinc-400 hover:bg-white/5'}`}
              >
                {p.label}
                <span className="block text-[10px] text-zinc-600">{p.path}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2">
          <p className="text-xs text-violet-200 font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Főoldal térkép — Pro szerkesztő
          </p>
          <ul className="text-[10px] text-zinc-500 space-y-1 leading-relaxed list-disc list-inside">
            <li>Sárga fogantyú = pozíció húzás</li>
            <li>Kattintás = 10 pin + 10 kártya + méret + skála</li>
            <li>Admin → Szerkesztő → Pin / kártya Pro = globális alapok</li>
          </ul>
          <button
            type="button"
            onClick={() => { navigate('/'); onClose(); setDevModeActive(true); }}
            className="mt-1 w-full py-2 rounded-xl text-xs font-bold text-[#07111f]"
            style={{ background: 'linear-gradient(135deg, #00C896, #00A67E)' }}
          >
            Ugrás a várostérképre
          </button>
          <button
            type="button"
            onClick={() => { navigate('/admin?tab=developer'); onClose(); }}
            className="w-full py-2 rounded-xl text-xs font-semibold border border-violet-500/30 text-violet-200 hover:bg-violet-500/10"
          >
            Teljes weboldal-szerkesztő
          </button>
        </section>
      </div>
    </div>
  );
}
