import { Heart, MapPin, Gavel, Eye } from 'lucide-react';
import { useRouter } from '../lib/router';
import { formatPrice, formatRelativeTime, getOptimizedImageUrl } from '../lib/utils';
import type { Listing } from '../lib/types';

const statusLabel: Record<string, { text: string; cls: string }> = {
  sold: { text: 'Elkelt', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  ended: { text: 'Lezárult', cls: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
};

export default function ListingCard({ listing, priority = false }: { listing: Listing; priority?: boolean }) {
  const { navigate } = useRouter();
  const imageUrl = listing.images?.[0] || '';
  const optimizedUrl = getOptimizedImageUrl(imageUrl, 480);
  const status = listing.status !== 'active' ? statusLabel[listing.status] : null;
  const isAuction = listing.listing_type === 'auction';
  const href = isAuction ? `/auction/${listing.id}` : `/listing/${listing.id}`;
  const displayPrice = isAuction && listing.auction ? listing.auction.current_price : listing.price;

  return (
    <button
      onClick={() => navigate(href)}
      aria-label={`${listing.title} — ${formatPrice(displayPrice)}`}
      className="group text-left w-full overflow-hidden relative"
      style={{
        borderRadius: '18px',
        background: 'linear-gradient(150deg, rgba(0,208,132,0.055) 0%, rgba(10,22,38,0.8) 45%, rgba(7,17,31,0.85) 100%)',
        border: '1px solid rgba(0,230,118,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(0,230,118,0.08), 0 2px 16px -4px rgba(0,0,0,0.55)',
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(-5px) scale(1.012)';
        el.style.boxShadow = 'inset 0 1px 0 rgba(0,208,132,0.14), 0 24px 56px -8px rgba(0,0,0,0.75), 0 0 32px rgba(0,208,132,0.09)';
        el.style.borderColor = 'rgba(0,208,132,0.22)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = '';
        el.style.boxShadow = 'inset 0 1px 0 rgba(0,208,132,0.08), 0 2px 16px -4px rgba(0,0,0,0.55)';
        el.style.borderColor = 'rgba(0,208,132,0.1)';
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'rgba(7,17,31,0.6)' }}>
        {imageUrl ? (
          <img src={optimizedUrl} alt={listing.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'low'}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-600 ease-out ${status ? 'opacity-55 grayscale-[50%]' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 opacity-20 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Bottom gradient for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(7,17,31,0.75) 0%, transparent 100%)' }} />

        {/* Status overlay */}
        {status && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backdropFilter: 'blur(2px)', background: 'rgba(7,17,31,0.3)' }}>
            <span className={`text-sm font-bold px-4 py-1.5 rounded-2xl border shadow-xl ${status.cls} -rotate-6`}>
              {status.text}
            </span>
          </div>
        )}

        {/* Auction badge */}
        {isAuction && !status && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold text-white"
            style={{ background: 'rgba(168,85,247,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 0 12px rgba(168,85,247,0.5)' }}>
            <Gavel className="w-3 h-3" />Aukció
          </span>
        )}

        {/* Featured badge */}
        {listing.is_featured && !status && !isAuction && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold"
            style={{ background: 'linear-gradient(135deg, rgba(0,208,132,0.9), rgba(5,150,105,0.9))', color: '#07111f', boxShadow: '0 0 12px rgba(0,208,132,0.5)' }}>
            Kiemelt
          </span>
        )}

        {/* Favorite heart */}
        {listing.is_favorited && (
          <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(7,17,31,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.4)' }}>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          </div>
        )}

        {/* Views badge — bottom right on hover */}
        {listing.views > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(7,17,31,0.8)', backdropFilter: 'blur(8px)' }}>
            <Eye className="w-2.5 h-2.5" />{listing.views}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 truncate text-sm leading-snug transition-colors duration-200"
          style={{ textShadow: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00d084')}
          onMouseLeave={e => (e.currentTarget.style.color = '')}>
          {listing.title}
        </h3>
        <div className="flex items-baseline gap-2 mt-1.5">
          <p className={`font-black text-base leading-tight ${status ? 'text-zinc-600' : 'text-[#00d084]'}`}
            style={!status ? { textShadow: '0 0 20px rgba(0,208,132,0.3)' } : {}}>
            {formatPrice(displayPrice)}
          </p>
          {isAuction && listing.auction && listing.auction.bid_count > 0 && (
            <span className="text-[11px] text-zinc-600 font-medium">{listing.auction.bid_count} licit</span>
          )}
          {listing.is_negotiable && !isAuction && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
              Alku
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2.5 text-zinc-600 text-[11px]">
          {listing.location && (
            <span className="flex items-center gap-1 truncate mr-2">
              <MapPin className="w-3 h-3 flex-shrink-0 text-zinc-700" />
              <span className="truncate text-zinc-500">{listing.location}</span>
            </span>
          )}
          <span className="flex-shrink-0 ml-auto text-zinc-600">{formatRelativeTime(listing.created_at)}</span>
        </div>
      </div>

      {/* Bottom neon accent line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,208,132,0.6) 50%, transparent)' }} />
    </button>
  );
}
