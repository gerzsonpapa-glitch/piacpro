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
import { useSEO, SEO_PAGES } from '../lib/seo';

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
      className={`group text-left w-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 ${
        urgent
          ? 'ring-1 ring-red-500/30 glow-pulse-red'
          : 'glass-bubble hover:border-white/15'
      }`}
      style={urgent ? {
        background: 'linear-gradient(145deg, rgba(239,68,68,0.08), rgba(255,255,255,0.04))',
        border: '1px solid rgba(239,68,68,0.2)',
        boxShadow: '0 2px 16px -4px rgba(0,0,0,0.45)',
      } : {}}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {image
          ? <img src={image} alt={listing.title} loading="lazy" decoding="async" sizes="(max-width: 640px) 50vw, 25vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full bg-white/5 flex items-center justify-center"><Gavel className="w-10 h-10 text-zinc-600" /></div>
        }
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 to-transparent" />
        {isLastFiveMin && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-[10px] font-bold animate-pulse">
            <Flame className="w-3 h-3" />HOT
          </div>
        )}
        {urgent && !isLastFiveMin && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-[10px] font-bold">
            <Timer className="w-3 h-3" />MA LÉJ
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 glass-strong rounded-xl px-2 py-1.5">
          <Timer className={`w-3 h-3 ${isLastHour ? 'text-red-400' : 'text-amber-400'}`} />
          {countdown.waiting
            ? <span className="text-[10px] text-zinc-400">Első licit indítja</span>
            : countdown.done
            ? <span className="text-[10px] text-red-400">Lezárult</span>
            : <span className={`text-[10px] font-mono font-bold tracking-wider ${isLastHour ? 'text-red-300' : 'text-amber-300'}`}>
                {String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')}
              </span>
          }
        </div>
      </div>
      <div className="p-3.5">
        <p className="font-semibold text-zinc-100 truncate text-sm group-hover:text-amber-300 transition-colors leading-snug">{listing.title}</p>
        <div className="flex items-center justify-between mt-2">
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
      className="glass-bubble rounded-2xl p-4 text-left w-full transition-all duration-250 group flex items-center gap-3.5 hover:-translate-y-0.5">
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 glass flex items-center justify-center">
        {job.logo_url
          ? <img src={job.logo_url} alt={job.company} className="w-full h-full object-cover" />
          : <Building2 className="w-5 h-5 text-emerald-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 text-sm truncate group-hover:text-emerald-300 transition-colors">{job.title}</p>
        <p className="text-zinc-500 text-xs truncate mt-0.5">{job.company}</p>
        <div className="flex items-center gap-2 mt-1.5">
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
      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all duration-200" />
    </button>
  );
}

/* ── Section heading ──────────────────────────────────────────────── */
function SectionHead({
  icon: Icon,
  label,
  iconColor = 'text-emerald-400',
  count,
  linkLabel = 'Összes',
  linkColor = 'text-emerald-400 hover:text-emerald-300',
  onLink,
}: {
  icon: React.ElementType;
  label: string;
  iconColor?: string;
  count?: number;
  linkLabel?: string;
  linkColor?: string;
  onLink?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0`}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-100 leading-tight">{label}</h2>
          {count !== undefined && count > 0 && (
            <p className="text-[11px] text-zinc-600 mt-0.5">{count.toLocaleString('hu-HU')} db</p>
          )}
        </div>
      </div>
      {onLink && (
        <button onClick={onLink}
          className={`flex items-center gap-1.5 text-[13px] font-medium transition-all duration-200 hover:gap-2 ${linkColor}`}>
          {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-bubble rounded-2xl overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-1/2" />
      </div>
    </div>
  );
}

const RECENTLY_VIEWED_KEY = 'recently_viewed_listings';

const COUNTIES = [
  'Budapest', 'Baranya', 'Bács-Kiskun', 'Békés', 'Borsod-Abaúj-Zemplén',
  'Csongrád-Csanád', 'Fejér', 'Győr-Moson-Sopron', 'Hajdú-Bihar', 'Heves',
  'Jász-Nagykun-Szolnok', 'Komárom-Esztergom', 'Nógrád', 'Pest', 'Somogy',
  'Szabolcs-Szatmár-Bereg', 'Tolna', 'Vas', 'Veszprém', 'Zala',
];

export default function HomePage() {
  useSEO(SEO_PAGES.home);
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

  return (
    <div className="space-y-8 md:space-y-14">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl md:rounded-3xl p-5 sm:p-8 md:p-14 min-h-[320px] md:min-h-[360px] flex items-center"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09), 0 8px 40px -8px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(24px)',
        }}>
        {/* Glow orbs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/[0.07] rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-teal-500/[0.05] rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[180px] h-[180px] bg-sky-500/[0.04] rounded-full blur-[60px] pointer-events-none" />

        <div className="relative w-full max-w-2xl">
          {/* Label pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)' }}>
            <Star className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 text-[11px] font-semibold tracking-widest uppercase">Magyarország legjobb piactere</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-zinc-50">
            Vásárolj, add el,
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #6ee7b7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              találj munkát.
            </span>
          </h1>
          <p className="text-zinc-400 mt-5 text-base md:text-[1.05rem] max-w-xl leading-relaxed">
            Minden egy helyen: termékhirdetések, élő licitek és állásajánlatok. Gyors, egyszerű, megbízható.
          </p>

          {/* Stats row */}
          {(listingCount > 0 || auctionCount > 0 || jobCount > 0) && (
            <div className="flex items-center gap-5 mt-5 mb-6">
              {listingCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-zinc-500">{listingCount.toLocaleString('hu-HU')} hirdetés</span>
                </div>
              )}
              {auctionCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-xs text-zinc-500">{auctionCount} aktív licit</span>
                </div>
              )}
              {jobCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span className="text-xs text-zinc-500">{jobCount} állás</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-2.5 max-w-xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Mit keresel? Termék, állás, termelő..."
                  className="w-full pl-11 pr-4 py-3.5 glass-input rounded-2xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm" />
              </div>
              <div className="relative sm:w-44">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                <label htmlFor="search-location" className="sr-only">Helyszín szűrő</label>
                <select id="search-location" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-8 pr-3 py-3.5 glass-input rounded-2xl text-zinc-100 focus:outline-none text-sm cursor-pointer">
                  <option value="">Országos</option>
                  {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit"
                aria-label="Keresés mindenben"
                className="flex-1 py-3.5 glass-pill-active text-emerald-300 font-semibold rounded-2xl transition-all hover:scale-[1.01] text-sm">
                Keresés mindenben
              </button>
              <button type="button" onClick={(e) => handleMarketSearch(e as unknown as React.FormEvent)}
                aria-label="Keresés csak a piactéren"
                className="px-5 py-3.5 glass-pill text-zinc-400 hover:text-zinc-200 rounded-2xl text-sm font-medium transition-colors">
                Csak piactér
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── 3 HUB CARDS ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

        <button onClick={() => navigate('/search')}
          className="group glass rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-left transition-all duration-280 hover:scale-[1.015] hover:-translate-y-1 border border-white/[0.07] hover:border-emerald-500/25 relative overflow-hidden"
          style={{ transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-emerald-500/16 transition-all duration-500" />
          <div className="relative flex sm:block items-center gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)' }}>
              <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors sm:mb-2">Piactér</h2>
              <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed hidden sm:block sm:mb-6">
                Add el felesleges dolgaidat vagy vegyél olcsón másoktól.
              </p>
              <div className="flex items-center justify-between mt-1 sm:mt-0">
                <span className="text-xs text-zinc-600 font-medium">{listingCount.toLocaleString('hu-HU')} hirdetés</span>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold group-hover:gap-2 transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </button>

        <button onClick={() => navigate('/auctions')}
          className="group glass rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-left transition-all duration-280 hover:scale-[1.015] hover:-translate-y-1 border border-white/[0.07] hover:border-amber-500/25 relative overflow-hidden"
          style={{ transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-amber-500/16 transition-all duration-500" />
          <div className="relative flex sm:block items-center gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)' }}>
              <Gavel className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-zinc-100 group-hover:text-amber-300 transition-colors sm:mb-2">Licitek</h2>
              <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed hidden sm:block sm:mb-6">
                Licitálj valós időben. Az nyeri, aki a legtöbbet kínálja.
              </p>
              <div className="flex items-center justify-between mt-1 sm:mt-0">
                <span className="text-xs text-zinc-600 font-medium">{auctionCount} aktív licit</span>
                <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold group-hover:gap-2 transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </button>

        <button onClick={() => navigate('/jobs')}
          className="group glass rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-left transition-all duration-280 hover:scale-[1.015] hover:-translate-y-1 border border-white/[0.07] hover:border-sky-500/25 relative overflow-hidden"
          style={{ transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-sky-500/16 transition-all duration-500" />
          <div className="relative flex sm:block items-center gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.22)' }}>
              <Briefcase className="w-5 h-5 sm:w-7 sm:h-7 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-zinc-100 group-hover:text-sky-300 transition-colors sm:mb-2">Állások</h2>
              <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed hidden sm:block sm:mb-6">
                Találd meg az álmaid állását, vagy keress munkatársat.
              </p>
              <div className="flex items-center justify-between mt-1 sm:mt-0">
                <span className="text-xs text-zinc-600 font-medium">{jobCount} pozíció</span>
                <span className="flex items-center gap-1 text-sky-400 text-xs font-semibold group-hover:gap-2 transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
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
          <SectionHead
            icon={ShoppingBag}
            label="Kategóriák"
            iconColor="text-emerald-400"
            onLink={() => navigate('/search')}
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {categories.map((cat) => {
              const Icon = getIcon(cat.slug);
              const destination = cat.slug === 'termelok' ? '/helyi-vallalkozasok' : `/search?category=${cat.slug}`;
              return (
                <button key={cat.id} onClick={() => navigate(destination)}
                  className="group flex flex-col items-center gap-2.5 p-4 glass-bubble rounded-2xl transition-all duration-250 hover:scale-[1.05] hover:-translate-y-0.5 hover:border-emerald-500/20">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-250 group-hover:scale-110"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)' }}>
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
          <SectionHead
            icon={Flame}
            label="Ma lejáró licitek"
            iconColor="text-red-400"
            count={expiringAuctions.length > 0 ? expiringAuctions.length : undefined}
            linkLabel="Összes licit"
            linkColor="text-amber-400 hover:text-amber-300"
            onLink={() => navigate('/auctions')}
          />
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
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
          <SectionHead
            icon={Gavel}
            label="Aktív licitek"
            iconColor="text-amber-400"
            count={auctionCount}
            linkColor="text-amber-400 hover:text-amber-300"
            onLink={() => navigate('/auctions')}
          />
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {allAuctions.map((l) => <AuctionCard key={l.id} listing={l} />)}
            </div>
          )}
        </section>
      )}

      {/* ── NÉPSZERŰ ─────────────────────────────────────────────────────── */}
      {(loading || popularListings.length > 0) && (
        <section>
          <SectionHead
            icon={TrendingUp}
            label="Népszerű hirdetések"
            iconColor="text-amber-400"
            onLink={() => navigate('/search?sort=popular')}
          />
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
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
          <SectionHead icon={Clock} label="Nemrég nézett" iconColor="text-zinc-400" />
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {recentlyViewed.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* ── LEGFRISSEBB ──────────────────────────────────────────────────── */}
      <section>
        <SectionHead
          icon={Zap}
          label="Legfrissebb hirdetések"
          iconColor="text-emerald-400"
          count={listingCount}
          onLink={() => navigate('/search')}
        />
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : latestListings.length === 0 ? (
          <div className="glass rounded-2xl p-14 text-center">
            <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Még nincsenek hirdetések</p>
            {user && (
              <button onClick={() => navigate('/create')}
                className="mt-5 glass-pill-active text-emerald-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all">
                Légy az első
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {latestListings.map((l, i) => <ListingCard key={l.id} listing={l} priority={i < 4} />)}
          </div>
        )}
      </section>

      {/* ── ÁLLÁSOK ──────────────────────────────────────────────────────── */}
      <section>
        <SectionHead
          icon={Briefcase}
          label="Kiemelt állások"
          iconColor="text-sky-400"
          count={jobCount}
          linkColor="text-sky-400 hover:text-sky-300"
          onLink={() => navigate('/jobs')}
        />
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-bubble rounded-2xl h-[72px] skeleton" />)}
          </div>
        ) : featuredJobs.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
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
          <div className="space-y-2.5">
            {featuredJobs.map((job) => <JobMiniCard key={job.id} job={job} />)}
          </div>
        )}
      </section>

      {/* ── ADOMÁNYOK ────────────────────────────────────────────────────── */}
      {(loading || featuredDonations.length > 0) && (
        <section>
          <SectionHead
            icon={Heart}
            label="Adomány kampányok"
            iconColor="text-rose-400"
            linkColor="text-rose-400 hover:text-rose-300"
            onLink={() => navigate('/donations')}
          />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-bubble rounded-3xl overflow-hidden">
                  <div className="aspect-video skeleton" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-3.5 skeleton rounded w-3/4" />
                    <div className="h-1.5 skeleton rounded" />
                    <div className="h-3.5 skeleton rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {featuredDonations.map((d) => {
                const pct = d.goal_amount > 0 ? Math.min(Math.round((d.current_amount / d.goal_amount) * 100), 100) : 0;
                return (
                  <button key={d.id} onClick={() => navigate(`/donations/${d.id}`)}
                    className="group glass-bubble rounded-3xl overflow-hidden text-left transition-all duration-280 hover:scale-[1.02] hover:-translate-y-0.5"
                    style={{ transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
                    <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                      {d.images?.[0]
                        ? <img src={d.images[0]} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 text-zinc-700" /></div>
                      }
                      {d.is_verified && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />Hitelesített
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2.5">
                      <p className="font-semibold text-zinc-100 line-clamp-1 group-hover:text-rose-300 transition-colors text-sm">{d.title}</p>
                      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
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

      {/* ── HELYI VÁLLALKOZÁSOK CTA ──────────────────────────────────────── */}
      <section className="rounded-3xl p-7 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(52,211,153,0.06) 0%, rgba(255,255,255,0.03) 60%, rgba(20,184,166,0.04) 100%)',
          border: '1px solid rgba(52,211,153,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(52,211,153,0.08)',
        }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <MapPin className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-zinc-100 text-lg">Helyi vállalkozások</h2>
            <p className="text-zinc-500 text-sm mt-1">Kistermelők, kézművesek, kisboltok és szakemberek a közösségből</p>
          </div>
          <button onClick={() => navigate('/helyi-vallalkozasok')}
            className="glass-pill-active text-emerald-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all flex items-center gap-2 flex-shrink-0">
            Felfedezés <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FÓRUM CTA ───────────────────────────────────────────────────── */}
      <section className="rounded-3xl p-7 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(14,165,233,0.06) 0%, rgba(255,255,255,0.03) 60%, rgba(20,184,166,0.04) 100%)',
          border: '1px solid rgba(14,165,233,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(14,165,233,0.07)',
        }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-sky-500/10 rounded-full blur-[40px] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <MessageCircle className="w-6 h-6 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-zinc-100 text-lg">Közösségi Fórum</h2>
            <p className="text-zinc-500 text-sm mt-1">Kérdezz, segíts másoknak, oszd meg tapasztalataidat</p>
          </div>
          <button onClick={() => navigate('/forum')}
            className="text-sky-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all flex items-center gap-2 flex-shrink-0"
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.22)' }}>
            Csatlakozás <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── REGISZTRÁCIÓ CTA ─────────────────────────────────────────────── */}
      {!user && (
        <section className="rounded-3xl glass-strong p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-emerald-500/[0.07] rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-teal-500/[0.04] rounded-full blur-[60px] pointer-events-none" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)' }}>
              <Zap className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Csatlakozz ingyen!</h2>
            <p className="text-zinc-400 mt-4 text-lg leading-relaxed max-w-lg mx-auto">
              Regisztrálj és hirdesd termékeid, indíts liciteket, keress munkát — percek alatt.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
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
