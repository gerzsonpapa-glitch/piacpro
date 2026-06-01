import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import type { Listing, Job, Donation } from '../lib/types';
import { normalizeListingAuction, formatPrice } from '../lib/utils';
import {
  ShoppingBag, Gavel, Briefcase, Timer, Flame, Users, TrendingUp,
  MapPin, Building2, Wifi, Package, Zap, Clock, ChevronRight,
  Leaf, CheckCircle2, Heart, Target, MessageCircle, ArrowRight,
  PlusCircle, Activity, Search, Star, Sparkles, Shield,
} from 'lucide-react';
import { useSEO, SEO_PAGES } from '../lib/seo';
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

/* ── District click zones ────────────────────────────────────────
   cx/cy = center of each building in % of the city image
   anchor = which side the floating card appears on
─────────────────────────────────────────────────────────────────── */
const DISTRICTS = [
  {
    id: 'piac',
    label: 'PIAC TÉR',
    sublabel: 'Adok-veszek hirdetések',
    statLabel: 'aktív hirdetés',
    statKey: 'listings' as const,
    color: '#00d084',
    path: '/search',
    icon: ShoppingBag,
    cx: 22, cy: 52,
    anchor: 'right' as const,
  },
  {
    id: 'munka',
    label: 'MUNKA NEGYED',
    sublabel: 'Állások, munkalehetőségek',
    statLabel: 'aktív állás',
    statKey: 'jobs' as const,
    color: '#60a5fa',
    path: '/jobs',
    icon: Briefcase,
    cx: 46, cy: 36,
    anchor: 'bottom' as const,
  },
  {
    id: 'boltok',
    label: 'BOLTOK UTCÁJA',
    sublabel: 'Üzletek, szolgáltatók',
    statLabel: 'aktív bolt',
    statKey: null,
    color: '#f59e0b',
    path: '/helyi-vallalkozasok',
    icon: Building2,
    cx: 73, cy: 44,
    anchor: 'left' as const,
  },
  {
    id: 'licit',
    label: 'LICIT CSARNOK',
    sublabel: 'Licitálj és nyerj',
    statLabel: 'aktív licit',
    statKey: 'auctions' as const,
    color: '#c084fc',
    path: '/auctions',
    icon: Gavel,
    cx: 17, cy: 64,
    anchor: 'right' as const,
  },
  {
    id: 'kozosseg',
    label: 'KÖZÖSSÉGI TÉR',
    sublabel: 'Fórum, hírek, események',
    statLabel: 'aktív beszélgetés',
    statKey: null,
    color: '#38bdf8',
    path: '/forum',
    icon: Users,
    cx: 79, cy: 60,
    anchor: 'left' as const,
  },
  {
    id: 'adomany',
    label: 'ADOMÁNY KÖZPONT',
    sublabel: 'Segíts és segítséget kapj',
    statLabel: 'aktív gyűjtés',
    statKey: 'donations' as const,
    color: '#fbbf24',
    path: '/donations',
    icon: Heart,
    cx: 32, cy: 73,
    anchor: 'right' as const,
  },
  {
    id: 'termelok',
    label: 'TERMELŐK PIACA',
    sublabel: 'Helyi termelők, friss termékek',
    statLabel: 'termelő',
    statKey: null,
    color: '#4ade80',
    path: '/helyi-vallalkozasok',
    icon: Leaf,
    cx: 56, cy: 71,
    anchor: 'right' as const,
  },
];

const POPULAR = ['iPhone', 'bicikli', 'kanapé', 'munkalehetőség', 'laptop', 'autó', 'albérlet', 'kutya'];
const RECENTLY_VIEWED_KEY = 'recently_viewed_listings';

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(0,208,132,0.07)' }}>
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-2.5"><div className="h-3.5 skeleton rounded w-3/4" /><div className="h-4 skeleton rounded w-1/2" /></div>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const { navigate } = useRouter();
  const JOB_COLORS: Record<string, string> = {
    teljes: 'text-[#00d084] bg-[rgba(0,208,132,0.1)] border-[rgba(0,208,132,0.25)]',
    reszmunka: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    szabaduszo: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    gyakorlat: 'text-teal-400 bg-teal-500/10 border-teal-500/25',
  };
  const JOB_LABELS: Record<string, string> = { teljes: 'Teljes', reszmunka: 'Részmunka', szabaduszo: 'Szabadúszó', gyakorlat: 'Gyakorlat' };
  return (
    <button onClick={() => navigate('/jobs')}
      className="rounded-2xl p-4 text-left w-full group flex items-center gap-3.5 transition-all hover:-translate-y-0.5"
      style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(59,130,246,0.12)' }}>
      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        {job.logo_url ? <img src={job.logo_url} alt={job.company} className="w-full h-full object-cover rounded-xl" /> : <Building2 className="w-5 h-5 text-blue-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 text-sm truncate group-hover:text-blue-300 transition-colors">{job.title}</p>
        <p className="text-zinc-500 text-xs truncate mt-0.5">{job.company}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${JOB_COLORS[job.type] ?? JOB_COLORS.teljes}`}>{JOB_LABELS[job.type] ?? 'Teljes'}</span>
          {job.remote && <span className="text-[10px] text-sky-400 flex items-center gap-0.5"><Wifi className="w-2.5 h-2.5" />Remote</span>}
          {job.location && <span className="text-[10px] text-zinc-600 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{job.location}</span>}
        </div>
      </div>
      {(job.salary_min || job.salary_max) && (
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-black text-blue-400">{job.salary_min ? new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(job.salary_min / 1000) + 'e' : '—'}+</p>
          <p className="text-[10px] text-zinc-600">HUF/hó</p>
        </div>
      )}
      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

function AuctionMiniCard({ listing }: { listing: Listing }) {
  const { navigate } = useRouter();
  const au = listing.auction;
  const cd = useCountdown(au?.ends_at || new Date().toISOString(), au?.timer_started ?? false);
  const lastH = !cd.waiting && !cd.done && cd.total < 3600000;
  const lastF = !cd.waiting && !cd.done && cd.total < 300000;
  const img = listing.images?.[0];
  return (
    <button onClick={() => navigate(`/auction/${listing.id}`)}
      className="group text-left w-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(168,85,247,0.15)' }}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {img ? <img src={img} alt={listing.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(13,27,42,0.5)' }}><Gavel className="w-10 h-10 text-zinc-700" /></div>}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
        {lastF && <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-black animate-pulse" style={{ background: 'rgba(239,68,68,0.9)' }}><Flame className="w-3 h-3" />HOT</div>}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5" style={{ background: 'rgba(7,17,31,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <Timer className={`w-3 h-3 ${lastH ? 'text-red-400' : 'text-[#a855f7]'}`} />
          {cd.waiting ? <span className="text-[10px] text-zinc-400">Első licit indítja</span>
            : cd.done ? <span className="text-[10px] text-red-400">Lezárult</span>
            : <span className={`text-[10px] font-mono font-black tracking-wider ${lastH ? 'text-red-300' : 'text-[#a855f7]'}`}>{String(cd.h).padStart(2,'0')}:{String(cd.m).padStart(2,'0')}:{String(cd.s).padStart(2,'0')}</span>}
        </div>
      </div>
      <div className="p-3.5">
        <p className="font-semibold text-zinc-100 truncate text-sm group-hover:text-[#a855f7] transition-colors">{listing.title}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[#a855f7] font-black text-sm">{formatPrice(au?.current_price || listing.price)}</p>
          {(au?.bid_count ?? 0) > 0 && <p className="text-[10px] text-zinc-500 flex items-center gap-0.5"><Users className="w-3 h-3" />{au?.bid_count} licit</p>}
        </div>
      </div>
    </button>
  );
}

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

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  useSEO(SEO_PAGES.home);
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [popularListings, setPopularListings] = useState<Listing[]>([]);
  const [allAuctions, setAllAuctions] = useState<Listing[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);
  const [featuredDonations, setFeaturedDonations] = useState<Donation[]>([]);

  const [listingCount, setListingCount] = useState(0);
  const [auctionCount, setAuctionCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [donationCount, setDonationCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  // Zoom state
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomTarget, setZoomTarget] = useState<{ x: number; y: number; path: string } | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([fetchListings(), fetchAuctions(), fetchJobs(), fetchRecentlyViewed(), fetchDonations(), fetchOnlineCount()])
      .finally(() => setLoading(false));
    const t = setTimeout(() => setReady(true), 80);
    // Refresh online count every 60s
    const onlineInterval = setInterval(fetchOnlineCount, 60000);
    return () => { clearTimeout(t); clearInterval(onlineInterval); };
  }, []);

  async function fetchListings() {
    const [a, b] = await Promise.all([
      supabase.from('listings').select('*, seller:profiles(*)', { count: 'exact' }).eq('status','active').eq('listing_type','regular').order('created_at',{ascending:false}).limit(8),
      supabase.from('listings').select('*, seller:profiles(*)').eq('status','active').eq('listing_type','regular').order('views',{ascending:false}).limit(4),
    ]);
    setLatestListings(a.data || []); setListingCount(a.count || 0); setPopularListings(b.data || []);
  }
  async function fetchAuctions() {
    const { data, count } = await supabase.from('listings').select('*, auction:auctions(*)',{count:'exact'}).eq('listing_type','auction').eq('status','active').order('created_at',{ascending:false}).limit(8);
    const norm = (data||[]).map(normalizeListingAuction).filter((l:Listing)=>l.auction?.status==='active');
    setAllAuctions(norm.slice(0,4)); setAuctionCount(count||0);
  }
  async function fetchJobs() {
    const { data, count } = await supabase.from('jobs').select('*',{count:'exact'}).eq('status','active').order('created_at',{ascending:false}).limit(4);
    setFeaturedJobs(data||[]); setJobCount(count||0);
  }
  async function fetchDonations() {
    const { data, count } = await supabase.from('donations').select('*', { count: 'exact' }).eq('status','active').order('is_verified',{ascending:false}).order('current_amount',{ascending:false}).limit(3);
    setFeaturedDonations((data||[]) as Donation[]);
    setDonationCount(count || 0);
  }
  async function fetchOnlineCount() {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    setOnlineCount(count || 0);
  }
  async function fetchRecentlyViewed() {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)||'[]');
      if(!ids.length) return;
      const { data } = await supabase.from('listings').select('*, seller:profiles(*)').in('id',ids).neq('status','deleted');
      if(data?.length) setRecentlyViewed(ids.map(id=>data.find(l=>l.id===id)).filter(Boolean) as Listing[]);
    } catch { /* ignore */ }
  }

  function handleDistrictClick(district: typeof DISTRICTS[0]) {
    if (zoomActive) return;
    setZoomTarget({ x: district.cx, y: district.cy, path: district.path });
    setZoomActive(true);
    setTimeout(() => {
      navigate(district.path);
      setTimeout(() => { setZoomActive(false); setZoomTarget(null); }, 300);
    }, 820);
  }

  return (
    <div style={{ background: '#07111f', minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════════════════════════════
          FULLSCREEN CITY — immersive world entry
      ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={cityRef}
        className={`relative w-full overflow-hidden ${zoomActive ? 'city-zoom-active' : ''}`}
        style={{ height: 'calc(100vh - 68px)', minHeight: '600px', maxHeight: '1080px' }}
      >
        {/* City image — fills everything */}
        <div className="city-map-container" style={{ position: 'absolute' }}>
          <img
            src="/4958ed4e-94b0-44bb-9a73-d253229f7c40 copy copy.jpg"
            alt="PiacPro városa"
            className="city-map-img"
            fetchPriority="high"
            style={zoomActive && zoomTarget ? {
              transformOrigin: `${zoomTarget.x}% ${zoomTarget.y}%`,
              animation: 'zoomIntoBuilding 0.9s cubic-bezier(0.55, 0, 0.1, 1) forwards',
            } : {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 35%',
              filter: 'brightness(0.72) saturate(1.08)',
              animation: 'cityBreathe 14s ease-in-out infinite',
            }}
          />
        </div>

        {/* Flash overlay for zoom */}
        {zoomActive && <div className="city-zoom-flash" />}

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, rgba(7,17,31,1) 0%, transparent 100%)' }} />

        {/* ── FLOATING DISTRICT CARDS — anchored to each building ── */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {DISTRICTS.map((d, i) => {
            const Icon = d.icon;
            const isHov = hoveredDistrict === d.id;
            const statNum = d.statKey === 'listings' ? listingCount
              : d.statKey === 'jobs' ? jobCount
              : d.statKey === 'auctions' ? auctionCount
              : d.statKey === 'donations' ? donationCount
              : null;

            // Card position relative to building anchor point
            const cardStyle: React.CSSProperties = {
              position: 'absolute',
              pointerEvents: 'auto',
              cursor: 'pointer',
              transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, opacity 0.5s ease',
              transitionDelay: ready ? `${i * 70}ms` : '0ms',
              opacity: ready ? 1 : 0,
              transform: isHov ? 'translate(-50%, -50%) scale(1.07) translateY(-4px)' : 'translate(-50%, -50%) scale(1)',
              left: `${d.cx}%`,
              top: `${d.cy}%`,
              zIndex: isHov ? 30 : 20,
            };

            return (
              <div
                key={d.id}
                style={cardStyle}
                onMouseEnter={() => setHoveredDistrict(d.id)}
                onMouseLeave={() => setHoveredDistrict(null)}
                onClick={() => handleDistrictClick(d)}
              >
                {/* The card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px 10px 10px',
                  borderRadius: '14px',
                  background: isHov
                    ? `linear-gradient(135deg, rgba(3,8,20,0.97) 0%, ${d.color}14 100%)`
                    : 'rgba(3,8,20,0.88)',
                  border: `1.5px solid ${isHov ? d.color + 'dd' : d.color + '60'}`,
                  backdropFilter: 'blur(22px)',
                  boxShadow: isHov
                    ? `0 8px 32px rgba(0,0,0,0.75), 0 0 28px ${d.color}45`
                    : `0 4px 18px rgba(0,0,0,0.65), 0 0 12px ${d.color}18`,
                  transition: 'all 0.25s ease',
                  whiteSpace: 'nowrap',
                }}>
                  {/* Icon bubble */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${d.color}1a`,
                    border: `1px solid ${d.color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.25s ease',
                    boxShadow: isHov ? `0 0 16px ${d.color}50` : 'none',
                  }}>
                    <Icon style={{ color: d.color, width: '16px', height: '16px' }} />
                  </div>

                  {/* Text */}
                  <div>
                    <div style={{
                      color: isHov ? d.color : '#f4f4f5',
                      fontSize: '12px',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                      textShadow: isHov ? `0 0 14px ${d.color}` : 'none',
                      transition: 'all 0.25s ease',
                    }}>
                      {d.label}
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '10px',
                      marginTop: '2px',
                      lineHeight: 1.3,
                    }}>
                      {d.sublabel}
                    </div>
                    {statNum != null && statNum > 0 && (
                      <div style={{
                        color: d.color,
                        fontSize: '10px',
                        fontWeight: 700,
                        marginTop: '2px',
                        opacity: 0.9,
                      }}>
                        {statNum.toLocaleString('hu-HU')} {d.statLabel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Minimal bottom HUD ── */}
        <div className={`absolute bottom-0 inset-x-0 z-30 flex items-end justify-between px-4 pb-4 transition-all duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>

          {/* PiacAI pill */}
          <button
            onClick={() => navigate('/piac-ai')}
            className="items-center gap-2.5 px-3 py-2 rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97] hidden md:flex"
            style={{
              background: 'rgba(3,8,18,0.85)',
              border: '1px solid rgba(0,208,132,0.38)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 22px rgba(0,208,132,0.14)',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src="/robot.jpg" alt="PiacAI" className="w-9 h-9 rounded-xl object-cover"
                style={{ border: '1.5px solid rgba(0,208,132,0.45)' }} />
              <span style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#00d084', border: '1.5px solid rgba(3,8,18,1)',
                boxShadow: '0 0 6px #00d084',
              }} />
            </div>
            <div>
              <div className="text-[11px] font-black text-zinc-100 leading-tight">PiacAI</div>
              <div className="text-[9px] font-medium" style={{ color: '#00d084' }}>Kész segíteni →</div>
            </div>
          </button>

          {/* Scroll hint */}
          <div className="flex flex-col items-center gap-1 absolute left-1/2 -translate-x-1/2 bottom-4">
            <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-500">Görgets le</span>
            <div className="w-4 h-7 rounded-full border border-zinc-700 flex items-start justify-center pt-1">
              <div className="w-1 h-1.5 rounded-full bg-[#00d084]" style={{ animation: 'floatY 1.8s ease-in-out infinite' }} />
            </div>
          </div>

          {/* Live stats pill */}
          <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-2xl"
            style={{ background: 'rgba(3,8,18,0.85)', border: '1px solid rgba(0,208,132,0.2)', backdropFilter: 'blur(20px)' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: '#00d084', boxShadow: '0 0 6px #00d084', animation: 'pulseDot 2s ease-in-out infinite' }} />
            {[
              { color: '#00d084', val: onlineCount > 0 ? onlineCount : '—', label: 'online' },
              { color: '#3b82f6', val: listingCount, label: 'hirdetés' },
              { color: '#c084fc', val: auctionCount, label: 'aukció' },
              { color: '#f59e0b', val: jobCount, label: 'állás' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-[11px] font-black" style={{ color: s.color }}>
                  {typeof s.val === 'number' ? s.val.toLocaleString('hu-HU') : s.val}
                </span>
                <span className="text-[10px] text-zinc-500">{s.label}</span>
                {i < 3 && <span className="text-zinc-700 text-[10px] ml-1">·</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CONTENT SECTIONS
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10" style={{ background: '#07111f' }}>

        {/* District navigation strip */}
        <div className="sticky top-[68px] z-40 px-4 py-2.5 overflow-x-auto"
          style={{ background: 'rgba(7,17,31,0.95)', borderBottom: '1px solid rgba(0,208,132,0.1)', backdropFilter: 'blur(24px)' }}>
          <div className="flex items-center gap-2 max-w-[1440px] mx-auto">
            {DISTRICTS.map(d => {
              const Icon = d.icon;
              return (
                <button key={d.id} onClick={() => navigate(d.path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all hover:scale-[1.04]"
                  style={{ background: `${d.color}15`, border: `1px solid ${d.color}35`, color: d.color }}>
                  <Icon className="w-3 h-3" />{d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── AI recs + Popular ── */}
        <section className="px-4 pt-8 pb-6 max-w-[1440px] mx-auto" style={{ borderBottom: '1px solid rgba(0,208,132,0.07)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
          </div>
        </section>

        <div className="max-w-[1440px] mx-auto px-4 space-y-10 py-10">

          {/* Auctions */}
          {(loading || allAuctions.length > 0) && (
            <section>
              <SectionHead icon={Gavel} label="Aktív licitek" iconColor="text-[#a855f7]" count={auctionCount}
                linkLabel="Licit Csarnok" linkColor="text-[#a855f7] hover:text-purple-300" onLink={() => navigate('/auctions')} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)
                  : allAuctions.map(l=><AuctionMiniCard key={l.id} listing={l}/>)}
              </div>
            </section>
          )}

          {/* Popular listings */}
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
              linkLabel="Munka Negyed" linkColor="text-[#3b82f6] hover:text-blue-300" onLink={() => navigate('/jobs')} />
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
                linkLabel="Adomány Központ" linkColor="text-[#eab308] hover:text-yellow-300" onLink={() => navigate('/donations')} />
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
