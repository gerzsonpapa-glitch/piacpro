import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  computeContainedImageRect,
  findHeroMapImage,
  type CityMapImageRect,
} from '../lib/cityMapImageBounds';

const CityMapBoundsContext = createContext<CityMapImageRect | null>(null);

export function CityMapBoundsProvider({
  stage,
  children,
}: {
  stage: HTMLElement | null;
  children: ReactNode;
}) {
  const [rect, setRect] = useState<CityMapImageRect | null>(null);

  useEffect(() => {
    if (!stage) return;

    let raf = 0;

    const measure = () => {
      const img = findHeroMapImage(stage);
      const stageBox = stage.getBoundingClientRect();
      const aspect =
        img && img.naturalWidth > 0 && img.naturalHeight > 0
          ? img.naturalWidth / img.naturalHeight
          : 16 / 9;
      const objectPosition =
        img ? getComputedStyle(img).objectPosition : 'center center';
      const next = computeContainedImageRect(
        stageBox.width,
        stageBox.height,
        aspect,
        objectPosition,
      );
      setRect(next);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    schedule();

    const img = findHeroMapImage(stage);
    if (img && !img.complete) img.addEventListener('load', schedule);

    const ro = new ResizeObserver(schedule);
    ro.observe(stage);
    if (img) ro.observe(img);

    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (img && !img.complete) img.removeEventListener('load', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
    };
  }, [stage]);

  const value = useMemo(() => rect, [rect]);

  return (
    <CityMapBoundsContext.Provider value={value}>{children}</CityMapBoundsContext.Provider>
  );
}

export function useCityMapBounds() {
  return useContext(CityMapBoundsContext);
}
