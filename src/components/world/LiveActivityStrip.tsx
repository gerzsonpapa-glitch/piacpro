import { motion } from 'framer-motion';
import { Activity, ShoppingBag, Gavel, Briefcase } from 'lucide-react';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';
import { formatRelativeTime } from '../../lib/utils';

const TYPE_ICON = {
  listing: ShoppingBag,
  auction: Gavel,
  job: Briefcase,
  donation: Activity,
};

export default function LiveActivityStrip() {
  const { activity, stats } = useLiveWorldStats(45000);

  if (stats.loading && activity.length === 0) return null;

  return (
    <div className="world-live-strip relative z-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="world-live-dot w-2 h-2 rounded-full bg-[#00E676]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-[#00E676]/90">Élő</span>
        </div>
        <div className="flex-1 overflow-x-auto scrollbar-none flex items-center gap-4 min-w-0">
          {activity.length > 0 ? (
            activity.map((item) => {
              const Icon = TYPE_ICON[item.type] ?? Activity;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 flex-shrink-0 text-[11px] text-zinc-400"
                >
                  <Icon className="w-3 h-3 text-cyan-400/80" />
                  <span className="text-zinc-300 max-w-[180px] truncate">{item.title}</span>
                  <span className="text-zinc-600">{formatRelativeTime(item.at)}</span>
                </motion.div>
              );
            })
          ) : (
            <span className="text-[11px] text-zinc-500">
              {stats.listings.toLocaleString('hu-HU')} hirdetés · {stats.auctions} licit · {stats.jobs} állás
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
