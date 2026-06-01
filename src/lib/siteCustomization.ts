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

export interface SiteCustomizationConfig {
  hero: {
    title: string;
    subtitle: string;
    imageUrl: string;
    brightness: number;
  };
  announcement: {
    enabled: boolean;
    text: string;
    link: string;
    background: string;
    textColor: string;
  };
  theme: {
    accent: string;
    background: string;
  };
  customCss: string;
  quarters: QuarterOverride[];
  footer: {
    tagline: string;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
}

export const DEFAULT_SITE_CONFIG: SiteCustomizationConfig = {
  hero: {
    title: 'ÜDV A PIACPRO VILÁGÁBAN!',
    subtitle: 'Fedezd fel a lehetőségeket. Minden egy helyen.',
    imageUrl: '/4958ed4e-94b0-44bb-9a73-d253229f7c40.jpg',
    brightness: 0.68,
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
    background: '#07111f',
  },
  customCss: '',
  quarters: [],
  footer: {
    tagline: 'Magyarország modern közösségi piactere. Add el, vedd meg — egyszerűen, biztonságosan, gyorsan.',
  },
  maintenance: {
    enabled: false,
    message: 'A weboldal karbantartás alatt áll. Hamarosan visszatérünk.',
  },
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    const bv = out[key];
    if (isPlainObject(pv) && isPlainObject(bv)) {
      out[key] = deepMerge(bv, pv);
    } else if (pv !== undefined) {
      out[key] = pv;
    }
  }
  return out as T;
}

export function mergeSiteConfig(raw: unknown): SiteCustomizationConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SITE_CONFIG, quarters: [] };
  return deepMerge(
    DEFAULT_SITE_CONFIG as unknown as Record<string, unknown>,
    raw as Record<string, unknown>,
  ) as unknown as SiteCustomizationConfig;
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
        ...(o.label !== undefined && { label: o.label }),
        ...(o.sublabel !== undefined && { sublabel: o.sublabel }),
        ...(o.desc !== undefined && { desc: o.desc }),
        ...(o.img !== undefined && { img: o.img }),
        ...(o.color !== undefined && { color: o.color }),
        ...(o.path !== undefined && { path: o.path }),
      };
    })
    .filter((q): q is T => q !== null);
}

export function applySiteTheme(config: SiteCustomizationConfig) {
  const root = document.documentElement;
  root.style.setProperty('--piac-accent', config.theme.accent);
  root.style.setProperty('--piac-bg', config.theme.background);
  document.body.style.backgroundColor = config.theme.background;

  let styleEl = document.getElementById('piac-custom-css') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'piac-custom-css';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = config.customCss || '';
}
