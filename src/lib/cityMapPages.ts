/** Navigálható oldalak — fejlesztői térkép-szerkesztőhöz */
export const APP_PAGE_OPTIONS: { path: string; label: string }[] = [
  { path: '/search', label: 'Piac / Hirdetések' },
  { path: '/discover', label: 'Globális keresés' },
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

export type CityPinSize = 'xs' | 'sm' | 'md' | 'lg';
export type CityPinVariant = 'icon' | 'card' | 'icon-card' | 'compact-card';

export const CITY_PIN_SIZES: { id: CityPinSize; label: string }[] = [
  { id: 'xs', label: 'XS — 20px' },
  { id: 'sm', label: 'S — 24px' },
  { id: 'md', label: 'M — 32px' },
  { id: 'lg', label: 'L — 40px' },
];

export const CITY_PIN_VARIANTS: { id: CityPinVariant; label: string; desc: string }[] = [
  { id: 'icon', label: 'Csak ikon', desc: 'Kis kör gomb' },
  { id: 'icon-card', label: 'Ikon + címke', desc: 'Mobil ajánlott' },
  { id: 'compact-card', label: 'Mini kártya', desc: 'Ikon + rövid szöveg' },
  { id: 'card', label: 'Teljes kártya', desc: 'Asztali nézet' },
];

export type CityCardStyle = 'glass' | 'neon' | 'minimal' | 'bold';

export const CITY_CARD_STYLES: { id: CityCardStyle; label: string; desc: string }[] = [
  { id: 'glass', label: 'Üveg', desc: 'Átlátszó, modern' },
  { id: 'neon', label: 'Neon', desc: 'Erős fény, kiemelt' },
  { id: 'minimal', label: 'Minimal', desc: 'Visszafogott, kicsi' },
  { id: 'bold', label: 'Merész', desc: 'Nagy, feltűnő' },
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
  { id: 'search', label: 'Keresés' },
  { id: 'message', label: 'Üzenet' },
];

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
  showLabel?: boolean;
  hidden?: boolean;
}
