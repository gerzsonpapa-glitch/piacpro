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
  'Diákmunka / Nyári munka', 'Alkalmi munka / Részmunka', 'Otthoni / Home office', 'Azonnali kezdés',
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
