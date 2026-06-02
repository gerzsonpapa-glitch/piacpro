import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import WorldZonePageHeader from '../world/WorldZonePageHeader';

export default function PageShell({
  children,
  title,
  subtitle,
  zoneId,
  className = '',
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  zoneId?: import('../lib/worldZones').WorldZoneId;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`piac-page-content max-w-[1440px] mx-auto px-3 sm:px-4 py-6 sm:py-8 ${className}`}
    >
      {zoneId && title && (
        <div className="mb-6">
          <WorldZonePageHeader
            zoneId={zoneId}
            title={title}
            subtitle={subtitle}
            compact
            showLiveCount={!!subtitle}
          />
        </div>
      )}
      {(title || subtitle) && !zoneId && (
        <header className="mb-6 sm:mb-8">
          {title && (
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-50 uppercase">
              {title}
            </h1>
          )}
          {subtitle && <p className="text-zinc-500 text-sm mt-2 max-w-2xl">{subtitle}</p>}
        </header>
      )}
      {children}
    </motion.div>
  );
}
