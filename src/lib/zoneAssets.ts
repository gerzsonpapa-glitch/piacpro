import type { WorldZoneId } from './worldZones';

export type ZoneAssetId = WorldZoneId | 'hub' | 'messages' | 'piac-ai';

export type ZoneMotionKind = 'static' | 'loop-webp' | 'loop-gif' | 'loop-video' | 'css-ambient';

export interface ZoneAsset {
  id: ZoneAssetId;
  label: string;
  /** Statikus háttér (fallback) */
  static: { jpg: string; webp: string };
  /** Animált loop — S&F-szerű élő képernyő */
  loop?: {
    webp?: string;
    gif?: string;
    mp4?: string;
  };
  motion: ZoneMotionKind;
  objectPosition?: string;
  /** Extra CSS filter a zóna hangulatához */
  filter?: string;
  /** S&F-szerű pulzáló fény szín */
  ambientColor?: string;
}

const Z = (name: string) => `/zones/${name}`;
const HUB_V = '20260602v5';

/**
 * PiacPro zóna háttérképek — eredeti vizuális világ.
 * Stílus: modern magyar digitális város, barátságos karikatúra (app/fintech illusztráció).
 * TILOS: fantasy RPG, ork/troll/elf, más játék másolata.
 * Egyedi forrás: zones-source/{id}.png felülírja a master crop-ot.
 */
export const ZONE_ASSETS: Record<ZoneAssetId, ZoneAsset> = {
  hub: {
    id: 'hub',
    label: 'PiacPro város',
    static: { jpg: `${Z('hub.jpg')}?v=${HUB_V}`, webp: `${Z('hub.webp')}?v=${HUB_V}` },
    loop: { webp: `${Z('hub-loop.webp')}?v=${HUB_V}` },
    motion: 'static',
    objectPosition: 'center center',
    ambientColor: '#F59E0B',
    filter: 'contrast(1.03)',
  },
  marketplace: {
    id: 'marketplace',
    label: 'Piac Tér',
    static: { jpg: Z('marketplace.jpg'), webp: Z('marketplace.webp') },
    loop: { webp: Z('marketplace-loop.webp') },
    motion: 'loop-webp',
    objectPosition: 'center 40%',
    ambientColor: '#00E676',
    filter: 'saturate(1.15) brightness(1.05)',
  },
  auction: {
    id: 'auction',
    label: 'Licit Csarnok',
    static: { jpg: Z('auction.jpg'), webp: Z('auction.webp') },
    loop: { webp: Z('auction-loop.webp') },
    motion: 'loop-webp',
    objectPosition: 'center 45%',
    ambientColor: '#A855F7',
    filter: 'saturate(1.2) brightness(0.95)',
  },
  jobs: {
    id: 'jobs',
    label: 'Munka Negyed',
    static: { jpg: Z('jobs.jpg'), webp: Z('jobs.webp') },
    motion: 'css-ambient',
    objectPosition: 'center 35%',
    ambientColor: '#38BDF8',
  },
  community: {
    id: 'community',
    label: 'Közösségi Tér',
    static: { jpg: Z('community.jpg'), webp: Z('community.webp') },
    loop: { webp: Z('community-loop.webp') },
    motion: 'loop-webp',
    objectPosition: 'center 42%',
    ambientColor: '#FBBF24',
  },
  business: {
    id: 'business',
    label: 'Boltok Utcája',
    static: { jpg: Z('business.jpg'), webp: Z('business.webp') },
    motion: 'css-ambient',
    objectPosition: 'center 38%',
    ambientColor: '#F97316',
  },
  donations: {
    id: 'donations',
    label: 'Adomány Központ',
    static: { jpg: Z('donations.jpg'), webp: Z('donations.webp') },
    motion: 'css-ambient',
    objectPosition: 'center 40%',
    ambientColor: '#EAB308',
    filter: 'saturate(1.1) brightness(1.08)',
  },
  producers: {
    id: 'producers',
    label: 'Termelők Piaca',
    static: { jpg: Z('producers.jpg'), webp: Z('producers.webp') },
    motion: 'css-ambient',
    objectPosition: 'center 45%',
    ambientColor: '#4ADE80',
  },
  admin: {
    id: 'admin',
    label: 'Vezérlőközpont',
    static: { jpg: Z('admin.jpg'), webp: Z('admin.webp') },
    motion: 'css-ambient',
    objectPosition: 'center 50%',
    ambientColor: '#22D3EE',
    filter: 'saturate(1.05) brightness(0.9)',
  },
  messages: {
    id: 'messages',
    label: 'Üzenet Torony',
    static: { jpg: Z('messages.jpg'), webp: Z('messages.webp') },
    motion: 'css-ambient',
    objectPosition: 'center 40%',
    ambientColor: '#22D3EE',
  },
  'piac-ai': {
    id: 'piac-ai',
    label: 'PiacAI Torony',
    static: { jpg: Z('piac-ai.jpg'), webp: Z('piac-ai.webp') },
    loop: { webp: Z('piac-ai-loop.webp') },
    motion: 'loop-webp',
    objectPosition: 'center 42%',
    ambientColor: '#A78BFA',
  },
};

export function getZoneAsset(id: ZoneAssetId): ZoneAsset {
  return ZONE_ASSETS[id];
}

export function getZoneAssetForPath(path: string): ZoneAsset | null {
  if (path === '/login' || path === '/register') return null;
  if (path === '/') return ZONE_ASSETS.hub;
  if (path.startsWith('/piac-ai') || path.startsWith('/ai-assistant')) return ZONE_ASSETS['piac-ai'];
  if (path.startsWith('/messages')) return ZONE_ASSETS.messages;
  if (path.startsWith('/admin')) return ZONE_ASSETS.admin;
  if (path.startsWith('/auctions') || path.startsWith('/auction') || path.startsWith('/create-auction')) {
    return ZONE_ASSETS.auction;
  }
  if (path.startsWith('/jobs') || path.startsWith('/job') || path.startsWith('/create-job')) {
    return ZONE_ASSETS.jobs;
  }
  if (path.startsWith('/forum') || path.startsWith('/rules')) return ZONE_ASSETS.community;
  if (path.startsWith('/donations') || path.startsWith('/offers') || path.startsWith('/create-donation')) {
    return ZONE_ASSETS.donations;
  }
  if (path.startsWith('/producers')) return ZONE_ASSETS.producers;
  if (
    path.startsWith('/helyi-vallalkozasok') ||
    path.startsWith('/shops') ||
    path.startsWith('/shop/') ||
    path.startsWith('/my-shop') ||
    path.startsWith('/vallalkozas') ||
    path.startsWith('/business')
  ) {
    return ZONE_ASSETS.business;
  }
  if (
    path.startsWith('/search') ||
    path.startsWith('/discover') ||
    path.startsWith('/favorites') ||
    path.startsWith('/create') ||
    path.startsWith('/listing') ||
    path.startsWith('/edit-listing') ||
    path.startsWith('/checkout')
  ) {
    return ZONE_ASSETS.marketplace;
  }
  if (path.startsWith('/profile') || path.startsWith('/vedelem')) return ZONE_ASSETS.hub;
  return ZONE_ASSETS.hub;
}

export function getZoneAssetFromWorldZoneId(id: WorldZoneId): ZoneAsset {
  return ZONE_ASSETS[id];
}

/** Hub / főváros kép URL (site customization fallbackkel) */
export const HUB_STATIC = ZONE_ASSETS.hub.static;
