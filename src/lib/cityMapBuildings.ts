import type { ElementType } from 'react';
import {
  ShoppingBag, Gavel, Briefcase, Users, Store, Heart, Leaf, Shield, Church,
  PlusCircle, Search, MessageCircle,
} from 'lucide-react';

export interface CityBuilding {
  id: string;
  label: string;
  sublabel: string;
  path: string;
  icon: ElementType;
  color: string;
  glow: string;
  /** Hotspot középpont a térképen (%) */
  top: string;
  left: string;
  /** Kattintható terület mérete */
  width?: string;
  height?: string;
  tier: 'primary' | 'secondary' | 'system';
  countKey?: 'listing' | 'auction' | 'job' | 'donations' | 'producers' | 'shops';
}

/** Gyors műveletek — lebegő ikonok az épületek közelében (nem külön panel) */
export interface CityQuickPin {
  id: string;
  label: string;
  path: string;
  icon: ElementType;
  color: string;
  top: string;
  left: string;
}

/** Hotspot pozíciók a /piacpro-world-map.png képhez igazítva */
export const CITY_BUILDINGS: CityBuilding[] = [
  {
    id: 'piac-ter',
    label: 'Piac Tér',
    sublabel: 'Marketplace Zóna',
    path: '/search',
    icon: ShoppingBag,
    color: '#00E676',
    glow: 'rgba(0,230,118,0.55)',
    top: '28%',
    left: '14%',
    width: '14%',
    height: '16%',
    tier: 'primary',
    countKey: 'listing',
  },
  {
    id: 'munka',
    label: 'Munka',
    sublabel: 'Állás Központ',
    path: '/jobs',
    icon: Briefcase,
    color: '#38BDF8',
    glow: 'rgba(56,189,248,0.5)',
    top: '22%',
    left: '38%',
    width: '12%',
    height: '14%',
    tier: 'primary',
    countKey: 'job',
  },
  {
    id: 'boltok',
    label: 'Boltok',
    sublabel: 'Üzleti Negyed',
    path: '/helyi-vallalkozasok',
    icon: Store,
    color: '#FBBF24',
    glow: 'rgba(251,191,36,0.45)',
    top: '24%',
    left: '58%',
    width: '14%',
    height: '15%',
    tier: 'primary',
    countKey: 'shops',
  },
  {
    id: 'licit',
    label: 'Licit',
    sublabel: 'Aukció Aréna',
    path: '/auctions',
    icon: Gavel,
    color: '#A855F7',
    glow: 'rgba(168,85,247,0.55)',
    top: '36%',
    left: '5%',
    width: '13%',
    height: '16%',
    tier: 'primary',
    countKey: 'auction',
  },
  {
    id: 'kozossegi',
    label: 'Közösség',
    sublabel: 'Közösségi Tér',
    path: '/forum',
    icon: Users,
    color: '#22D3EE',
    glow: 'rgba(34,211,238,0.45)',
    top: '38%',
    left: '66%',
    width: '14%',
    height: '16%',
    tier: 'primary',
  },
  {
    id: 'termelok',
    label: 'Termelők',
    sublabel: 'Termelők Világa',
    path: '/producers',
    icon: Leaf,
    color: '#4ADE80',
    glow: 'rgba(74,222,128,0.5)',
    top: '58%',
    left: '52%',
    width: '16%',
    height: '18%',
    tier: 'secondary',
    countKey: 'producers',
  },
  {
    id: 'templom-adomany',
    label: 'Adomány',
    sublabel: 'Adomány Tér',
    path: '/donations',
    icon: Church,
    color: '#F472B6',
    glow: 'rgba(244,114,182,0.55)',
    top: '34%',
    left: '2%',
    width: '8%',
    height: '12%',
    tier: 'secondary',
    countKey: 'donations',
  },
  {
    id: 'templom-vedelem',
    label: 'Védelem',
    sublabel: 'Biztonság & védelem',
    path: '/vedelem',
    icon: Shield,
    color: '#34D399',
    glow: 'rgba(52,211,153,0.5)',
    top: '26%',
    left: '90%',
    width: '8%',
    height: '12%',
    tier: 'system',
  },
  {
    id: 'adomany-epulet',
    label: 'Adomány',
    sublabel: 'Segítség & támogatás',
    path: '/donations',
    icon: Heart,
    color: '#F472B6',
    glow: 'rgba(244,114,182,0.45)',
    top: '60%',
    left: '16%',
    width: '13%',
    height: '15%',
    tier: 'secondary',
    countKey: 'donations',
  },
];

export const CITY_QUICK_PINS: CityQuickPin[] = [
  { id: 'create', label: 'Hirdetés', path: '/create', icon: PlusCircle, color: '#00E676', top: '32%', left: '10%' },
  { id: 'search', label: 'Keresés', path: '/discover', icon: Search, color: '#06B6D4', top: '46%', left: '42%' },
  { id: 'messages', label: 'Üzenetek', path: '/messages', icon: MessageCircle, color: '#22D3EE', top: '42%', left: '72%' },
];

export const CITY_MAP_IMAGE = '/piacpro-world-map.png';

/** Zóna oldalak — ugyanaz a város, más nézet / crop */
export const ZONE_SCENE_IMAGES: Record<string, { src: string; position: string }> = {
  marketplace: { src: CITY_MAP_IMAGE, position: '18% 28%' },
  auction: { src: CITY_MAP_IMAGE, position: '8% 38%' },
  jobs: { src: CITY_MAP_IMAGE, position: '42% 24%' },
  community: { src: CITY_MAP_IMAGE, position: '72% 40%' },
  business: { src: CITY_MAP_IMAGE, position: '62% 26%' },
  donations: { src: CITY_MAP_IMAGE, position: '18% 62%' },
  producers: { src: CITY_MAP_IMAGE, position: '55% 60%' },
  admin: { src: CITY_MAP_IMAGE, position: '50% 50%' },
};
