import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import type { Listing, Job, Donation } from '../lib/types';
import { normalizeListingAuction, formatPrice } from '../lib/utils';
import {
  ShoppingBag, Gavel, Briefcase, Timer, Flame, Users, TrendingUp,
  MapPin, Building2, Wifi, Package, Zap, Clock, ChevronRight,
  Leaf, CheckCircle2, Heart, Target, MessageCircle, ArrowRight,
  PlusCircle, Activity, Search, Star, Sparkles,
} from 'lucide-react';
import { useSEO, SEO_PAGES } from '../lib/seo';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import { applyQuarterOverrides } from '../lib/siteCustomization';
import type { QuarterId } from '../lib/siteCustomization';
import ListingCard from '../components/ListingCard';

/* ── Countdown ─────────────────────────────────────────────────── */
function useCountdown(endsAt: string, started: boolean) {
  const calc = useCallback(() => {
    if (!started) return { h: 0, m: 0, s: 0, total: 0, done: false, waiting: true };
    const d = new Date(endsAt).getTime() - Date.now();
    if (d <= 0) return { h: 0, m: 0, s: 0, total: 0, done: true, waiting: false };
    return { h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000), total: d, done: false, waiting: false };
  }, [endsAt, started]);
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [calc]);
  return t;
}

/* ── Small auction card ─────────────────────────────────────────── */
function AuctionCard({ listing, urgent }: { listing: Listing; urgent?: boolean }) {
  const { navigate } = useRouter();
  const au = listing.auction;
  const cd = useCountdown(au?.ends_at || new Date().toISOString(), au?.timer_started ?? false);
  const lastH = !cd.waiting && !cd.done && cd.total < 3600000;
  const lastF = !cd.waiting && !cd.done && cd.total < 300000;
  const img = listing.images?.[0];
  return (
    <button onClick={() => navigate(`/auction/${listing.id}`)}
      className="group text-left w-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      style={urgent ? {
        background: 'linear-gradient(145deg, rgba(239,68,68,0.1), rgba(13,27,42,0.8))',
        border: '1px solid rgba(239,68,68,0.25)',
        boxShadow: '0 0 20px rgba(239,68,68,0.1)',
      } : { background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(0,208,132,0.1)' }}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {img ? <img src={img} alt={listing.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(13,27,42,0.5)' }}><Gavel className="w-10 h-10 text-zinc-700" /></div>}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
        {lastF && <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-black animate-pulse" style={{ background: 'rgba(239,68,68,0.9)' }}><Flame className="w-3 h-3" />HOT</div>}
        {urgent && !lastF && <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-black" style={{ background: 'rgba(245,158,11,0.9)' }}><Timer className="w-3 h-3" />MA LÉJ</div>}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5" style={{ background: 'rgba(7,17,31,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,208,132,0.15)' }}>
          <Timer className={`w-3 h-3 ${lastH ? 'text-red-400' : 'text-[#00d084]'}`} />
          {cd.waiting ? <span className="text-[10px] text-zinc-400">Első licit indítja</span>
            : cd.done ? <span className="text-[10px] text-red-400">Lezárult</span>
            : <span className={`text-[10px] font-mono font-black tracking-wider ${lastH ? 'text-red-300' : 'text-[#00d084]'}`}>{String(cd.h).padStart(2,'0')}:{String(cd.m).padStart(2,'0')}:{String(cd.s).padStart(2,'0')}</span>}
        </div>
      </div>
      <div className="p-3.5">
        <p className="font-semibold text-zinc-100 truncate text-sm group-hover:text-[#00d084] transition-colors">{listing.title}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[#00d084] font-black text-sm">{formatPrice(au?.current_price || listing.price)}</p>
          {(au?.bid_count ?? 0) > 0 && <p className="text-[10px] text-zinc-500 flex items-center gap-0.5"><Users className="w-3 h-3" />{au?.bid_count} licit</p>}
        </div>
      </div>
    </button>
  );
}

/* ── Job card ───────────────────────────────────────────────────── */
const JOB_COLORS: Record<string, string> = {
  teljes: 'text-[#00d084] bg-[rgba(0,208,132,0.1)] border-[rgba(0,208,132,0.25)]',
  reszmunka: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  szabaduszo: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  gyakorlat: 'text-teal-400 bg-teal-500/10 border-teal-500/25',
};
const JOB_LABELS: Record<string, string> = { teljes: 'Teljes', reszmunka: 'Részmunka', szabaduszo: 'Szabadúszó', gyakorlat: 'Gyakorlat' };

function JobCard({ job }: { job: Job }) {
  const { navigate } = useRouter();
  return (
    <button onClick={() => navigate('/jobs')}
      className="rounded-2xl p-4 text-left w-full group flex items-center gap-3.5 transition-all hover:-translate-y-0.5 hover:border-[rgba(0,208,132,0.25)]"
      style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(0,208,132,0.08)' }}>
      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.15)' }}>
        {job.logo_url ? <img src={job.logo_url} alt={job.company} className="w-full h-full object-cover rounded-xl" /> : <Building2 className="w-5 h-5 text-[#00d084]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 text-sm truncate group-hover:text-[#00d084] transition-colors">{job.title}</p>
        <p className="text-zinc-500 text-xs truncate mt-0.5">{job.company}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${JOB_COLORS[job.type] ?? JOB_COLORS.teljes}`}>{JOB_LABELS[job.type] ?? 'Teljes'}</span>
          {job.remote && <span className="text-[10px] text-sky-400 flex items-center gap-0.5"><Wifi className="w-2.5 h-2.5" />Távmunka</span>}
          {job.location && <span className="text-[10px] text-zinc-600 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{job.location}</span>}
        </div>
      </div>
      {(job.salary_min || job.salary_max) && (
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-black text-[#00d084]">{job.salary_min ? new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(job.salary_min / 1000) + 'e' : '—'}+</p>
          <p className="text-[10px] text-zinc-600">HUF/hó</p>
        </div>
      )}
      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover:text-[#00d084] group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

/* ── Section header ─────────────────────────────────────────────── */
function SectionHead({ icon: Icon, label, iconColor = 'text-[#00d084]', count, linkLabel = 'Összes', linkColor = 'text-[#00d084] hover:text-emerald-300', onLink }: {
  icon: React.ElementType; label: string; iconColor?: string; count?: number; linkLabel?: string; linkColor?: string; onLink?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.15)' }}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-100 leading-tight">{label}</h2>
          {count !== undefined && count > 0 && <p className="text-[11px] text-zinc-600 mt-0.5">{count.toLocaleString('hu-HU')} db</p>}
        </div>
      </div>
      {onLink && (
        <button onClick={onLink} className={`flex items-center gap-1.5 text-[13px] font-semibold transition-all hover:gap-2 ${linkColor}`}>
          {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(0,208,132,0.07)' }}>
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-2.5"><div className="h-3.5 skeleton rounded w-3/4" /><div className="h-4 skeleton rounded w-1/2" /></div>
    </div>
  );
}

/* ── District data — each with its own Pexels image ─────────────── */
const QUARTERS = [
  {
    id: 'piac-ter' as QuarterId,
    label: 'PIAC TÉR',
    sublabel: 'Adok-veszek hirdetések',
    icon: ShoppingBag,
    color: '#00d084',
    bg: 'rgba(0,208,132,0.18)',
    border: 'rgba(0,208,132,0.5)',
    glow: 'rgba(0,208,132,0.35)',
    path: '/search',
    countKey: 'listing' as const,
    img: 'https://images.pexels.com/photos/1435752/pexels-photo-1435752.jpeg?auto=compress&cs=tinysrgb&w=800',
    desc: 'Vásárolj, adj el, cserélj',
    pos: { top: '33%', left: '19%' },
  },
  {
    id: 'munka-negyed' as QuarterId,
    label: 'MUNKA NEGYED',
    sublabel: 'Állások, munkalehetőségek',
    icon: Briefcase,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.18)',
    border: 'rgba(59,130,246,0.5)',
    glow: 'rgba(59,130,246,0.35)',
    path: '/jobs',
    countKey: 'job' as const,
    img: 'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=800',
    desc: 'Találd meg álmaid munkáját',
    pos: { top: '21%', left: '42%' },
  },
  {
    id: 'boltok-utcaja' as QuarterId,
    label: 'BOLTOK UTCÁJA',
    sublabel: 'Üzletek, szolgáltatók',
    icon: Building2,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.18)',
    border: 'rgba(245,158,11,0.5)',
    glow: 'rgba(245,158,11,0.35)',
    path: '/helyi-vallalkozasok',
    countKey: null,
    img: 'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=800',
    desc: 'Fedezd fel a legjobb boltokat',
    pos: { top: '29%', left: '62%' },
  },
  {
    id: 'licit-csarnok' as QuarterId,
    label: 'LICIT CSARNOK',
    sublabel: 'Licitálj és nyerj',
    icon: Gavel,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.18)',
    border: 'rgba(168,85,247,0.5)',
    glow: 'rgba(168,85,247,0.35)',
    path: '/auctions',
    countKey: 'auction' as const,
    img: 'https://images.pexels.com/photos/3760072/pexels-photo-3760072.jpeg?auto=compress&cs=tinysrgb&w=800',
    desc: 'Élő licitek, valós idő',
    pos: { top: '51%', left: '15%' },
  },
  {
    id: 'kozossegi-ter' as QuarterId,
    label: 'KÖZÖSSÉGI TÉR',
    sublabel: 'Fórum, hírek, események',
    icon: Users,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.18)',
    border: 'rgba(56,189,248,0.5)',
    glow: 'rgba(56,189,248,0.35)',
    path: '/forum',
    countKey: null,
    img: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
    desc: 'Csatlakozz a közösséghez',
    pos: { top: '49%', left: '62%' },
  },
  {
    id: 'adomany-kozpont' as QuarterId,
    label: 'ADOMÁNY KÖZPONT',
    sublabel: 'Segíts és segítséget kapj',
    icon: Heart,
    color: '#eab308',
    bg: 'rgba(234,179,8,0.18)',
    border: 'rgba(234,179,8,0.5)',
    glow: 'rgba(234,179,8,0.35)',
    path: '/donations',
    countKey: null,
    img: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800',
    desc: 'Adj, kapj, változtass',
    pos: { top: '68%', left: '30%' },
  },
  {
    id: 'termelok-piaca' as QuarterId,
    label: 'TERMELŐK PIACA',
    sublabel: 'Helyi termelők, friss termékek',
    icon: Leaf,
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.18)',
    border: 'rgba(74,222,128,0.5)',
    glow: 'rgba(74,222,128,0.35)',
    path: '/helyi-vallalkozasok',
    countKey: null,
    img: 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=800',
    desc: 'Friss, helyi, természetes',
    pos: { top: '68%', left: '54%' },
  },
];

const QUICK_ACCESS = [
  { icon: PlusCircle,    label: 'Hirdetés feladása', sub: 'Ingyenesen, egyszerűen',  path: '/create',      color: '#00d084' },
  { icon: Search,        label: 'Keresés',           sub: 'Találd meg, amit keresel', path: '/discover',   color: '#3b82f6' },
  { icon: MessageCircle, label: 'Üzenetek',          sub: 'Beszélgess biztonságosan', path: '/messages',   color: '#38bdf8' },
  { icon: Activity,      label: 'Értesítések',       sub: 'Maradj naprakész',         path: '/messages',   color: '#f59e0b' },
  { icon: Heart,         label: 'Kedvencek',         sub: 'Mentsd el, ami tetszik',   path: '/favorites',  color: '#ec4899' },
  { icon: Star,          label: 'Profilom',          sub: 'Beállítások, adatok',      path: '/profile',    color: '#4ade80' },
];

const POPULAR = ['iPhone', 'bicikli', 'kanapé', 'munkalehetőség', 'laptop', 'autó', 'albérlet', 'kutya'];
const RECENTLY_VIEWED_KEY = 'recently_viewed_listings';

/* ── District cards shown below hero in a grid ───────────────────── */
function DistrictGrid({
  quarters,
  onNav,
  counts,
}: {
  quarters: typeof QUARTERS;
  onNav: (p: string) => void;
  counts: { listing: number; auction: number; job: number };
}) {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {quarters.map((q, i) => {
        const Icon = q.icon;
        const cnt = q.countKey === 'listing' ? counts.listing : q.countKey === 'auction' ? counts.auction : q.countKey === 'job' ? counts.job : 0;
        const isHov = hov === i;
        return (
          <button
            key={q.label}
            onClick={() => onNav(q.path)}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
            className="group relative rounded-2xl overflow-hidden transition-all duration-300 text-left"
            style={{
              border: isHov ? `1px solid ${q.border}` : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isHov ? `0 12px 40px rgba(0,0,0,0.5), 0 0 28px ${q.glow}` : '0 4px 16px rgba(0,0,0,0.3)',
              transform: isHov ? 'translateY(-6px) scale(1.03)' : 'none',
            }}
          >
            {/* District background image */}
            <div className="relative h-32 sm:h-36 overflow-hidden">
              <img
                src={q.img}
                alt={q.label}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Color gradient overlay */}
              <div className="absolute inset-0" style={{
                background: `linear-gradient(to bottom, rgba(7,17,31,0.25) 0%, rgba(7,17,31,0.05) 40%, ${q.bg.replace('0.18','0.55')} 100%)`
              }} />
              {/* Neon icon top-right */}
              <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(7,17,31,0.75)', backdropFilter: 'blur(12px)', border: `1px solid ${q.border}` }}>
                <Icon style={{ color: q.color, width: '1rem', height: '1rem' }} />
              </div>
              {/* Count badge */}
              {cnt > 0 && (
                <div className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded-lg text-[9px] font-black"
                  style={{ background: 'rgba(7,17,31,0.8)', backdropFilter: 'blur(8px)', color: q.color, border: `1px solid ${q.border}` }}>
                  {cnt.toLocaleString('hu-HU')} db
                </div>
              )}
            </div>
            {/* Text area */}
            <div className="p-3" style={{ background: 'rgba(7,17,31,0.9)' }}>
              <div className="text-[11px] font-black tracking-wider uppercase leading-tight mb-0.5" style={{ color: q.color }}>
                {q.label}
              </div>
              <div className="text-[10px] text-zinc-400 leading-snug">{q.desc}</div>
            </div>
            {/* Hover neon border */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: `inset 0 0 0 1px ${q.border}` }} />
          </button>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  useSEO(SEO_PAGES.home);
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { config, devModeActive } = useSiteCustomization();
  const quarters = useMemo(
    () => applyQuarterOverrides(QUARTERS, config.quarters),
    [config.quarters],
  );

  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [popularListings, setPopularListings] = useState<Listing[]>([]);
  const [expiringAuctions, setExpiringAuctions] = useState<Listing[]>([]);
  const [allAuctions, setAllAuctions] = useState<Listing[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);
  const [featuredDonations, setFeaturedDonations] = useState<Donation[]>([]);

  const [listingCount, setListingCount] = useState(0);
  const [auctionCount, setAuctionCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 1200) + 1800);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [hovQ, setHovQ] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([fetchListings(), fetchAuctions(), fetchJobs(), fetchRecentlyViewed(), fetchDonations()])
      .finally(() => setLoading(false));
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  async function fetchListings() {
    const [a, b] = await Promise.all([
      supabase.from('listings').select('*, seller:profiles(*)', { count: 'exact' }).eq('status','active').eq('listing_type','regular').order('created_at',{ascending:false}).limit(8),
      supabase.from('listings').select('*, seller:profiles(*)').eq('status','active').eq('listing_type','regular').order('views',{ascending:false}).limit(4),
    ]);
    setLatestListings(a.data || []); setListingCount(a.count || 0); setPopularListings(b.data || []);
  }
  async function fetchAuctions() {
    const { data, count } = await supabase.from('listings').select('*, auction:auctions(*)',{count:'exact'}).eq('listing_type','auction').eq('status','active').order('created_at',{ascending:false}).limit(12);
    const norm = (data||[]).map(normalizeListingAuction).filter((l:Listing)=>l.auction?.status==='active');
    const now = Date.now();
    setExpiringAuctions(norm.filter((l:Listing)=>{
      if(!l.auction?.timer_started||!l.auction?.ends_at) return false;
      const ms = new Date(l.auction.ends_at).getTime()-now;
      return ms>0 && ms<86400000;
    }).slice(0,4));
    setAllAuctions(norm.slice(0,4)); setAuctionCount(count||0);
  }
  async function fetchJobs() {
    const { data, count } = await supabase.from('jobs').select('*',{count:'exact'}).eq('status','active').order('created_at',{ascending:false}).limit(4);
    setFeaturedJobs(data||[]); setJobCount(count||0);
  }
  async function fetchDonations() {
    const { data } = await supabase.from('donations').select('*').eq('status','active').order('is_verified',{ascending:false}).order('current_amount',{ascending:false}).limit(3);
    setFeaturedDonations((data||[]) as Donation[]);
  }
  async function fetchRecentlyViewed() {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)||'[]');
      if(!ids.length) return;
      const { data } = await supabase.from('listings').select('*, seller:profiles(*)').in('id',ids).neq('status','deleted');
      if(data?.length) setRecentlyViewed(ids.map(id=>data.find(l=>l.id===id)).filter(Boolean) as Listing[]);
    } catch { /* ignore */ }
  }

  return (
    <div style={{ background: '#07111f' }}>

      {/* ═══════════════════════════════════════════════════════════
          HERO — városkép
      ═══════════════════════════════════════════════════════════ */}
      <section
        className={`relative w-full overflow-hidden ${devModeActive ? 'ring-2 ring-[#00d084]/50 ring-inset' : ''}`}
        style={{ height: 'clamp(520px, 80vh, 820px)' }}
      >

        {/* City background */}
        <img src={config.hero.imageUrl} alt="PiacPro városképe"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: `brightness(${config.hero.brightness}) saturate(1.25)` }} fetchPriority="high" />

        {/* Gradients */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(7,17,31,0.55) 0%, rgba(7,17,31,0.05) 22%, rgba(7,17,31,0.05) 52%, rgba(7,17,31,0.8) 82%, rgba(7,17,31,1) 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(7,17,31,0.9) 0%, rgba(7,17,31,0.5) 14%, transparent 28%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(7,17,31,0.9) 0%, rgba(7,17,31,0.5) 14%, transparent 28%)' }} />

        {/* Scan line + grid */}
        <div className="scan-line" />
        <div className="absolute inset-0 pointer-events-none grid-overlay opacity-25" />

        {/* ── Top title ── */}
        <div className={`absolute top-5 inset-x-0 flex flex-col items-center z-10 pointer-events-none transition-all duration-700 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-[0.12em] uppercase text-center px-4"
            style={{ color: '#fff', textShadow: '0 2px 30px rgba(0,0,0,0.9), 0 0 60px rgba(0,208,132,0.3)' }}>
            {config.hero.title}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-300 text-center px-4" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
            {config.hero.subtitle}
          </p>
          {/* City center badge */}
          <div className="mt-4 w-14 h-14 rounded-full flex items-center justify-center float-anim pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
            style={{ background: 'radial-gradient(circle, rgba(0,208,132,0.25), rgba(7,17,31,0.85))', border: '2px solid rgba(0,208,132,0.55)', boxShadow: '0 0 40px rgba(0,208,132,0.45), inset 0 0 20px rgba(0,208,132,0.12)' }}
            onClick={() => navigate('/')}>
            <div className="text-center leading-none">
              <div className="text-[11px] font-black" style={{ color: '#00d084' }}>Piac</div>
              <div className="text-[11px] font-black text-white">Pro</div>
            </div>
          </div>
        </div>

        {/* ── 7 district pins over city image ── */}
        <div className="absolute inset-0 z-20">
          {quarters.map((q, i) => {
            const Icon = q.icon;
            const cnt = q.countKey === 'listing' ? listingCount : q.countKey === 'auction' ? auctionCount : q.countKey === 'job' ? jobCount : 0;
            const hov = hovQ === i;
            return (
              <button key={q.label}
                onClick={() => navigate(q.path)}
                onMouseEnter={() => setHovQ(i)}
                onMouseLeave={() => setHovQ(null)}
                className={`absolute transition-all duration-300 ${ready ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                style={{
                  top: q.pos.top, left: q.pos.left,
                  transitionDelay: ready ? `${i * 55}ms` : '0ms',
                  transform: hov ? 'scale(1.12) translateY(-5px)' : 'scale(1)',
                  zIndex: hov ? 30 : 20,
                }}>
                <div className="rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
                  style={{
                    minWidth: '158px',
                    background: hov ? q.bg : 'rgba(7,17,31,0.82)',
                    border: `1px solid ${hov ? q.border : 'rgba(255,255,255,0.13)'}`,
                    backdropFilter: 'blur(18px)',
                    boxShadow: hov ? `0 10px 36px rgba(0,0,0,0.55), 0 0 28px ${q.glow}` : '0 4px 20px rgba(0,0,0,0.5)',
                    transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: q.bg, border: `1px solid ${q.border}` }}>
                    <Icon style={{ color: q.color, width: '1.1rem', height: '1.1rem' }} />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-black tracking-wider uppercase leading-tight"
                      style={{ color: q.color, textShadow: hov ? `0 0 12px ${q.glow}` : 'none' }}>
                      {q.label}
                    </div>
                    <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{q.sublabel}</div>
                    {cnt > 0 && <div className="text-[10px] font-bold mt-0.5" style={{ color: q.color }}>{cnt.toLocaleString('hu-HU')} db</div>}
                  </div>
                </div>
                <div className="mt-1 flex justify-center">
                  <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
                    style={{ color: q.color, background: 'rgba(7,17,31,0.7)', border: `1px solid ${q.border}`, textShadow: hov ? `0 0 8px ${q.glow}` : 'none' }}>
                    {q.label.split(' ')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── LEFT PANEL — Quick access ── */}
        <div className={`absolute left-3 top-[88px] bottom-10 z-30 w-[185px] hidden lg:flex flex-col gap-2 transition-all duration-700 ${ready ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}>
          <div className="rounded-2xl flex-1 overflow-hidden" style={{ background: 'rgba(7,17,31,0.85)', border: '1px solid rgba(0,208,132,0.15)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            <div className="px-4 pt-3.5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#00d084' }} />
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'rgba(0,208,132,0.8)' }}>Gyors elérés</span>
              </div>
            </div>
            <div className="px-2 pb-2 space-y-0.5">
              {QUICK_ACCESS.map(item => {
                const Icon = item.icon;
                const target = item.path === '/profile' && user ? `/profile/${user.id}` : item.path;
                return (
                  <button key={item.label} onClick={() => navigate(target)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all group hover:bg-[rgba(0,208,132,0.06)]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}18`, border: `1px solid ${item.color}35` }}>
                      <Icon style={{ color: item.color, width: '0.9rem', height: '0.9rem' }} />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-[12px] font-semibold text-zinc-200 group-hover:text-white truncate">{item.label}</div>
                      <div className="text-[10px] text-zinc-600 truncate">{item.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PiacAI bot */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(7,17,31,0.85)', border: '1px solid rgba(0,208,132,0.2)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <img src="/kell.png" alt="PiacAI" className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              <div>
                <div className="text-xs font-bold text-zinc-100">Üdv a PiacPro-ban!</div>
                <div className="text-[10px] text-zinc-500">Én vagyok PiacAI</div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed mb-2.5">Segítek megtalálni, amire szükséged van. Kérdezz bátran!</p>
            <button onClick={() => navigate('/piac-ai')}
              className="w-full py-2 rounded-xl text-xs font-bold text-[#07111f] flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #00d084, #059669)', boxShadow: '0 0 16px rgba(0,208,132,0.4)' }}>
              <Sparkles className="w-3 h-3" />Kérdezz tőlem!
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL — Live stats ── */}
        <div className={`absolute right-3 top-[88px] bottom-10 z-30 w-[185px] hidden lg:flex flex-col gap-2 transition-all duration-700 ${ready ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(7,17,31,0.85)', border: '1px solid rgba(0,208,132,0.15)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00d084] pulse-dot" />
              <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'rgba(0,208,132,0.8)' }}>Élő aktivitás</span>
            </div>
            <div className="px-3 pb-3 space-y-1.5">
              {[
                { icon: Users,       color: '#00d084', bg: 'rgba(0,208,132,0.1)',    label: `${onlineCount.toLocaleString('hu-HU')} online most` },
                { icon: ShoppingBag, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  label: `${listingCount > 0 ? listingCount : 128} aktív hirdetés` },
                { icon: Briefcase,   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: `${jobCount > 0 ? jobCount : 26} nyitott állás` },
                { icon: Building2,   color: '#f97316', bg: 'rgba(249,115,22,0.1)',  label: '15 regisztrált bolt' },
                { icon: Heart,       color: '#ec4899', bg: 'rgba(236,72,153,0.1)',  label: '8 aktív kampány' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center gap-2.5 px-2 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                    </div>
                    <span className="text-[11px] text-zinc-300 leading-tight">{s.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="px-3 pb-3">
              <button onClick={() => navigate('/search')}
                className="w-full py-2 rounded-xl text-[11px] font-semibold text-[#00d084] flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.2)' }}>
                <Activity className="w-3.5 h-3.5" />Böngészés
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════
          CONTENT BELOW HERO
      ═══════════════════════════════════════════════════════════ */}
      <div className="relative" style={{ background: '#07111f' }}>
        <div className="fixed inset-0 pointer-events-none z-0" style={{ top: '100vh' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,208,132,0.04) 0%, transparent 60%)' }} />
        </div>

        {/* ── 7 DISTRICT CARDS ── */}
        <section className="relative z-10 px-4 pt-8 pb-6 max-w-[1440px] mx-auto">
          <SectionHead icon={Building2} label="A PiacPro negyedei" iconColor="text-[#00d084]" />
          <DistrictGrid
            quarters={quarters}
            onNav={navigate}
            counts={{ listing: listingCount, auction: auctionCount, job: jobCount }}
          />
        </section>

        {/* ── AI RECOMMENDATIONS + POPULAR + SOCIAL ── */}
        <section className="px-4 pb-8 max-w-[1440px] mx-auto" style={{ borderBottom: '1px solid rgba(0,208,132,0.07)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* AI recs */}
            <div className="md:col-span-2 rounded-2xl p-5" style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(0,208,132,0.1)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#00d084]" />
                <span className="text-sm font-black text-zinc-200">AI ajánlások neked</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black" style={{ background: 'rgba(0,208,132,0.15)', color: '#00d084', border: '1px solid rgba(0,208,132,0.3)' }}>Beta</span>
              </div>
              {loading ? (
                <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><div key={i} className="skeleton h-16 rounded-xl"/>)}</div>
              ) : latestListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {latestListings.slice(0,3).map(l => (
                    <button key={l.id} onClick={() => navigate(`/listing/${l.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl text-left group transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(7,17,31,0.6)', border: '1px solid rgba(0,208,132,0.08)' }}>
                      {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,208,132,0.06)' }}><Package className="w-5 h-5 text-zinc-600" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-[#00d084] transition-colors">{l.title}</p>
                        <p className="text-xs text-zinc-600 truncate mt-0.5">{l.location}</p>
                        <p className="text-xs font-black mt-0.5" style={{ color: '#00d084' }}>{formatPrice(l.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : <p className="text-zinc-600 text-sm">Még nincsenek ajánlások.</p>}
            </div>

            {/* Popular + Social */}
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl p-4" style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(0,208,132,0.1)' }}>
                <div className="text-sm font-black text-zinc-200 mb-3">Népszerű keresések</div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map(s => (
                    <button key={s} onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-[#00d084] transition-all hover:scale-[1.05]"
                      style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(0,208,132,0.1)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(0,208,132,0.1)' }}>
                <div className="text-sm font-black text-zinc-200 mb-1">Csatlakozz hozzánk!</div>
                <p className="text-xs text-zinc-500 mb-3">Kövess minket és légy naprakész</p>
                <div className="flex gap-3">
                  {[
                    { label: 'f', color: '#1877f2', bg: 'rgba(24,119,242,0.15)', border: 'rgba(24,119,242,0.3)' },
                    { label: 'G', color: '#00d084', bg: 'rgba(0,208,132,0.15)', border: 'rgba(0,208,132,0.3)' },
                    { label: 'Y', color: '#ff0000', bg: 'rgba(255,0,0,0.15)',   border: 'rgba(255,0,0,0.3)' },
                    { label: 'I', color: '#e1306c', bg: 'rgba(225,48,108,0.15)',border: 'rgba(225,48,108,0.3)' },
                  ].map((s, i) => (
                    <button key={i} className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:scale-110"
                      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT SECTIONS ── */}
        <div className="max-w-[1440px] mx-auto px-4 space-y-10 py-10">

          {/* Expiring auctions */}
          {(loading || expiringAuctions.length > 0) && (
            <section>
              <SectionHead icon={Flame} label="Ma lejáró licitek" iconColor="text-red-400"
                count={expiringAuctions.length || undefined}
                linkLabel="Összes licit" linkColor="text-[#a855f7] hover:text-purple-300"
                onLink={() => navigate('/auctions')} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)
                  : expiringAuctions.map(l=><AuctionCard key={l.id} listing={l} urgent/>)}
              </div>
            </section>
          )}

          {/* Active auctions */}
          {(loading || allAuctions.length > 0) && (
            <section>
              <SectionHead icon={Gavel} label="Aktív licitek" iconColor="text-[#a855f7]" count={auctionCount}
                linkColor="text-[#a855f7] hover:text-purple-300" onLink={() => navigate('/auctions')} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)
                  : allAuctions.map(l=><AuctionCard key={l.id} listing={l}/>)}
              </div>
            </section>
          )}

          {/* Popular */}
          {(loading || popularListings.length > 0) && (
            <section>
              <SectionHead icon={TrendingUp} label="Népszerű hirdetések" iconColor="text-[#f59e0b]"
                onLink={() => navigate('/search?sort=popular')} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)
                  : popularListings.map(l=><ListingCard key={l.id} listing={l}/>)}
              </div>
            </section>
          )}

          {/* Recently viewed */}
          {recentlyViewed.length > 0 && (
            <section>
              <SectionHead icon={Clock} label="Nemrég nézett" iconColor="text-zinc-400" />
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {recentlyViewed.map(l=><ListingCard key={l.id} listing={l}/>)}
              </div>
            </section>
          )}

          {/* Latest listings */}
          <section>
            <SectionHead icon={Zap} label="Legfrissebb hirdetések" iconColor="text-[#00d084]"
              count={listingCount} onLink={() => navigate('/search')} />
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><SkeletonCard key={i}/>)}</div>
            ) : latestListings.length === 0 ? (
              <div className="rounded-2xl p-14 text-center" style={{ background: 'rgba(13,27,42,0.6)', border: '1px solid rgba(0,208,132,0.07)' }}>
                <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Még nincsenek hirdetések</p>
                {user && <button onClick={() => navigate('/create')} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#07111f] hover:scale-[1.02] transition-all" style={{ background: 'linear-gradient(135deg, #00d084, #059669)' }}>Légy az első</button>}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{latestListings.map((l,i)=><ListingCard key={l.id} listing={l} priority={i<4}/>)}</div>
            )}
          </section>

          {/* Jobs */}
          <section>
            <SectionHead icon={Briefcase} label="Kiemelt állások" iconColor="text-[#3b82f6]" count={jobCount}
              linkColor="text-[#3b82f6] hover:text-blue-300" onLink={() => navigate('/jobs')} />
            {loading ? (
              <div className="space-y-2.5">{Array.from({length:3}).map((_,i)=><div key={i} className="rounded-2xl h-[72px] skeleton"/>)}</div>
            ) : featuredJobs.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(13,27,42,0.6)', border: '1px solid rgba(0,208,132,0.07)' }}>
                <Briefcase className="w-8 h-8 text-zinc-700 mx-auto mb-2" /><p className="text-zinc-500 text-sm">Még nincsenek álláshirdetések</p>
              </div>
            ) : (
              <div className="space-y-2.5">{featuredJobs.map(j=><JobCard key={j.id} job={j}/>)}</div>
            )}
          </section>

          {/* Donations */}
          {(loading || featuredDonations.length > 0) && (
            <section>
              <SectionHead icon={Heart} label="Adomány kampányok" iconColor="text-[#eab308]"
                linkColor="text-[#eab308] hover:text-yellow-300" onLink={() => navigate('/donations')} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loading ? Array.from({length:3}).map((_,i)=>(
                  <div key={i} className="rounded-3xl overflow-hidden" style={{ background: 'rgba(13,27,42,0.6)', border: '1px solid rgba(0,208,132,0.07)' }}>
                    <div className="aspect-video skeleton"/><div className="p-4 space-y-2.5"><div className="h-3.5 skeleton rounded w-3/4"/><div className="h-1.5 skeleton rounded"/></div>
                  </div>
                )) : featuredDonations.map(d => {
                  const pct = d.goal_amount > 0 ? Math.min(Math.round((d.current_amount/d.goal_amount)*100),100) : 0;
                  return (
                    <button key={d.id} onClick={() => navigate(`/donations/${d.id}`)}
                      className="group rounded-3xl overflow-hidden text-left transition-all hover:scale-[1.02] hover:-translate-y-1"
                      style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(234,179,8,0.12)', transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
                      <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                        {d.images?.[0] ? <img src={d.images[0]} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 text-zinc-700"/></div>}
                        {d.is_verified && <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-bold" style={{ background: 'rgba(0,208,132,0.9)' }}><CheckCircle2 className="w-3 h-3"/>Hitelesített</div>}
                      </div>
                      <div className="p-4 space-y-2.5">
                        <p className="font-semibold text-zinc-100 line-clamp-1 group-hover:text-[#eab308] transition-colors text-sm">{d.title}</p>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #eab308, #f59e0b)' }}/>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm" style={{ color: '#eab308' }}>{d.current_amount.toLocaleString('hu-HU')} Ft</span>
                          {d.goal_amount > 0 && <span className="text-zinc-600 text-xs flex items-center gap-0.5"><Target className="w-3 h-3"/>{pct}%</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* CTA cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <section className="rounded-3xl overflow-hidden relative group cursor-pointer transition-all hover:scale-[1.01]"
              onClick={() => navigate('/helyi-vallalkozasok')}
              style={{ border: '1px solid rgba(245,158,11,0.18)' }}>
              <img src="https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Helyi vállalkozások" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,17,31,0.92) 0%, rgba(7,17,31,0.7) 50%, rgba(7,17,31,0.4) 100%)' }} />
              <div className="absolute inset-0 flex items-center p-7">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <MapPin className="w-6 h-6 text-amber-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-black text-zinc-100 text-base">Helyi vállalkozások</h2>
                    <p className="text-zinc-400 text-xs mt-1">Kistermelők, kézművesek, kisboltok</p>
                  </div>
                  <div className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#07111f] flex items-center gap-2 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 16px rgba(245,158,11,0.35)' }}>
                    Felfedezés <ArrowRight className="w-4 h-4"/>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl overflow-hidden relative group cursor-pointer transition-all hover:scale-[1.01]"
              onClick={() => navigate('/forum')}
              style={{ border: '1px solid rgba(56,189,248,0.18)' }}>
              <img src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Közösségi fórum" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,17,31,0.92) 0%, rgba(7,17,31,0.7) 50%, rgba(7,17,31,0.4) 100%)' }} />
              <div className="absolute inset-0 flex items-center p-7">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <MessageCircle className="w-6 h-6 text-[#38bdf8]"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-black text-zinc-100 text-base">Közösségi Fórum</h2>
                    <p className="text-zinc-400 text-xs mt-1">Kérdezz, segíts, ossz meg tapasztalataidat</p>
                  </div>
                  <div className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#07111f] flex items-center gap-2 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)', boxShadow: '0 0 16px rgba(56,189,248,0.35)' }}>
                    Csatlakozás <ArrowRight className="w-4 h-4"/>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Registration CTA */}
          {!user && (
            <section className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
              style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(0,208,132,0.12)' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(0,208,132,0.06)' }}/>
              <div className="grid-overlay absolute inset-0 opacity-50 rounded-3xl" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 float-anim"
                  style={{ background: 'rgba(0,208,132,0.12)', border: '1px solid rgba(0,208,132,0.3)', boxShadow: '0 0 30px rgba(0,208,132,0.2)' }}>
                  <Zap className="w-8 h-8 text-[#00d084]"/>
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Csatlakozz ingyen!</h2>
                <p className="text-zinc-400 mt-4 text-lg leading-relaxed max-w-lg mx-auto">
                  Regisztrálj és hirdesd termékeid, indíts liciteket, keress munkát — percek alatt.
                </p>
                <div className="flex flex-wrap gap-3 justify-center mt-8">
                  <button onClick={() => navigate('/register')}
                    className="px-8 py-3.5 rounded-2xl font-black text-[#07111f] hover:scale-[1.03] transition-all text-sm"
                    style={{ background: 'linear-gradient(135deg, #00d084, #059669)', boxShadow: '0 0 24px rgba(0,208,132,0.4)' }}>
                    Regisztráció — ingyenes
                  </button>
                  <button onClick={() => navigate('/login')}
                    className="px-6 py-3.5 rounded-2xl text-[#00d084] font-semibold hover:scale-[1.02] transition-all text-sm"
                    style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.25)' }}>
                    Bejelentkezés
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
