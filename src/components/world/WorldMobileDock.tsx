import { Leaf, Heart, Layers } from 'lucide-react';
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

  const quickSecondary = [
    { label: 'Termelők', path: '/producers', icon: Leaf, color: '#4ADE80' },
    { label: 'Adomány', path: '/donations', icon: Heart, color: '#F472B6' },
  ];

  return (
    <nav className="world-mobile-dock md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="world-dock-more-strip flex items-stretch border-b border-white/5 min-h-[36px]">
        {quickSecondary.map((item) => {
          const Icon = item.icon;
          const active = path === item.path || path.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold min-h-[36px] ${
                active ? 'text-emerald-300 bg-emerald-500/10' : 'text-zinc-500'
              }`}
              style={active ? { color: item.color } : undefined}
            >
              <Icon className="w-3 h-3" />
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenSecondary}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-zinc-500 min-h-[36px] border-l border-white/5"
        >
          <Layers className="w-3 h-3 text-purple-400" />
          Több
        </button>
      </div>
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
