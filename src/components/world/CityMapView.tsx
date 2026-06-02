import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';
import PiacEditable from '../PiacEditable';
import {
  CITY_BUILDINGS,
  CITY_QUICK_PINS,
  CITY_MAP_IMAGE,
  type CityBuilding,
} from '../../lib/cityMapBuildings';
import CityBuildingHotspot from './CityBuildingHotspot';

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
}) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { config } = useSiteCustomization();
  const { stats } = useLiveWorldStats();

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

  const mapSrc = config.hero.imageUrl || CITY_MAP_IMAGE;

  return (
    <section
      className={`city-map-view relative w-full overflow-hidden ${devModeActive ? 'ring-2 ring-[#00E676]/40 ring-inset' : ''}`}
      style={{ height: 'clamp(100svh, 100dvh, 920px)', minHeight: '560px' }}
    >
      {/* Élő város háttér */}
      <img
        src={mapSrc}
        alt="PiacPro digitális város"
        data-piac-edit="hero.imageUrl"
        className={`city-map-bg absolute inset-0 w-full h-full object-cover object-center ${devModeActive ? 'piac-editable' : ''}`}
        style={{
          filter: `brightness(${config.hero.brightness ?? 1.05}) saturate(${config.hero.saturation ?? 1.08})`,
        }}
        fetchPriority="high"
      />

      {/* Minimális alsó átmenet — a térkép dominál */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(7,17,31,0.92) 0%, transparent 18%), linear-gradient(to bottom, rgba(7,17,31,0.35) 0%, transparent 12%)',
        }}
      />

      {/* Finom cím — nem takarja a várost */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="absolute top-3 sm:top-5 inset-x-0 z-10 flex flex-col items-center pointer-events-none px-4"
      >
        <PiacEditable
          editKey="hero.title"
          as="p"
          className="text-[10px] sm:text-xs font-black tracking-[0.28em] uppercase text-center text-white/70 pointer-events-auto"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
        >
          {config.hero.title}
        </PiacEditable>
      </motion.div>

      {/* Épület hotspotok */}
      <div className="absolute inset-0 z-20">
        {CITY_BUILDINGS.map((b, i) => (
          <CityBuildingHotspot
            key={b.id}
            building={b}
            count={getCount(b, counts)}
            ready={ready}
            index={i}
            onClick={() => navigate(b.path)}
          />
        ))}
      </div>

      {/* Gyors műveletek — lebegő ikonok (nem panel) */}
      <div className="absolute inset-0 z-[25] pointer-events-none">
        {CITY_QUICK_PINS.map((pin) => {
          const Icon = pin.icon;
          const target = pin.path === '/profile' && user ? `/profile/${user.id}` : pin.path;
          return (
            <motion.button
              key={pin.id}
              type="button"
              onClick={() => navigate(target)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={ready ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4 + CITY_BUILDINGS.length * 0.03 }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.95 }}
              className="city-quick-pin pointer-events-auto absolute flex items-center justify-center rounded-full"
              style={{
                top: pin.top,
                left: pin.left,
                transform: 'translate(-50%, -50%)',
                width: '2.25rem',
                height: '2.25rem',
                background: 'rgba(7,17,31,0.75)',
                border: `1px solid ${pin.color}55`,
                boxShadow: `0 0 16px ${pin.color}33`,
              }}
              title={pin.label}
              aria-label={pin.label}
            >
              <Icon className="w-4 h-4" style={{ color: pin.color }} />
            </motion.button>
          );
        })}
      </div>

      {/* Élő stat — egy sor, alul, minimális */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 sm:bottom-6 inset-x-4 z-30 flex justify-center pointer-events-none"
      >
        <div
          className="city-live-strip inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 rounded-2xl text-[10px] sm:text-[11px] text-zinc-400 backdrop-blur-md pointer-events-none"
          style={{
            background: 'rgba(7,17,31,0.55)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span><strong className="text-[#00E676]">{stats.loading ? '…' : stats.listings.toLocaleString('hu-HU')}</strong> hirdetés</span>
          <span className="hidden sm:inline text-zinc-700">·</span>
          <span><strong className="text-purple-300">{stats.loading ? '…' : stats.auctions.toLocaleString('hu-HU')}</strong> licit</span>
          <span className="hidden sm:inline text-zinc-700">·</span>
          <span><strong className="text-sky-300">{stats.loading ? '…' : stats.jobs.toLocaleString('hu-HU')}</strong> állás</span>
        </div>
      </motion.div>
    </section>
  );
}
