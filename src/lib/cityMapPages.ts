/** Navigálható oldalak — fejlesztői térkép-szerkesztőhöz */
export const APP_PAGE_OPTIONS: { path: string; label: string }[] = [
  { path: '/search', label: 'Piac / Hirdetések' },
  { path: '/discover', label: 'Keresés az egész oldalon' },
  { path: '/uzleti', label: 'Vállalkozások központ' },
  { path: '/hogyan-mukodik', label: 'Hogyan működik?' },
  { path: '/create', label: 'Hirdetés feladása' },
  { path: '/favorites', label: 'Kedvencek' },
  { path: '/auctions', label: 'Aukciók' },
  { path: '/create-auction', label: 'Licit indítása' },
  { path: '/jobs', label: 'Állások' },
  { path: '/forum', label: 'Fórum' },
  { path: '/messages', label: 'Üzenetek' },
  { path: '/helyi-vallalkozasok', label: 'Helyi vállalkozások' },
  { path: '/shops', label: 'Boltok' },
  { path: '/producers', label: 'Termelők' },
  { path: '/donations', label: 'Adományok' },
  { path: '/donations/create', label: 'Adomány létrehozása' },
  { path: '/vedelem', label: 'Védelem' },
  { path: '/piac-ai', label: 'PiacAI chat' },
  { path: '/rules', label: 'Szabályzat' },
  { path: '/admin', label: 'Admin' },
  { path: '/login', label: 'Bejelentkezés' },
  { path: '/register', label: 'Regisztráció' },
  { path: '/my-shop', label: 'Saját bolt' },
  { path: '/vallalkozasom', label: 'Vállalkozásom' },
];

/** 10 prémium pin méret — minden stílushoz külön skálázható */
export type CityPinSize =
  | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'hero' | 'mega';

export const CITY_PIN_SIZES: { id: CityPinSize; label: string; px: number }[] = [
  { id: '2xs', label: '2XS', px: 16 },
  { id: 'xs', label: 'XS', px: 20 },
  { id: 'sm', label: 'S', px: 24 },
  { id: 'md', label: 'M', px: 32 },
  { id: 'lg', label: 'L', px: 40 },
  { id: 'xl', label: 'XL', px: 48 },
  { id: '2xl', label: '2XL', px: 56 },
  { id: '3xl', label: '3XL', px: 64 },
  { id: 'hero', label: 'Hero', px: 72 },
  { id: 'mega', label: 'Mega', px: 88 },
];

/** 10 prémium pin megjelenés */
export type CityPinVariant =
  | 'icon'
  | 'icon-card'
  | 'compact-card'
  | 'card'
  | 'badge'
  | 'ring'
  | 'beacon'
  | 'ribbon'
  | 'stack'
  | 'portal';

export const CITY_PIN_VARIANTS: { id: CityPinVariant; label: string; desc: string; tier: 'core' | 'premium' }[] = [
  { id: 'icon', label: 'Csak ikon', desc: 'Minimal kör gomb', tier: 'core' },
  { id: 'icon-card', label: 'Ikon + címke', desc: 'Mobil ajánlott', tier: 'core' },
  { id: 'compact-card', label: 'Mini kártya', desc: 'Ikon + rövid szöveg', tier: 'core' },
  { id: 'card', label: 'Teljes kártya', desc: 'Asztali prémium', tier: 'core' },
  { id: 'badge', label: 'Jelvény', desc: 'Ikon + értesítő pont', tier: 'premium' },
  { id: 'ring', label: 'Gyűrű', desc: 'Dupla keret, fókusz', tier: 'premium' },
  { id: 'beacon', label: 'Világítótorony', desc: 'Függőleges fényoszlop', tier: 'premium' },
  { id: 'ribbon', label: 'Szalag', desc: 'Vízszintes banner címke', tier: 'premium' },
  { id: 'stack', label: 'Rétegelt', desc: 'Ikon a kártya felett', tier: 'premium' },
  { id: 'portal', label: 'Portál', desc: 'Koncentrikus glow kapu', tier: 'premium' },
];

/** 10 prémium kártya stílus */
export type CityCardStyle =
  | 'glass'
  | 'neon'
  | 'minimal'
  | 'bold'
  | 'frosted'
  | 'hologram'
  | 'pill'
  | 'outline'
  | 'gradient'
  | 'royal';

export const CITY_CARD_STYLES: { id: CityCardStyle; label: string; desc: string; tier: 'core' | 'premium' }[] = [
  { id: 'glass', label: 'Üveg', desc: 'Átlátszó, modern', tier: 'core' },
  { id: 'neon', label: 'Neon', desc: 'Erős fény, kiemelt', tier: 'core' },
  { id: 'minimal', label: 'Minimal', desc: 'Visszafogott, kicsi', tier: 'core' },
  { id: 'bold', label: 'Merész', desc: 'Nagy, feltűnő', tier: 'core' },
  { id: 'frosted', label: 'Matt üveg', desc: 'Finom homály, prémium', tier: 'premium' },
  { id: 'hologram', label: 'Hologram', desc: 'Irisz effekt, sci-fi', tier: 'premium' },
  { id: 'pill', label: 'Kapszula', desc: 'Lekerekített chip', tier: 'premium' },
  { id: 'outline', label: 'Körvonal', desc: 'Vékony keret, elegáns', tier: 'premium' },
  { id: 'gradient', label: 'Gradiens', desc: 'Színátmenetes panel', tier: 'premium' },
  { id: 'royal', label: 'Royal', desc: 'Arany-accent prémium', tier: 'premium' },
];

export const CITY_ICON_OPTIONS: { id: string; label: string }[] = [
  { id: 'shopping', label: 'Piac' },
  { id: 'gavel', label: 'Licit' },
  { id: 'briefcase', label: 'Munka' },
  { id: 'users', label: 'Közösség' },
  { id: 'store', label: 'Bolt' },
  { id: 'heart', label: 'Szív / Adomány' },
  { id: 'leaf', label: 'Termelő' },
  { id: 'award', label: 'Hírnév / Jelvény' },
  { id: 'handheart', label: 'Segítség' },
  { id: 'shield', label: 'Védelem' },
  { id: 'search', label: 'Keresés' },
  { id: 'message', label: 'Üzenet' },
  { id: 'star', label: 'Csillag / Kiemelt' },
  { id: 'home', label: 'Otthon / Hub' },
  { id: 'sparkles', label: 'Prémium / AI' },
];

const PIN_SIZE_SET = new Set<string>(CITY_PIN_SIZES.map((s) => s.id));
const PIN_VARIANT_SET = new Set<string>(CITY_PIN_VARIANTS.map((v) => v.id));
const CARD_STYLE_SET = new Set<string>(CITY_CARD_STYLES.map((s) => s.id));

export function normalizeCityPinSize(value: unknown, fallback: CityPinSize = 'sm'): CityPinSize {
  return typeof value === 'string' && PIN_SIZE_SET.has(value) ? (value as CityPinSize) : fallback;
}

export function normalizeCityPinVariant(value: unknown, fallback: CityPinVariant = 'icon-card'): CityPinVariant {
  return typeof value === 'string' && PIN_VARIANT_SET.has(value) ? (value as CityPinVariant) : fallback;
}

export function normalizeCityCardStyle(value: unknown, fallback: CityCardStyle = 'glass'): CityCardStyle {
  return typeof value === 'string' && CARD_STYLE_SET.has(value) ? (value as CityCardStyle) : fallback;
}

export function normalizePinScale(value: unknown, fallback = 1): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(2, Math.max(0.5, Math.round(n * 100) / 100));
}

export function getPinSizeMeta(size: CityPinSize) {
  return CITY_PIN_SIZES.find((s) => s.id === size) ?? CITY_PIN_SIZES[2];
}

export interface CityMapHotspotOverride {
  id: string;
  label?: string;
  sublabel?: string;
  path?: string;
  top?: string;
  left?: string;
  imageTop?: string;
  imageLeft?: string;
  color?: string;
  iconId?: string;
  cardStyle?: CityCardStyle;
  pinSize?: CityPinSize;
  pinVariant?: CityPinVariant;
  /** Finom skála 0.5–2.0 (100% = 1) */
  pinScale?: number;
  showLabel?: boolean;
  hidden?: boolean;
}

export interface CityMapDefaults {
  pinSize?: CityPinSize;
  pinVariant?: CityPinVariant;
  cardStyle?: CityCardStyle;
  pinScale?: number;
  showLabel?: boolean;
}

export const DEFAULT_CITY_MAP_DEFAULTS: CityMapDefaults = {
  pinSize: 'sm',
  pinVariant: 'icon-card',
  cardStyle: 'glass',
  pinScale: 1,
  showLabel: true,
};
