import { motion } from 'framer-motion';
import { useRouter } from '../../lib/router';
import { WORLD_ZONES, type WorldZone } from '../../lib/worldZones';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';
import { ArrowRight } from 'lucide-react';

function zoneCount(zone: WorldZone, stats: ReturnType<typeof useLiveWorldStats>['stats']) {
  switch (zone.id) {
    case 'marketplace': return stats.listings;
    case 'auction': return stats.auctions;
    case 'jobs': return stats.jobs;
    case 'donations': return stats.donations;
    case 'producers': return stats.producers;
    case 'business': return stats.shops;
    default: return 0;
  }
}

export default function WorldZoneHub({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { navigate } = useRouter();
  const { stats } = useLiveWorldStats();

  function go(path: string) {
    navigate(path);
    onNavigate?.();
  }

  return (
    <div className={compact ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
      {!compact && (
        <div className="sm:col-span-2 mb-1">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-400/70">Világ zónák</p>
          <p className="text-xs text-zinc-500 mt-0.5">Válassz területet — minden zóna egy élő közösség</p>
        </div>
      )}
      {WORLD_ZONES.map((zone, i) => {
        const Icon = zone.icon;
        const count = zoneCount(zone, stats);
        return (
          <motion.button
            key={zone.id}
            type="button"
            onClick={() => go(zone.path)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`world-zone-portal text-left w-full ${compact ? 'p-3' : 'p-4'}`}
            style={{
              ['--zone-color' as string]: zone.color,
              ['--zone-glow' as string]: zone.glow,
              ['--zone-border' as string]: zone.border,
              background: zone.gradient,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: zone.bg, border: `1px solid ${zone.border}`, boxShadow: `0 0 20px ${zone.glow}` }}
              >
                <Icon className="w-5 h-5" style={{ color: zone.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px]">{zone.emoji}</span>
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: zone.color }}>
                    {zone.title}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{zone.subtitle}</p>
                {!stats.loading && count > 0 && (
                  <p className="text-[10px] font-bold mt-1" style={{ color: zone.color }}>
                    {count.toLocaleString('hu-HU')} élő
                  </p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
