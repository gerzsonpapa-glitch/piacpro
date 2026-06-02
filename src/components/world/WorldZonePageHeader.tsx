import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ADMIN_ZONE,
  getZoneById,
  getLiveCountForZone,
  type WorldZoneId,
} from '../../lib/worldZones';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';

export interface ZoneHeaderStat {
  label: string;
  value: string | number;
}

export default function WorldZonePageHeader({
  zoneId,
  title,
  subtitle,
  count,
  countLabel,
  meta,
  actions,
  compact = false,
  showLiveCount = true,
  variant = 'glass',
}: {
  zoneId: WorldZoneId | 'admin';
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  meta?: ZoneHeaderStat[];
  actions?: ReactNode;
  compact?: boolean;
  showLiveCount?: boolean;
  /** glass = csak szöveg a zóna háttér fölött (nincs dupla kép) */
  variant?: 'glass' | 'hero';
}) {
  const zone = zoneId === 'admin' ? ADMIN_ZONE : getZoneById(zoneId);
  const { stats } = useLiveWorldStats();
  if (!zone) return null;

  const liveCount = count ?? (showLiveCount ? getLiveCountForZone(zone, stats) : undefined);
  const statRows: ZoneHeaderStat[] =
    meta ??
    (liveCount !== undefined && countLabel
      ? [{ label: countLabel, value: stats.loading ? '…' : liveCount }]
      : []);

  if (variant === 'glass') {
    return (
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`world-zone-glass-header rounded-2xl border backdrop-blur-xl ${compact ? 'p-4' : 'p-5 md:p-6'}`}
        style={{
          background: 'rgba(7,17,31,0.55)',
          borderColor: `${zone.color}33`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full pulse-dot flex-shrink-0" style={{ background: zone.color }} />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.18em] truncate"
                style={{ color: zone.color }}
              >
                {zone.emoji} {zone.title}
              </span>
            </div>
            <h1 className={`font-black text-white leading-tight ${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
              {title}
            </h1>
            {(subtitle || statRows.length > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
                {statRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: zone.color }} />
                    <span>
                      <strong className="text-zinc-200 tabular-nums">
                        {typeof row.value === 'number' ? row.value.toLocaleString('hu-HU') : row.value}
                      </strong>{' '}
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2 flex-shrink-0">{actions}</div>}
        </div>
      </motion.header>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="page-hero rounded-3xl overflow-hidden world-zone-page-hero"
      style={{
        height: compact ? 'clamp(120px, 18vh, 160px)' : 'clamp(180px, 28vh, 260px)',
        boxShadow: `0 24px 80px rgba(0,0,0,0.45), 0 0 40px ${zone.glow}`,
      }}
    >
      <div
        className="page-hero-overlay absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(7,17,31,0.35) 0%, rgba(7,17,31,0.15) 40%, rgba(7,17,31,0.92) 100%), ${zone.gradient}`,
        }}
      />
      <div className="absolute inset-0 grid-overlay opacity-30" />
      <div className={`page-hero-content relative h-full flex flex-col justify-end ${compact ? 'px-4 pb-3' : 'px-6 pb-5'}`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: zone.color }} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: zone.color }}>
                {zone.emoji} {zone.title}
              </span>
            </div>
            <h1 className={`font-black text-white leading-tight ${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
              {title}
            </h1>
            {(subtitle || statRows.length > 0) && (
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
                {statRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: zone.color }} />
                    <span>
                      <strong className="text-zinc-200 tabular-nums">
                        {typeof row.value === 'number' ? row.value.toLocaleString('hu-HU') : row.value}
                      </strong>{' '}
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      </div>
    </motion.section>
  );
}
