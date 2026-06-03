export type QuarterId =
  | 'piac-ter'
  | 'munka-negyed'
  | 'boltok-utcaja'
  | 'licit-csarnok'
  | 'kozossegi-ter'
  | 'adomany-kozpont'
  | 'termelok-piaca';

export interface QuarterOverride {
  id: QuarterId;
  label?: string;
  sublabel?: string;
  desc?: string;
  img?: string;
  color?: string;
  path?: string;
  hidden?: boolean;
}

export interface SiteWorldConfig {
  enabled: boolean;
  particles: boolean;
  particleCount: number;
  particleColor: string;
  floatingOrbs: boolean;
  orbIntensity: number;
  scanLines: boolean;
  gridVisible: boolean;
  gridOpacity: number;
  heroKenBurns: boolean;
  cardFloat: boolean;
  neonPulse: boolean;
  parallaxStrength: number;
  globalSaturation: number;
  globalContrast: number;
  depthBlur: number;
}

export interface SiteThemeConfig {
  accent: string;
  accentSecondary: string;
  background: string;
  surface: string;
  gradientTop: string;
  gradientBottom: string;
  glassBlur: number;
  glassBorderOpacity: number;
}

export interface SiteHeroConfig {
  title: string;
  subtitle: string;
  imageUrl: string;
  brightness: number;
  saturation: number;
  overlayColor: string;
  overlayOpacity: number;
  badgeTop: string;
  badgeBottom: string;
  heightVh: number;
}

export interface PageSkinConfig {
  path: string;
  label: string;
  bgImage: string;
  bgColor: string;
  overlay: string;
  title: string;
  subtitle: string;
}

export interface QuickAccessOverride {
  id: string;
  label?: string;
  sub?: string;
  path?: string;
  color?: string;
  hidden?: boolean;
}

export interface SiteMediaConfig {
  logoImageUrl: string;
  ambientBgUrl: string;
  ogImageUrl: string;
}

import type { CityMapHotspotOverride, CityMapDefaults } from './cityMapPages';
import { DEFAULT_CITY_MAP_DEFAULTS } from './cityMapPages';
import { DEFAULT_HOME_WOW } from './homeWow';
import {
  normalizeHomeVariant,
  HOME_VARIANTS,
  getHomeVariantMeta,
  isImmersiveHomeVariant,
  isBuildingSceneVariant,
  homeVariantSupportsMenuStyle,
  type HomeVariantId,
  type HomeMenuStyleId,
} from './homeVariants';

export type { CityMapHotspotOverride, CityMapDefaults };
export type { HomeVariantId, HomeMenuStyleId };
export type { SiteHomeWowConfig };
export { DEFAULT_HOME_WOW };
export {
  HOME_VARIANTS,
  normalizeHomeVariant,
  getHomeVariantMeta,
  isImmersiveHomeVariant,
  isBuildingSceneVariant,
  homeVariantSupportsMenuStyle,
};

export interface SiteHomeConfig {
  variant: HomeVariantId;
  menuStyle: HomeMenuStyleId;
}

export interface SiteCustomizationConfig {
  version: number;
  hero: SiteHeroConfig;
  announcement: {
    enabled: boolean;
    text: string;
    link: string;
    background: string;
    textColor: string;
  };
  theme: SiteThemeConfig;
  world: SiteWorldConfig;
  customCss: string;
  quarters: QuarterOverride[];
  pages: PageSkinConfig[];
  quickAccess: QuickAccessOverride[];
  cityMapHotspots: CityMapHotspotOverride[];
  /** Új zónák alapértelmezett pin/kártya stílusa (fejlesztői prémium) */
  cityMapDefaults: CityMapDefaults;
  nav: {
    brandSubtitle: string;
    searchPlaceholder: string;
  };
  media: SiteMediaConfig;
  footer: { tagline: string };
  maintenance: { enabled: boolean; message: string };
  home: SiteHomeConfig;
  /** Főoldali „wow” élmény — egyenként kikapcsolható */
  homeWow: SiteHomeWowConfig;
}

export const WORLD_BACKGROUND_4K = '/zones/hub.jpg';
export const WORLD_BACKGROUND_4K_WEBP = '/zones/hub.webp';
export const WORLD_HUB_LOOP = '/zones/hub-loop.webp';
/** Cache-bust — új hub kép után növeld */
export const WORLD_HUB_ASSET_VERSION = '20260602v5';

const LEGACY_WORLD_BACKGROUNDS = new Set([
  '',
  '/piacpro-world-map.png',
  '/piacpro-world-hero.png',
  '/piacpro-world-4k.png',
  '/piacpro-world-4k.jpg',
  '/piacpro-isometric-world.jpg',
  '/piacpro-isometric-world.webp',
]);

export function getWorldBackgroundUrl(config: SiteCustomizationConfig): string {
  const url = config.media.ambientBgUrl || config.hero.imageUrl || WORLD_BACKGROUND_4K;
  if (LEGACY_WORLD_BACKGROUNDS.has(url)) return WORLD_BACKGROUND_4K;
  return url;
}

/** Beépített hub háttér — nem egyedi feltöltés */
export function isBuiltinHubBackground(url: string): boolean {
  if (!url || LEGACY_WORLD_BACKGROUNDS.has(url)) return true;
  const base = url.split('?')[0];
  return (
    base === WORLD_BACKGROUND_4K ||
    base === WORLD_BACKGROUND_4K_WEBP ||
    base.endsWith('/zones/hub.jpg') ||
    base.endsWith('/zones/hub.webp') ||
    base.endsWith('/zones/hub.png')
  );
}

export function getWorldBackgroundSources(config: SiteCustomizationConfig): { jpg: string; webp: string } {
  const jpg = getWorldBackgroundUrl(config);
  if (isBuiltinHubBackground(jpg)) {
    const v = `?v=${WORLD_HUB_ASSET_VERSION}`;
    return { jpg: `${WORLD_BACKGROUND_4K}${v}`, webp: `${WORLD_BACKGROUND_4K_WEBP}${v}` };
  }
  if (jpg.endsWith('.webp')) return { jpg, webp: jpg };
  if (jpg.endsWith('.jpg') || jpg.endsWith('.jpeg')) {
    return { jpg, webp: jpg.replace(/\.jpe?g$/i, '.webp') };
  }
  return { jpg, webp: jpg };
}

export const PAGE_SKIN_DEFAULTS: PageSkinConfig[] = [
  { path: '/', label: 'Főoldal', bgImage: '/zones/hub.jpg', bgColor: '', overlay: '', title: '', subtitle: '' },
  { path: '/search', label: 'Piactér', bgImage: '/zones/marketplace.jpg', bgColor: '', overlay: '', title: 'Piactér', subtitle: 'Hirdetések böngészése és keresés' },
  { path: '/discover', label: 'Felfedezés', bgImage: '/zones/marketplace.jpg', bgColor: '', overlay: '', title: 'Felfedezés', subtitle: 'Globális keresés a piacon' },
  { path: '/create', label: 'Hirdetés feladása', bgImage: '/zones/marketplace.jpg', bgColor: '', overlay: '', title: 'Új hirdetés', subtitle: '' },
  { path: '/favorites', label: 'Kedvencek', bgImage: '/zones/marketplace.jpg', bgColor: '', overlay: '', title: 'Kedvencek', subtitle: '' },
  { path: '/auctions', label: 'Licitek', bgImage: '/zones/auction.jpg', bgColor: '', overlay: '', title: 'Licit Csarnok', subtitle: 'Élő aukciók és licitek' },
  { path: '/jobs', label: 'Állások', bgImage: '/zones/jobs.jpg', bgColor: '', overlay: '', title: 'Munka Negyed', subtitle: 'Álláshirdetések és jelentkezés' },
  { path: '/donations', label: 'Adományok', bgImage: '/zones/donations.jpg', bgColor: '', overlay: '', title: 'Adomány Központ', subtitle: 'Segítség és támogatás' },
  { path: '/forum', label: 'Fórum', bgImage: '/zones/community.jpg', bgColor: '', overlay: '', title: 'Közösségi Tér', subtitle: 'Beszélgetések és hírek' },
  { path: '/messages', label: 'Üzenetek', bgImage: '/zones/messages.jpg', bgColor: '', overlay: '', title: 'Üzenet Torony', subtitle: 'Azonnali chat' },
  { path: '/helyi-vallalkozasok', label: 'Helyi vállalkozások', bgImage: '/zones/business.jpg', bgColor: '', overlay: '', title: 'Boltok Utcája', subtitle: 'Helyi boltok és szolgáltatók' },
  { path: '/shops', label: 'Boltok', bgImage: '/zones/business.jpg', bgColor: '', overlay: '', title: 'Boltok', subtitle: '' },
  { path: '/producers', label: 'Termelők', bgImage: '/zones/producers.jpg', bgColor: '', overlay: '', title: 'Termelők Piaca', subtitle: 'Friss helyi termékek' },
  { path: '/piac-ai', label: 'PiacAI', bgImage: '/zones/piac-ai.jpg', bgColor: '', overlay: '', title: 'PiacAI Torony', subtitle: 'Intelligens asszisztens' },
  { path: '/admin', label: 'Admin', bgImage: '/zones/admin.jpg', bgColor: '', overlay: '', title: 'Vezérlőközpont', subtitle: 'Rendszerkezelés' },
];

export const DEFAULT_SITE_CONFIG: SiteCustomizationConfig = {
  version: 2,
  hero: {
    title: 'Üdv a PiacPro világában',
    subtitle: 'Eladás · vásárlás · munka · segítség — egy biztonságos magyar piactér.',
    imageUrl: WORLD_BACKGROUND_4K,
    brightness: 1.04,
    saturation: 1.06,
    overlayColor: '#07111f',
    overlayOpacity: 0.08,
    badgeTop: 'PiacPro',
    badgeBottom: 'Főtér',
    heightVh: 80,
  },
  announcement: {
    enabled: false,
    text: '',
    link: '',
    background: 'rgba(0,208,132,0.15)',
    textColor: '#00d084',
  },
  theme: {
    accent: '#00C896',
    accentSecondary: '#00A67E',
    background: '#07111f',
    surface: '#0d1b2a',
    gradientTop: 'rgba(0,200,150,0.05)',
    gradientBottom: 'rgba(0,200,150,0.03)',
    glassBlur: 48,
    glassBorderOpacity: 0.18,
  },
  world: {
    enabled: true,
    particles: true,
    particleCount: 48,
    particleColor: '#00d084',
    floatingOrbs: true,
    orbIntensity: 1,
    scanLines: true,
    gridVisible: true,
    gridOpacity: 0.35,
    heroKenBurns: true,
    cardFloat: true,
    neonPulse: true,
    parallaxStrength: 1,
    globalSaturation: 1,
    globalContrast: 1,
    depthBlur: 48,
  },
  customCss: '',
  quarters: [],
  pages: PAGE_SKIN_DEFAULTS,
  quickAccess: [],
  cityMapHotspots: [],
  cityMapDefaults: { ...DEFAULT_CITY_MAP_DEFAULTS },
  nav: {
    brandSubtitle: 'Magyar Közösségi Piactér',
    searchPlaceholder: 'Mit keresel a városban?',
  },
  media: {
    logoImageUrl: '',
    ambientBgUrl: WORLD_BACKGROUND_4K,
    ogImageUrl: WORLD_BACKGROUND_4K,
  },
  footer: {
    tagline: 'Magyarország modern közösségi piactere. Add el, vedd meg — egyszerűen, biztonságosan, gyorsan.',
  },
  maintenance: {
    enabled: false,
    message: 'A weboldal karbantartás alatt áll. Hamarosan visszatérünk.',
  },
  home: {
    variant: 'city',
    menuStyle: 'rail',
  },
  homeWow: { ...DEFAULT_HOME_WOW },
};

const LOCAL_STORAGE_KEY = 'piacpro_site_config_v2';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    const bv = out[key];
    if (Array.isArray(pv)) {
      out[key] = pv;
    } else if (isPlainObject(pv) && isPlainObject(bv)) {
      out[key] = deepMerge(bv, pv);
    } else if (pv !== undefined) {
      out[key] = pv;
    }
  }
  return out as T;
}

export function mergeSiteConfig(raw: unknown): SiteCustomizationConfig {
  const base = { ...DEFAULT_SITE_CONFIG, quarters: [] as QuarterOverride[] };
  if (!raw || typeof raw !== 'object') return base;
  const merged = deepMerge(
    DEFAULT_SITE_CONFIG as unknown as Record<string, unknown>,
    raw as Record<string, unknown>,
  ) as unknown as SiteCustomizationConfig;
  // Oldalak: alapértelmezett + mentett felülírások
  const pageMap = new Map((merged.pages || []).map((p) => [p.path, p]));
  merged.pages = PAGE_SKIN_DEFAULTS.map((def) => {
    const saved = pageMap.get(def.path) || {};
    const savedBg = saved.bgImage ?? '';
    const bgImage =
      !savedBg || LEGACY_WORLD_BACKGROUNDS.has(savedBg) || savedBg.includes('piacpro-')
        ? def.bgImage
        : savedBg;
    return {
      ...def,
      ...saved,
      path: def.path,
      label: saved.label || def.label,
      bgImage,
      title: saved.title || def.title,
      subtitle: saved.subtitle || def.subtitle,
    };
  });
  if (LEGACY_WORLD_BACKGROUNDS.has(merged.hero.imageUrl)) {
    merged.hero.imageUrl = WORLD_BACKGROUND_4K;
  }
  if (LEGACY_WORLD_BACKGROUNDS.has(merged.media.ambientBgUrl)) {
    merged.media.ambientBgUrl = WORLD_BACKGROUND_4K;
  }
  if (!merged.media.ogImageUrl || LEGACY_WORLD_BACKGROUNDS.has(merged.media.ogImageUrl)) {
    merged.media.ogImageUrl = WORLD_BACKGROUND_4K;
  }
  if (!merged.home || typeof merged.home !== 'object') {
    merged.home = { ...DEFAULT_SITE_CONFIG.home };
  } else {
    merged.home = {
      variant: normalizeHomeVariant(merged.home.variant),
      menuStyle: merged.home.menuStyle === 'floating' ? 'floating' : 'rail',
    };
  }
  merged.cityMapDefaults = {
    ...DEFAULT_CITY_MAP_DEFAULTS,
    ...(merged.cityMapDefaults && typeof merged.cityMapDefaults === 'object' ? merged.cityMapDefaults : {}),
  };
  merged.homeWow = {
    ...DEFAULT_HOME_WOW,
    ...(merged.homeWow && typeof merged.homeWow === 'object' ? merged.homeWow : {}),
  };
  return merged;
}

export function loadConfigFromLocalStorage(): SiteCustomizationConfig | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return mergeSiteConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveConfigToLocalStorage(config: SiteCustomizationConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export interface BaseQuarter {
  id: QuarterId;
  label: string;
  sublabel: string;
  desc: string;
  img: string;
  color: string;
  path: string;
  [key: string]: unknown;
}

export function applyQuarterOverrides<T extends BaseQuarter>(base: T[], overrides: QuarterOverride[]): T[] {
  const byId = new Map(overrides.map((o) => [o.id, o]));
  return base
    .map((q) => {
      const o = byId.get(q.id);
      if (o?.hidden) return null;
      if (!o) return q;
      return {
        ...q,
        ...(o.label !== undefined && o.label !== '' && { label: o.label }),
        ...(o.sublabel !== undefined && o.sublabel !== '' && { sublabel: o.sublabel }),
        ...(o.desc !== undefined && o.desc !== '' && { desc: o.desc }),
        ...(o.img !== undefined && o.img !== '' && { img: o.img }),
        ...(o.color !== undefined && o.color !== '' && { color: o.color }),
        ...(o.path !== undefined && o.path !== '' && { path: o.path }),
      };
    })
    .filter((q): q is T => q !== null);
}

export function getPageSkin(config: SiteCustomizationConfig, path: string): PageSkinConfig | null {
  const exact = config.pages.find((p) => p.path === path);
  if (exact && (exact.bgImage || exact.bgColor || exact.title)) return exact;
  const prefix = config.pages.find((p) => p.path !== '/' && path.startsWith(p.path) && (p.bgImage || p.bgColor));
  return prefix || (path === '/' ? config.pages.find((p) => p.path === '/') || null : null);
}

export function applySiteTheme(config: SiteCustomizationConfig) {
  const root = document.documentElement;
  const w = config.world;
  const t = config.theme;

  root.style.setProperty('--piac-accent', t.accent);
  root.style.setProperty('--piac-accent-2', t.accentSecondary);
  root.style.setProperty('--piac-bg', t.background);
  root.style.setProperty('--piac-surface', t.surface);
  root.style.setProperty('--piac-glass-blur', `${t.glassBlur}px`);
  root.style.setProperty('--piac-glass-border', `rgba(0,208,132,${t.glassBorderOpacity})`);
  root.style.setProperty('--piac-grid-opacity', String(w.gridOpacity));
  root.style.setProperty('--piac-saturation', String(w.globalSaturation));
  root.style.setProperty('--piac-contrast', String(w.globalContrast));
  root.style.setProperty('--piac-particle-color', w.particleColor);

  document.body.style.backgroundColor = t.background;
  document.body.style.filter = '';
  const appRoot = document.getElementById('root');
  if (appRoot) {
    // NE filter a #root-on — position:fixed gyerekek az oldal aljára kerülnek, nem a viewportra.
    appRoot.style.filter = '';
  }

  const homeVariant = normalizeHomeVariant(config.home?.variant);
  const homeMenu = config.home?.menuStyle === 'floating' ? 'floating' : 'rail';
  root.dataset.piacHomeVariant = homeVariant;
  root.dataset.piacHomeMenu = homeMenu;

  root.dataset.piacWorld = w.enabled ? '1' : '0';
  root.dataset.piacParticles = w.enabled && w.particles ? '1' : '0';
  root.dataset.piacOrbs = w.enabled && w.floatingOrbs ? '1' : '0';
  root.dataset.piacScanlines = w.enabled && w.scanLines ? '1' : '0';
  root.dataset.piacGrid = w.enabled && w.gridVisible ? '1' : '0';
  root.dataset.piacKenburns = w.enabled && w.heroKenBurns ? '1' : '0';
  root.dataset.piacCardfloat = w.enabled && w.cardFloat ? '1' : '0';
  root.dataset.piacNeonpulse = w.enabled && w.neonPulse ? '1' : '0';

  let styleEl = document.getElementById('piac-custom-css') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'piac-custom-css';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = config.customCss || '';

  let ambientEl = document.getElementById('piac-ambient-css') as HTMLStyleElement | null;
  if (!ambientEl) {
    ambientEl = document.createElement('style');
    ambientEl.id = 'piac-ambient-css';
    document.head.appendChild(ambientEl);
  }
  const accentRgb = hexToRgb(t.accent);
  ambientEl.textContent = `
    body::before {
      background:
        radial-gradient(ellipse 120% 60% at 15% -10%, ${t.gradientTop} 0%, transparent 55%),
        radial-gradient(ellipse 80% 50% at 85% 10%, rgba(59,130,246,0.04) 0%, transparent 50%),
        radial-gradient(ellipse 100% 70% at 50% 110%, ${t.gradientBottom} 0%, transparent 55%) !important;
    }
    body::after {
      opacity: ${w.gridVisible ? w.gridOpacity : 0} !important;
      background-image:
        linear-gradient(rgba(${accentRgb},0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(${accentRgb},0.04) 1px, transparent 1px) !important;
    }
    .glass, .glass-bubble, .glass-pill {
      border-color: var(--piac-glass-border, rgba(0,208,132,0.18)) !important;
    }
    .glass-pill-active, .breathe-green {
      color: var(--piac-accent, #00d084) !important;
    }
  `;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '0,208,132';
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Felhasználóbarát mentési hibaüzenet */
export function formatSiteSaveError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('does not exist') || m.includes('site_customization')) {
    return 'Az adatbázis tábla még nincs létrehozva. Futtasd a Supabase migrációt (site_customization), vagy a beállítások a böngészőbe mentődnek.';
  }
  if (m.includes('nincs jogosultság') || m.includes('permission') || m.includes('row-level')) {
    return 'Nincs jogosultság menteni. Jelentkezz be gerzsonpapa@gmail.com fiókkal.';
  }
  if (m.includes('save_site_customization')) {
    return 'A mentés funkció (RPC) nincs telepítve. Futtasd a legújabb Supabase migrációt.';
  }
  return message;
}
