import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';

/** Lebegő „élő város” sáv — aktív tartalmak és friss aktivitás. */
export default function HomeLivePulseBar() {
  const { stats, activity } = useLiveWorldStats(45_000);
  const barRef = useRef<HTMLDivElement>(null);
  const prevTotal = useRef(0);

  useEffect(() => {
    const total = stats.listings + stats.auctions + stats.jobs;
    if (prevTotal.current > 0 && total !== prevTotal.current) {
      barRef.current?.classList.add('home-live-pulse-bar--tick');
      const t = window.setTimeout(() => barRef.current?.classList.remove('home-live-pulse-bar--tick'), 800);
      prevTotal.current = total;
      return () => clearTimeout(t);
    }
    prevTotal.current = total;
  }, [stats.listings, stats.auctions, stats.jobs]);

  const recentLabel = activity[0]?.title
    ? activity[0].title.length > 42
      ? `${activity[0].title.slice(0, 42)}…`
      : activity[0].title
    : null;

  return (
    <div ref={barRef} className="home-live-pulse-bar pointer-events-none" role="status" aria-live="polite">
      <div className="home-live-pulse-bar__inner piac-glass-panel">
        <span className="home-live-pulse-bar__dot" aria-hidden />
        <Activity className="w-3.5 h-3.5 text-[#00E676] shrink-0" aria-hidden />
        <span className="home-live-pulse-bar__text">
          {stats.loading ? (
            'Élő adatok betöltése…'
          ) : (
            <>
              <strong>{stats.listings.toLocaleString('hu-HU')}</strong> aktív hirdetés
              {stats.listingsToday > 0 && (
                <> · <strong className="text-sky-300">{stats.listingsToday}</strong> új ma</>
              )}
              {stats.jobs > 0 && (
                <> · <strong>{stats.jobs.toLocaleString('hu-HU')}</strong> állás</>
              )}
            </>
          )}
        </span>
        {recentLabel && (
          <span className="home-live-pulse-bar__recent hidden xl:inline">
            Friss: {recentLabel}
          </span>
        )}
      </div>
    </div>
  );
}
