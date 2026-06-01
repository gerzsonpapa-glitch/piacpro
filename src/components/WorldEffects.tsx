import { useEffect, useMemo, useState } from 'react';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';

function Particles({ count, color }: { count: number; color: string }) {
  const dots = useMemo(
    () =>
      Array.from({ length: Math.min(Math.max(count, 8), 120) }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        top: `${(i * 23 + 11) % 100}%`,
        size: 2 + (i % 3),
        delay: `${(i % 20) * 0.35}s`,
        duration: `${4 + (i % 7)}s`,
        opacity: 0.15 + (i % 5) * 0.08,
      })),
    [count],
  );

  return (
    <div className="piac-particles pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      {dots.map((d) => (
        <span
          key={d.id}
          className="piac-particle absolute rounded-full"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            background: color,
            opacity: d.opacity,
            animationDelay: d.delay,
            animationDuration: d.duration,
            boxShadow: `0 0 ${d.size * 4}px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

export default function WorldEffects() {
  const { config } = useSiteCustomization();
  const w = config.world;
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!w.enabled || !w.floatingOrbs) return;
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [w.enabled, w.floatingOrbs]);

  if (!w.enabled) return null;

  const parallax = scrollY * 0.04 * w.parallaxStrength;

  return (
    <>
      {w.particles && <Particles count={w.particleCount} color={w.particleColor} />}

      {w.floatingOrbs && (
        <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
          <div
            className="piac-orb absolute -top-20 left-[10%] w-[800px] h-[500px] rounded-full blur-[180px]"
            style={{
              background: `rgba(0,208,132,${0.032 * w.orbIntensity})`,
              transform: `translateY(${parallax}px) rotate(-15deg)`,
            }}
          />
          <div
            className="piac-orb absolute top-[30%] right-[5%] w-[600px] h-[400px] rounded-full blur-[160px]"
            style={{
              background: `rgba(59,130,246,${0.025 * w.orbIntensity})`,
              transform: `translateY(${-parallax * 0.6}px)`,
            }}
          />
          <div
            className="piac-orb absolute bottom-0 left-[30%] w-[700px] h-[350px] rounded-full blur-[150px]"
            style={{
              background: `rgba(0,208,132,${0.022 * w.orbIntensity})`,
              transform: `translateY(${parallax * 0.3}px)`,
            }}
          />
        </div>
      )}

      {config.media.ambientBgUrl && (
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.media.ambientBgUrl})` }}
          aria-hidden
        />
      )}
    </>
  );
}
