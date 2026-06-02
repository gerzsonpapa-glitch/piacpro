import { useMemo, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, ImageUp, Loader2, Search } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { CityMapBoundsProvider } from '../../contexts/CityMapBoundsContext';
import { uploadSiteAsset } from '../../lib/uploadSiteAsset';
import PiacEditable from '../PiacEditable';
import {
  CITY_BUILDINGS,
  applyCityMapOverrides,
  type CityBuilding,
} from '../../lib/cityMapBuildings';
import type { CityMapHotspotOverride } from '../../lib/cityMapPages';
import CityBuildingHotspot from './CityBuildingHotspot';
import CityMapHotspotEditor from './CityMapHotspotEditor';
import CityMainSquare from './CityMainSquare';
import WorldQuickAccessSidebar from './WorldQuickAccessSidebar';
import WorldLiveStatsSidebar from './WorldLiveStatsSidebar';
import PiacAIHomeWidget from './PiacAIHomeWidget';

function getCount(
  building: CityBuilding,
  counts: Record<string, number>,
): number | undefined {
  if (!building.countKey) return undefined;
  return counts[building.countKey] ?? 0;
}

export default function CityMapView({
  ready = true,
  devModeActive = false,
}: {
  ready?: boolean;
  devModeActive?: boolean;
  bottomDock?: React.ReactNode;
}) {
  const { navigate } = useRouter();
  const { config, canEdit, saveConfig } = useSiteCustomization();
  const { showToast } = useNotification();
  const { stats } = useLiveWorldStats();
  const [editBuilding, setEditBuilding] = useState<CityBuilding | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const mapFileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  const bindStageRef = useCallback((node: HTMLDivElement | null) => {
    stageRef.current = node;
    setStageEl(node);
  }, []);

  const editMode = devModeActive && canEdit;

  const buildings = useMemo(
    () => applyCityMapOverrides(CITY_BUILDINGS, config.cityMapHotspots ?? []),
    [config.cityMapHotspots],
  );

  const legacyPositionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const o of config.cityMapHotspots ?? []) {
      if (o.top || o.left) ids.add(o.id);
    }
    return ids;
  }, [config.cityMapHotspots]);

  const counts = useMemo(
    () => ({
      listing: stats.listings,
      auction: stats.auctions,
      job: stats.jobs,
      donations: stats.donations,
      producers: stats.producers,
      shops: stats.shops,
    }),
    [stats],
  );

  const upsertOverride = useCallback(
    async (patch: CityMapHotspotOverride, successMsg = 'Zóna mentve.') => {
      const list = [...(config.cityMapHotspots ?? [])];
      const idx = list.findIndex((o) => o.id === patch.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...patch };
      else list.push(patch);
      const { error, usedLocalFallback } = await saveConfig({ ...config, cityMapHotspots: list });
      if (error) {
        showToast('error', 'Mentés sikertelen', error);
        return false;
      }
      showToast(
        'success',
        'Mentve',
        usedLocalFallback ? `${successMsg} (helyi mentés)` : successMsg,
      );
      return true;
    },
    [config, saveConfig, showToast],
  );

  const deleteBuilding = useCallback(
    async (id: string) => {
      let list = [...(config.cityMapHotspots ?? [])];
      if (id.startsWith('custom-')) {
        list = list.filter((o) => o.id !== id);
      } else {
        const idx = list.findIndex((o) => o.id === id);
        if (idx >= 0) list[idx] = { ...list[idx], hidden: true };
        else list.push({ id, hidden: true });
      }
      const { error } = await saveConfig({ ...config, cityMapHotspots: list });
      if (error) showToast('error', 'Törlés sikertelen', error);
      else showToast('success', 'Eltávolítva', 'A zóna elrejtve.');
      setEditBuilding(null);
    },
    [config, saveConfig, showToast],
  );

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!addMode || !editMode || !stageRef.current) return;
    e.stopPropagation();
    const rect = stageRef.current.getBoundingClientRect();
    const top = `${Math.max(4, Math.min(96, Math.round(((e.clientY - rect.top) / rect.height) * 100)))}%`;
    const left = `${Math.max(4, Math.min(96, Math.round(((e.clientX - rect.left) / rect.width) * 100)))}%`;
    const id = `custom-${Date.now()}`;
    setEditBuilding({
      id,
      label: 'Új zóna',
      sublabel: 'Új épület',
      path: '/search',
      icon: CITY_BUILDINGS[0].icon,
      color: '#00C896',
      glow: 'rgba(0,200,150,0.4)',
      top,
      left,
      tier: 'secondary',
      cardStyle: 'glass',
      iconId: 'store',
    });
    setAddMode(false);
  }

  async function replaceMapImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMap(true);
    const { url, error } = await uploadSiteAsset(file);
    setUploadingMap(false);
    e.target.value = '';
    if (error) {
      showToast('error', 'Kép feltöltés', error);
      return;
    }
    if (!url) return;
    const { error: saveErr, usedLocalFallback } = await saveConfig({
      ...config,
      hero: { ...config.hero, imageUrl: url },
      media: { ...config.media, ambientBgUrl: url },
    });
    if (saveErr) showToast('error', 'Mentés sikertelen', saveErr);
    else {
      showToast('success', 'Városkép frissítve', usedLocalFallback ? 'Helyi mentés' : 'A teljes képernyős háttér mentve.');
    }
  }

  function handleWorldSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/discover?q=${encodeURIComponent(searchQ.trim())}`);
  }

  return (
    <section
      className={`world-home-immersive relative w-full min-h-[100dvh] ${devModeActive ? 'ring-2 ring-[#00E676]/30 ring-inset' : ''}`}
    >
      {editMode && (
        <div className="absolute top-3 inset-x-3 z-[125] flex flex-wrap gap-2 justify-center" data-dev-map-tool>
          <button
            type="button"
            onClick={() => setAddMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border backdrop-blur-md transition-all ${addMode ? 'bg-[#00E676]/20 border-[#00E676]/50 text-[#00E676]' : 'bg-black/50 border-white/15 text-zinc-300'}`}
          >
            <Plus className="w-3.5 h-3.5" />
            {addMode ? 'Kattints a világra…' : 'Új zóna'}
          </button>
          <button
            type="button"
            onClick={() => mapFileRef.current?.click()}
            disabled={uploadingMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border bg-black/50 border-white/15 text-zinc-300 backdrop-blur-md"
          >
            {uploadingMap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageUp className="w-3.5 h-3.5" />}
            Háttér cseréje
          </button>
          <button
            type="button"
            data-piac-edit="hero.imageUrl"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border bg-black/50 border-violet-500/35 text-violet-200 backdrop-blur-md piac-editable"
          >
            <Pencil className="w-3.5 h-3.5" />
            Háttér URL
          </button>
          <button
            type="button"
            data-piac-edit="nav.searchPlaceholder"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border bg-black/50 border-violet-500/35 text-violet-200 backdrop-blur-md piac-editable"
          >
            Kereső szöveg
          </button>
          <button
            type="button"
            onClick={async () => {
              const { error } = await saveConfig({
                ...config,
                hero: { ...config.hero, imageUrl: '/zones/hub.jpg' },
                media: { ...config.media, ambientBgUrl: '/zones/hub.jpg' },
              });
              if (error) showToast('error', 'Mentés sikertelen', error);
              else showToast('success', 'Alap háttér', 'A beépített városkép visszaállítva.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border bg-black/50 border-amber-500/35 text-amber-200 backdrop-blur-md"
          >
            Alap háttér
          </button>
          <input ref={mapFileRef} type="file" accept="image/*" className="hidden" onChange={replaceMapImage} />
          <span className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/50 border border-amber-500/30 text-[10px] text-amber-300 backdrop-blur-md">
            <Pencil className="w-3 h-3" /> Fogantyú = húzás
          </span>
        </div>
      )}

      <CityMapBoundsProvider stage={stageEl}>
      <div ref={bindStageRef} className="city-map-stage world-home-stage relative w-full min-h-[100dvh]">
        <CityMainSquare ready={ready} />

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          className="city-map-hero-head absolute top-2 sm:top-3 md:top-5 left-1/2 -translate-x-1/2 z-30 text-center px-3 sm:px-4 w-full max-w-xl pointer-events-none"
        >
          <PiacEditable
            editKey="hero.title"
            as="h1"
            className="text-[10px] sm:text-xs font-black tracking-[0.14em] sm:tracking-[0.18em] uppercase text-white/85 pointer-events-auto line-clamp-2"
          >
            {config.hero.title}
          </PiacEditable>
          <PiacEditable
            editKey="hero.subtitle"
            as="p"
            className="hidden sm:block text-[10px] sm:text-[11px] text-zinc-400/90 mt-1 pointer-events-auto max-w-md mx-auto leading-relaxed line-clamp-2"
          >
            {config.hero.subtitle}
          </PiacEditable>

          <form onSubmit={handleWorldSearch} className="pointer-events-auto mt-2 sm:mt-3 md:mt-4 max-w-md mx-auto">
            <div className="piac-city-search relative flex items-center rounded-xl sm:rounded-2xl overflow-hidden">
              <Search className="absolute left-3 sm:left-3.5 w-3.5 sm:w-4 h-3.5 sm:h-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={config.nav.searchPlaceholder || 'Mit keresel a városban?'}
                className="w-full bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none pl-9 sm:pl-10 pr-11 sm:pr-12 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm min-w-0"
              />
              <button
                type="submit"
                className="absolute right-1 sm:right-1.5 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform piac-city-search-btn"
                aria-label="Keresés indítása"
              >
                <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </form>
        </motion.div>

        <div className="absolute left-3 md:left-5 top-16 bottom-36 xl:bottom-32 z-20 hidden lg:flex flex-col justify-start w-[188px] pointer-events-none">
          <div className="pointer-events-auto max-h-full overflow-y-auto scrollbar-none">
            <WorldQuickAccessSidebar />
          </div>
        </div>

        <div className="absolute right-3 md:right-5 top-16 z-20 hidden lg:block w-[188px] pointer-events-auto">
          <WorldLiveStatsSidebar />
        </div>

        <div className="city-map-pins absolute inset-0 z-10">
          {buildings.map((b, i) => (
            <CityBuildingHotspot
              key={b.id}
              building={b}
              count={getCount(b, counts)}
              ready={ready}
              index={i}
              editMode={editMode}
              addMode={addMode}
              useLegacyPosition={legacyPositionIds.has(b.id)}
              onEdit={() => setEditBuilding(b)}
              onClick={() => navigate(b.path)}
              onPositionChange={
                editMode
                  ? async (top, left) => {
                      await upsertOverride({ id: b.id, top, left }, 'Pozíció mentve.');
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {addMode && editMode && (
          <div className="absolute inset-0 z-[40] cursor-crosshair" onClick={handleMapClick} />
        )}

        <div className="city-map-ai-slot absolute bottom-5 sm:bottom-6 md:bottom-8 left-3 sm:left-auto sm:right-3 md:right-5 z-20 pointer-events-auto">
          <PiacAIHomeWidget compact={isMobile} />
        </div>
      </div>
      </CityMapBoundsProvider>

      {editBuilding && editMode && (
        <CityMapHotspotEditor
          building={editBuilding}
          onSave={async (patch) => {
            const ok = await upsertOverride(patch);
            if (ok) setEditBuilding(null);
          }}
          onDelete={() => deleteBuilding(editBuilding.id)}
          onClose={() => setEditBuilding(null)}
        />
      )}
    </section>
  );
}
