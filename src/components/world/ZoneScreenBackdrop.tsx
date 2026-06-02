import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import type { ZoneAsset } from '../../lib/zoneAssets';

/**
 * S&F-szerű teljes képernyős zóna háttér — statikus kép, animált WebP/GIF vagy videó loop.
 */
export default function ZoneScreenBackdrop({
  asset,
  dimmed = true,
  className = '',
  scope = 'fixed',
}: {
  asset: ZoneAsset;
  dimmed?: boolean;
  className?: string;
  /** fixed = teljes oldal; hero = csak a főoldali hero viewport */
  scope?: 'fixed' | 'hero';
}) {
  const { config } = useSiteCustomization();
  const brightness = config.hero.brightness ?? 1.02;
  const saturation = config.hero.saturation ?? 1.12;
  const filter = `brightness(${brightness}) saturate(${saturation}) ${asset.filter ?? ''}`.trim();

  const hasLoopWebp = asset.loop?.webp && (asset.motion === 'loop-webp' || asset.motion === 'loop-gif');
  const hasLoopVideo = asset.loop?.mp4 && asset.motion === 'loop-video';
  const hasLoopGif = asset.loop?.gif && asset.motion === 'loop-gif';
  const useCssMotion = asset.motion === 'css-ambient';

  const isHomeHero = scope === 'hero' || className.includes('zone-screen-backdrop--home');

  return (
    <div
      className={`zone-screen-backdrop pointer-events-none overflow-hidden ${scope === 'hero' ? 'zone-screen-backdrop--hero' : 'fixed inset-0 z-0'} ${className}`}
      data-zone-asset={asset.id}
      aria-hidden
    >
      {hasLoopVideo && asset.loop?.mp4 ? (
        <video
          className="zone-screen-media zone-screen-video"
          autoPlay
          muted
          loop
          playsInline
          poster={asset.static.jpg}
          style={{ objectPosition: asset.objectPosition ?? 'center' }}
        >
          <source src={asset.loop.mp4} type="video/mp4" />
        </video>
      ) : hasLoopGif && asset.loop?.gif ? (
        <img
          src={asset.loop.gif}
          alt=""
          className="zone-screen-media zone-screen-gif"
          style={{ objectPosition: asset.objectPosition ?? 'center', filter }}
        />
      ) : hasLoopWebp && asset.loop?.webp ? (
        <img
          src={asset.loop.webp}
          alt=""
          className="zone-screen-media zone-screen-loop"
          style={{ objectPosition: asset.objectPosition ?? 'center', filter }}
        />
      ) : (
        <picture className="zone-screen-media-wrap">
          <source srcSet={asset.static.webp} type="image/webp" />
          <img
            src={asset.static.jpg}
            alt=""
            className={`zone-screen-media ${useCssMotion ? 'zone-screen-kenburns' : ''}`}
            style={{ objectPosition: asset.objectPosition ?? 'center', filter }}
            decoding="async"
          />
        </picture>
      )}

      {asset.ambientColor && (
        <div
          className={`zone-ambient-glow absolute inset-0 ${useCssMotion ? 'zone-ambient-pulse' : ''}`}
          style={{
            background: `radial-gradient(ellipse 70% 55% at 50% 20%, ${asset.ambientColor}22 0%, transparent 65%)`,
          }}
        />
      )}

      {isHomeHero && (
        <div className="absolute inset-0 pointer-events-none zone-home-warmth" aria-hidden />
      )}

      {isHomeHero ? (
        <div className="home-hero-backdrop-fade" />
      ) : (
        <div
          className="absolute inset-0 zone-screen-overlay"
          style={{
            background: dimmed
              ? `linear-gradient(to bottom, rgba(7,17,31,0.55) 0%, rgba(7,17,31,0.82) 100%)`
              : `linear-gradient(to top, rgba(20,12,8,0.35) 0%, rgba(7,17,31,0.04) 40%, transparent 55%), linear-gradient(to bottom, rgba(7,17,31,0.5) 0%, rgba(12,8,20,0.82) 100%)`,
          }}
        />
      )}

      {!isHomeHero && (
        <div className="zone-scanlines absolute inset-0 opacity-[0.04] pointer-events-none" />
      )}
    </div>
  );
}
