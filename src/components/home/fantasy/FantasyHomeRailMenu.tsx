import type { WorldZone } from '../../../lib/worldZones';

interface FantasyHomeRailMenuProps {
  zones: WorldZone[];
  onNavigate: (path: string) => void;
  activeId?: string | null;
}

export default function FantasyHomeRailMenu({ zones, onNavigate, activeId }: FantasyHomeRailMenuProps) {
  return (
    <nav className="fantasy-home-rail" aria-label="PiacPro zónák">
      <p className="fantasy-home-rail__label">Válassz zónát</p>
      <ul className="fantasy-home-rail__list">
        {zones.map((zone, index) => {
          const Icon = zone.icon;
          const active = activeId === zone.id;
          return (
            <li key={zone.id}>
              <button
                type="button"
                onClick={() => onNavigate(zone.path)}
                className={`fantasy-home-rail__item ${active ? 'fantasy-home-rail__item--active' : ''}`}
                style={{
                  ['--zone-color' as string]: zone.color,
                  ['--zone-glow' as string]: zone.glow,
                  animationDelay: `${index * 55}ms`,
                }}
              >
                <span className="fantasy-home-rail__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="fantasy-home-rail__icon" aria-hidden>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="fantasy-home-rail__text">
                  <span className="fantasy-home-rail__title">{zone.label}</span>
                  <span className="fantasy-home-rail__sub">{zone.subtitle}</span>
                </span>
                <span className="fantasy-home-rail__chev" aria-hidden>›</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
