import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { SECONDARY_WORLD_ZONES, getLiveCountForZone } from '../../lib/worldZones';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';
import ZonePortalCard from './ZonePortalCard';

export default function SecondaryWorldsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { navigate } = useRouter();
  const { stats } = useLiveWorldStats();

  function go(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="world-secondary-sheet fixed inset-x-0 bottom-0 z-[86] rounded-t-3xl max-h-[min(70vh,480px)] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/15 border border-purple-400/25">
                  <Layers className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-100">További világok</p>
                  <p className="text-[10px] text-zinc-500">Kibővített zónák — nem fő navigáció</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {SECONDARY_WORLD_ZONES.map((zone, i) => (
                <ZonePortalCard
                  key={zone.id}
                  zone={zone}
                  count={getLiveCountForZone(zone, stats)}
                  loading={stats.loading}
                  compact
                  index={i}
                  onClick={() => go(zone.path)}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
