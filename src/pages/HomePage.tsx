import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import type { Listing, Job, Donation } from '../lib/types';
import { normalizeListingAuction, formatPrice } from '../lib/utils';
import {
  ShoppingBag, Gavel, Briefcase, Timer, Users,
  Building2, Package, Zap, Clock,
  Leaf, CheckCircle2, Heart, Target, ArrowRight,
  Search, Sparkles, Send, MessageCircle,
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

/* ── World Zones ─────────────────────────────────────────────────
   Each zone is a district in the digital world.
   position: % from top-left of the world canvas
─────────────────────────────────────────────────────────────────── */
const ZONES = [
  {
    id: 'piac',
    label: 'Piac Tér',
    sublabel: 'Adok-veszek hirdetések',
    statKey: 'listings' as const,
    statLabel: 'hirdetés',
    color: '#00d084',
    glow: 'rgba(0,208,132,0.35)',
    path: '/search',
    icon: ShoppingBag,
    x: 12, y: 38,
    size: 'lg' as const,
  },
  {
    id: 'munka',
    label: 'Munka Negyed',
    sublabel: 'Állások, karrierlehetőségek',
    statKey: 'jobs' as const,
    statLabel: 'állás',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.35)',
    path: '/jobs',
    icon: Briefcase,
    x: 68, y: 22,
    size: 'md' as const,
  },
  {
    id: 'boltok',
    label: 'Boltok Utcája',
    sublabel: 'Üzletek, szolgáltatók',
    statKey: null,
    statLabel: 'bolt',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.35)',
    path: '/helyi-vallalkozasok',
    icon: Building2,
    x: 76, y: 52,
    size: 'md' as const,
  },
  {
    id: 'licit',
    label: 'Licit Csarnok',
    sublabel: 'Licitálj és nyerj',
    statKey: 'auctions' as const,
    statLabel: 'aktív licit',
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.35)',
    path: '/auctions',
    icon: Gavel,
    x: 14, y: 66,
    size: 'md' as const,
  },
  {
    id: 'kozosseg',
    label: 'Közösségi Tér',
    sublabel: 'Fórum, hírek, csevegés',
    statKey: null,
    statLabel: 'online',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.35)',
    path: '/forum',
    icon: Users,
    x: 72, y: 74,
    size: 'md' as const,
  },
  {
    id: 'adomany',
    label: 'Segítség Központ',
    sublabel: 'Adományok, támogatás',
    statKey: 'donations' as const,
    statLabel: 'kampány',
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.35)',
    path: '/donations',
    icon: Heart,
    x: 30, y: 76,
    size: 'sm' as const,
  },
  {
    id: 'termelok',
    label: 'Termelők Piaca',
    sublabel: 'Helyi termelők, friss termékek',
    statKey: null,
    statLabel: 'termelő',
    color: '#4ade80',
    glow: 'rgba(74,222,128,0.35)',
    path: '/helyi-vallalkozasok',
    icon: Leaf,
    x: 52, y: 78,
    size: 'sm' as const,
  },
];

const AI_PROMPTS = [
  'Mit szeretnél ma csinálni?',
  'Keress valamit a világban...',
  'Hova szeretnél menni?',
  'Milyen hirdetést keresel?',
];

const RECENTLY_VIEWED_KEY = 'recently_viewed_listings';

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(0,208,132,0.07)' }}>
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-2.5"><div className="h-3.5 skeleton rounded w-3/4" /><div className="h-4 skeleton rounded w-1/2" /></div>
    </div>
  );
}

function AuctionMiniCard({ listing }: { listing: Listing }) {
  const { navigate } = useRouter();
  const au = listing.auction;
  const cd = useCountdown(au?.ends_at || new Date().toISOString(), au?.timer_started ?? false);
  const lastH = !cd.waiting && !cd.done && cd.total < 3600000;
  const img = listing.images?.[0];
  return (
    <button onClick={() => navigate(`/auction/${listing.id}`)}
      className="group text-left w-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(192,132,252,0.15)' }}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {img ? <img src={img} alt={listing.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(13,27,42,0.5)' }}><Gavel className="w-10 h-10 text-zinc-700" /></div>}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5" style={{ background: 'rgba(7,17,31,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(192,132,252,0.2)' }}>
          <Timer className={`w-3 h-3 ${lastH ? 'text-red-400' : 'text-[#c084fc]'}`} />
          {cd.waiting ? <span className="text-[10px] text-zinc-400">Első licit indítja</span>
            : cd.done ? <span className="text-[10px] text-red-400">Lezárult</span>
            : <span className={`text-[10px] font-mono font-black tracking-wider ${lastH ? 'text-red-300' : 'text-[#c084fc]'}`}>{String(cd.h).padStart(2,'0')}:{String(cd.m).padStart(2,'0')}:{String(cd.s).padStart(2,'0')}</span>}
        </div>
      </div>
      <div className="p-3.5">
        <p className="font-semibold text-zinc-100 truncate text-sm group-hover:text-[#c084fc] transition-colors">{listing.title}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[#c084fc] font-black text-sm">{formatPrice(au?.current_price || listing.price)}</p>
          {(au?.bid_count ?? 0) > 0 && <p className="text-[10px] text-zinc-500 flex items-center gap-0.5"><Users className="w-3 h-3" />{au?.bid_count} licit</p>}
        </div>
      </div>
    </button>
  );
}

/* ── Zone Node — the floating district widget ── */
function ZoneNode({
  zone, stat, hovered, onHover, onClick, delay,
}: {
  zone: typeof ZONES[0];
  stat: number;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
  delay: number;
}) {
  const Icon = zone.icon;
  const sizeMap = { lg: 72, md: 60, sm: 52 };
  const iconSize = sizeMap[zone.size];

  return (
    <div
      className="world-zone absolute"
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: hovered ? 40 : 20,
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={() => onHover(zone.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      {/* Outer glow ring — always pulsing */}
      <div className="zone-glow-ring" style={{
        width: `${iconSize + 32}px`,
        height: `${iconSize + 32}px`,
        borderRadius: '50%',
        border: `1px solid ${zone.color}35`,
        background: `radial-gradient(circle, ${zone.glow.replace('0.35', '0.08')} 0%, transparent 70%)`,
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'zonePulseRing 3s ease-in-out infinite',
        animationDelay: `${delay * 0.3}ms`,
        transition: 'all 0.3s ease',
        ...(hovered ? {
          border: `1px solid ${zone.color}88`,
          background: `radial-gradient(circle, ${zone.glow.replace('0.35', '0.2')} 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%) scale(1.15)',
        } : {}),
      }} />

      {/* Icon hub */}
      <div style={{
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        borderRadius: '50%',
        background: hovered
          ? `radial-gradient(circle at 35% 35%, ${zone.color}40, rgba(3,8,20,0.92))`
          : `radial-gradient(circle at 35% 35%, ${zone.color}28, rgba(3,8,20,0.85))`,
        border: `2px solid ${hovered ? zone.color + 'ee' : zone.color + '70'}`,
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: hovered
          ? `0 0 60px ${zone.glow}, 0 0 120px ${zone.glow.replace('0.35', '0.15')}, 0 12px 40px rgba(0,0,0,0.7), inset 0 1px 0 ${zone.color}44`
          : `0 0 28px ${zone.glow.replace('0.35', '0.28')}, 0 0 60px ${zone.glow.replace('0.35', '0.1')}, 0 6px 24px rgba(0,0,0,0.6), inset 0 1px 0 ${zone.color}30`,
        transform: hovered ? 'scale(1.15)' : 'scale(1)',
        cursor: 'pointer',
        zIndex: 2,
      }}>
        <Icon style={{ color: zone.color, width: `${iconSize * 0.4}px`, height: `${iconSize * 0.4}px`, filter: `drop-shadow(0 0 8px ${zone.color}88)` }} />

        {/* Live stat badge */}
        {stat > 0 && (
          <div style={{
            position: 'absolute',
            top: '-8px', right: '-8px',
            padding: '3px 7px',
            borderRadius: '20px',
            background: `rgba(3,8,20,0.95)`,
            border: `1.5px solid ${zone.color}88`,
            color: zone.color,
            fontSize: '10px',
            fontWeight: 900,
            lineHeight: 1.4,
            backdropFilter: 'blur(12px)',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s ease',
            boxShadow: `0 0 14px ${zone.glow.replace('0.35', '0.4')}`,
            textShadow: `0 0 8px ${zone.color}`,
          }}>
            {stat > 999 ? `${(stat/1000).toFixed(1)}k` : stat}
          </div>
        )}
      </div>

      {/* Label — always visible, stronger on hover */}
      <div style={{
        position: 'absolute',
        top: `calc(100% + ${iconSize * 0.18}px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: hovered ? 1 : 0.85,
        transition: 'all 0.25s ease',
        pointerEvents: 'none',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>
        <div style={{
          color: hovered ? zone.color : '#f0f0f2',
          fontSize: zone.size === 'lg' ? '13px' : '11px',
          fontWeight: 800,
          letterSpacing: '0.04em',
          textShadow: hovered
            ? `0 0 20px ${zone.color}, 0 0 40px ${zone.color}66`
            : '0 1px 12px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.8)',
          transition: 'all 0.25s ease',
        }}>
          {zone.label}
        </div>
        <div style={{
          color: hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)',
          fontSize: '10px',
          marginTop: '2px',
          textShadow: '0 1px 8px rgba(0,0,0,0.9)',
          transition: 'all 0.25s ease',
          maxHeight: hovered ? '20px' : '0px',
          overflow: 'hidden',
        }}>
          {zone.sublabel}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  useSEO(SEO_PAGES.home);
  const { navigate } = useRouter();
  const { user } = useAuth();

  // Data
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
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

  // World state
  const [ready, setReady] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomTarget, setZoomTarget] = useState<{ x: number; y: number; path: string } | null>(null);

  // AI state
  const [aiQuery, setAiQuery] = useState('');
  const [aiPlaceholderIdx, setAiPlaceholderIdx] = useState(0);
  const [aiTyped, setAiTyped] = useState('');
  const [aiTyping, setAiTyping] = useState(true);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Typewriter for AI placeholder
  useEffect(() => {
    const phrase = AI_PROMPTS[aiPlaceholderIdx];
    let i = 0;
    setAiTyped('');
    setAiTyping(true);
    const typeTimer = setInterval(() => {
      i++;
      setAiTyped(phrase.slice(0, i));
      if (i >= phrase.length) {
        clearInterval(typeTimer);
        setAiTyping(false);
        setTimeout(() => {
          setAiPlaceholderIdx(p => (p + 1) % AI_PROMPTS.length);
        }, 2400);
      }
    }, 52);
    return () => clearInterval(typeTimer);
  }, [aiPlaceholderIdx]);

  useEffect(() => {
    Promise.all([fetchListings(), fetchAuctions(), fetchJobs(), fetchRecentlyViewed(), fetchDonations(), fetchOnlineCount()])
      .finally(() => setLoading(false));
    const t = setTimeout(() => setReady(true), 120);
    const onlineInterval = setInterval(fetchOnlineCount, 60000);
    return () => { clearTimeout(t); clearInterval(onlineInterval); };
  }, []);

  async function fetchListings() {
    const { data, count } = await supabase.from('listings').select('*, seller:profiles(*)', { count: 'exact' })
      .eq('status', 'active').eq('listing_type', 'regular').order('created_at', { ascending: false }).limit(8);
    setLatestListings(data || []); setListingCount(count || 0);
  }
  async function fetchAuctions() {
    const { data, count } = await supabase.from('listings').select('*, auction:auctions(*)', { count: 'exact' })
      .eq('listing_type', 'auction').eq('status', 'active').order('created_at', { ascending: false }).limit(8);
    const norm = (data || []).map(normalizeListingAuction).filter((l: Listing) => l.auction?.status === 'active');
    setAllAuctions(norm.slice(0, 4)); setAuctionCount(count || 0);
  }
  async function fetchJobs() {
    const { data, count } = await supabase.from('jobs').select('*', { count: 'exact' })
      .eq('status', 'active').order('created_at', { ascending: false }).limit(4);
    setFeaturedJobs(data || []); setJobCount(count || 0);
  }
  async function fetchDonations() {
    const { data, count } = await supabase.from('donations').select('*', { count: 'exact' })
      .eq('status', 'active').order('is_verified', { ascending: false }).order('current_amount', { ascending: false }).limit(3);
    setFeaturedDonations((data || []) as Donation[]); setDonationCount(count || 0);
  }
  async function fetchOnlineCount() {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    setOnlineCount(count || 0);
  }
  async function fetchRecentlyViewed() {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
      if (!ids.length) return;
      const { data } = await supabase.from('listings').select('*, seller:profiles(*)').in('id', ids).neq('status', 'deleted');
      if (data?.length) setRecentlyViewed(ids.map(id => data.find(l => l.id === id)).filter(Boolean) as Listing[]);
    } catch { /* ignore */ }
  }

  function getZoneStat(zone: typeof ZONES[0]) {
    if (zone.statKey === 'listings') return listingCount;
    if (zone.statKey === 'jobs') return jobCount;
    if (zone.statKey === 'auctions') return auctionCount;
    if (zone.statKey === 'donations') return donationCount;
    return 0;
  }

  function handleZoneClick(zone: typeof ZONES[0]) {
    if (zoomActive) return;
    setZoomTarget({ x: zone.x, y: zone.y, path: zone.path });
    setZoomActive(true);
    setTimeout(() => {
      navigate(zone.path);
      setTimeout(() => { setZoomActive(false); setZoomTarget(null); }, 300);
    }, 750);
  }

  function handleAiSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = aiQuery.trim();
    if (!q) return;
    navigate(`/piac-ai?q=${encodeURIComponent(q)}`);
  }

  function handleAiSuggestion(zone: typeof ZONES[0]) {
    navigate(zone.path);
  }

  const worldReady = ready && !loading;

  return (
    <div style={{ background: '#07111f', minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════════════════════════════
          THE WORLD — full viewport immersive scene
      ═══════════════════════════════════════════════════════════════ */}
      <section
        className={`world-stage relative w-full overflow-hidden ${zoomActive ? 'world-zooming' : ''}`}
        style={{ height: 'calc(100vh - 68px)', minHeight: '640px' }}
      >
        {/* ── Deep space background ── */}
        <div className="absolute inset-0 world-bg" />

        {/* ── City image — YOU ARE IN THE CITY ── */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/4958ed4e-94b0-44bb-9a73-d253229f7c40 copy copy.jpg"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            style={zoomActive && zoomTarget ? {
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 30%',
              transformOrigin: `${zoomTarget.x}% ${zoomTarget.y}%`,
              animation: 'worldZoomIn 0.75s cubic-bezier(0.55, 0, 0.1, 1) forwards',
            } : {
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 30%',
              filter: 'brightness(0.72) saturate(1.15) contrast(1.05)',
              animation: 'cityBreathe 18s ease-in-out infinite',
            }}
          />

          {/* Atmospheric depth — horizon haze */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(7,17,31,0.45) 0%, transparent 30%, transparent 55%, rgba(7,17,31,0.92) 85%, rgba(7,17,31,1) 100%)',
          }} />

          {/* Side vignette — immersive depth */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 110% 100% at 50% 50%, transparent 45%, rgba(7,17,31,0.55) 80%, rgba(7,17,31,0.88) 100%)',
          }} />

          {/* Golden hour atmosphere — warm glow from city center */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 70% 50% at 48% 45%, rgba(255,190,60,0.06) 0%, transparent 65%)',
            mixBlendMode: 'screen',
          }} />

          {/* Haze layer at treeline */}
          <div className="absolute inset-x-0" style={{
            top: '40%', height: '25%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(60,100,255,0.04) 50%, transparent 100%)',
            mixBlendMode: 'screen',
          }} />
        </div>

        {/* ── Digital world overlay — grid, particles, depth ── */}
        {/* Perspective grid — you're standing IN the world */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(0,208,132,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,208,132,0.035) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 85% 80% at 50% 55%, black 10%, transparent 75%)',
          opacity: worldReady ? 1 : 0,
          transition: 'opacity 1.4s ease',
        }} />

        {/* District neon halos — each zone casts light on the city */}
        {ZONES.map(zone => (
          <div key={`halo-${zone.id}`} className="absolute pointer-events-none" style={{
            left: `${zone.x}%`, top: `${zone.y}%`,
            transform: 'translate(-50%, -50%)',
            width: '280px', height: '280px', borderRadius: '50%',
            background: `radial-gradient(circle, ${zone.glow.replace('0.35', '0.12')} 0%, transparent 65%)`,
            animation: `ambientOrb ${4 + ZONES.indexOf(zone) * 0.7}s ease-in-out infinite`,
            animationDelay: `${ZONES.indexOf(zone) * 0.4}s`,
            zIndex: 5,
          }} />
        ))}

        {/* City ambient glow — warm center light */}
        <div className="absolute pointer-events-none" style={{
          width: '900px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,208,132,0.055) 0%, transparent 65%)',
          top: '38%', left: '50%', transform: 'translate(-50%, -50%)',
          animation: 'ambientOrb 10s ease-in-out infinite',
        }} />

        {/* ── Zone flash overlay for zoom ── */}
        {zoomActive && <div className="city-zoom-flash" />}

        {/* ── ZONE NODES — the world districts ── */}
        <div className="absolute inset-0" style={{ opacity: worldReady ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          {ZONES.map((zone, i) => (
            <ZoneNode
              key={zone.id}
              zone={zone}
              stat={getZoneStat(zone)}
              hovered={hoveredZone === zone.id}
              onHover={setHoveredZone}
              onClick={() => handleZoneClick(zone)}
              delay={i * 80}
            />
          ))}
        </div>

        {/* ── World connection lines (SVG) ── */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: worldReady ? 0.35 : 0, transition: 'opacity 1s ease 0.5s' }}
          preserveAspectRatio="none">
          {ZONES.map((zone) => (
            <line key={zone.id}
              x1={`${zone.x}%`} y1={`${zone.y}%`}
              x2="50%" y2="50%"
              stroke={zone.color}
              strokeWidth="0.8"
              strokeDasharray="5 10"
              style={{ animation: `lineFlow 4s linear infinite`, animationDelay: `${ZONES.indexOf(zone) * 0.5}s` }}
            />
          ))}
        </svg>

        {/* ── AI HUB — center of the world ── */}
        <div
          className="absolute z-30"
          style={{
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: worldReady ? 1 : 0,
            transition: 'opacity 0.6s ease 0.4s',
          }}
        >
          {/* Outer rings */}
          <div className="ai-hub-ring ai-hub-ring-3" />
          <div className="ai-hub-ring ai-hub-ring-2" />
          <div className="ai-hub-ring ai-hub-ring-1" />

          {/* Core */}
          <div className="ai-hub-core">
            <img src="/robot.jpg" alt="PiacAI"
              style={{
                width: '52px', height: '52px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(0,208,132,0.6)',
                boxShadow: '0 0 20px rgba(0,208,132,0.5)',
                display: 'block',
              }}
            />
          </div>

          {/* AI label above */}
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ color: '#00d084', fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', textShadow: '0 0 16px rgba(0,208,132,0.8)' }}>
              PiacAI
            </div>
          </div>

          {/* AI input — floats below the hub */}
          <form
            onSubmit={handleAiSubmit}
            style={{
              position: 'absolute',
              top: 'calc(100% + 20px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '340px',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '16px',
              background: 'rgba(3,8,20,0.88)',
              border: '1px solid rgba(0,208,132,0.4)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 24px rgba(0,208,132,0.12)',
            }}>
              <Search style={{ color: '#00d084', width: '15px', height: '15px', flexShrink: 0 }} />
              <input
                ref={aiInputRef}
                type="text"
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                placeholder={aiTyped + (aiTyping ? '|' : '')}
                className="flex-1 bg-transparent text-zinc-100 text-sm font-medium outline-none placeholder-zinc-600"
                style={{ minWidth: 0 }}
              />
              {aiQuery && (
                <button type="submit" style={{
                  background: 'linear-gradient(135deg, #00d084, #059669)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '5px 10px',
                  color: '#07111f',
                  fontWeight: 900,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(0,208,132,0.4)',
                }}>
                  <Send style={{ width: '11px', height: '11px' }} />
                  Küld
                </button>
              )}
            </div>

            {/* Quick zone suggestions */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginTop: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              {ZONES.slice(0, 5).map(zone => {
                const Icon = zone.icon;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handleAiSuggestion(zone)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: `rgba(3,8,20,0.7)`,
                      border: `1px solid ${zone.color}45`,
                      color: zone.color,
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backdropFilter: 'blur(12px)',
                      transition: 'all 0.18s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${zone.color}18`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${zone.color}88`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(3,8,20,0.7)';
                      (e.currentTarget as HTMLElement).style.borderColor = `${zone.color}45`;
                    }}
                  >
                    <Icon style={{ width: '10px', height: '10px' }} />
                    {zone.label}
                  </button>
                );
              })}
            </div>
          </form>
        </div>

        {/* ── Live world activity — bottom strip ── */}
        <div
          className="absolute bottom-0 inset-x-0 z-30 flex items-center justify-center gap-6 pb-4"
          style={{
            opacity: worldReady ? 1 : 0,
            transition: 'opacity 0.6s ease 0.8s',
          }}
        >
          {[
            { color: '#00d084', val: onlineCount || '—', label: 'online most' },
            { color: '#60a5fa', val: listingCount, label: 'hirdetés' },
            { color: '#c084fc', val: auctionCount, label: 'licit' },
            { color: '#f59e0b', val: jobCount, label: 'állás' },
            { color: '#fb923c', val: donationCount, label: 'kampány' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {i === 0 && <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#00d084', boxShadow: '0 0 8px #00d084',
                animation: 'pulseDot 2s ease-in-out infinite', flexShrink: 0,
              }} />}
              <span style={{ color: s.color, fontSize: '12px', fontWeight: 900 }}>
                {typeof s.val === 'number' ? s.val.toLocaleString('hu-HU') : s.val}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{s.label}</span>
              {i < 4 && <span style={{ color: 'rgba(255,255,255,0.1)', marginLeft: '6px' }}>·</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CONTENT WORLD — scroll discovery
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ background: '#07111f', position: 'relative', zIndex: 10 }}>

        {/* Sticky district nav */}
        <div className="sticky top-[68px] z-40 px-4 py-2.5 overflow-x-auto"
          style={{ background: 'rgba(7,17,31,0.96)', borderBottom: '1px solid rgba(0,208,132,0.08)', backdropFilter: 'blur(24px)' }}>
          <div className="flex items-center gap-2 max-w-[1440px] mx-auto">
            {ZONES.map(zone => {
              const Icon = zone.icon;
              return (
                <button key={zone.id} onClick={() => navigate(zone.path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all hover:scale-[1.04]"
                  style={{ background: `${zone.color}12`, border: `1px solid ${zone.color}30`, color: zone.color }}>
                  <Icon className="w-3 h-3" />{zone.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 py-10 space-y-14">

          {/* Live world activity */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full" style={{ background: '#00d084', boxShadow: '0 0 8px #00d084', animation: 'pulseDot 2s ease-in-out infinite' }} />
              <h2 className="text-lg font-black text-zinc-100">A világ most él</h2>
              <span className="text-xs text-zinc-600">valós idejű aktivitás</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Users, color: '#00d084', glow: 'rgba(0,208,132,0.2)', val: onlineCount || '—', label: 'Felhasználó online', sub: 'az elmúlt 5 percben' },
                { icon: ShoppingBag, color: '#60a5fa', glow: 'rgba(96,165,250,0.2)', val: listingCount, label: 'Aktív hirdetés', sub: 'a piactéren' },
                { icon: Gavel, color: '#c084fc', glow: 'rgba(192,132,252,0.2)', val: auctionCount, label: 'Aktív licit', sub: 'most folyamatban' },
                { icon: Briefcase, color: '#f59e0b', glow: 'rgba(245,158,11,0.2)', val: jobCount, label: 'Nyitott állás', sub: 'munkát kínál' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(13,27,42,0.6)', border: `1px solid ${s.color}20`, boxShadow: `0 0 20px ${s.glow}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                      <Icon style={{ color: s.color, width: '18px', height: '18px' }} />
                    </div>
                    <div>
                      <div className="text-xl font-black" style={{ color: s.color }}>
                        {typeof s.val === 'number' ? s.val.toLocaleString('hu-HU') : s.val}
                      </div>
                      <div className="text-xs font-semibold text-zinc-300">{s.label}</div>
                      <div className="text-[10px] text-zinc-600">{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Auctions */}
          {(loading || allAuctions.length > 0) && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)' }}>
                    <Gavel className="w-4 h-4 text-[#c084fc]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Aktív licitek</h2>
                    {auctionCount > 0 && <p className="text-[11px] text-zinc-600">{auctionCount.toLocaleString('hu-HU')} db</p>}
                  </div>
                </div>
                <button onClick={() => navigate('/auctions')}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#c084fc] hover:text-purple-300 transition-colors">
                  Licit Csarnok <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : allAuctions.map(l => <AuctionMiniCard key={l.id} listing={l} />)}
              </div>
            </section>
          )}

          {/* Latest listings */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.15)' }}>
                  <Zap className="w-4 h-4 text-[#00d084]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Legfrissebb hirdetések</h2>
                  {listingCount > 0 && <p className="text-[11px] text-zinc-600">{listingCount.toLocaleString('hu-HU')} db</p>}
                </div>
              </div>
              <button onClick={() => navigate('/search')}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#00d084] hover:text-emerald-300 transition-colors">
                Összes <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : latestListings.length === 0 ? (
              <div className="rounded-2xl p-14 text-center" style={{ background: 'rgba(13,27,42,0.6)', border: '1px solid rgba(0,208,132,0.07)' }}>
                <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Még nincsenek hirdetések</p>
                {user && <button onClick={() => navigate('/create')} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#07111f] hover:scale-[1.02] transition-all" style={{ background: 'linear-gradient(135deg, #00d084, #059669)' }}>Légy az első</button>}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{latestListings.map((l, i) => <ListingCard key={l.id} listing={l} priority={i < 4} />)}</div>
            )}
          </section>

          {/* Recently viewed */}
          {recentlyViewed.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(161,161,170,0.08)', border: '1px solid rgba(161,161,170,0.15)' }}>
                  <Clock className="w-4 h-4 text-zinc-400" />
                </div>
                <h2 className="text-base font-bold text-zinc-100">Nemrég nézett</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {recentlyViewed.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
            </section>
          )}

          {/* Jobs */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
                  <Briefcase className="w-4 h-4 text-[#60a5fa]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Munka Negyed</h2>
                  {jobCount > 0 && <p className="text-[11px] text-zinc-600">{jobCount} nyitott állás</p>}
                </div>
              </div>
              <button onClick={() => navigate('/jobs')}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#60a5fa] hover:text-blue-300 transition-colors">
                Összes állás <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2.5">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-2xl h-[72px] skeleton" />)}</div>
            ) : featuredJobs.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(13,27,42,0.6)', border: '1px solid rgba(0,208,132,0.07)' }}>
                <Briefcase className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">Még nincsenek álláshirdetések</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {featuredJobs.map(job => (
                  <button key={job.id} onClick={() => navigate('/jobs')}
                    className="rounded-2xl p-4 text-left w-full group flex items-center gap-3.5 transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(96,165,250,0.1)' }}>
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.18)' }}>
                      {job.logo_url ? <img src={job.logo_url} alt={job.company} className="w-full h-full object-cover rounded-xl" /> : <Building2 className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-100 text-sm truncate group-hover:text-blue-300 transition-colors">{job.title}</p>
                      <p className="text-zinc-500 text-xs truncate mt-0.5">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
                    </div>
                    {(job.salary_min || job.salary_max) && (
                      <p className="text-xs font-black text-blue-400 flex-shrink-0">
                        {job.salary_min ? new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(job.salary_min / 1000) + 'e' : '—'}+
                        <span className="text-zinc-600 font-normal"> Ft/hó</span>
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Donations */}
          {(loading || featuredDonations.length > 0) && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}>
                    <Heart className="w-4 h-4 text-[#fb923c]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Segítség Központ</h2>
                    {donationCount > 0 && <p className="text-[11px] text-zinc-600">{donationCount} aktív kampány</p>}
                  </div>
                </div>
                <button onClick={() => navigate('/donations')}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#fb923c] hover:text-orange-300 transition-colors">
                  Összes kampány <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-3xl overflow-hidden" style={{ background: 'rgba(13,27,42,0.6)', border: '1px solid rgba(0,208,132,0.07)' }}>
                    <div className="aspect-video skeleton" /><div className="p-4 space-y-2.5"><div className="h-3.5 skeleton rounded w-3/4" /><div className="h-1.5 skeleton rounded" /></div>
                  </div>
                )) : featuredDonations.map(d => {
                  const pct = d.goal_amount > 0 ? Math.min(Math.round((d.current_amount / d.goal_amount) * 100), 100) : 0;
                  return (
                    <button key={d.id} onClick={() => navigate(`/donations/${d.id}`)}
                      className="group rounded-3xl overflow-hidden text-left transition-all hover:scale-[1.02] hover:-translate-y-1"
                      style={{ background: 'rgba(13,27,42,0.7)', border: '1px solid rgba(251,146,60,0.1)' }}>
                      <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                        {d.images?.[0] ? <img src={d.images[0]} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 text-zinc-700" /></div>}
                        {d.is_verified && <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-bold" style={{ background: 'rgba(0,208,132,0.9)' }}><CheckCircle2 className="w-3 h-3" />Hitelesített</div>}
                      </div>
                      <div className="p-4 space-y-2.5">
                        <p className="font-semibold text-zinc-100 line-clamp-1 group-hover:text-[#fb923c] transition-colors text-sm">{d.title}</p>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #fb923c, #f59e0b)' }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-[#fb923c]">{d.current_amount.toLocaleString('hu-HU')} Ft</span>
                          {d.goal_amount > 0 && <span className="text-zinc-600 text-xs flex items-center gap-0.5"><Target className="w-3 h-3" />{pct}%</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* World entry CTAs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
            <div className="rounded-3xl overflow-hidden relative group cursor-pointer transition-all hover:scale-[1.01]"
              onClick={() => navigate('/helyi-vallalkozasok')}
              style={{ border: '1px solid rgba(245,158,11,0.15)' }}>
              <img src="https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,17,31,0.94) 0%, rgba(7,17,31,0.6) 60%, transparent 100%)' }} />
              <div className="absolute inset-0 flex items-center p-7">
                <div className="flex items-center gap-5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <Building2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-zinc-100 text-base">Boltok Utcája</h3>
                    <p className="text-zinc-400 text-xs mt-1">Helyi vállalkozások, kézművesek</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl text-sm font-bold text-[#07111f] flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 16px rgba(245,158,11,0.3)' }}>
                    Belépés <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden relative group cursor-pointer transition-all hover:scale-[1.01]"
              onClick={() => navigate('/forum')}
              style={{ border: '1px solid rgba(56,189,248,0.15)' }}>
              <img src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,17,31,0.94) 0%, rgba(7,17,31,0.6) 60%, transparent 100%)' }} />
              <div className="absolute inset-0 flex items-center p-7">
                <div className="flex items-center gap-5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <MessageCircle className="w-5 h-5 text-[#38bdf8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-zinc-100 text-base">Közösségi Tér</h3>
                    <p className="text-zinc-400 text-xs mt-1">Fórum, események, csevegés</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl text-sm font-bold text-[#07111f] flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)', boxShadow: '0 0 16px rgba(56,189,248,0.3)' }}>
                    Belépés <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
