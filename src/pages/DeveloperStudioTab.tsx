import { useEffect, useState } from 'react';
import {
  Home, Palette, Code, Wrench, Save, RotateCcw, ExternalLink,
  LayoutGrid, Sparkles, Globe, Image as ImageIcon, Layers, Navigation,
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import {
  DEFAULT_SITE_CONFIG,
  type QuarterId,
  type QuarterOverride,
  type SiteCustomizationConfig,
  type PageSkinConfig,
  WORLD_BACKGROUND_4K,
} from '../lib/siteCustomization';
import { ZONE_ASSETS } from '../lib/zoneAssets';
import { ImageUrlField, Field, inputCls } from '../components/developer/ImageUrlField';

const QUARTER_META: { id: QuarterId; name: string }[] = [
  { id: 'piac-ter', name: 'Piac tér' },
  { id: 'munka-negyed', name: 'Munka negyed' },
  { id: 'boltok-utcaja', name: 'Boltok utcája' },
  { id: 'licit-csarnok', name: 'Licit csarnok' },
  { id: 'kozossegi-ter', name: 'Közösségi tér' },
  { id: 'adomany-kozpont', name: 'Adomány központ' },
  { id: 'termelok-piaca', name: 'Termelők piaca' },
];

type StudioSection = 'world' | 'hero' | 'zones' | 'quarters' | 'pages' | 'theme' | 'media' | 'css' | 'extra';

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <div
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${checked ? 'bg-[#00d084]' : 'bg-zinc-700'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`}
        />
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

export default function DeveloperStudioTab() {
  const { config, saveConfig } = useSiteCustomization();
  const { showToast } = useNotification();
  const [draft, setDraft] = useState<SiteCustomizationConfig>(config);
  const [section, setSection] = useState<StudioSection>('world');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  function patch<K extends keyof SiteCustomizationConfig>(key: K, value: SiteCustomizationConfig[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function getQuarterOverride(id: QuarterId): QuarterOverride {
    return draft.quarters.find((q) => q.id === id) ?? { id };
  }

  function setQuarterOverride(id: QuarterId, patchQ: Partial<QuarterOverride>) {
    const existing = draft.quarters.filter((q) => q.id !== id);
    const prev = getQuarterOverride(id);
    patch('quarters', [...existing, { ...prev, ...patchQ, id }]);
  }

  function updatePage(path: string, patchP: Partial<PageSkinConfig>) {
    patch(
      'pages',
      draft.pages.map((p) => (p.path === path ? { ...p, ...patchP } : p)),
    );
  }

  async function handleSave() {
    setSaving(true);
    const { error, usedLocalFallback } = await saveConfig(draft);
    setSaving(false);
    if (error) {
      showToast('error', 'Mentés sikertelen', error);
    } else if (usedLocalFallback) {
      showToast(
        'success',
        'Mentve (helyi)',
        'Az adatbázis tábla hiányzik — a beállítások a böngésződben vannak. Futtasd a Supabase migrációt az élő mentéshez.',
        12000,
      );
    } else {
      showToast('success', 'Weboldal mentve', 'Minden látogató azonnal látja a változásokat.');
    }
  }

  function handleReset() {
    if (!confirm('Biztosan visszaállítod az alapértelmezett digitális világot?')) return;
    setDraft({ ...DEFAULT_SITE_CONFIG });
  }

  const sections: { id: StudioSection; label: string; icon: React.ElementType }[] = [
    { id: 'world', label: 'Digitális világ', icon: Sparkles },
    { id: 'hero', label: 'Főoldal hero', icon: Home },
    { id: 'zones', label: 'Zóna képernyők', icon: Globe },
    { id: 'quarters', label: '7 negyed', icon: LayoutGrid },
    { id: 'pages', label: 'Oldal hátterek', icon: Layers },
    { id: 'theme', label: 'Színek / mélység', icon: Palette },
    { id: 'media', label: 'Képek / média', icon: ImageIcon },
    { id: 'css', label: 'Egyéni CSS', icon: Code },
    { id: 'extra', label: 'Nav / egyéb', icon: Wrench },
  ];

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5 border border-violet-500/25 bg-violet-500/5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-violet-400" />
              Teljes weboldal-szerkesztő
            </h3>
            <p className="text-zinc-500 text-sm mt-1 max-w-2xl leading-relaxed">
              Fejlesztői jog: minden szöveg, kép, szín, animáció és oldal-háttér. Képeket feltölthetsz
              vagy URL-t adhatsz meg. Mentés után az egész PiacPro élőben frissül.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill text-zinc-300 text-xs font-medium">
              <ExternalLink className="w-3.5 h-3.5" /> Előnézet
            </a>
            <button type="button" onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill text-zinc-400 text-xs font-medium">
              <RotateCcw className="w-3.5 h-3.5" /> Alaphelyzet
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-zinc-900 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Mentés...' : 'Mentés az élő oldalra'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="xl:w-52 flex flex-row xl:flex-col gap-1 overflow-x-auto glass rounded-2xl p-1.5 flex-shrink-0">
          {sections.map((s) => (
            <button key={s.id} type="button" onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                section === s.id ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 glass rounded-2xl p-5 space-y-4 min-w-0 max-h-[70vh] overflow-y-auto">

          {section === 'world' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-violet-400/80 font-semibold">
                Digitális világ — animációk és atmoszféra
              </p>
              <Toggle checked={draft.world.enabled} onChange={(v) => patch('world', { ...draft.world, enabled: v })} label="Digitális világ bekapcsolva" />
              <div className="grid sm:grid-cols-2 gap-2">
                <Toggle checked={draft.world.particles} onChange={(v) => patch('world', { ...draft.world, particles: v })} label="Lebegő részecskék" />
                <Toggle checked={draft.world.floatingOrbs} onChange={(v) => patch('world', { ...draft.world, floatingOrbs: v })} label="Fénygömbök (parallax)" />
                <Toggle checked={draft.world.scanLines} onChange={(v) => patch('world', { ...draft.world, scanLines: v })} label="Scan vonalak" />
                <Toggle checked={draft.world.gridVisible} onChange={(v) => patch('world', { ...draft.world, gridVisible: v })} label="Háló rács" />
                <Toggle checked={draft.world.heroKenBurns} onChange={(v) => patch('world', { ...draft.world, heroKenBurns: v })} label="Hero lassú zoom (Ken Burns)" />
                <Toggle checked={draft.world.cardFloat} onChange={(v) => patch('world', { ...draft.world, cardFloat: v })} label="Kártyák lebegése" />
                <Toggle checked={draft.world.neonPulse} onChange={(v) => patch('world', { ...draft.world, neonPulse: v })} label="Neon pulzálás" />
              </div>
              <Field label={`Részecske szám (${draft.world.particleCount})`}>
                <input type="range" min={8} max={100} value={draft.world.particleCount}
                  onChange={(e) => patch('world', { ...draft.world, particleCount: Number(e.target.value) })}
                  className="w-full accent-violet-500" />
              </Field>
              <Field label={`Parallax erősség (${draft.world.parallaxStrength})`}>
                <input type="range" min={0} max={3} step={0.1} value={draft.world.parallaxStrength}
                  onChange={(e) => patch('world', { ...draft.world, parallaxStrength: Number(e.target.value) })}
                  className="w-full accent-violet-500" />
              </Field>
              <Field label={`Rács átlátszóság (${draft.world.gridOpacity})`}>
                <input type="range" min={0} max={1} step={0.05} value={draft.world.gridOpacity}
                  onChange={(e) => patch('world', { ...draft.world, gridOpacity: Number(e.target.value) })}
                  className="w-full accent-violet-500" />
              </Field>
              <Field label="Részecske szín">
                <input type="color" value={draft.world.particleColor}
                  onChange={(e) => patch('world', { ...draft.world, particleColor: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer" />
              </Field>
              <Field label={`Telítettség (${draft.world.globalSaturation})`}>
                <input type="range" min={0.5} max={2} step={0.05} value={draft.world.globalSaturation}
                  onChange={(e) => patch('world', { ...draft.world, globalSaturation: Number(e.target.value) })}
                  className="w-full accent-violet-500" />
              </Field>
              <Field label={`Kontraszt (${draft.world.globalContrast})`}>
                <input type="range" min={0.8} max={1.5} step={0.05} value={draft.world.globalContrast}
                  onChange={(e) => patch('world', { ...draft.world, globalContrast: Number(e.target.value) })}
                  className="w-full accent-violet-500" />
              </Field>
            </>
          )}

          {section === 'hero' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Kezdőképernyő</p>
              <Field label="Főcím">
                <input className={inputCls()} value={draft.hero.title}
                  onChange={(e) => patch('hero', { ...draft.hero, title: e.target.value })} />
              </Field>
              <Field label="Alcím">
                <input className={inputCls()} value={draft.hero.subtitle}
                  onChange={(e) => patch('hero', { ...draft.hero, subtitle: e.target.value })} />
              </Field>
              <ImageUrlField label="Főváros háttér (hub)" value={draft.hero.imageUrl}
                onChange={(url) => patch('hero', { ...draft.hero, imageUrl: url || WORLD_BACKGROUND_4K })}
                hint="Alapértelmezett: /zones/hub.jpg — forrás: zones-source/hub.png" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={`Fényerő (${draft.hero.brightness})`}>
                  <input type="range" min={0.2} max={1.2} step={0.02} value={draft.hero.brightness}
                    onChange={(e) => patch('hero', { ...draft.hero, brightness: Number(e.target.value) })}
                    className="w-full accent-[#00d084]" />
                </Field>
                <Field label={`Telítettség (${draft.hero.saturation})`}>
                  <input type="range" min={0} max={2} step={0.05} value={draft.hero.saturation}
                    onChange={(e) => patch('hero', { ...draft.hero, saturation: Number(e.target.value) })}
                    className="w-full accent-[#00d084]" />
                </Field>
                <Field label={`Magasság vh (${draft.hero.heightVh})`}>
                  <input type="range" min={50} max={100} value={draft.hero.heightVh}
                    onChange={(e) => patch('hero', { ...draft.hero, heightVh: Number(e.target.value) })}
                    className="w-full accent-[#00d084]" />
                </Field>
                <Field label={`Átlátszó réteg (${draft.hero.overlayOpacity})`}>
                  <input type="range" min={0} max={1} step={0.05} value={draft.hero.overlayOpacity}
                    onChange={(e) => patch('hero', { ...draft.hero, overlayOpacity: Number(e.target.value) })}
                    className="w-full accent-[#00d084]" />
                </Field>
              </div>
              <Field label="Réteg színe (overlay)">
                <input type="color" value={draft.hero.overlayColor}
                  onChange={(e) => patch('hero', { ...draft.hero, overlayColor: e.target.value })}
                  className="w-full h-10 rounded-lg" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Központi jelvény (felső)">
                  <input className={inputCls()} value={draft.hero.badgeTop}
                    onChange={(e) => patch('hero', { ...draft.hero, badgeTop: e.target.value })} />
                </Field>
                <Field label="Központi jelvény (alsó)">
                  <input className={inputCls()} value={draft.hero.badgeBottom}
                    onChange={(e) => patch('hero', { ...draft.hero, badgeBottom: e.target.value })} />
                </Field>
              </div>
            </>
          )}

          {section === 'zones' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Modulonkénti S&F-szerű képernyők</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Minden zóna saját eredeti PiacPro illusztráció. Új kép: <code className="text-[#00E676]">zones-source/&#123;id&#125;.png</code> → <code className="text-[#00E676]">node scripts/build-zone-assets.mjs</code>
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.values(ZONE_ASSETS).map((z) => (
                  <div key={z.id} className="rounded-xl border border-white/5 overflow-hidden bg-black/20">
                    <img src={z.static.jpg} alt={z.label} className="w-full h-28 object-cover" />
                    <div className="p-3 space-y-1">
                      <p className="text-sm font-bold text-zinc-200">{z.label}</p>
                      <p className="text-[10px] text-zinc-600 font-mono">{z.static.jpg}</p>
                      {z.loop?.webp && <p className="text-[10px] text-cyan-600/80">Loop: {z.loop.webp}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'quarters' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Városnegyedek</p>
              {QUARTER_META.map((meta) => {
                const q = getQuarterOverride(meta.id);
                return (
                  <div key={meta.id} className="rounded-xl p-4 border border-white/5 space-y-3 bg-black/20">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-zinc-200">{meta.name}</span>
                      <Toggle checked={!!q.hidden} onChange={(v) => setQuarterOverride(meta.id, { hidden: v })} label="Rejtett" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Címke"><input className={inputCls()} value={q.label ?? ''} onChange={(e) => setQuarterOverride(meta.id, { label: e.target.value })} /></Field>
                      <Field label="Alcím"><input className={inputCls()} value={q.sublabel ?? ''} onChange={(e) => setQuarterOverride(meta.id, { sublabel: e.target.value })} /></Field>
                      <Field label="Leírás"><input className={inputCls()} value={q.desc ?? ''} onChange={(e) => setQuarterOverride(meta.id, { desc: e.target.value })} /></Field>
                      <Field label="Szín (hex)"><input className={inputCls()} value={q.color ?? ''} onChange={(e) => setQuarterOverride(meta.id, { color: e.target.value })} /></Field>
                      <Field label="Link"><input className={inputCls()} value={q.path ?? ''} onChange={(e) => setQuarterOverride(meta.id, { path: e.target.value })} /></Field>
                    </div>
                    <ImageUrlField label="Kártya kép" value={q.img ?? ''} onChange={(url) => setQuarterOverride(meta.id, { img: url })} />
                  </div>
                );
              })}
            </>
          )}

          {section === 'pages' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Oldalankénti háttér és cím</p>
              {draft.pages.map((p) => (
                <div key={p.path} className="rounded-xl p-4 border border-white/5 space-y-3 bg-black/20">
                  <p className="text-sm font-semibold text-[#00d084]">{p.label} <span className="text-zinc-600 font-normal">{p.path}</span></p>
                  <ImageUrlField label="Háttérkép" value={p.bgImage} onChange={(url) => updatePage(p.path, { bgImage: url })} />
                  <Field label="Háttérszín (ha nincs kép)">
                    <input className={inputCls()} value={p.bgColor} placeholder="#07111f"
                      onChange={(e) => updatePage(p.path, { bgColor: e.target.value })} />
                  </Field>
                  <Field label="Sötét overlay (rgba)">
                    <input className={inputCls()} value={p.overlay} placeholder="rgba(7,17,31,0.7)"
                      onChange={(e) => updatePage(p.path, { overlay: e.target.value })} />
                  </Field>
                  <Field label="Oldal cím (opcionális banner)">
                    <input className={inputCls()} value={p.title} onChange={(e) => updatePage(p.path, { title: e.target.value })} />
                  </Field>
                  <Field label="Alcím">
                    <input className={inputCls()} value={p.subtitle} onChange={(e) => updatePage(p.path, { subtitle: e.target.value })} />
                  </Field>
                </div>
              ))}
            </>
          )}

          {section === 'theme' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Színek és üveg mélység</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {(['accent', 'accentSecondary', 'background', 'surface'] as const).map((key) => (
                  <Field key={key} label={key}>
                    <div className="flex gap-2">
                      <input type="color" value={draft.theme[key]}
                        onChange={(e) => patch('theme', { ...draft.theme, [key]: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer" />
                      <input className={inputCls()} value={draft.theme[key]}
                        onChange={(e) => patch('theme', { ...draft.theme, [key]: e.target.value })} />
                    </div>
                  </Field>
                ))}
              </div>
              <Field label={`Üveg elmosás (${draft.theme.glassBlur}px)`}>
                <input type="range" min={8} max={80} value={draft.theme.glassBlur}
                  onChange={(e) => patch('theme', { ...draft.theme, glassBlur: Number(e.target.value) })}
                  className="w-full accent-[#00d084]" />
              </Field>
              <Field label={`Üveg szegély erősség (${draft.theme.glassBorderOpacity})`}>
                <input type="range" min={0} max={0.6} step={0.02} value={draft.theme.glassBorderOpacity}
                  onChange={(e) => patch('theme', { ...draft.theme, glassBorderOpacity: Number(e.target.value) })}
                  className="w-full accent-[#00d084]" />
              </Field>
              <Field label={`Mélység blur (${draft.world.depthBlur}px)`}>
                <input type="range" min={0} max={80} value={draft.world.depthBlur}
                  onChange={(e) => patch('world', { ...draft.world, depthBlur: Number(e.target.value) })}
                  className="w-full accent-violet-500" />
              </Field>
            </>
          )}

          {section === 'media' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Globális képek</p>
              <ImageUrlField label="Ambient háttér (fallback)" value={draft.media.ambientBgUrl || WORLD_BACKGROUND_4K}
                onChange={(url) => patch('media', { ...draft.media, ambientBgUrl: url || WORLD_BACKGROUND_4K })} />
              <ImageUrlField label="Logo / ikon kép (opcionális)" value={draft.media.logoImageUrl}
                onChange={(url) => patch('media', { ...draft.media, logoImageUrl: url })} />
              <ImageUrlField label="Közösségi megosztás kép (OG)" value={draft.media.ogImageUrl || WORLD_BACKGROUND_4K}
                onChange={(url) => patch('media', { ...draft.media, ogImageUrl: url || WORLD_BACKGROUND_4K })}
                hint="Alapértelmezett: /zones/hub.jpg" />
            </>
          )}

          {section === 'css' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Haladó CSS</p>
              <textarea value={draft.customCss} onChange={(e) => patch('customCss', e.target.value)} rows={18}
                className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 font-mono text-xs leading-relaxed focus:outline-none"
                placeholder="/* pl. .glass { box-shadow: 0 0 60px rgba(0,208,132,0.2); } */" />
            </>
          )}

          {section === 'extra' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5" /> Navigáció
              </p>
              <Field label="Logo alcím">
                <input className={inputCls()} value={draft.nav.brandSubtitle}
                  onChange={(e) => patch('nav', { ...draft.nav, brandSubtitle: e.target.value })} />
              </Field>
              <Field label="Kereső placeholder">
                <input className={inputCls()} value={draft.nav.searchPlaceholder}
                  onChange={(e) => patch('nav', { ...draft.nav, searchPlaceholder: e.target.value })} />
              </Field>
              <Field label="Lábléc szöveg">
                <textarea value={draft.footer.tagline} onChange={(e) => patch('footer', { tagline: e.target.value })}
                  rows={3} className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 text-sm focus:outline-none resize-none" />
              </Field>
              <Toggle checked={draft.announcement.enabled}
                onChange={(v) => patch('announcement', { ...draft.announcement, enabled: v })}
                label="Felső bejelentő sáv" />
              <Field label="Bejelentés szöveg">
                <input className={inputCls()} value={draft.announcement.text}
                  onChange={(e) => patch('announcement', { ...draft.announcement, text: e.target.value })} />
              </Field>
              <Field label="Bejelentés link">
                <input className={inputCls()} value={draft.announcement.link}
                  onChange={(e) => patch('announcement', { ...draft.announcement, link: e.target.value })} />
              </Field>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
