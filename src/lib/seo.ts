import { useEffect } from 'react';

const SITE_NAME = 'PiacPro';
const BASE_URL = 'https://piacpro.hu';
const DEFAULT_IMAGE = '/kell.png';
const DEFAULT_DESC =
  'PiacPro – Magyarország modern közösségi piactere. Adj el, vegyél, licitálj, keress munkát, találj helyi termelőt. Ingyenes hirdetésfeladás.';

interface SEOOptions {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSEO({ title, description, image, path, type = 'website', noindex = false }: SEOOptions) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Magyar Közösségi Piactér`;
    const desc = description || DEFAULT_DESC;
    const img = image || `${BASE_URL}${DEFAULT_IMAGE}`;
    const url = `${BASE_URL}${path || window.location.pathname}`;

    document.title = fullTitle;

    setMeta('description', desc);
    setMeta('robots', noindex ? 'noindex,nofollow' : 'index,follow');

    // Open Graph
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:image', img, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:type', type, 'property');
    setMeta('og:site_name', SITE_NAME, 'property');
    setMeta('og:locale', 'hu_HU', 'property');

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', img);

    // Canonical
    setLink('canonical', url);
  }, [title, description, image, path, type, noindex]);
}

// Pre-built configs for static pages
export const SEO_PAGES = {
  home: {
    title: undefined,
    description: DEFAULT_DESC,
  },
  search: {
    title: 'Hirdetések',
    description: 'Böngéssz ezrek között: használt és új termékek, elektronika, bútor, ruha, autó és sok más – PiacPro ingyen hirdetési piactér.',
  },
  auctions: {
    title: 'Licitek',
    description: 'Valós idejű online licitek Magyarországon. Ajánlj árat, nyerd meg a legjobb termékeket – PiacPro aukciók.',
  },
  jobs: {
    title: 'Álláskeresés és álláshirdetések',
    description: 'Keress munkát vagy hirdess meg állásokat Magyarországon. Teljes és részmunka, távmunka lehetőségek, fizikai és szellemi munkák – PiacPro Állások.',
  },
  shops: {
    title: 'Online boltok',
    description: 'Fedezz fel helyi vállalkozások online boltjait. Egyedi termékek, kézműves áruk, hazai márkák – PiacPro Boltok.',
  },
  producers: {
    title: 'Helyi termelők',
    description: 'Vásárolj közvetlenül a termelőtől! Bioélelmiszer, friss zöldség, tejtermék, méz, tojás – helyi gazdáktól PiacPro-n.',
  },
  donations: {
    title: 'Adománygyűjtés és felajánlások',
    description: 'Indíts adománygyűjtő kampányt vagy ajánlj fel tárgyakat és szolgáltatásokat ingyenesen. Közösségi segítségnyújtás – PiacPro.',
  },
  forum: {
    title: 'Közösségi fórum',
    description: 'Kérdezz, segíts másoknak, osszd meg tapasztalataid a PiacPro közösségi fórumán. Piactér tippek, ötletek, kérdések.',
  },
  discover: {
    title: 'Felfedezés – keresés mindenhol',
    description: 'Keress egyszerre hirdetések, licitek, állások, boltok és termelők között – PiacPro globális keresés.',
  },
  favorites: {
    title: 'Kedvenceim',
    description: undefined,
    noindex: true,
  },
  messages: {
    title: 'PiacPro Chat',
    description: 'Üzenetváltás vásárlókkal és eladókkal a PiacPro piactéren.',
    noindex: true,
  },
  admin: {
    title: 'Adminisztráció',
    description: undefined,
    noindex: true,
  },
  rules: {
    title: 'Felhasználási szabályzat',
    description: 'A PiacPro felhasználási feltételei, adatvédelmi szabályzat és közösségi irányelvek.',
  },
  vedelem: {
    title: 'Pénzügyi tanácsadás és védelem',
    description: 'Nyugdíjelőtakarékosság, lakáshitel, életbiztosítás, KGFB – pénzügyi megoldások és személyes tanácsadás OVB partneren keresztül.',
  },
  localBusinesses: {
    title: 'Helyi vállalkozások',
    description: 'Fedezz fel helyi kiskereskedőket, kézműveseket és vállalkozásokat a környékeden. Térkép nézet, értékelések – PiacPro.',
  },
} as const;
