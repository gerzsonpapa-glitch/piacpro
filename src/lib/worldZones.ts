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
}

export const WORLD_ZONES: WorldZone[] = [
  {
    id: 'marketplace',
    emoji: '🟢',
    label: 'Piac',
    title: 'Marketplace Zone',
    subtitle: 'Vásárlás, eladás, keresés a piac téren',
    path: '/search',
    icon: ShoppingBag,
    color: '#00E676',
    glow: 'rgba(0,230,118,0.45)',
    border: 'rgba(0,230,118,0.35)',
    bg: 'rgba(0,230,118,0.12)',
    gradient: 'linear-gradient(135deg, rgba(0,230,118,0.15), rgba(6,182,212,0.08))',
    paths: ['/search', '/discover', '/favorites', '/create', '/listing'],
  },
  {
    id: 'auction',
    emoji: '🟣',
    label: 'Licit',
    title: 'Auction Arena',
    subtitle: 'Élő licitek, valós idejű verseny',
    path: '/auctions',
    icon: Gavel,
    color: '#A855F7',
    glow: 'rgba(168,85,247,0.5)',
    border: 'rgba(168,85,247,0.4)',
    bg: 'rgba(168,85,247,0.12)',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.08))',
    paths: ['/auctions', '/auction', '/create-auction'],
  },
  {
    id: 'jobs',
    emoji: '🔵',
    label: 'Állás',
    title: 'Job Center',
    subtitle: 'Küldetések, állások, karrierlehetőségek',
    path: '/jobs',
    icon: Briefcase,
    color: '#38BDF8',
    glow: 'rgba(56,189,248,0.45)',
    border: 'rgba(56,189,248,0.35)',
    bg: 'rgba(56,189,248,0.12)',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(59,130,246,0.08))',
    paths: ['/jobs', '/job'],
  },
  {
    id: 'donations',
    emoji: '🟡',
    label: 'Adomány',
    title: 'Donation Space',
    subtitle: 'Segítség, támogatás, közösségi jó',
    path: '/donations',
    icon: Heart,
    color: '#FBBF24',
    glow: 'rgba(251,191,36,0.45)',
    border: 'rgba(251,191,36,0.35)',
    bg: 'rgba(251,191,36,0.12)',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.14), rgba(244,114,182,0.08))',
    paths: ['/donations', '/offers'],
  },
  {
    id: 'producers',
    emoji: '🟠',
    label: 'Termelők',
    title: 'Producers World',
    subtitle: 'Helyi termelők, friss termékek',
    path: '/producers',
    icon: Leaf,
    color: '#4ADE80',
    glow: 'rgba(74,222,128,0.45)',
    border: 'rgba(74,222,128,0.35)',
    bg: 'rgba(74,222,128,0.12)',
    gradient: 'linear-gradient(135deg, rgba(74,222,128,0.14), rgba(34,197,94,0.08))',
    paths: ['/producers'],
  },
  {
    id: 'community',
    emoji: '⚪',
    label: 'Közösség',
    title: 'Community Hub',
    subtitle: 'Fórum, beszélgetések, hírek',
    path: '/forum',
    icon: Users,
    color: '#E2E8F0',
    glow: 'rgba(226,232,240,0.25)',
    border: 'rgba(226,232,240,0.2)',
    bg: 'rgba(226,232,240,0.08)',
    gradient: 'linear-gradient(135deg, rgba(148,163,184,0.12), rgba(56,189,248,0.06))',
    paths: ['/forum', '/messages'],
  },
  {
    id: 'business',
    emoji: '🏪',
    label: 'Boltok',
    title: 'Business District',
    subtitle: 'Helyi vállalkozások és üzletek',
    path: '/helyi-vallalkozasok',
    icon: Store,
    color: '#FB923C',
    glow: 'rgba(251,146,60,0.45)',
    border: 'rgba(251,146,60,0.35)',
    bg: 'rgba(251,146,60,0.12)',
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.14), rgba(245,158,11,0.08))',
    paths: ['/helyi-vallalkozasok', '/shops', '/vallalkozasom'],
  },
];

export const ADMIN_ZONE: WorldZone = {
  id: 'admin',
  emoji: '⚙️',
  label: 'Vezérlő',
  title: 'Control Room',
  subtitle: 'Platform adminisztráció',
  path: '/admin',
  icon: Shield,
  color: '#22D3EE',
  glow: 'rgba(34,211,238,0.45)',
  border: 'rgba(34,211,238,0.35)',
  bg: 'rgba(34,211,238,0.12)',
  gradient: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(124,58,237,0.1))',
  paths: ['/admin'],
};

export const AI_GUIDE_OPTIONS = [
  { key: 'buy', label: 'Vásárlás', desc: 'Piac téren böngészés', path: '/search', zone: 'marketplace' as WorldZoneId },
  { key: 'sell', label: 'Eladás', desc: 'Hirdetés feladása', path: '/create', zone: 'marketplace' as WorldZoneId },
  { key: 'jobs', label: 'Állás', desc: 'Munkalehetőségek', path: '/jobs', zone: 'jobs' as WorldZoneId },
  { key: 'auction', label: 'Licit', desc: 'Aukciók arénája', path: '/auctions', zone: 'auction' as WorldZoneId },
  { key: 'donation', label: 'Adomány', desc: 'Támogatás és segítség', path: '/donations', zone: 'donations' as WorldZoneId },
  { key: 'community', label: 'Közösség', desc: 'Fórum és üzenetek', path: '/forum', zone: 'community' as WorldZoneId },
];

const SKIP_ZONE_PATHS = ['/', '/login', '/register', '/piac-ai', '/vedelem', '/rules'];

export function getZoneForPath(path: string): WorldZone | null {
  if (path === '/') return null;
  if (SKIP_ZONE_PATHS.includes(path)) return null;
  if (path.startsWith('/admin')) return ADMIN_ZONE;
  for (const zone of WORLD_ZONES) {
    if (zone.paths.some((p) => path === p || path.startsWith(p + '/'))) return zone;
  }
  if (path.startsWith('/profile')) return null;
  return null;
}

export function getZoneById(id: WorldZoneId): WorldZone | undefined {
  if (id === 'admin') return ADMIN_ZONE;
  return WORLD_ZONES.find((z) => z.id === id);
}
