import { useEffect, useState } from 'react';
import {
  Home, Palette, Code, Wrench, Save, RotateCcw, Eye, ExternalLink,
  Megaphone, LayoutGrid,
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import {
  DEFAULT_SITE_CONFIG,
  type QuarterId,
  type QuarterOverride,
  type SiteCustomizationConfig,
} from '../lib/siteCustomization';

const QUARTER_META: { id: QuarterId; name: string }[] = [
  { id: 'piac-ter', name: 'Piac tér' },
  { id: 'munka-negyed', name: 'Munka negyed' },
  { id: 'boltok-utcaja', name: 'Boltok utcája' },
  { id: 'licit-csarnok', name: 'Licit csarnok' },
  { id: 'kozossegi-ter', name: 'Közösségi tér' },
  { id: 'adomany-kozpont', name: 'Adomány központ' },
  { id: 'termelok-piaca', name: 'Termelők piaca' },
];

type StudioSection = 'hero' | 'theme' | 'quarters' | 'css' | 'extra';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function inputCls() {
  return 'w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm';
}

export default function DeveloperStudioTab() {
  const { config, saveConfig } = useSiteCustomization();
  const { showToast } = useNotification();
  const [draft, setDraft] = useState<SiteCustomizationConfig>(config);
  const [section, setSection] = useState<StudioSection>('hero');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  function patch<K extends keyof SiteCustomizationConfig>(
    key: K,
    value: SiteCustomizationConfig[K],
  ) {
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

  async function handleSave() {
    setSaving(true);
    const { error } = await saveConfig(draft);
    setSaving(false);
    if (error) showToast('error', 'Mentés sikertelen', error);
    else showToast('success', 'Weboldal mentve', 'A változtatások azonnal érvénybe léptek.');
  }

  function handleReset() {
    if (!confirm('Biztosan visszaállítod az alapértelmezett kinézetet?')) return;
    setDraft({ ...DEFAULT_SITE_CONFIG, quarters: [] });
  }

  const sections: { id: StudioSection; label: string; icon: React.ElementType }[] = [
    { id: 'hero', label: 'Főoldal / Hero', icon: Home },
    { id: 'quarters', label: 'Negyedek', icon: LayoutGrid },
    { id: 'theme', label: 'Színek', icon: Palette },
    { id: 'css', label: 'Egyéni CSS', icon: Code },
    { id: 'extra', label: 'Egyéb', icon: Wrench },
  ];

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5 border border-[#00d084]/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
              <Code className="w-5 h-5 text-[#00d084]" />
              Weboldal szerkesztő (fejlesztői mód)
            </h3>
            <p className="text-zinc-500 text-sm mt-1 leading-relaxed max-w-xl">
              Itt módosíthatod a főoldal szövegeit, képeit, színeit és egyéni CSS-t.
              Csak a te fiókod (gerzsonpapa@gmail.com) menthet — a változások minden látogatónak megjelennek.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill text-zinc-300 text-xs font-medium hover:text-zinc-100"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Előnézet
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill text-zinc-400 text-xs font-medium hover:text-zinc-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Alaphelyzet
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-900 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00d084, #059669)' }}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Mentés...' : 'Mentés'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-48 flex flex-row lg:flex-col gap-1 overflow-x-auto glass rounded-2xl p-1.5">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                section === s.id
                  ? 'bg-white/10 text-[#00d084]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 glass rounded-2xl p-5 space-y-4 min-w-0">
          {section === 'hero' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Kezdőképernyő</p>
              <Field label="Főcím">
                <input
                  className={inputCls()}
                  value={draft.hero.title}
                  onChange={(e) => patch('hero', { ...draft.hero, title: e.target.value })}
                />
              </Field>
              <Field label="Alcím">
                <input
                  className={inputCls()}
                  value={draft.hero.subtitle}
                  onChange={(e) => patch('hero', { ...draft.hero, subtitle: e.target.value })}
                />
              </Field>
              <Field label="Háttérkép URL (pl. /képem.jpg vagy teljes link)">
                <input
                  className={inputCls()}
                  value={draft.hero.imageUrl}
                  onChange={(e) => patch('hero', { ...draft.hero, imageUrl: e.target.value })}
                />
              </Field>
              <Field label={`Kép fényerő (${draft.hero.brightness})`}>
                <input
                  type="range"
                  min={0.3}
                  max={1}
                  step={0.02}
                  value={draft.hero.brightness}
                  onChange={(e) =>
                    patch('hero', { ...draft.hero, brightness: Number(e.target.value) })
                  }
                  className="w-full accent-[#00d084]"
                />
              </Field>
            </>
          )}

          {section === 'quarters' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
                Városnegyed kártyák (főoldal)
              </p>
              <div className="space-y-4">
                {QUARTER_META.map((meta) => {
                  const q = getQuarterOverride(meta.id);
                  return (
                    <div
                      key={meta.id}
                      className="rounded-xl p-4 border border-white/5 space-y-3"
                      style={{ background: 'rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-zinc-200">{meta.name}</span>
                        <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!q.hidden}
                            onChange={(e) => setQuarterOverride(meta.id, { hidden: e.target.checked })}
                            className="rounded accent-[#00d084]"
                          />
                          Elrejtés
                        </label>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="Címke">
                          <input
                            className={inputCls()}
                            value={q.label ?? ''}
                            placeholder="Alapértelmezett marad, ha üres"
                            onChange={(e) => setQuarterOverride(meta.id, { label: e.target.value })}
                          />
                        </Field>
                        <Field label="Alcím">
                          <input
                            className={inputCls()}
                            value={q.sublabel ?? ''}
                            onChange={(e) => setQuarterOverride(meta.id, { sublabel: e.target.value })}
                          />
                        </Field>
                        <Field label="Rövid leírás">
                          <input
                            className={inputCls()}
                            value={q.desc ?? ''}
                            onChange={(e) => setQuarterOverride(meta.id, { desc: e.target.value })}
                          />
                        </Field>
                        <Field label="Kép URL">
                          <input
                            className={inputCls()}
                            value={q.img ?? ''}
                            onChange={(e) => setQuarterOverride(meta.id, { img: e.target.value })}
                          />
                        </Field>
                        <Field label="Szín (hex)">
                          <input
                            className={inputCls()}
                            value={q.color ?? ''}
                            placeholder="#00d084"
                            onChange={(e) => setQuarterOverride(meta.id, { color: e.target.value })}
                          />
                        </Field>
                        <Field label="Link (útvonal)">
                          <input
                            className={inputCls()}
                            value={q.path ?? ''}
                            placeholder="/search"
                            onChange={(e) => setQuarterOverride(meta.id, { path: e.target.value })}
                          />
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {section === 'theme' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Színek</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Fő szín (akcentus)">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={draft.theme.accent}
                      onChange={(e) => patch('theme', { ...draft.theme, accent: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      className={inputCls()}
                      value={draft.theme.accent}
                      onChange={(e) => patch('theme', { ...draft.theme, accent: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Háttérszín">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={draft.theme.background}
                      onChange={(e) => patch('theme', { ...draft.theme, background: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      className={inputCls()}
                      value={draft.theme.background}
                      onChange={(e) => patch('theme', { ...draft.theme, background: e.target.value })}
                    />
                  </div>
                </Field>
              </div>
              <div
                className="rounded-xl p-4 text-sm"
                style={{
                  background: draft.theme.background,
                  border: `1px solid ${draft.theme.accent}40`,
                  color: draft.theme.accent,
                }}
              >
                Előnézet — így néz ki az akcentus szín a háttéren.
              </div>
            </>
          )}

          {section === 'css' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
                Egyéni CSS (haladó)
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Globális stílusok, amelyek az egész oldalra érvényesek. Óvatosan használd — hibás CSS
                tönkreteheti a megjelenést.
              </p>
              <textarea
                value={draft.customCss}
                onChange={(e) => patch('customCss', e.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 font-mono text-xs leading-relaxed focus:outline-none resize-y"
                placeholder={`.glass-pill-active {\n  color: var(--piac-accent);\n}`}
              />
            </>
          )}

          {section === 'extra' && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold flex items-center gap-2">
                <Megaphone className="w-3.5 h-3.5" />
                Felső sáv (bejelentés)
              </p>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={draft.announcement.enabled}
                  onChange={(e) =>
                    patch('announcement', { ...draft.announcement, enabled: e.target.checked })
                  }
                  className="rounded accent-[#00d084]"
                />
                Bejelentés sáv megjelenítése
              </label>
              <Field label="Szöveg">
                <input
                  className={inputCls()}
                  value={draft.announcement.text}
                  onChange={(e) =>
                    patch('announcement', { ...draft.announcement, text: e.target.value })
                  }
                />
              </Field>
              <Field label="Link (opcionális)">
                <input
                  className={inputCls()}
                  value={draft.announcement.link}
                  placeholder="https://..."
                  onChange={(e) =>
                    patch('announcement', { ...draft.announcement, link: e.target.value })
                  }
                />
              </Field>

              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold pt-4">
                Lábléc
              </p>
              <Field label="Rövid leírás">
                <textarea
                  value={draft.footer.tagline}
                  onChange={(e) => patch('footer', { tagline: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 text-sm focus:outline-none resize-none"
                />
              </Field>

              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold pt-4 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                Karbantartási mód
              </p>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.maintenance.enabled}
                  onChange={(e) =>
                    patch('maintenance', { ...draft.maintenance, enabled: e.target.checked })
                  }
                  className="rounded accent-amber-500"
                />
                Karbantartás bekapcsolása (csak üzenet, nem zárja le teljesen az oldalt)
              </label>
              <Field label="Üzenet">
                <textarea
                  value={draft.maintenance.message}
                  onChange={(e) =>
                    patch('maintenance', { ...draft.maintenance, message: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 text-sm focus:outline-none resize-none"
                />
              </Field>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
