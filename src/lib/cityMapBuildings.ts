import type { ElementType } from 'react';
import {
  ShoppingBag, Gavel, Briefcase, Users, Store, Heart, Leaf, Award, HandHeart, Shield,
} from 'lucide-react';
import { WORLD_BACKGROUND_4K } from './siteCustomization';
import type { CityMapHotspotOverride, CityCardStyle, CityPinSize, CityPinVariant } from './cityMapPages';
import { resolveCityIcon } from './cityMapIcons';
import { colorGlow } from './cityMapCardStyles';
import { HUB_HOTSPOT_DEFAULTS } from './hubHotspotsDefaults';

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
  /** Pozíció a hub képen belül (0–100%), object-fit: contain igazításhoz */
  imageTop?: string;
  imageLeft?: string;
  tier: 'primary' | 'secondary' | 'system';
  countKey?: 'listing' | 'auction' | 'job' | 'donations' | 'producers' | 'shops';
  iconId?: string;
  cardStyle?: CityCardStyle;
  pinSize?: CityPinSize;
  pinVariant?: CityPinVariant;
  showLabel?: boolean;
}

export interface CityQuickPin {
  id: string;
  label: string;
  path: string;
  icon: ElementType;
  color: string;
  top: string;
  left: string;
}

/**
 * PiacPro digitális város — épületek a Főtér körül.
 * v2 koncepció: prémium, letisztult, nem cyberpunk.
 */
export const CITY_BUILDINGS: CityBuilding[] = applyHubDefaults([
  {
    id: 'piac-ter',
    label: 'Piacnegyed',
    sublabel: 'Apróhirdetés · Adás-vétel · Szolgáltatás',
    path: '/search',
    icon: ShoppingBag,
    iconId: 'shopping',
    color: '#00C896',
    glow: colorGlow('#00C896', 0.5),
    top: '36%',
    left: '11%',
    imageTop: '60%',
    imageLeft: '10%',
    tier: 'primary',
    countKey: 'listing',
    cardStyle: 'glass',
  },
  {
    id: 'munka',
    label: 'Munkásnegyed',
    sublabel: 'Állások · Szakemberek · Vállalkozók',
    path: '/jobs',
    icon: Briefcase,
    iconId: 'briefcase',
    color: '#3B82F6',
    glow: colorGlow('#3B82F6', 0.5),
    top: '20%',
    left: '76%',
    imageTop: '34%',
    imageLeft: '72%',
    tier: 'primary',
    countKey: 'job',
    cardStyle: 'glass',
  },
  {
    id: 'licit',
    label: 'Licitközpont',
    sublabel: 'Élő aukciók · Licitek',
    path: '/auctions',
    icon: Gavel,
    iconId: 'gavel',
    color: '#8B5CF6',
    glow: colorGlow('#8B5CF6', 0.5),
    top: '74%',
    left: '14%',
    imageTop: '36%',
    imageLeft: '20%',
    tier: 'primary',
    countKey: 'auction',
    cardStyle: 'glass',
  },
  {
    id: 'termelok',
    label: 'Termelői Negyed',
    sublabel: 'Őstermelők · Kézművesek · Helyi termék',
    path: '/producers',
    icon: Leaf,
    iconId: 'leaf',
    color: '#4ADE80',
    glow: colorGlow('#4ADE80', 0.5),
    top: '82%',
    left: '48%',
    imageTop: '48%',
    imageLeft: '91%',
    tier: 'primary',
    countKey: 'producers',
    cardStyle: 'glass',
  },
  {
    id: 'boltok',
    label: 'Boltok Utcája',
    sublabel: 'Webshopok · Cégek · Üzletek',
    path: '/shops',
    icon: Store,
    iconId: 'store',
    color: '#F97316',
    glow: colorGlow('#F97316', 0.5),
    top: '26%',
    left: '88%',
    imageTop: '58%',
    imageLeft: '83%',
    tier: 'primary',
    countKey: 'shops',
    cardStyle: 'glass',
  },
  {
    id: 'kozossegi',
    label: 'Közösségi Ház',
    sublabel: 'Fórum · Csoportok · Események',
    path: '/forum',
    icon: Users,
    iconId: 'users',
    color: '#38BDF8',
    glow: colorGlow('#38BDF8', 0.5),
    top: '56%',
    left: '87%',
    imageTop: '40%',
    imageLeft: '58%',
    tier: 'primary',
    cardStyle: 'glass',
  },
  {
    id: 'segitsegkozpont',
    label: 'Segítségközpont',
    sublabel: 'Segítségkérés · Felajánlások',
    path: '/donations',
    icon: HandHeart,
    iconId: 'handheart',
    color: '#60A5FA',
    glow: colorGlow('#60A5FA', 0.5),
    top: '48%',
    left: '8%',
    imageTop: '44%',
    imageLeft: '30%',
    tier: 'secondary',
    cardStyle: 'minimal',
  },
  {
    id: 'templom-adomany',
    label: 'Adományközpont',
    sublabel: 'Adománygyűjtés · Támogatás',
    path: '/donations/create',
    icon: Heart,
    iconId: 'heart',
    color: '#FBBF24',
    glow: colorGlow('#FBBF24', 0.5),
    top: '64%',
    left: '32%',
    imageTop: '52%',
    imageLeft: '42%',
    tier: 'secondary',
    countKey: 'donations',
    cardStyle: 'glass',
  },
  {
    id: 'hirnev-torony',
    label: 'Hírnév Torony',
    sublabel: 'Rang · Jelvény · Megbízhatóság',
    path: '/rules',
    icon: Award,
    iconId: 'award',
    color: '#F59E0B',
    glow: colorGlow('#F59E0B', 0.5),
    top: '10%',
    left: '48%',
    imageTop: '20%',
    imageLeft: '49%',
    tier: 'system',
    cardStyle: 'minimal',
  },
  {
    id: 'vedelem',
    label: 'Védelem',
    sublabel: 'Biztosítás · OVB · Védelem',
    path: '/vedelem',
    icon: Shield,
    iconId: 'shield',
    color: '#6366F1',
    glow: colorGlow('#6366F1', 0.5),
    top: '30%',
    left: '38%',
    imageTop: '28%',
    imageLeft: '38%',
    tier: 'secondary',
    cardStyle: 'minimal',
    pinSize: 'xs',
    pinVariant: 'icon-card',
  },
]);

function applyHubDefaults(buildings: CityBuilding[]): CityBuilding[] {
  return buildings.map((b) => {
    const d = HUB_HOTSPOT_DEFAULTS[b.id];
    if (!d) return b;
    return {
      ...b,
      imageTop: d.imageTop,
      imageLeft: d.imageLeft,
      pinSize: d.pinSize ?? b.pinSize,
      pinVariant: d.pinVariant ?? b.pinVariant ?? 'icon-card',
    };
  });
}

export function mergeCityBuildingPreview(
  building: CityBuilding,
  patch: CityMapHotspotOverride,
): CityBuilding {
  return {
    ...building,
    ...(patch.label !== undefined && { label: patch.label }),
    ...(patch.sublabel !== undefined && { sublabel: patch.sublabel }),
    ...(patch.path && { path: patch.path }),
    ...(patch.top && { top: patch.top }),
    ...(patch.left && { left: patch.left }),
    ...(patch.imageTop && { imageTop: patch.imageTop }),
    ...(patch.imageLeft && { imageLeft: patch.imageLeft }),
    ...(patch.color && { color: patch.color, glow: colorGlow(patch.color, 0.55) }),
    ...(patch.iconId && { iconId: patch.iconId, icon: resolveCityIcon(patch.iconId, building.icon) }),
    ...(patch.cardStyle && { cardStyle: patch.cardStyle }),
    ...(patch.pinSize && { pinSize: patch.pinSize }),
    ...(patch.pinVariant && { pinVariant: patch.pinVariant }),
    ...(patch.showLabel !== undefined && { showLabel: patch.showLabel }),
  };
}

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
        ...(o.imageTop && { imageTop: o.imageTop }),
        ...(o.imageLeft && { imageLeft: o.imageLeft }),
        ...(o.pinSize && { pinSize: o.pinSize }),
        ...(o.pinVariant && { pinVariant: o.pinVariant }),
        ...(o.showLabel !== undefined && { showLabel: o.showLabel }),
      };
    })
    .filter((b): b is CityBuilding => b !== null);

  for (const o of overrides) {
    if (o.hidden) continue;
    if (merged.some((b) => b.id === o.id)) continue;
    if (!o.top || !o.left || !o.path) continue;
    merged.push({
      id: o.id,
      label: o.label || 'Új épület',
      sublabel: o.sublabel || o.path,
      path: o.path,
      icon: resolveCityIcon(o.iconId, Store),
      iconId: o.iconId,
      cardStyle: o.cardStyle || 'glass',
      color: o.color || '#00C896',
      glow: colorGlow(o.color || '#00C896', 0.55),
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
