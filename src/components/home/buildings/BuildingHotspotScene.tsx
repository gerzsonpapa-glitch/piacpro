import { useState } from 'react';
import type { HomeVariantId } from '../../../lib/homeVariants';
import type { BuildingHotspotLayout, BuildingSceneLayout } from '../../../lib/homeBuildingLayouts';
import { ZONE_FACADE_IMAGES } from '../../../lib/homeBuildingLayouts';
import { findFantasyZone } from '../fantasy/fantasyHomeZones';

interface BuildingHotspotSceneProps {
  variant: Exclude<HomeVariantId, 'city' | 'fantasy'>;
  layout: BuildingSceneLayout;
  onNavigate: (path: string) => void;
}

function Hotspot({
  spot,
  variant,
  active,
  onEnter,
  onLeave,
  onClick,
}: {
  spot: BuildingHotspotLayout;
  variant: Exclude<HomeVariantId, 'city' | 'fantasy'>;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const zone = findFantasyZone(spot.zoneId);
  if (!zone) return null;

  const facade = ZONE_FACADE_IMAGES[spot.zoneId] ?? zone.path;

  return (
    <button
      type="button"
      className={`building-hotspot building-hotspot--${variant} ${active ? 'building-hotspot--active' : ''}`}
      style={{
        top: spot.top,
        left: spot.left,
        width: spot.width,
        height: spot.height,
        clipPath: spot.clipPath,
        zIndex: spot.zIndex ?? 2,
        ['--zone-color' as string]: zone.color,
        ['--zone-glow' as string]: zone.glow,
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onClick}
      aria-label={`${zone.title} — ${zone.subtitle}`}
    >
      <span
        className="building-hotspot__facade"
        style={{
          backgroundImage: `url(${facade})`,
          backgroundPosition: spot.objectPosition ?? 'center 40%',
        }}
      />
      <span className="building-hotspot__roof" aria-hidden />
      <span className="building-hotspot__sign">
        <span className="building-hotspot__sign-title">{zone.label}</span>
        <span className="building-hotspot__sign-sub">{zone.subtitle}</span>
      </span>
      <span className="building-hotspot__pulse" aria-hidden />
    </button>
  );
}

export default function BuildingHotspotScene({ variant, layout, onNavigate }: BuildingHotspotSceneProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeZone = activeId ? findFantasyZone(activeId) : null;

  return (
    <div className={`building-scene building-scene--${variant}`}>
      <div className="building-scene__sky" aria-hidden />
      <picture className="building-scene__bg">
        <source srcSet={layout.sceneBg.webp} type="image/webp" />
        <img
          src={layout.sceneBg.jpg}
          alt=""
          className="building-scene__bg-img"
          style={{ objectPosition: layout.objectPosition ?? 'center 45%' }}
          draggable={false}
        />
      </picture>
      <div className="building-scene__overlay" aria-hidden />
      <div className="building-scene__hotspots">
        {layout.hotspots.map((spot) => (
          <Hotspot
            key={spot.zoneId}
            spot={spot}
            variant={variant}
            active={activeId === spot.zoneId}
            onEnter={() => setActiveId(spot.zoneId)}
            onLeave={() => setActiveId(null)}
            onClick={() => onNavigate(findFantasyZone(spot.zoneId)?.path ?? '/search')}
          />
        ))}
      </div>
      {activeZone && (
        <div
          className="building-scene__tooltip"
          style={{ ['--zone-color' as string]: activeZone.color }}
        >
          <strong>{activeZone.title}</strong>
          <span>{activeZone.subtitle}</span>
        </div>
      )}
      <p className="building-scene__hint">Kattints egy épületre vagy standra a belépéshez</p>
    </div>
  );
}
