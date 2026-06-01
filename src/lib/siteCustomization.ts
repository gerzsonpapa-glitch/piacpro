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
  nav: {
    brandSubtitle: string;
    searchPlaceholder: string;
  };
  media: SiteMediaConfig;
  footer: { tagline: string };
  maintenance: { enabled: boolean; message: string };
}

export const PAGE_SKIN_DEFAULTS: PageSkinConfig[] = [
  { path: '/', label: 'Főoldal', bgImage: '', bgColor: '', overlay: '', title: '', subtitle: '' },
  { path: '/search', label: 'Piactér', bgImage: '', bgColor: '', overlay: '', title: '', subtitle: '' },
  { path: '/auctions', label: 'Licitek', bgImage: '', bgColor: '', overlay: '', title: '', subtitle: '' },
  { path: '/jobs', label: 'Állások', bgImage: '', bgColor: '', overlay: '', title: '', subtitle: '' },
  { path: '/donations', label: 'Adományok', bgImage: '', bgColor: '', overlay: '', title: '', subtitle: '' },
  { path: '/forum', label: 'Fórum', bgImage: '', bgColor: '', overlay: '', title: '', subtitle: '' },
  { path: '/discover', label: 'Felfedezés', bgImage: '', bgColor: '', overlay: '', title: '', subtitle: '' },
  { path: '/helyi-vallalkozasok', label: 'Helyi', bgImage: '', bgColor: '', overlay: '', title: '', subtitle: '' },
];

export const DEFAULT_SITE_CONFIG: SiteCustomizationConfig = {
  version: 2,
  hero: {
    title: 'ÜDV A PIACPRO VILÁGÁBAN!',
    subtitle: 'Fedezd fel a lehetőségeket. Minden egy helyen.',
    imageUrl: '/4958ed4e-94b0-44bb-9a73-d253229f7c40.jpg',
    brightness: 0.68,
    saturation: 1.25,
    overlayColor: '#07111f',
    overlayOpacity: 0.55,
    badgeTop: 'Piac',
    badgeBottom: 'Pro',
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
    accent: '#00d084',
    accentSecondary: '#059669',
    background: '#07111f',
    surface: '#0d1b2a',
    gradientTop: 'rgba(0,208,132,0.065)',
    gradientBottom: 'rgba(0,208,132,0.04)',
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
  nav: {
    brandSubtitle: 'Magyar Közösségi Piactér',
    searchPlaceholder: 'Keress hirdetést, munkát, boltot, szolgáltatást...',
  },
  media: {
    logoImageUrl: '',
    ambientBgUrl: '',
    ogImageUrl: '',
  },
  footer: {
    tagline: 'Magyarország modern közösségi piactere. Add el, vedd meg — egyszerűen, biztonságosan, gyorsan.',
  },
  maintenance: {
    enabled: false,
    message: 'A weboldal karbantartás alatt áll. Hamarosan visszatérünk.',
  },
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
  merged.pages = PAGE_SKIN_DEFAULTS.map((def) => ({
    ...def,
    ...(pageMap.get(def.path) || {}),
    path: def.path,
    label: pageMap.get(def.path)?.label || def.label,
  }));
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
  document.body.style.filter = w.enabled
    ? `saturate(${w.globalSaturation}) contrast(${w.globalContrast})`
    : '';

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
