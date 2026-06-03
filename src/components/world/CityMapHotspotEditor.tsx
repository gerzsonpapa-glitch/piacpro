import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Trash2, Sparkles } from 'lucide-react';
import {
  APP_PAGE_OPTIONS,
  CITY_CARD_STYLES,
  CITY_ICON_OPTIONS,
  CITY_PIN_SIZES,
  CITY_PIN_VARIANTS,
  getPinSizeMeta,
  type CityMapHotspotOverride,
} from '../../lib/cityMapPages';
import type { CityBuilding } from '../../lib/cityMapBuildings';
import { resolveCityIcon } from '../../lib/cityMapIcons';
import { colorGlow } from '../../lib/cityMapCardStyles';
import CityPinVisual from './CityPinVisual';
import { DevSection, DevSizePickerGrid, DevStylePickerGrid } from '../dev/DevStylePickerGrid';
import { Store } from 'lucide-react';

export default function CityMapHotspotEditor({
  building,
  onSave,
  onDelete,
  onClose,
  onPreviewChange,
}: {
  building: CityBuilding;
  onSave: (patch: CityMapHotspotOverride) => boolean | void | Promise<boolean | void>;
  onDelete: () => void | Promise<void>;
  onClose: () => void;
  onPreviewChange?: (patch: CityMapHotspotOverride | null) => void;
}) {
  const [label, setLabel] = useState(building.label);
  const [sublabel, setSublabel] = useState(building.sublabel);
  const [path, setPath] = useState(building.path);
  const [customPath, setCustomPath] = useState('');
  const [color, setColor] = useState(building.color);
  const [iconId, setIconId] = useState(building.iconId ?? 'store');
  const [cardStyle, setCardStyle] = useState(building.cardStyle ?? 'glass');
  const [pinSize, setPinSize] = useState(building.pinSize ?? 'sm');
  const [pinVariant, setPinVariant] = useState(building.pinVariant ?? 'icon-card');
  const [pinScale, setPinScale] = useState(building.pinScale ?? 1);
  const [showLabel, setShowLabel] = useState(building.showLabel !== false);
  const [saving, setSaving] = useState(false);

  const PreviewIcon = resolveCityIcon(iconId, Store);
  const previewPath = path === '__custom__' ? customPath.trim() : path;
  const sizeMeta = getPinSizeMeta(pinSize);

  const livePatch = useMemo(
    (): CityMapHotspotOverride => ({
      id: building.id,
      label: label.trim() || 'Új zóna',
      sublabel: sublabel.trim() || previewPath || building.path,
      path: previewPath.startsWith('/') ? previewPath : building.path,
      color,
      iconId,
      cardStyle,
      pinSize,
      pinVariant,
      pinScale,
      showLabel,
      top: building.top,
      left: building.left,
      imageTop: building.imageTop,
      imageLeft: building.imageLeft,
    }),
    [
      building.id,
      building.top,
      building.left,
      building.imageTop,
      building.imageLeft,
      building.path,
      label,
      sublabel,
      previewPath,
      color,
      iconId,
      cardStyle,
      pinSize,
      pinVariant,
      pinScale,
      showLabel,
    ],
  );

  useEffect(() => {
    onPreviewChange?.(livePatch);
    return () => onPreviewChange?.(null);
  }, [livePatch, onPreviewChange]);

  async function handleSave() {
    const finalPath = path === '__custom__' ? customPath.trim() : path;
    if (!finalPath.startsWith('/')) return;
    setSaving(true);
    try {
      const ok = await onSave({
        id: building.id,
        label: label.trim() || 'Új zóna',
        sublabel: sublabel.trim() || finalPath,
        path: finalPath,
        color,
        iconId,
        cardStyle,
        pinSize,
        pinVariant,
        pinScale,
        showLabel,
        top: building.top,
        left: building.left,
        imageTop: building.imageTop,
        imageLeft: building.imageLeft,
      });
      if (ok !== false) onClose();
    } finally {
      setSaving(false);
    }
  }

  const panel = (
    <>
      <div
        className="city-map-hotspot-editor-backdrop fixed inset-0 z-[9990] bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="city-map-hotspot-editor fixed right-0 bottom-0 z-[9991] w-full max-w-lg flex flex-col shadow-2xl"
        style={{
          top: 'var(--piac-hotspot-editor-top, 3.25rem)',
          height: 'calc(100dvh - var(--piac-hotspot-editor-top, 3.25rem))',
          background: 'rgba(7,17,31,0.98)',
          borderLeft: '1px solid rgba(0,230,118,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b border-white/8">
          <div>
            <h3 className="text-sm font-black text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Prémium zóna szerkesztő
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">{building.id} · 10×10 stílus katalógus</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
          <div className="rounded-xl border border-[#00E676]/20 bg-[#00E676]/5 p-3">
            <label className="text-[10px] uppercase tracking-wider text-[#00E676]/80 font-bold">Élő előnézet</label>
            <div className="mt-2 flex justify-center py-6 rounded-xl bg-black/30 border border-white/5 min-h-[120px] items-center">
              <CityPinVisual
                Icon={PreviewIcon}
                label={label.trim() || 'Név'}
                sublabel={sublabel.trim() || 'Alcím'}
                color={color}
                glow={colorGlow(color, 0.55)}
                cardStyle={cardStyle}
                pinSize={pinSize}
                pinVariant={pinVariant}
                pinScale={pinScale}
                showLabel={showLabel}
              />
            </div>
            <p className="text-[9px] text-zinc-600 mt-2 text-center">
              {pinVariant} · {cardStyle} · {sizeMeta.label} ({sizeMeta.px}px) · skála {Math.round(pinScale * 100)}%
            </p>
          </div>

          <DevSection title="Alapadatok" subtitle="Név, ikon, link">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Megjelenő név</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676]/40"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Alcím / leírás</label>
              <input
                value={sublabel}
                onChange={(e) => setSublabel(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676]/40"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Ikon (15 prémium)</label>
              <select
                value={iconId}
                onChange={(e) => setIconId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-200 focus:outline-none"
              >
                {CITY_ICON_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Oldal (hova mutasson)</label>
              <select
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-200 focus:outline-none"
              >
                {APP_PAGE_OPTIONS.map((p) => (
                  <option key={p.path} value={p.path}>{p.label} — {p.path}</option>
                ))}
                <option value="__custom__">Egyedi URL…</option>
              </select>
            </div>
            {path === '__custom__' && (
              <input
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="/sajat-oldal"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-200 focus:outline-none"
              />
            )}
          </DevSection>

          <DevSection title="Pin méret & skála" subtitle="10 méret + finomhangolás">
            <DevSizePickerGrid
              label="Alap méret"
              options={CITY_PIN_SIZES}
              value={pinSize}
              onChange={setPinSize}
            />
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Finom skála</label>
                <span className="text-[10px] font-mono text-[#00E676]">{Math.round(pinScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={pinScale}
                onChange={(e) => setPinScale(Number(e.target.value))}
                className="mt-2 w-full accent-[#00E676]"
              />
              <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
                <span>50%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>
          </DevSection>

          <DevSection title="Pin stílus" subtitle="10 prémium megjelenés">
            <DevStylePickerGrid
              label="Megjelenés típusa"
              hint="Pro = prémium"
              options={CITY_PIN_VARIANTS}
              value={pinVariant}
              onChange={setPinVariant}
              columns={2}
            />
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={showLabel}
                onChange={(e) => setShowLabel(e.target.checked)}
                className="rounded border-white/20"
              />
              Címke / alcím megjelenítése
            </label>
          </DevSection>

          <DevSection title="Kártya stílus" subtitle="10 prémium panel — card / stack / ribbon típusoknál">
            <DevStylePickerGrid
              label="Kártya kinézet"
              options={CITY_CARD_STYLES}
              value={cardStyle}
              onChange={setCardStyle}
              columns={2}
            />
          </DevSection>

          <DevSection title="Szín" subtitle="Hex + picker" defaultOpen={false}>
            <div className="flex gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer" />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-200 focus:outline-none"
              />
            </div>
          </DevSection>

          <p className="text-[10px] text-zinc-500 pb-2">
            Pozíció: {building.imageTop ?? building.top} × {building.imageLeft ?? building.left}
            {' '}— sárga fogantyúval húzd a térképen. Mentés után azonnal él.
          </p>
        </div>

        <div className="flex-shrink-0 flex gap-2 px-4 py-3 border-t border-white/10 bg-[#07111f]/95 backdrop-blur-md safe-area-pb">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[#07111f] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #00E676, #00C853)' }}
          >
            <Save className="w-4 h-4" /> {saving ? 'Mentés…' : 'Mentés'}
          </button>
          <button
            type="button"
            onClick={async () => { await onDelete(); onClose(); }}
            className="px-3 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10"
            title="Épület eltávolítása"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
