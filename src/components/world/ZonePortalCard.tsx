import { motion } from 'framer-motion';
import type { ElementType } from 'react';
import type { WorldZone } from '../../lib/worldZones';
import { ArrowRight } from 'lucide-react';

export default function ZonePortalCard({
  zone,
  count,
  loading,
  compact,
  index,
  onClick,
}: {
  zone: WorldZone;
  count: number;
  loading: boolean;
  compact?: boolean;
  index: number;
  onClick: () => void;
}) {
  const Icon = zone.icon as ElementType;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className={`world-zone-portal text-left w-full ${compact ? 'p-3' : 'p-4 sm:p-5'}`}
      style={{
        ['--zone-color' as string]: zone.color,
        ['--zone-glow' as string]: zone.glow,
        ['--zone-border' as string]: zone.border,
        background: zone.gradient,
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center flex-shrink-0`}
          style={{ background: zone.bg, border: `1px solid ${zone.border}`, boxShadow: `0 0 24px ${zone.glow}` }}
        >
          <Icon className={compact ? 'w-5 h-5' : 'w-6 h-6'} style={{ color: zone.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm">{zone.emoji}</span>
            <span className={`${compact ? 'text-xs' : 'text-sm'} font-black uppercase tracking-wider`} style={{ color: zone.color }}>
              {zone.title}
            </span>
          </div>
          <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-zinc-400 mt-1 leading-relaxed`}>{zone.subtitle}</p>
          {!loading && count > 0 && (
            <p className="text-[10px] font-bold mt-1.5 flex items-center gap-1.5" style={{ color: zone.color }}>
              <span className="world-live-dot w-1.5 h-1.5 rounded-full inline-block" />
              {count.toLocaleString('hu-HU')} élő
            </p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1 opacity-60" />
      </div>
    </motion.button>
  );
}
