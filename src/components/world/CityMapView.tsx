import { useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Pencil, ImageUp, Loader2 } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';
import { CityMapBoundsProvider } from '../../contexts/CityMapBoundsContext';
import { uploadSiteAsset } from '../../lib/uploadSiteAsset';
import {
  CITY_BUILDINGS,
  applyCityMapOverrides,
  mergeCityBuildingPreview,
  type CityBuilding,
} from '../../lib/cityMapBuildings';
import type { CityMapHotspotOverride } from '../../lib/cityMapPages';
import CityBuildingHotspot from './CityBuildingHotspot';
import CityMapHotspotEditor from './CityMapHotspotEditor';
import WorldQuickAccessSidebar from './WorldQuickAccessSidebar';
import WorldLiveStatsSidebar from './WorldLiveStatsSidebar';
import HomeMountainEngraving from './HomeMountainEngraving';

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
  const [editorPreview, setEditorPreview] = useState<CityMapHotspotOverride | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [uploadingMap, setUploadingMap] = useState(false);
  const mapFileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);

  const bindStageRef = useCallback((node: HTMLDivElement | null) => {
    stageRef.current = node;
    setStageEl(node);
  }, []);

  const editMode = devModeActive && canEdit;

  const buildings = useMemo(() => {
    let list = applyCityMapOverrides(CITY_BUILDINGS, config.cityMapHotspots ?? []);
    if (editorPreview) {
      const idx = list.findIndex((b) => b.id === editorPreview.id);
      if (idx >= 0) {
        list = list.map((b, i) => (i === idx ? mergeCityBuildingPreview(b, editorPreview) : b));
      } else if (editBuilding?.id === editorPreview.id) {
        list = [...list, mergeCityBuildingPreview(editBuilding, editorPreview)];
      }
    }
    return list;
  }, [config.cityMapHotspots, editorPreview, editBuilding]);

  const legacyPositionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const o of config.cityMapHotspots ?? []) {
      if ((o.top || o.left) && o.imageTop == null && o.imageLeft == null) ids.add(o.id);
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

  return (
    <section
      className={`world-home-immersive relative w-full min-h-[100dvh] ${devModeActive ? 'dev-mode-active-map' : ''}`}
    >
      {editMode && createPortal(
        <div
          className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[9980] flex flex-wrap gap-2 justify-center max-w-3xl px-1"
          data-dev-map-tool
        >
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
        </div>,
        document.body,
      )}

      <CityMapBoundsProvider stage={stageEl}>
      <div ref={bindStageRef} className="city-map-stage world-home-stage relative w-full min-h-[100dvh]">
        <HomeMountainEngraving ready={ready} />

        <div className="city-map-side-left fixed left-3 xl:left-5 top-[5.5rem] xl:top-24 bottom-28 z-[35] hidden lg:flex flex-col justify-start w-[188px] pointer-events-none">
          <div className="pointer-events-auto max-h-full overflow-y-auto scrollbar-none">
            <WorldQuickAccessSidebar />
          </div>
        </div>

        <div className="city-map-side-right fixed right-3 xl:right-5 top-[5.5rem] xl:top-24 z-[35] hidden lg:block w-[188px] pointer-events-auto max-h-[calc(100dvh-8rem)] overflow-y-auto scrollbar-none">
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
              isLivePreview={editBuilding?.id === b.id && !!editorPreview}
              onPositionChange={
                editMode
                  ? async (pos) => {
                      await upsertOverride({ id: b.id, ...pos }, 'Pozíció mentve.');
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {addMode && editMode && (
          <div className="absolute inset-0 z-[40] cursor-crosshair" onClick={handleMapClick} />
        )}
      </div>
      </CityMapBoundsProvider>

      {editBuilding && editMode && (
        <CityMapHotspotEditor
          building={editBuilding}
          onSave={(patch) => upsertOverride(patch)}
          onDelete={() => deleteBuilding(editBuilding.id)}
          onClose={() => {
            setEditBuilding(null);
            setEditorPreview(null);
          }}
          onPreviewChange={setEditorPreview}
        />
      )}
    </section>
  );
}
