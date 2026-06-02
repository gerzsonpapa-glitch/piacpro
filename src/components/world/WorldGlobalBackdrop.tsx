import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { getWorldBackgroundSources } from '../../lib/siteCustomization';

/** Élethű 4K városkép — minden oldal mögött (a főoldalon a CityMapView fed le) */
export default function WorldGlobalBackdrop({
  hidden = false,
  dimmed = true,
}: {
  hidden?: boolean;
  dimmed?: boolean;
}) {
  const { config } = useSiteCustomization();
  if (hidden) return null;

  const { jpg, webp } = getWorldBackgroundSources(config);
  const brightness = config.hero.brightness ?? 1.02;
  const saturation = config.hero.saturation ?? 1.12;

  return (
    <div className="piac-world-backdrop fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      <picture>
        <source srcSet={webp} type="image/webp" />
        <img
          src={jpg}
          alt=""
          className="piac-world-backdrop-img"
          style={{
            filter: `brightness(${brightness}) saturate(${saturation})`,
          }}
          decoding="async"
          fetchPriority="low"
        />
      </picture>
      <div
        className="absolute inset-0"
        style={{
          background: dimmed
            ? `linear-gradient(to bottom, rgba(7,17,31,${config.hero.overlayOpacity ?? 0.35}) 0%, rgba(7,17,31,0.72) 100%)`
            : `linear-gradient(to top, rgba(7,17,31,0.55) 0%, transparent 18%), linear-gradient(to bottom, rgba(7,17,31,0.15) 0%, transparent 10%)`,
        }}
      />
    </div>
  );
}
