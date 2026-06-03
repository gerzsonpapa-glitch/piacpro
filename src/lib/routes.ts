/**
 * Központi útvonal-regiszter — App.tsx és redirectek szinkronban tartása.
 */
export const APP_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  resetPassword: '/reset-password',
  onboarding: '/onboarding',
  howItWorks: '/hogyan-mukodik',
  businessHub: '/uzleti',
  createListing: '/create',
  createAuction: '/create-auction',
  auctions: '/auctions',
  search: '/search',
  discover: '/discover',
  favorites: '/favorites',
  messages: '/messages',
  admin: '/admin',
  rules: '/rules',
  jobs: '/jobs',
  shops: '/shops',
  myShop: '/my-shop',
  producers: '/producers',
  producersApply: '/producers/apply',
  localBusinesses: '/helyi-vallalkozasok',
  businessRegister: '/vallalkozas-regisztracio',
  myBusiness: '/vallalkozasom',
  donations: '/donations',
  donationsCreate: '/donations/create',
  offersCreate: '/offers/create',
  forum: '/forum',
  forumBugs: '/forum/hibak',
  protection: '/vedelem',
  piacAi: '/piac-ai',
  aiAssistant: '/ai-assistant',
} as const;

/** Legacy URL-ek → canonical útvonal */
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/job': '/jobs',
  '/create-job': '/jobs?create=1',
  '/ai-assistant': '/create?mode=ai',
};

export function isKnownAppPath(path: string): boolean {
  if (path === '/') return true;
  const prefixes = [
    '/listing/', '/auction/', '/edit-listing/', '/checkout/', '/profile/', '/chat/',
    '/jobs/', '/job/', '/shops/', '/producers/', '/donations/', '/offers/',
    '/helyi-vallalkozasok/', '/forum/',
  ];
  const exact = new Set(Object.values(APP_ROUTES));
  if (exact.has(path as typeof APP_ROUTES[keyof typeof APP_ROUTES])) return true;
  return prefixes.some((p) => path.startsWith(p));
}
