import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { useRouter } from '../../lib/router';
import { useSEO, SEO_PAGES } from '../../lib/seo';
import HomeIntentBar from '../../components/world/HomeIntentBar';
import BuildingHotspotScene from '../../components/home/buildings/BuildingHotspotScene';
import { HOME_BUILDING_LAYOUTS } from '../../lib/homeBuildingLayouts';
import { getHomeVariantMeta, type HomeVariantId } from '../../lib/homeVariants';

const IMMERSIVE_BUILDING_VARIANTS = [
  'isometric',
  'neon',
  'medieval',
  'blueprint',
  'postcard',
  'nightmarket',
] as const;

type BuildingVariant = (typeof IMMERSIVE_BUILDING_VARIANTS)[number];

function isBuildingVariant(v: HomeVariantId): v is BuildingVariant {
  return (IMMERSIVE_BUILDING_VARIANTS as readonly string[]).includes(v);
}

/** Épület-gombos immersive skin-ek (6 db, mindegyik egyedi téma). */
export default function HomePageImmersive({ variant }: { variant: HomeVariantId }) {
  useSEO(SEO_PAGES.home);
  const { navigate } = useRouter();
  const { config } = useSiteCustomization();
  const meta = getHomeVariantMeta(variant);

  if (!isBuildingVariant(variant)) return null;

  const layout = HOME_BUILDING_LAYOUTS[variant];

  return (
    <div className={`immersive-home immersive-home--${variant}`} data-home-skin={variant}>
      <header className="immersive-home__header">
        <div className="immersive-home__brand">
          <p className="immersive-home__eyebrow">{config.hero.badgeTop || 'PiacPro'}</p>
          <h1 className="immersive-home__title">{meta.label}</h1>
          <p className="immersive-home__tagline">{meta.description}</p>
        </div>
        <button type="button" className="immersive-home__guide" onClick={() => navigate('/hogyan-mukodik')}>
          Hogyan működik?
        </button>
      </header>

      <div className="immersive-home__intent">
        <HomeIntentBar />
      </div>

      <div className="immersive-home__stage">
        <BuildingHotspotScene variant={variant} layout={layout} onNavigate={navigate} />
      </div>
    </div>
  );
}
