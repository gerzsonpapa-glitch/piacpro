import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { getWorldBackgroundSources, isBuiltinHubBackground, getWorldBackgroundUrl } from '../../lib/siteCustomization';
import { ZONE_ASSETS } from '../../lib/zoneAssets';
import ZoneScreenBackdrop from './ZoneScreenBackdrop';

/** Főoldali hero — csak az első képernyőn, alul szolid színre olvad. */
export default function HomeHeroBackdrop() {
  const { config } = useSiteCustomization();
  const bgUrl = getWorldBackgroundUrl(config);
  const useCustom = !isBuiltinHubBackground(bgUrl);

  if (useCustom) {
    const { jpg, webp } = getWorldBackgroundSources(config);
    const brightness = config.hero.brightness ?? 1.04;
    const saturation = config.hero.saturation ?? 1.06;
    return (
      <div className="home-hero-backdrop absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
        <picture className="home-hero-backdrop-media-wrap">
          <source srcSet={webp} type="image/webp" />
          <img
            src={jpg}
            alt=""
            className="home-hero-backdrop-media"
            style={{ filter: `brightness(${brightness}) saturate(${saturation})` }}
            decoding="async"
          />
        </picture>
        <div className="home-hero-backdrop-vignette" />
        <div className="home-hero-backdrop-fade" />
      </div>
    );
  }

  return (
    <ZoneScreenBackdrop
      asset={ZONE_ASSETS.hub}
      dimmed={false}
      scope="hero"
      className="zone-screen-backdrop--home"
    />
  );
}
