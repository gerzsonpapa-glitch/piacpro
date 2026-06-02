import type { ElementType } from 'react';
import {
  ShoppingBag, Gavel, Briefcase, Heart, Leaf, Users, Store, Shield,
} from 'lucide-react';

export type WorldZoneId =
  | 'marketplace'
  | 'auction'
  | 'jobs'
  | 'donations'
  | 'producers'
  | 'community'
  | 'business'
  | 'admin';

export interface WorldZone {
  id: WorldZoneId;
  emoji: string;
  label: string;
  title: string;
  subtitle: string;
  path: string;
  icon: ElementType;
  color: string;
  glow: string;
  border: string;
  bg: string;
  gradient: string;
  paths: string[];
  tier: 'primary' | 'secondary';
}

/** 🔥 1. szint — max 5 fő világ (fő navigáció) */
export const PRIMARY_WORLD_ZONES: WorldZone[] = [
  {
    id: 'marketplace',
    emoji: '🟢',
    label: 'Piac',
    title: 'Piac Tér',
    subtitle: 'Vásárlás, eladás, hirdetések',
    path: '/search',
    icon: ShoppingBag,
    color: '#00C896',
    glow: 'rgba(0,200,150,0.45)',
    border: 'rgba(0,200,150,0.35)',
    bg: 'rgba(0,200,150,0.12)',
    gradient: 'linear-gradient(135deg, rgba(0,200,150,0.15), rgba(6,182,212,0.08))',
    paths: ['/search', '/discover', '/favorites', '/create', '/listing', '/edit-listing', '/checkout'],
    tier: 'primary',
  },
  {
    id: 'auction',
    emoji: '🟣',
    label: 'Licit',
    title: 'Licit Csarnok',
    subtitle: 'Élő licitek és aukciók',
    path: '/auctions',
    icon: Gavel,
    color: '#A855F7',
    glow: 'rgba(168,85,247,0.5)',
    border: 'rgba(168,85,247,0.4)',
    bg: 'rgba(168,85,247,0.12)',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.08))',
    paths: ['/auctions', '/auction', '/create-auction'],
    tier: 'primary',
  },
  {
    id: 'jobs',
    emoji: '🔵',
    label: 'Állás',
    title: 'Munka Negyed',
    subtitle: 'Állások és karrierlehetőségek',
    path: '/jobs',
    icon: Briefcase,
    color: '#38BDF8',
    glow: 'rgba(56,189,248,0.45)',
    border: 'rgba(56,189,248,0.35)',
    bg: 'rgba(56,189,248,0.12)',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(59,130,246,0.08))',
    paths: ['/jobs', '/job'],
    tier: 'primary',
  },
  {
    id: 'community',
    emoji: '🟡',
    label: 'Közösség',
    title: 'Közösségi Tér',
    subtitle: 'Fórum, beszélgetések, hírek',
    path: '/forum',
    icon: Users,
    color: '#FBBF24',
    glow: 'rgba(251,191,36,0.4)',
    border: 'rgba(251,191,36,0.35)',
    bg: 'rgba(251,191,36,0.1)',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(56,189,248,0.06))',
    paths: ['/forum', '/messages', '/chat'],
    tier: 'primary',
  },
  {
    id: 'business',
    emoji: '⚪',
    label: 'Üzleti',
    title: 'Boltok Utcája',
    subtitle: 'Helyi boltok és vállalkozások',
    path: '/helyi-vallalkozasok',
    icon: Store,
    color: '#E2E8F0',
    glow: 'rgba(226,232,240,0.25)',
    border: 'rgba(226,232,240,0.22)',
    bg: 'rgba(226,232,240,0.08)',
    gradient: 'linear-gradient(135deg, rgba(148,163,184,0.12), rgba(251,146,60,0.08))',
    paths: ['/helyi-vallalkozasok', '/shops', '/vallalkozasom', '/vallalkozas-regisztracio', '/producers/apply'],
    tier: 'primary',
  },
];

/** 🧩 2. szint — kibővített világok (rejtett, csak „További világok”) */
export const SECONDARY_WORLD_ZONES: WorldZone[] = [
  {
    id: 'donations',
    emoji: '💛',
    label: 'Adomány',
    title: 'Adomány Központ',
    subtitle: 'Segítség és közösségi támogatás',
    path: '/donations',
    icon: Heart,
    color: '#F472B6',
    glow: 'rgba(244,114,182,0.45)',
    border: 'rgba(244,114,182,0.35)',
    bg: 'rgba(244,114,182,0.12)',
    gradient: 'linear-gradient(135deg, rgba(244,114,182,0.14), rgba(251,191,36,0.08))',
    paths: ['/donations', '/offers'],
    tier: 'secondary',
  },
  {
    id: 'producers',
    emoji: '🌿',
    label: 'Termelők',
    title: 'Termelők Piaca',
    subtitle: 'Helyi termelők és friss termékek',
    path: '/producers',
    icon: Leaf,
    color: '#4ADE80',
    glow: 'rgba(74,222,128,0.45)',
    border: 'rgba(74,222,128,0.35)',
    bg: 'rgba(74,222,128,0.12)',
    gradient: 'linear-gradient(135deg, rgba(74,222,128,0.14), rgba(34,197,94,0.08))',
    paths: ['/producers'],
    tier: 'secondary',
  },
];

export const ALL_WORLD_ZONES: WorldZone[] = [...PRIMARY_WORLD_ZONES, ...SECONDARY_WORLD_ZONES];

/** @deprecated use ALL_WORLD_ZONES */
export const WORLD_ZONES = ALL_WORLD_ZONES;

export const ADMIN_ZONE: WorldZone = {
  id: 'admin',
  emoji: '⚙️',
  label: 'Vezérlő',
  title: 'Vezérlőközpont',
  subtitle: 'Platform adminisztráció',
  path: '/admin',
  icon: Shield,
  color: '#22D3EE',
  glow: 'rgba(34,211,238,0.45)',
  border: 'rgba(34,211,238,0.35)',
  bg: 'rgba(34,211,238,0.12)',
  gradient: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(124,58,237,0.1))',
  paths: ['/admin'],
  tier: 'secondary',
};

export interface AIGuideOption {
  key: string;
  label: string;
  desc: string;
  path: string;
  zone: WorldZoneId;
  priority: number;
  hint?: string;
}

export const AI_GUIDE_OPTIONS: AIGuideOption[] = [
  { key: 'buy', label: 'Vásárlás', desc: 'Böngéssz a piac téren', path: '/search', zone: 'marketplace', priority: 1 },
  { key: 'sell', label: 'Eladás', desc: 'Hirdetés feladása', path: '/create', zone: 'marketplace', priority: 2 },
  { key: 'auction', label: 'Licit', desc: 'Aukciók arénája', path: '/auctions', zone: 'auction', priority: 3 },
  { key: 'jobs', label: 'Állás', desc: 'Munkalehetőségek', path: '/jobs', zone: 'jobs', priority: 4 },
  { key: 'community', label: 'Közösség', desc: 'Fórum és üzenetek', path: '/forum', zone: 'community', priority: 5 },
  { key: 'business', label: 'Üzleti negyed', desc: 'Boltok és vállalkozások', path: '/helyi-vallalkozasok', zone: 'business', priority: 6 },
  { key: 'donation', label: 'Adomány Tér', desc: 'Segítség és támogatás', path: '/donations', zone: 'donations', priority: 7, hint: 'Kibővített világ' },
  { key: 'producers', label: 'Termelők', desc: 'Helyi termelők piaca', path: '/producers', zone: 'producers', priority: 8, hint: 'Kibővített világ' },
];

const SKIP_ZONE_PATHS = ['/', '/login', '/register', '/piac-ai', '/vedelem', '/rules'];

export function getZoneForPath(path: string): WorldZone | null {
  if (path === '/') return null;
  if (SKIP_ZONE_PATHS.includes(path)) return null;
  if (path.startsWith('/admin')) return ADMIN_ZONE;
  if (path.startsWith('/profile')) return null;
  for (const zone of ALL_WORLD_ZONES) {
    if (zone.paths.some((p) => path === p || path.startsWith(p + '/'))) return zone;
  }
  return null;
}

export function getZoneById(id: WorldZoneId): WorldZone | undefined {
  if (id === 'admin') return ADMIN_ZONE;
  return ALL_WORLD_ZONES.find((z) => z.id === id);
}

export function getLiveCountForZone(
  zone: WorldZone,
  stats: {
    listings: number;
    auctions: number;
    jobs: number;
    donations: number;
    producers: number;
    shops: number;
  },
): number {
  switch (zone.id) {
    case 'marketplace': return stats.listings;
    case 'auction': return stats.auctions;
    case 'jobs': return stats.jobs;
    case 'donations': return stats.donations;
    case 'producers': return stats.producers;
    case 'business': return stats.shops;
    default: return 0;
  }
}

const SECONDARY_QUARTER_IDS = ['adomany-kozpont', 'termelok-piaca'] as const;

export function splitQuarters<T extends { id: string }>(quarters: T[]): { primary: T[]; secondary: T[] } {
  return {
    primary: quarters.filter((q) => !SECONDARY_QUARTER_IDS.includes(q.id as typeof SECONDARY_QUARTER_IDS[number])),
    secondary: quarters.filter((q) => SECONDARY_QUARTER_IDS.includes(q.id as typeof SECONDARY_QUARTER_IDS[number])),
  };
}

export function isPrimaryZonePath(path: string): boolean {
  return PRIMARY_WORLD_ZONES.some((z) => z.path === path || z.paths.some((p) => path.startsWith(p)));
}
