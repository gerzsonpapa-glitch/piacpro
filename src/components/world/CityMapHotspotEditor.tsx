import { useMemo, useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import {
  APP_PAGE_OPTIONS,
  CITY_CARD_STYLES,
  CITY_ICON_OPTIONS,
  type CityMapHotspotOverride,
} from '../../lib/cityMapPages';
import type { CityBuilding } from '../../lib/cityMapBuildings';
import { resolveCityIcon } from '../../lib/cityMapIcons';
import { getBuildingCardPresentation } from '../../lib/cityMapCardStyles';
import { Store } from 'lucide-react';

export default function CityMapHotspotEditor({
  building,
  onSave,
  onDelete,
  onClose,
}: {
  building: CityBuilding;
  onSave: (patch: CityMapHotspotOverride) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(building.label);
  const [sublabel, setSublabel] = useState(building.sublabel);
  const [path, setPath] = useState(building.path);
  const [customPath, setCustomPath] = useState('');
  const [color, setColor] = useState(building.color);
  const [iconId, setIconId] = useState(building.iconId ?? 'store');
  const [cardStyle, setCardStyle] = useState(building.cardStyle ?? 'glass');
  const [saving, setSaving] = useState(false);

  const PreviewIcon = resolveCityIcon(iconId, Store);
  const preview = useMemo(
    () => getBuildingCardPresentation(cardStyle, color),
    [cardStyle, color],
  );

  async function handleSave() {
    const finalPath = path === '__custom__' ? customPath.trim() : path;
    if (!finalPath.startsWith('/')) return;
    setSaving(true);
    await onSave({
      id: building.id,
      label: label.trim() || 'Új zóna',
      sublabel: sublabel.trim() || finalPath,
      path: finalPath,
      color,
      iconId,
      cardStyle,
      top: building.top,
      left: building.left,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="city-map-hotspot-editor fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/75" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ background: 'rgba(7,17,31,0.98)', border: '1px solid rgba(0,230,118,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-zinc-100">Épület szerkesztése</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        </div>

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
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Ikon</label>
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
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Előnézet</label>
          <div className="mt-2 flex justify-center py-4 rounded-xl bg-black/30 border border-white/5">
            <div
              className={`flex items-start rounded-2xl text-left ${preview.cardClass} ${cardStyle === 'minimal' ? 'px-2 py-2 gap-2' : cardStyle === 'bold' ? 'px-4 py-4 gap-3.5' : 'px-3.5 py-3 gap-3'}`}
              style={preview.buttonStyle}
            >
              <span className={`flex items-center justify-center flex-shrink-0 ${preview.iconWrapClass}`} style={preview.iconWrapStyle}>
                <PreviewIcon className={cardStyle === 'minimal' ? 'w-3.5 h-3.5' : cardStyle === 'bold' ? 'w-6 h-6' : 'w-5 h-5'} style={{ color }} />
              </span>
              <span className="flex flex-col min-w-0 pt-0.5">
                <span className={preview.labelClass} style={{ color, '--neon-color': color } as React.CSSProperties}>
                  {label.trim() || 'Név'}
                </span>
                <span className={preview.sublabelClass}>{sublabel.trim() || 'Alcím'}</span>
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Kártya stílus</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CITY_CARD_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCardStyle(s.id)}
                className={`px-3 py-2 rounded-xl text-left text-xs border transition-all ${cardStyle === s.id ? 'border-[#00E676]/50 bg-[#00E676]/10 text-[#00E676]' : 'border-white/10 text-zinc-400 hover:border-white/20'}`}
              >
                <span className="font-bold block">{s.label}</span>
                <span className="text-[10px] opacity-70">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Szín</label>
          <div className="mt-1 flex gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer" />
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-200 focus:outline-none"
            />
          </div>
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

        <p className="text-[10px] text-zinc-500">
          Pozíció: {building.top} × {building.left} — a fogantyúval húzd az épületet a térképen.
        </p>

        <div className="flex gap-2 pt-1">
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
    </div>
  );
}
