import { Zap, Package, ArrowRight } from 'lucide-react';
import { useRouter } from '../../lib/router';
import type { Listing } from '../../lib/types';
import { formatPrice } from '../../lib/utils';
import GlassPanel from '../ui/GlassPanel';

export default function HomeHeroDock({
  listings,
  loading,
  totalCount = 0,
}: {
  listings: Listing[];
  loading: boolean;
  totalCount?: number;
}) {
  const { navigate } = useRouter();

  return (
    <div className="home-hero-dock w-full pointer-events-auto">
      <GlassPanel className="p-4 piac-glass-panel">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-[#00E676] flex-shrink-0" />
            <span className="text-sm font-black text-zinc-100 truncate">Legfrissebb hirdetések</span>
            {!loading && totalCount > 0 && (
              <span className="text-[10px] text-zinc-500 tabular-nums">{totalCount.toLocaleString('hu-HU')} db</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#00E676] hover:gap-1.5 transition-all flex-shrink-0"
          >
            Összes <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-[72px] rounded-xl" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {listings.slice(0, 3).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => navigate(`/listing/${l.id}`)}
                className="piac-rec-card flex items-center gap-3 p-3 text-left group rounded-xl border border-white/[0.06] hover:border-[#00E676]/25 transition-all"
                style={{ background: 'rgba(7,17,31,0.45)' }}
              >
                {l.images?.[0] ? (
                  <img src={l.images[0]} alt={l.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#00E676]/10">
                    <Package className="w-5 h-5 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-100 truncate group-hover:text-[#00E676] transition-colors">
                    {l.title}
                  </p>
                  {l.location && (
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{l.location}</p>
                  )}
                  <p className="text-xs font-black mt-1 text-[#00E676]">{formatPrice(l.price)}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Még nincsenek hirdetések — légy az első!</p>
        )}
      </GlassPanel>
    </div>
  );
}
