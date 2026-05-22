import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import type { Listing, Job, Category, Producer, Donation } from '../lib/types';
import ListingCard from '../components/ListingCard';
import { normalizeListingAuction, formatPrice } from '../lib/utils';
import {
  Search, ArrowRight, ShoppingBag, Gavel, Briefcase,
  Timer, Flame, Users, TrendingUp, MapPin,
  PlusCircle, Building2, Wifi, Package,
  Zap, Star, Clock, ChevronRight,
  Home, Leaf, CheckCircle2,
  Palette, Scissors, Sprout, Monitor, Music, Shirt,
  Apple, BookOpen, Lightbulb, Gift, Heart, Target, MessageCircle
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  alkotasok: Palette,
  kezmuvesek: Scissors,
  termelok: Sprout,
  digitalis: Monitor,
  media: Music,
  'lakas-dekor': Home,
  divat: Shirt,
  elelmiszer: Apple,
  szolgaltatasok: Briefcase,
  oktatas: BookOpen,
  kreatif: Lightbulb,
  egyedi: Star,
  egyeb: Package,
};

function getIcon(slug: string): React.ElementType {
  return ICON_MAP[slug] || Package;
}

function useCountdown(endsAt: string, timerStarted: boolean) {
  const calc = useCallback(() => {
    if (!timerStarted) return { h: 0, m: 0, s: 0, total: 0, done: false, waiting: true };
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, total: 0, done: true, waiting: false };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      total: diff, done: false, waiting: false,
    };
  }, [endsAt, timerStarted]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

function AuctionCard({ listing, urgent }: { listing: Listing; urgent?: boolean }) {
  const { navigate } = useRouter();
  const auction = listing.auction;
  const countdown = useCountdown(auction?.ends_at || new Date().toISOString(), auction?.timer_started ?? false);
  const isLastHour = !countdown.waiting && !countdown.done && countdown.total < 3600000;
  const isLastFiveMin = !countdown.waiting && !countdown.done && countdown.total < 300000;
  const image = listing.images?.[0];

  return (
    <button onClick={() => navigate(`/auction/${listing.id}`)}
      className={`group text-left w-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${urgent ? 'ring-1 ring-red-500/30' : 'glass-bubble'}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {image
          ? <img src={image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full bg-white/5 flex items-center justify-center"><Gavel className="w-10 h-10 text-zinc-600" /></div>
        }
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
        {isLastFiveMin && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/90 px-2 py-1 rounded-lg text-white text-[10px] font-bold animate-pulse">
            <Flame className="w-3 h-3" />HOT
          </div>
        )}
        {urgent && !isLastFiveMin && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500/90 px-2 py-1 rounded-lg text-white text-[10px] font-bold">
            <Timer className="w-3 h-3" />MA LÉJ
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 glass-strong rounded-xl px-2 py-1">
          <Timer className={`w-3 h-3 ${isLastHour ? 'text-red-400' : 'text-amber-400'}`} />
          {countdown.waiting
            ? <span className="text-[10px] text-zinc-400">Első licit indítja</span>
            : countdown.done
            ? <span className="text-[10px] text-red-400">Lezárult</span>
            : <span className={`text-[10px] font-mono font-bold ${isLastHour ? 'text-red-300' : 'text-amber-300'}`}>
                {String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')}
              </span>
          }
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-zinc-100 truncate text-sm group-hover:text-amber-300 transition-colors">{listing.title}</p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-amber-400 font-bold text-sm">{formatPrice(auction?.current_price || listing.price)}</p>
          {(auction?.bid_count ?? 0) > 0 && (
            <p className="text-[10px] text-zinc-600 flex items-center gap-0.5">
              <Users className="w-3 h-3" />{auction?.bid_count} licit
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

const JOB_TYPES: Record<string, { label: string; color: string }> = {
  teljes:      { label: 'Teljes állás',      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  reszmunka:   { label: 'Részmunka',         color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  szabaduszo:  { label: 'Szabadúszó',        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  gyakorlat:   { label: 'Szakmai gyakorlat', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
};

function JobMiniCard({ job }: { job: Job }) {
  const { navigate } = useRouter();
  const typeInfo = JOB_TYPES[job.type] ?? JOB_TYPES.teljes;

  return (
    <button onClick={() => navigate('/jobs')}
      className="glass-bubble rounded-2xl p-4 text-left w-full hover:bg-white/5 transition-all group flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 glass flex items-center justify-center">
        {job.logo_url
          ? <img src={job.logo_url} alt={job.company} className="w-full h-full object-cover" />
          : <Building2 className="w-5 h-5 text-emerald-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 text-sm truncate group-hover:text-emerald-300 transition-colors">{job.title}</p>
        <p className="text-zinc-500 text-xs truncate">{job.company}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-medium ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
          {job.remote && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-sky-400"><Wifi className="w-2.5 h-2.5" />Remote</span>
          )}
          {job.location && (
            <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />{job.location}
            </span>
          )}
        </div>
      </div>
      {(job.salary_min || job.salary_max) && (
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-semibold text-emerald-400">
            {job.salary_min
              ? new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(job.salary_min / 1000) + 'e'
              : '—'
            }+
          </p>
          <p className="text-[10px] text-zinc-600">HUF/hó</p>
        </div>
      )}
      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover:text-zinc-400 transition-colors" />
    </button>
  );
}

const RECENTLY_VIEWED_KEY = 'recently_viewed_listings';

export default function HomePage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [popularListings, setPopularListings] = useState<Listing[]>([]);
  const [expiringAuctions, setExpiringAuctions] = useState<Listing[]>([]);
  const [allAuctions, setAllAuctions] = useState<Listing[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [featuredProducers, setFeaturedProducers] = useState<Producer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);
  const [featuredDonations, setFeaturedDonations] = useState<Donation[]>([]);

  const [listingCount, setListingCount] = useState(0);
  const [auctionCount, setAuctionCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchListings(), fetchAuctions(), fetchJobs(), fetchCategories(), fetchRecentlyViewed(), fetchProducers(), fetchDonations()])
      .finally(() => setLoading(false));
  }, []);

  async function fetchListings() {
    const [latestRes, popularRes] = await Promise.all([
      supabase.from('listings').select('*, seller:profiles(*)', { count: 'exact' })
        .eq('status', 'active').eq('listing_type', 'regular')
        .order('created_at', { ascending: false }).limit(8),
      supabase.from('listings').select('*, seller:profiles(*)')
        .eq('status', 'active').eq('listing_type', 'regular')
        .order('views', { ascending: false }).limit(4),
    ]);
    setLatestListings(latestRes.data || []);
    setListingCount(latestRes.count || 0);
    setPopularListings(popularRes.data || []);
  }

  async function fetchAuctions() {
    const { data, count } = await supabase
      .from('listings').select('*, auction:auctions(*)', { count: 'exact' })
      .eq('listing_type', 'auction').eq('status', 'active')
      .order('created_at', { ascending: false }).limit(12);

    const normalized = (data || []).map(normalizeListingAuction)
      .filter((l: Listing) => l.auction?.status === 'active');

    const now = Date.now();
    const expiring = normalized.filter((l: Listing) => {
      if (!l.auction?.timer_started || !l.auction?.ends_at) return false;
      const msLeft = new Date(l.auction.ends_at).getTime() - now;
      return msLeft > 0 && msLeft < 24 * 3600000;
    });

    setExpiringAuctions(expiring.slice(0, 4));
    setAllAuctions(normalized.slice(0, 4));
    setAuctionCount(count || 0);
  }

  async function fetchJobs() {
    const { data, count } = await supabase
      .from('jobs').select('*', { count: 'exact' })
      .eq('status', 'active').order('created_at', { ascending: false }).limit(4);
    setFeaturedJobs(data || []);
    setJobCount(count || 0);
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').is('parent_id', null).order('sort_order').limit(15);
    setCategories(data || []);
  }

  async function fetchProducers() {
    const { data } = await supabase
      .from('producers')
      .select('*, products:producer_products(id, name)')
      .order('is_verified', { ascending: false })
      .order('avg_rating', { ascending: false })
      .limit(4);
    setFeaturedProducers((data || []) as Producer[]);
  }

  async function fetchDonations() {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'active')
      .order('is_verified', { ascending: false })
      .order('current_amount', { ascending: false })
      .limit(3);
    setFeaturedDonations((data || []) as Donation[]);
  }

  async function fetchRecentlyViewed() {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
      if (ids.length === 0) return;
      const { data } = await supabase
        .from('listings')
        .select('*, seller:profiles(*)')
        .in('id', ids)
        .neq('status', 'deleted');
      if (data && data.length > 0) {
        const ordered = ids.map((id) => data.find((l) => l.id === id)).filter(Boolean) as Listing[];
        setRecentlyViewed(ordered.slice(0, 6));
      }
    } catch {
      // ignore
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (searchLocation) params.set('location', searchLocation);
    navigate(`/discover?${params.toString()}`);
  }

  function handleMarketSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (searchLocation) params.set('location', searchLocation);
    navigate(`/search?${params.toString()}`);
  }

  const COUNTIES = [
    'Budapest', 'Baranya', 'Bács-Kiskun', 'Békés', 'Borsod-Abaúj-Zemplén',
    'Csongrád-Csanád', 'Fejér', 'Győr-Moson-Sopron', 'Hajdú-Bihar', 'Heves',
    'Jász-Nagykun-Szolnok', 'Komárom-Esztergom', 'Nógrád', 'Pest', 'Somogy',
    'Szabolcs-Szatmár-Bereg', 'Tolna', 'Vas', 'Veszprém', 'Zala',
  ];

  return (
    <div className="space-y-12">

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl glass p-8 md:p-14 min-h-[340px] flex items-center">
        {/* decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-emerald-500/[0.06] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-teal-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[200px] h-[200px] bg-sky-500/[0.03] rounded-full blur-[60px] pointer-events-none" />

        <div className="relative w-full max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-5">
            <Star className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold tracking-wide">Magyarország legjobb piactere</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Vásárolj, add el,<br />
            <span className="text-emerald-400">találj munkát.</span>
          </h1>
          <p className="text-zinc-400 mt-4 text-base md:text-lg max-w-xl leading-relaxed">
            Minden egy helyen: termékhirdetések, élő licitek és állásajánlatok. Gyors, egyszerű, megbízható.
          </p>

          <form onSubmit={handleSearch} className="mt-8 space-y-2.5 max-w-xl">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Mit keresel? Termék, állás, termelő..."
                  className="w-full pl-11 pr-4 py-3.5 glass-input rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
              </div>
              <div className="relative sm:w-44">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                <select value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-8 pr-3 py-3.5 glass-input rounded-2xl text-zinc-100 focus:outline-none text-sm cursor-pointer">
                  <option value="">Országos</option>
                  {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit"
                className="flex-1 py-3 glass-pill-active text-emerald-300 font-semibold rounded-2xl transition-all hover:scale-[1.01] text-sm">
                Keresés mindenben
              </button>
              <button type="button" onClick={(e) => handleMarketSearch(e as unknown as React.FormEvent)}
                className="px-4 py-3 glass-pill text-zinc-400 hover:text-zinc-200 rounded-2xl text-sm font-medium transition-colors">
                Csak piactér
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── 3 SECTION HUB ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Piactér */}
        <button onClick={() => navigate('/search')}
          className="group glass rounded-3xl p-6 text-left hover:bg-white/[0.04] transition-all hover:scale-[1.01] border border-white/5 hover:border-emerald-500/25 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-500/8 rounded-full blur-[40px]" />
          <div className="relative">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-5">
              <ShoppingBag className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors mb-1">Piactér</h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-5">
              Add el felesleges dolgaidat vagy vegyél olcsón másoktól.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 font-medium">{listingCount.toLocaleString('hu-HU')} aktív hirdetés</span>
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold group-hover:gap-2 transition-all">
                Böngészés <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </button>

        {/* Licitek */}
        <button onClick={() => navigate('/auctions')}
          className="group glass rounded-3xl p-6 text-left hover:bg-white/[0.04] transition-all hover:scale-[1.01] border border-white/5 hover:border-amber-500/25 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-500/8 rounded-full blur-[40px]" />
          <div className="relative">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-5">
              <Gavel className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100 group-hover:text-amber-300 transition-colors mb-1">Licitek</h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-5">
              Licitálj valós időben. Az nyeri, aki a legtöbbet kínálja.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 font-medium">{auctionCount} aktív licit</span>
              <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold group-hover:gap-2 transition-all">
                Licitek <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </button>

        {/* Állások */}
        <button onClick={() => navigate('/jobs')}
          className="group glass rounded-3xl p-6 text-left hover:bg-white/[0.04] transition-all hover:scale-[1.01] border border-white/5 hover:border-sky-500/25 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-sky-500/8 rounded-full blur-[40px]" />
          <div className="relative">
            <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mb-5">
              <Briefcase className="w-7 h-7 text-sky-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100 group-hover:text-sky-300 transition-colors mb-1">Állások</h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-5">
              Találd meg az álmaid állását, vagy keress munkatársat.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 font-medium">{jobCount} nyitott pozíció</span>
              <span className="flex items-center gap-1 text-sky-400 text-xs font-semibold group-hover:gap-2 transition-all">
                Állások <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </button>
      </section>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      {user && (
        <section className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/create')}
            className="flex items-center gap-2 glass-pill px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-emerald-300 transition-colors">
            <PlusCircle className="w-4 h-4 text-emerald-400" />Hirdetés feladása
          </button>
          <button onClick={() => navigate('/create-auction')}
            className="flex items-center gap-2 glass-pill px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-amber-300 transition-colors">
            <Gavel className="w-4 h-4 text-amber-400" />Licit indítása
          </button>
          <button onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 glass-pill px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-sky-300 transition-colors">
            <Briefcase className="w-4 h-4 text-sky-400" />Állás feladása
          </button>
        </section>
      )}

      {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />Kategóriák
              </h2>
              <p className="text-zinc-500 text-sm mt-0.5">Alkotók, termelők, szolgáltatók — minden egy helyen</p>
            </div>
            <button onClick={() => navigate('/search')}
              className="text-emerald-400 text-sm font-medium hover:text-emerald-300 flex items-center gap-1 transition-colors">
              Összes <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {categories.map((cat) => {
              const Icon = getIcon(cat.slug);
              const destination = cat.slug === 'termelok' ? '/helyi-vallalkozasok' : `/search?category=${cat.slug}`;
              return (
                <button key={cat.id} onClick={() => navigate(destination)}
                  className="group flex flex-col items-center gap-2.5 p-4 glass-bubble rounded-2xl transition-all duration-300 hover:scale-[1.04] hover:bg-emerald-500/5 border border-transparent hover:border-emerald-500/15">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 group-hover:text-emerald-300 transition-colors text-center leading-tight line-clamp-2">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── MA LEJÁRÓ LICITEK ────────────────────────────────────────────── */}
      {(loading || expiringAuctions.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-400" />
              <span>Ma lejáró licitek</span>
              {expiringAuctions.length > 0 && (
                <span className="px-2 py-0.5 bg-red-500/15 border border-red-500/25 rounded-full text-red-400 text-xs font-bold">
                  {expiringAuctions.length} db
                </span>
              )}
            </h2>
            <button onClick={() => navigate('/auctions')}
              className="text-amber-400 text-sm font-medium hover:text-amber-300 flex items-center gap-1 transition-colors">
              Összes licit <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-bubble rounded-2xl aspect-[3/4] animate-pulse" />)}
            </div>
          ) : expiringAuctions.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-sm">Jelenleg nincs ma lejáró licit</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {expiringAuctions.map((l) => <AuctionCard key={l.id} listing={l} urgent />)}
            </div>
          )}
        </section>
      )}

      {/* ── AKTÍV LICITEK ────────────────────────────────────────────────── */}
      {(loading || allAuctions.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Gavel className="w-5 h-5 text-amber-400" />Aktív licitek
              {auctionCount > 0 && <span className="text-sm font-normal text-zinc-500">({auctionCount})</span>}
            </h2>
            <button onClick={() => navigate('/auctions')}
              className="text-amber-400 text-sm font-medium hover:text-amber-300 flex items-center gap-1 transition-colors">
              Összes <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-bubble rounded-2xl aspect-[3/4] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {allAuctions.map((l) => <AuctionCard key={l.id} listing={l} />)}
            </div>
          )}
        </section>
      )}

      {/* ── NÉPSZERŰ HIRDETÉSEK ──────────────────────────────────────────── */}
      {(loading || popularListings.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />Népszerű hirdetések
            </h2>
            <button onClick={() => navigate('/search?sort=popular')}
              className="text-emerald-400 text-sm font-medium hover:text-emerald-300 flex items-center gap-1 transition-colors">
              Összes <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-bubble rounded-3xl overflow-hidden animate-pulse"><div className="aspect-[4/3] bg-white/5" /><div className="p-4 space-y-2"><div className="h-4 bg-white/5 rounded w-3/4" /><div className="h-5 bg-white/5 rounded w-1/2" /></div></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {popularListings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </section>
      )}

      {/* ── NEMRÉG NÉZETT ────────────────────────────────────────────────── */}
      {recentlyViewed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />Nemrég nézett
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {recentlyViewed.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* ── LEGFRISSEBB HIRDETÉSEK ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />Legfrissebb hirdetések
            {listingCount > 0 && <span className="text-sm font-normal text-zinc-500">({listingCount.toLocaleString('hu-HU')})</span>}
          </h2>
          <button onClick={() => navigate('/search')}
            className="text-emerald-400 text-sm font-medium hover:text-emerald-300 flex items-center gap-1 transition-colors">
            Összes <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass-bubble rounded-3xl overflow-hidden animate-pulse"><div className="aspect-[4/3] bg-white/5" /><div className="p-4 space-y-2"><div className="h-4 bg-white/5 rounded w-3/4" /><div className="h-5 bg-white/5 rounded w-1/2" /></div></div>)}
          </div>
        ) : latestListings.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">Még nincsenek hirdetések</p>
            {user && (
              <button onClick={() => navigate('/create')}
                className="mt-4 glass-pill-active text-emerald-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all">
                Légy az első
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {latestListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* ── KIEMELT ÁLLÁSOK ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-sky-400" />Kiemelt állások
            {jobCount > 0 && <span className="text-sm font-normal text-zinc-500">({jobCount})</span>}
          </h2>
          <button onClick={() => navigate('/jobs')}
            className="text-sky-400 text-sm font-medium hover:text-sky-300 flex items-center gap-1 transition-colors">
            Összes <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-bubble rounded-2xl h-16 animate-pulse" />)}
          </div>
        ) : featuredJobs.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Briefcase className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">Még nincsenek álláshirdetések</p>
            {user && (
              <button onClick={() => navigate('/jobs')}
                className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                Adj fel az elsőt →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {featuredJobs.map((job) => <JobMiniCard key={job.id} job={job} />)}
          </div>
        )}
      </section>

      {/* ── ADOMÁNY KAMPÁNYOK ────────────────────────────────────────────── */}
      {(loading || featuredDonations.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />Adomány kampányok
            </h2>
            <button onClick={() => navigate('/donations')}
              className="text-rose-400 text-sm font-medium hover:text-rose-300 flex items-center gap-1 transition-colors">
              Összes <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-bubble rounded-3xl overflow-hidden animate-pulse"><div className="aspect-video bg-white/5" /><div className="p-4 space-y-2"><div className="h-4 bg-white/5 rounded w-3/4" /><div className="h-1.5 bg-white/5 rounded" /><div className="h-4 bg-white/5 rounded w-1/2" /></div></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {featuredDonations.map((d) => {
                const pct = d.goal_amount > 0 ? Math.min(Math.round((d.current_amount / d.goal_amount) * 100), 100) : 0;
                return (
                  <button key={d.id} onClick={() => navigate(`/donations/${d.id}`)}
                    className="group glass-bubble rounded-3xl overflow-hidden text-left hover:scale-[1.02] transition-all duration-300">
                    <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                      {d.images?.[0]
                        ? <img src={d.images[0]} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 text-zinc-700" /></div>
                      }
                      {d.is_verified && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/90 px-2 py-1 rounded-lg text-white text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />Hitelesített
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="font-semibold text-zinc-100 line-clamp-1 group-hover:text-rose-300 transition-colors text-sm">{d.title}</p>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-rose-400 font-bold text-sm">{d.current_amount.toLocaleString('hu-HU')} Ft</span>
                        {d.goal_amount > 0 && <span className="text-zinc-600 text-xs flex items-center gap-0.5"><Target className="w-3 h-3" />{pct}%</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── HELYI VÁLLALKOZÁSOK CTA ─────────────────────────────────────── */}
      <section className="glass rounded-3xl p-6 relative overflow-hidden border border-emerald-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-zinc-100 text-lg">Helyi vállalkozások</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Kistermelők, kézművesek, kisboltok és szakemberek a közösségből</p>
          </div>
          <button onClick={() => navigate('/helyi-vallalkozasok')}
            className="glass-pill-active text-emerald-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all flex items-center gap-2 flex-shrink-0">
            Felfedezés <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FÓRUM CTA ───────────────────────────────────────────────────── */}
      <section className="glass rounded-3xl p-6 relative overflow-hidden border border-sky-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-teal-500/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-6 h-6 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-zinc-100 text-lg">Közösségi Fórum</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Kérdezz, segíts másoknak, oszd meg tapasztalataidat</p>
          </div>
          <button onClick={() => navigate('/forum')}
            className="text-sky-300 border border-sky-500/25 bg-sky-500/10 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-500/15 hover:scale-[1.02] transition-all flex items-center gap-2 flex-shrink-0">
            Csatlakozás <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      {!user && (
        <section className="rounded-3xl glass-strong p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/6 rounded-full blur-[80px]" />
          <div className="relative">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Zap className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Csatlakozz ingyen!</h2>
            <p className="text-zinc-400 mt-3 text-lg leading-relaxed max-w-lg mx-auto">
              Regisztrálj és hirdesd termékeid, indíts liciteket, keress munkát — percek alatt.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-7">
              <button onClick={() => navigate('/register')}
                className="px-8 py-3.5 glass-pill-active text-emerald-300 font-semibold rounded-2xl hover:scale-[1.03] transition-all text-sm">
                Regisztráció — ingyenes
              </button>
              <button onClick={() => navigate('/login')}
                className="px-6 py-3.5 glass-pill text-zinc-400 font-medium rounded-2xl hover:text-zinc-200 transition-colors text-sm">
                Bejelentkezés
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
