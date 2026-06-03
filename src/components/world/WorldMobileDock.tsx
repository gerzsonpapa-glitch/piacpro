import { Layers } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { PRIMARY_WORLD_ZONES } from '../../lib/worldZones';

export default function WorldMobileDock({
  onOpenSecondary,
}: {
  onOpenSecondary: () => void;
}) {
  const { navigate, path } = useRouter();

  function isActive(zonePath: string, paths: string[]) {
    if (zonePath === path) return true;
    return paths.some((p) => path === p || path.startsWith(p + '/'));
  }

  return (
    <nav className="world-mobile-dock md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <button
        type="button"
        onClick={onOpenSecondary}
        className="world-dock-more-strip w-full py-1.5 text-[10px] font-semibold text-zinc-500 flex items-center justify-center gap-1.5 border-b border-white/5"
      >
        <Layers className="w-3 h-3 text-purple-400" />
        További világok
      </button>
      <div className="flex items-stretch min-h-[56px] h-[56px]">
        {PRIMARY_WORLD_ZONES.map((zone) => {
          const Icon = zone.icon;
          const active = isActive(zone.path, zone.paths);
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => navigate(zone.path)}
              className={`world-dock-item flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 px-0.5 min-h-[44px] ${active ? 'world-dock-item-active' : ''}`}
              style={active ? { color: zone.color } : undefined}
              aria-label={zone.label}
            >
              <Icon
                className="w-[1.15rem] h-[1.15rem] flex-shrink-0"
                style={active ? { filter: `drop-shadow(0 0 8px ${zone.glow})` } : undefined}
              />
              <span className="text-[9px] sm:text-[10px] font-semibold truncate max-w-full leading-tight">{zone.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
