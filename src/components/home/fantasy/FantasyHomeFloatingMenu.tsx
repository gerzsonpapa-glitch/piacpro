import type { WorldZone } from '../../../lib/worldZones';
import { FANTASY_FLOATING_SPOTS, findFantasyZone } from './fantasyHomeZones';

interface FantasyHomeFloatingMenuProps {
  onNavigate: (path: string) => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

export default function FantasyHomeFloatingMenu({ onNavigate, hoveredId, onHover }: FantasyHomeFloatingMenuProps) {
  return (
    <div className="fantasy-home-float-layer" aria-label="Interaktív zóna térkép">
      {FANTASY_FLOATING_SPOTS.map((spot, index) => {
        const zone = findFantasyZone(spot.zoneId);
        if (!zone) return null;
        const Icon = zone.icon;
        const hot = hoveredId === zone.id;
        return (
          <button
            key={zone.id}
            type="button"
            className={`fantasy-home-blip ${hot ? 'fantasy-home-blip--hot' : ''}`}
            style={{
              top: spot.top,
              left: spot.left,
              ['--zone-color' as string]: zone.color,
              ['--zone-glow' as string]: zone.glow,
              transform: `translate(-50%, -50%) scale(${spot.scale ?? 1})`,
              animationDelay: `${index * 80}ms`,
            }}
            onClick={() => onNavigate(zone.path)}
            onMouseEnter={() => onHover(zone.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(zone.id)}
            onBlur={() => onHover(null)}
          >
            <span className="fantasy-home-blip__ring" aria-hidden />
            <span className="fantasy-home-blip__core">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="fantasy-home-blip__tag">{zone.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FantasyHomeFloatPreview({ zone }: { zone: WorldZone | null }) {
  if (!zone) {
    return (
      <div className="fantasy-home-float-preview fantasy-home-float-preview--idle">
        <p className="fantasy-home-float-preview__hint">Vidd fölé az egeret egy zónára — vagy kattints belépéshez</p>
      </div>
    );
  }

  const Icon = zone.icon;
  return (
    <div
      className="fantasy-home-float-preview"
      style={{ ['--zone-color' as string]: zone.color, ['--zone-glow' as string]: zone.glow }}
    >
      <div className="fantasy-home-float-preview__icon">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="fantasy-home-float-preview__title">{zone.title}</p>
        <p className="fantasy-home-float-preview__sub">{zone.subtitle}</p>
      </div>
    </div>
  );
}
