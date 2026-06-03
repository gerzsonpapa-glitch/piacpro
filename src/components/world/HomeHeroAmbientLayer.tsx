import { useEffect, useRef, useState } from 'react';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { getBudapestDayPhase, isHomeWowFeatureEnabled } from '../../lib/homeWow';

/** Parallax felhők, szökőkút gőz, ablakfények — a hub hero fölött. */
export default function HomeHeroAmbientLayer() {
  const { config } = useSiteCustomization();
  const ambient = isHomeWowFeatureEnabled(config, 'ambientMotion');
  const dayNight = isHomeWowFeatureEnabled(config, 'dayNightCycle');
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(getBudapestDayPhase);

  useEffect(() => {
    if (!dayNight) return;
    setPhase(getBudapestDayPhase());
    const id = setInterval(() => setPhase(getBudapestDayPhase()), 60_000);
    return () => clearInterval(id);
  }, [dayNight]);

  useEffect(() => {
    if (!ambient) return;
    const el = ref.current?.closest('.world-home-hero-viewport') as HTMLElement | null;
    if (!el) return;

    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      el!.style.setProperty('--hub-parallax-x', x.toFixed(3));
      el!.style.setProperty('--hub-parallax-y', y.toFixed(3));
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [ambient]);

  if (!ambient && !dayNight) return null;

  return (
    <div
      ref={ref}
      className="home-hero-ambient absolute inset-0 z-[2] pointer-events-none overflow-hidden"
      data-day-phase={dayNight ? phase : undefined}
      aria-hidden
    >
      {ambient && (
        <>
          <div className="home-hero-ambient__cloud home-hero-ambient__cloud--a" />
          <div className="home-hero-ambient__cloud home-hero-ambient__cloud--b" />
          <div className="home-hero-ambient__fountain" />
          <div className="home-hero-ambient__windows" />
          <div className="home-hero-ambient__blimp-glow" />
        </>
      )}
      {dayNight && <div className="home-hero-ambient__daynight" />}
    </div>
  );
}
