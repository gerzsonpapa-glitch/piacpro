import { useRouter } from '../../lib/router';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';
import { CITY_BUILDINGS, applyCityMapOverrides, type CityBuilding } from '../../lib/cityMapBuildings';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';

function getCount(building: CityBuilding, counts: Record<string, number>): number | undefined {
  if (!building.countKey) return undefined;
  return counts[building.countKey] ?? 0;
}

/** Mobilon — gyors húzható negyedlista a városkép alatt. */
export default function CityMobileDistrictRail() {
  const { navigate } = useRouter();
  const { config } = useSiteCustomization();
  const { stats } = useLiveWorldStats();

  const buildings = applyCityMapOverrides(CITY_BUILDINGS, config.cityMapHotspots ?? []);
  const counts = {
    listing: stats.listings,
    auction: stats.auctions,
    job: stats.jobs,
    donations: stats.donations,
    producers: stats.producers,
    shops: stats.shops,
  };

  return (
    <div className="city-mobile-district-rail md:hidden pointer-events-auto">
      <p className="city-mobile-district-rail__label">Negyedek</p>
      <div className="city-mobile-district-rail__scroll scrollbar-none">
        {buildings.map((b) => {
          const Icon = b.icon;
          const count = getCount(b, counts);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => navigate(b.path)}
              className="city-mobile-district-chip"
              style={{
                ['--chip-color' as string]: b.color,
                ['--chip-glow' as string]: b.glow,
              }}
              aria-label={`${b.label} — ${b.sublabel}`}
            >
              <span className="city-mobile-district-chip__icon">
                <Icon className="w-4 h-4" style={{ color: b.color }} />
              </span>
              <span className="city-mobile-district-chip__text">
                <span className="city-mobile-district-chip__title">{b.label}</span>
                {count !== undefined && (
                  <span className="city-mobile-district-chip__meta">{count.toLocaleString('hu-HU')}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
