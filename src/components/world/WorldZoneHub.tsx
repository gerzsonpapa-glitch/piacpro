import { Layers } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { PRIMARY_WORLD_ZONES, getLiveCountForZone } from '../../lib/worldZones';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';
import ZonePortalCard from './ZonePortalCard';

export default function WorldZoneHub({
  onNavigate,
  onOpenSecondary,
}: {
  onNavigate?: () => void;
  onOpenSecondary?: () => void;
}) {
  const { navigate } = useRouter();
  const { stats } = useLiveWorldStats();

  function go(path: string) {
    navigate(path);
    onNavigate?.();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-400/80">Fő modulok</p>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Mindennapi elnevezések — kattints és indulj</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {PRIMARY_WORLD_ZONES.map((zone, i) => (
          <ZonePortalCard
            key={zone.id}
            zone={zone}
            count={getLiveCountForZone(zone, stats)}
            loading={stats.loading}
            index={i}
            onClick={() => go(zone.path)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onOpenSecondary?.()}
        className="world-more-worlds-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-zinc-300"
      >
        <Layers className="w-4 h-4 text-purple-400" />
        További lehetőségek
      </button>
    </div>
  );
}
