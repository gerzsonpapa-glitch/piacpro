import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ADMIN_ZONE,
  getZoneById,
  getLiveCountForZone,
  type WorldZoneId,
} from '../../lib/worldZones';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';

import { ZONE_SCENE_IMAGES } from '../../lib/cityMapBuildings';

const ZONE_HERO_IMAGES: Partial<Record<WorldZoneId | 'admin', string>> = {
  marketplace: ZONE_SCENE_IMAGES.marketplace.src,
  auction: ZONE_SCENE_IMAGES.auction.src,
  jobs: ZONE_SCENE_IMAGES.jobs.src,
  community: ZONE_SCENE_IMAGES.community.src,
  business: ZONE_SCENE_IMAGES.business.src,
  donations: ZONE_SCENE_IMAGES.donations.src,
  producers: ZONE_SCENE_IMAGES.producers.src,
  admin: ZONE_SCENE_IMAGES.admin.src,
};

const ZONE_HERO_POSITIONS: Partial<Record<WorldZoneId | 'admin', string>> = {
  marketplace: ZONE_SCENE_IMAGES.marketplace.position,
  auction: ZONE_SCENE_IMAGES.auction.position,
  jobs: ZONE_SCENE_IMAGES.jobs.position,
  community: ZONE_SCENE_IMAGES.community.position,
  business: ZONE_SCENE_IMAGES.business.position,
  donations: ZONE_SCENE_IMAGES.donations.position,
  producers: ZONE_SCENE_IMAGES.producers.position,
  admin: ZONE_SCENE_IMAGES.admin.position,
};

export default function WorldZonePageHeader({
  zoneId,
  title,
  subtitle,
  count,
  countLabel,
  image,
  imagePosition = 'center 40%',
  actions,
  compact = false,
  showLiveCount = true,
}: {
  zoneId: WorldZoneId | 'admin';
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  image?: string;
  imagePosition?: string;
  actions?: ReactNode;
  compact?: boolean;
  showLiveCount?: boolean;
}) {
  const zone = zoneId === 'admin' ? ADMIN_ZONE : getZoneById(zoneId);
  const { stats } = useLiveWorldStats();
  if (!zone) return null;

  const liveCount = count ?? (showLiveCount ? getLiveCountForZone(zone, stats) : undefined);
  const heroImg = image ?? ZONE_HERO_IMAGES[zoneId] ?? ZONE_HERO_IMAGES.marketplace;
  const heroPosition = imagePosition !== 'center 40%'
    ? imagePosition
    : (ZONE_HERO_POSITIONS[zoneId] ?? 'center 40%');
  const height = compact ? 'clamp(120px, 18vh, 160px)' : 'clamp(180px, 28vh, 260px)';

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="page-hero rounded-3xl overflow-hidden world-zone-page-hero"
      style={{
        height,
        boxShadow: `0 24px 80px rgba(0,0,0,0.45), 0 0 40px ${zone.glow}`,
      }}
    >
      <img
        src={heroImg}
        alt={zone.title}
        className="page-hero-bg"
        style={{ objectPosition: heroPosition }}
      />
      <div
        className="page-hero-overlay"
        style={{
          background: `linear-gradient(to bottom, rgba(7,17,31,0.35) 0%, rgba(7,17,31,0.15) 40%, rgba(7,17,31,0.92) 100%), ${zone.gradient}`,
        }}
      />
      <div className="absolute inset-0 grid-overlay opacity-30" />
      <div className="scan-line" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 60% at 20% 0%, ${zone.glow} 0%, transparent 65%)`,
        }}
      />
      <div className={`page-hero-content h-full flex flex-col justify-end ${compact ? 'px-4 pb-3' : 'px-6 pb-5'}`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: zone.color }} />
              <span
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: zone.color }}
              >
                {zone.emoji} {zone.title}
              </span>
            </div>
            <h1
              className={`font-black text-white leading-tight ${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
              style={{ textShadow: `0 0 30px ${zone.glow}` }}
            >
              {title}
            </h1>
            {(subtitle || liveCount !== undefined) && (
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {subtitle && (
                  <p className="text-xs text-zinc-400 max-w-xl">{subtitle}</p>
                )}
                {liveCount !== undefined && countLabel && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: zone.color }}
                    />
                    <span>
                      <strong className="text-zinc-200">
                        {stats.loading ? '…' : liveCount.toLocaleString('hu-HU')}
                      </strong>{' '}
                      {countLabel}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      </div>
    </motion.section>
  );
}
