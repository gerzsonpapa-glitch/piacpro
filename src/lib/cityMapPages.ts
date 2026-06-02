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
  color?: string;
  iconId?: string;
  cardStyle?: CityCardStyle;
  hidden?: boolean;
}
