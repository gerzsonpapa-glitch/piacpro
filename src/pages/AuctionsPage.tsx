import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import type { Listing } from '../lib/types';
import { formatPrice, normalizeListingAuction } from '../lib/utils';
import {
  Gavel, Clock, TrendingUp, Plus, MapPin, Timer, Flame,
  Search, SlidersHorizontal, ChevronDown, Users, Trophy, Zap
} from 'lucide-react';

function useCountdown(endsAt: string, timerStarted: boolean) {
  const calc = useCallback(() => {
    if (!timerStarted) return { h: 0, m: 0, s: 0, total: 0, done: false, waiting: true };
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, total: 0, done: true, waiting: false };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      total: diff,
      done: false,
      waiting: false,
    };
  }, [endsAt, timerStarted]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

function AuctionCard({ listing, featured }: { listing: Listing; featured?: boolean }) {
  const { navigate } = useRouter();
  const auction = listing.auction;
  const countdown = useCountdown(
    auction?.ends_at || new Date().toISOString(),
    auction?.timer_started ?? false
  );
  const image = listing.images?.[0];
  const isLastHour = !countdown.waiting && !countdown.done && countdown.total < 3600000;
  const isLastFiveMin = !countdown.waiting && !countdown.done && countdown.total < 300000;
  const bidCount = auction?.bid_count ?? 0;
  const priceRise = auction && auction.current_price > auction.starting_price
    ? Math.round(((auction.current_price - auction.starting_price) / auction.starting_price) * 100)
    : 0;

  if (featured) {
    return (
      <button
        onClick={() => navigate(`/auction/${listing.id}`)}
        className="group text-left w-full glass-bubble rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.015] relative"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          {image ? (
            <img src={image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <Gavel className="w-16 h-16 text-zinc-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {isLastFiveMin && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/90 px-3 py-1.5 rounded-xl text-white text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5" /> Utolsó percek!
            </div>
          )}
          {!isLastFiveMin && isLastHour && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-500/90 px-3 py-1.5 rounded-xl text-white text-xs font-bold">
              <Timer className="w-3.5 h-3.5" /> Utolsó óra
            </div>
          )}
          {priceRise > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 glass-pill px-2.5 py-1 rounded-xl text-xs font-semibold text-emerald-400">
              <TrendingUp className="w-3 h-3" /> +{priceRise}%
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-white text-lg leading-tight mb-2 group-hover:text-emerald-300 transition-colors">
              {listing.title}
            </h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-zinc-400 text-xs mb-0.5">Jelenlegi ajánlat</p>
                <p className="text-emerald-400 font-bold text-2xl">{formatPrice(auction?.current_price || listing.price)}</p>
              </div>
              <div className="text-right">
                {countdown.waiting ? (
                  <span className="text-zinc-400 text-sm">Első licit indítja</span>
                ) : countdown.done ? (
                  <span className="text-red-400 text-sm font-semibold">Lezárult</span>
                ) : (
                  <div className="flex items-center gap-1.5 glass-strong px-3 py-1.5 rounded-xl">
                    <Timer className={`w-4 h-4 ${isLastHour ? 'text-red-400' : 'text-amber-400'}`} />
                    <span className={`font-mono font-bold text-lg ${isLastHour ? 'text-red-300' : 'text-amber-300'}`}>
                      {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
                    </span>
                  </div>
                )}
                {bidCount > 0 && (
                  <p className="text-zinc-500 text-xs mt-1 flex items-center justify-end gap-1">
                    <Users className="w-3 h-3" /> {bidCount} licit
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`/auction/${listing.id}`)}
      className="group text-left w-full glass-bubble rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <img src={image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center">
            <Gavel className="w-10 h-10 text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        {isLastFiveMin && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/85 px-2 py-1 rounded-lg text-white text-[10px] font-bold animate-pulse">
            <Flame className="w-3 h-3" /> HOT
          </div>
        )}
        {auction?.status === 'active' && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 glass-strong rounded-xl px-2 py-1.5">
            <Timer className={`w-3 h-3 ${isLastHour ? 'text-red-400' : 'text-amber-400'}`} />
            {countdown.waiting ? (
              <span className="text-xs text-zinc-400">Első licit indítja</span>
            ) : countdown.done ? (
              <span className="text-xs text-red-400">Lezárult</span>
            ) : (
              <span className={`text-xs font-mono font-bold ${isLastHour ? 'text-red-300' : 'text-amber-300'}`}>
                {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
              </span>
            )}
          </div>
        )}
        {auction?.status === 'ended' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="glass-strong text-zinc-400 font-semibold px-4 py-2 rounded-xl text-sm">Lezárult</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 truncate group-hover:text-emerald-300 transition-colors text-sm">
          {listing.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-[10px] text-zinc-500">Jelenlegi ajánlat</p>
            <p className="text-emerald-400 font-bold">{formatPrice(auction?.current_price || listing.price)}</p>
          </div>
          <div className="text-right">
            {priceRise > 0 && (
              <p className="text-[10px] text-emerald-500 flex items-center gap-0.5 justify-end">
                <TrendingUp className="w-3 h-3" /> +{priceRise}%
              </p>
            )}
            {bidCount > 0 && (
              <p className="text-[10px] text-zinc-600 flex items-center gap-0.5 justify-end mt-0.5">
                <Users className="w-3 h-3" /> {bidCount} licit
              </p>
            )}
          </div>
        </div>
        {listing.location && (
          <p className="text-[10px] text-zinc-600 mt-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {listing.location}
          </p>
        )}
      </div>
    </button>
  );
}

export default function AuctionsPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [activeAuctions, setActiveAuctions] = useState<Listing[]>([]);
  const [endedAuctions, setEndedAuctions] = useState<Listing[]>([]);
  const [tab, setTab] = useState<'active' | 'ended'>('active');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'ending_soon' | 'most_bids' | 'lowest_price'>('ending_soon');
  const [showSort, setShowSort] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAuctions = useCallback(async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, seller:profiles(*), auction:auctions(*)')
      .eq('listing_type', 'auction')
      .order('created_at', { ascending: false });

    const all = (data || []).map(normalizeListingAuction);
    setActiveAuctions(all.filter((l: Listing) => l.auction?.status === 'active'));
    setEndedAuctions(all.filter((l: Listing) => l.auction?.status === 'ended' || l.auction?.status === 'sold'));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 30000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  const SORT_LABELS: Record<string, string> = {
    newest: 'Legújabb',
    ending_soon: 'Hamarabb lejár',
    most_bids: 'Legtöbb licit',
    lowest_price: 'Legalacsonyabb ár',
  };

  function applySortAndFilter(listings: Listing[]) {
    let list = listings;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.title.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q));
    }
    if (sortBy === 'ending_soon') {
      list = [...list].sort((a, b) => {
        if (!a.auction?.timer_started) return 1;
        if (!b.auction?.timer_started) return -1;
        return new Date(a.auction.ends_at).getTime() - new Date(b.auction.ends_at).getTime();
      });
    } else if (sortBy === 'most_bids') {
      list = [...list].sort((a, b) => (b.auction?.bid_count ?? 0) - (a.auction?.bid_count ?? 0));
    } else if (sortBy === 'lowest_price') {
      list = [...list].sort((a, b) => (a.auction?.current_price ?? 0) - (b.auction?.current_price ?? 0));
    }
    return list;
  }

  const shownActive = applySortAndFilter(activeAuctions);
  const shownEnded = applySortAndFilter(endedAuctions);
  const shown = tab === 'active' ? shownActive : shownEnded;

  // Top 2 active auctions with most bids for featured row
  const featured = [...activeAuctions]
    .sort((a, b) => (b.auction?.bid_count ?? 0) - (a.auction?.bid_count ?? 0))
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass p-8 md:p-10">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-500/15 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                <Gavel className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest">Aukciós piactér</p>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">Licitversenyek</h1>
              </div>
            </div>
            <p className="text-zinc-400 text-sm md:text-base max-w-lg">
              Licitálj a legjobb ajánlatokért — 24 és 48 órás aukciókon. Az első licit indítja a visszaszámlálót.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span><strong className="text-zinc-200">{activeAuctions.length}</strong> aktív aukció</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span><strong className="text-zinc-200">{endedAuctions.length}</strong> lezárult</span>
              </div>
            </div>
          </div>
          {user && (
            <button
              onClick={() => navigate('/create-auction')}
              className="flex items-center gap-2.5 glass-pill-active text-emerald-300 px-6 py-3 rounded-2xl font-semibold transition-all hover:scale-[1.03] whitespace-nowrap self-start md:self-center"
            >
              <Plus className="w-5 h-5" />
              Aukció indítása
            </button>
          )}
        </div>
      </section>

      {/* Featured — top active auctions */}
      {!loading && featured.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Kiemelt licitek</h2>
          </div>
          <div className={`grid gap-4 ${featured.length === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 md:grid-cols-2'}`}>
            {featured.map((l) => <AuctionCard key={l.id} listing={l} featured />)}
          </div>
        </section>
      )}

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés az aukciók között..."
            className="w-full pl-10 pr-4 py-3 glass-input rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 glass-pill px-4 py-3 rounded-2xl text-zinc-300 hover:text-zinc-100 text-sm transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {SORT_LABELS[sortBy]}
            <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-2 glass-strong rounded-2xl overflow-hidden z-20 min-w-[180px] shadow-xl">
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setSortBy(key as typeof sortBy); setShowSort(false); }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === key ? 'text-emerald-300 bg-emerald-500/10' : 'text-zinc-300 hover:bg-white/5'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('active')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${tab === 'active' ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
        >
          <div className={`w-2 h-2 rounded-full ${tab === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          Aktív ({activeAuctions.length})
        </button>
        <button
          onClick={() => setTab('ended')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${tab === 'ended' ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
        >
          <Clock className="w-4 h-4" />
          Lezárult ({endedAuctions.length})
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-bubble rounded-3xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-6 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shown.map((listing) => (
            <AuctionCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-3xl">
          <Gavel className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 text-lg font-medium">
            {search ? 'Nincs találat a keresésre' : tab === 'active' ? 'Nincs aktív aukció' : 'Nincs lezárult aukció'}
          </p>
          <p className="text-zinc-600 text-sm mt-1">
            {search ? 'Próbálj más keresési kifejezést' : tab === 'active' && user ? 'Légy az első, aki aukcióz!' : ''}
          </p>
          {tab === 'active' && !search && user && (
            <button
              onClick={() => navigate('/create-auction')}
              className="mt-5 glass-pill-active text-emerald-300 px-6 py-3 rounded-xl text-sm font-semibold"
            >
              <Zap className="w-4 h-4 inline mr-1.5" />
              Aukció indítása
            </button>
          )}
        </div>
      )}
    </div>
  );
}
