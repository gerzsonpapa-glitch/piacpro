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
      className="group text-left w-full glass-bubble rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={listing.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${status ? 'opacity-70 grayscale-[30%]' : ''}`} />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center text-zinc-600">
            <span className="text-4xl opacity-40">📷</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        {status && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${status.cls} rotate-[-12deg]`}>
              {status.text}
            </span>
          </div>
        )}
        {isAuction && !status && (
          <span className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <Gavel className="w-3 h-3" />Aukció
          </span>
        )}
        {listing.is_featured && !status && !isAuction && (
          <span className="absolute top-3 left-3 glass-pill-active text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-xl">
            Kiemelt
          </span>
        )}
        {listing.is_favorited && (
          <div className="absolute top-3 right-3 glass-pill rounded-full p-1.5">
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 truncate group-hover:text-emerald-300 transition-colors">
          {listing.title}
        </h3>
        <div className="flex items-baseline gap-1.5 mt-1">
          <p className={`font-bold text-lg ${status ? 'text-zinc-500' : 'text-emerald-400'}`}>
            {formatPrice(displayPrice)}
          </p>
          {isAuction && listing.auction && listing.auction.bid_count > 0 && (
            <span className="text-xs text-zinc-600">{listing.auction.bid_count} licit</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 text-zinc-500 text-xs">
          {listing.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {listing.location}
            </span>
          )}
          <span className="flex-shrink-0">{formatRelativeTime(listing.created_at)}</span>
        </div>
      </div>
    </button>
  );
}
