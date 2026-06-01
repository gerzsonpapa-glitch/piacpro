import type { Listing } from './types';

// Supabase returns numeric columns as strings and reverse-FK joins as arrays.
// This normalizes a listing's auction field to a proper single object with numbers.
export function normalizeListingAuction(listing: Listing): Listing {
  let auction = listing.auction;
  if (!auction) return listing;
  if (Array.isArray(auction)) auction = (auction as unknown[])[0] as typeof auction ?? undefined;
  if (!auction) return { ...listing, auction: undefined };
  return {
    ...listing,
    auction: {
      ...auction,
      current_price: Number(auction.current_price),
      starting_price: Number(auction.starting_price),
      min_bid_increment: Number(auction.min_bid_increment),
      bid_count: Number(auction.bid_count ?? 0),
      extension_count: Number(auction.extension_count ?? 0),
    },
  };
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU').format(price) + ' Ft';
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Most';
  if (diffMins < 60) return `${diffMins} perce`;
  if (diffHours < 24) return `${diffHours} órája`;
  if (diffDays < 7) return `${diffDays} napja`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hete`;
  return then.toLocaleDateString('hu-HU');
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Appends Supabase image transform params for width-limited delivery.
 * Only applies to Supabase storage URLs; passes through all other URLs unchanged.
 */
export function getOptimizedImageUrl(url: string | null | undefined, width: number): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('.supabase.co') && u.pathname.includes('/storage/')) {
      u.searchParams.set('width', String(width));
      u.searchParams.set('quality', '80');
      u.searchParams.set('format', 'webp');
      return u.toString();
    }
  } catch {
    // not a valid URL, return as-is
  }
  return url;
}

export type OnlineStatus = 'online' | 'recently' | 'offline';

export function getOnlineStatus(lastSeen: string | null | undefined): OnlineStatus {
  if (!lastSeen) return 'offline';
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  if (diffMs < 3 * 60 * 1000) return 'online';
  if (diffMs < 30 * 60 * 1000) return 'recently';
  return 'offline';
}

export function getOnlineLabel(lastSeen: string | null | undefined): string {
  if (!lastSeen) return 'Ismeretlen';
  const status = getOnlineStatus(lastSeen);
  if (status === 'online') return 'Aktív';
  if (status === 'recently') return `Aktív volt ${formatRelativeTime(lastSeen)}`;
  return `Utoljára látva: ${formatRelativeTime(lastSeen)}`;
}

export const JOB_CATEGORIES = [
  'Összes',
  // Raktár / logisztika
  'Targoncavezető', 'Raktáros', 'Komissiózó', 'Csomagoló / Szortírozó', 'Sofőr / Fuvarozó', 'Futár / Kézbesítő', 'Logisztika / Készletgazdálkodás',
  // Kereskedelem / bolt
  'Bolti eladó', 'Pénztáros', 'Árufeltöltő', 'Üzletvezető / Üzletasszisztens', 'Kereskedelmi képviselő', 'Értékesítő', 'Nagykereskedelmi ügyintéző',
  // Vendéglátás
  'Pincér / Felszolgáló', 'Szakács / Séf', 'Cukrász / Pék', 'Konyhai kisegítő', 'Barista / Bárpultos', 'Éttermi vezető / Menedzser',
  // Fizikai / ipari
  'Gyári munkás / Összeszerelő', 'Hegesztő', 'Gépi forgácsoló / CNC-kezelő', 'Villanyszerelő', 'Vízvezetékszerelő / Gázszerelő', 'Festő / Tapétázó', 'Kőműves / Építőipari munkás', 'Takarító / Tisztasági', 'Kertész / Parkfenntartó', 'Mezőgazdasági munkás',
  // Irodai / adminisztráció
  'Irodai adminisztrátor', 'Ügyfélszolgálatos', 'Titkár / Asszisztens', 'Adatrögzítő', 'Könyvelő / Pénzügyi ügyintéző', 'HR / Személyzeti ügyintéző',
  // IT / tech
  'Szoftverfejlesztő / Programozó', 'Rendszergazda / IT-üzemeltető', 'Webfejlesztő', 'IT-ügyfélszolgálat / Helpdesk', 'Adatelemző / BI-fejlesztő',
  // Egészségügy / szociális
  'Ápoló / Gondozó', 'Orvos / Egészségügyi szakember', 'Szociális munkás / Segítő', 'Gyógytornász / Fizikoterapeuta', 'Gyógyszerész', 'Fogorvos / Asszisztens',
  // Oktatás
  'Tanár / Oktató', 'Óvónő / Gondozó', 'Edző / Sportszakember', 'Nyelvtanár / Fordító',
  // Biztonság / védelem
  'Biztonsági őr / Portás', 'Tűzoltó / Mentős',
  // Szépségipar / személyes szolgáltatás
  'Fodrász / Kozmetikus', 'Masszőr / Testápoló', 'Manikűrös / Pedikűrös',
  // Média / kreatív
  'Grafikus / Designer', 'Fotós / Videós', 'Marketing / Social media', 'Copywriter / Tartalom-előállító',
  // Diák / alkalmi
  'Diákmunka / Nyári munka', 'Alkalmi munka / Részmunka', 'Otthoni / távmunka', 'Azonnali kezdés',
  // Külföldi
  'Külföldi munka – EU', 'Külföldi munka – Egyéb',
  // Egyéb
  'Egyéb',
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const HUNGARIAN_COUNTIES = [
  'Bács-Kiskun megye',
  'Baranya megye',
  'Békés megye',
  'Borsod-Abaúj-Zemplén megye',
  'Csongrád-Csanád megye',
  'Fejér megye',
  'Győr-Moson-Sopron megye',
  'Hajdú-Bihar megye',
  'Heves megye',
  'Jász-Nagykun-Szolnok megye',
  'Komárom-Esztergom megye',
  'Nógrád megye',
  'Pest megye',
  'Somogy megye',
  'Szabolcs-Szatmár-Bereg megye',
  'Tolna megye',
  'Vas megye',
  'Veszprém megye',
  'Zala megye',
  'Budapest',
] as const;

export type HungarianCounty = (typeof HUNGARIAN_COUNTIES)[number];

export const RANK_CONFIG: Record<number, { title: string; color: string; bg: string; border: string; emoji: string }> = {
  1: { title: 'Újonc',            color: 'text-zinc-400',    bg: 'bg-zinc-500/10',    border: 'border-zinc-500/20',    emoji: '🌱' },
  2: { title: 'Megbízható Eladó', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    emoji: '✅' },
  3: { title: 'Profi Eladó',      color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    emoji: '⭐' },
  4: { title: 'Kiemelt Eladó',    color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   emoji: '🏆' },
  5: { title: 'PiacPro Partner',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', emoji: '💎' },
};
