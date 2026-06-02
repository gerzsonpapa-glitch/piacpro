import type { ElementType } from 'react';
import {
  ShoppingBag, Gavel, Briefcase, Users, Store, Heart, Leaf, Shield, Church,
} from 'lucide-react';

/** Eredeti PiacPro vizuális világ — modern magyar digitális város, karikatúra.
 *  NEM fantasy RPG, NEM ork/troll, NEM más játék másolata. */
import { WORLD_BACKGROUND_4K } from './siteCustomization';
import type { CityMapHotspotOverride, CityCardStyle } from './cityMapPages';
import { resolveCityIcon } from './cityMapIcons';
import { colorGlow } from './cityMapCardStyles';

export interface CityBuilding {
  id: string;
  label: string;
  sublabel: string;
  path: string;
  icon: ElementType;
  color: string;
  glow: string;
  top: string;
  left: string;
  tier: 'primary' | 'secondary' | 'system';
  countKey?: 'listing' | 'auction' | 'job' | 'donations' | 'producers' | 'shops';
  iconId?: string;
  cardStyle?: CityCardStyle;
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

/** Hotspot pozíciók — izometrikus PiacPro városkép */
export const CITY_BUILDINGS: CityBuilding[] = [
  {
    id: 'piac-ter',
    label: 'Piac Tér',
    sublabel: 'Piac zóna',
    path: '/search',
    icon: ShoppingBag,
    color: '#00E676',
    glow: 'rgba(0,230,118,0.55)',
    top: '38%',
    left: '22%',
    tier: 'primary',
    countKey: 'listing',
    cardStyle: 'glass',
  },
  {
    id: 'munka',
    label: 'Munka Negyed',
    sublabel: 'Állásközpont',
    path: '/jobs',
    icon: Briefcase,
    color: '#38BDF8',
    glow: 'rgba(56,189,248,0.5)',
    top: '24%',
    left: '50%',
    tier: 'primary',
    countKey: 'job',
    cardStyle: 'neon',
  },
  {
    id: 'boltok',
    label: 'Boltok Utcája',
    sublabel: 'Üzleti negyed',
    path: '/helyi-vallalkozasok',
    icon: Store,
    color: '#FBBF24',
    glow: 'rgba(251,191,36,0.45)',
    top: '32%',
    left: '78%',
    tier: 'primary',
    countKey: 'shops',
    cardStyle: 'glass',
  },
  {
    id: 'licit',
    label: 'Licit Csarnok',
    sublabel: 'Aukció aréna',
    path: '/auctions',
    icon: Gavel,
    color: '#A855F7',
    glow: 'rgba(168,85,247,0.55)',
    top: '68%',
    left: '20%',
    tier: 'primary',
    countKey: 'auction',
    cardStyle: 'neon',
  },
  {
    id: 'templom-adomany',
    label: 'Adomány Központ',
    sublabel: 'Segítség és támogatás',
    path: '/donations',
    icon: Church,
    color: '#EAB308',
    glow: 'rgba(234,179,8,0.5)',
    top: '52%',
    left: '36%',
    tier: 'secondary',
    countKey: 'donations',
    cardStyle: 'glass',
  },
  {
    id: 'termelok',
    label: 'Termelők Piaca',
    sublabel: 'Helyi termelők',
    path: '/producers',
    icon: Leaf,
    color: '#4ADE80',
    glow: 'rgba(74,222,128,0.5)',
    top: '72%',
    left: '58%',
    tier: 'secondary',
    countKey: 'producers',
    cardStyle: 'glass',
  },
  {
    id: 'kozossegi',
    label: 'Közösségi Tér',
    sublabel: 'Fórum és események',
    path: '/forum',
    icon: Users,
    color: '#22D3EE',
    glow: 'rgba(34,211,238,0.45)',
    top: '54%',
    left: '82%',
    tier: 'primary',
    cardStyle: 'glass',
  },
  {
    id: 'templom-vedelem',
    label: 'Védelem',
    sublabel: 'Biztonság',
    path: '/vedelem',
    icon: Shield,
    color: '#34D399',
    glow: 'rgba(52,211,153,0.4)',
    top: '12%',
    left: '88%',
    tier: 'system',
    cardStyle: 'minimal',
  },
];

export function applyCityMapOverrides(
  base: CityBuilding[],
  overrides: CityMapHotspotOverride[],
): CityBuilding[] {
  const byId = new Map(overrides.map((o) => [o.id, o]));
  const merged = base
    .map((b) => {
      const o = byId.get(b.id);
      if (o?.hidden) return null;
      if (!o) return b;
      return {
        ...b,
        ...(o.label && { label: o.label }),
        ...(o.sublabel && { sublabel: o.sublabel }),
        ...(o.path && { path: o.path }),
        ...(o.top && { top: o.top }),
        ...(o.left && { left: o.left }),
        ...(o.color && { color: o.color, glow: colorGlow(o.color, 0.55) }),
        ...(o.iconId && { iconId: o.iconId, icon: resolveCityIcon(o.iconId, b.icon) }),
        ...(o.cardStyle ? { cardStyle: o.cardStyle } : {}),
      };
    })
    .filter((b): b is CityBuilding => b !== null);

  for (const o of overrides) {
    if (o.hidden) continue;
    if (merged.some((b) => b.id === o.id)) continue;
    if (!o.top || !o.left || !o.path) continue;
    merged.push({
      id: o.id,
      label: o.label || 'Új zóna',
      sublabel: o.sublabel || o.path,
      path: o.path,
      icon: resolveCityIcon(o.iconId, Store),
      iconId: o.iconId,
      cardStyle: o.cardStyle || 'glass',
      color: o.color || '#00E676',
      glow: colorGlow(o.color || '#00E676', 0.55),
      top: o.top,
      left: o.left,
      tier: 'secondary',
    });
  }
  return merged;
}

export const CITY_QUICK_PINS: CityQuickPin[] = [];

export const CITY_MAP_IMAGE = WORLD_BACKGROUND_4K;

export const ZONE_SCENE_IMAGES: Record<string, { src: string; webp: string; position: string }> = {
  marketplace: { src: '/zones/marketplace.jpg', webp: '/zones/marketplace.webp', position: 'center 40%' },
  auction: { src: '/zones/auction.jpg', webp: '/zones/auction.webp', position: 'center 45%' },
  jobs: { src: '/zones/jobs.jpg', webp: '/zones/jobs.webp', position: 'center 35%' },
  community: { src: '/zones/community.jpg', webp: '/zones/community.webp', position: 'center 42%' },
  business: { src: '/zones/business.jpg', webp: '/zones/business.webp', position: 'center 38%' },
  donations: { src: '/zones/donations.jpg', webp: '/zones/donations.webp', position: 'center 40%' },
  producers: { src: '/zones/producers.jpg', webp: '/zones/producers.webp', position: 'center 45%' },
  admin: { src: '/zones/admin.jpg', webp: '/zones/admin.webp', position: 'center 50%' },
};
