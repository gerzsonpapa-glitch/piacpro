import { Heart, MapPin, Gavel } from 'lucide-react';
import { useRouter } from '../lib/router';
import { formatPrice, formatRelativeTime } from '../lib/utils';
import type { Listing } from '../lib/types';

const statusLabel: Record<string, { text: string; cls: string }> = {
  sold: { text: 'Elkelt', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  ended: { text: 'Lezárult', cls: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const { navigate } = useRouter();
  const imageUrl = listing.images?.[0] || '';
  const status = listing.status !== 'active' ? statusLabel[listing.status] : null;
  const isAuction = listing.listing_type === 'auction';
  const href = isAuction ? `/auction/${listing.id}` : `/listing/${listing.id}`;
  const displayPrice = isAuction && listing.auction ? listing.auction.current_price : listing.price;

  return (
    <button
      onClick={() => navigate(href)}
      className="group text-left w-full glass-bubble rounded-2xl overflow-hidden"
      style={{ transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(-3px) scale(1.008)';
        el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.13), 0 20px 48px -10px rgba(0,0,0,0.6), 0 4px 12px -4px rgba(0,0,0,0.35)';
        el.style.borderColor = 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = '';
        el.style.boxShadow = '';
        el.style.borderColor = '';
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.03]">
        {imageUrl ? (
          <img src={imageUrl} alt={listing.title}
            className={`w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out ${status ? 'opacity-60 grayscale-[40%]' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {status && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${status.cls} rotate-[-10deg] shadow-lg`}>
              {status.text}
            </span>
          </div>
        )}
        {isAuction && !status && (
          <span className="absolute top-2.5 left-2.5 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Gavel className="w-3 h-3" />Aukció
          </span>
        )}
        {listing.is_featured && !status && !isAuction && (
          <span className="absolute top-2.5 left-2.5 glass-pill-active text-emerald-300 text-[10px] font-semibold px-2.5 py-1 rounded-xl">
            Kiemelt
          </span>
        )}
        {listing.is_favorited && (
          <div className="absolute top-2.5 right-2.5 glass-pill rounded-full p-1.5 shadow-sm">
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 truncate group-hover:text-emerald-300 transition-colors text-sm leading-snug">
          {listing.title}
        </h3>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <p className={`font-bold text-base ${status ? 'text-zinc-500' : 'text-emerald-400'}`}>
            {formatPrice(displayPrice)}
          </p>
          {isAuction && listing.auction && listing.auction.bid_count > 0 && (
            <span className="text-[11px] text-zinc-600">{listing.auction.bid_count} licit</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2.5 text-zinc-600 text-[11px]">
          {listing.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {listing.location}
            </span>
          )}
          <span className="flex-shrink-0 ml-auto">{formatRelativeTime(listing.created_at)}</span>
        </div>
      </div>
    </button>
  );
}
