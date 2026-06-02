import type { QuarterId, SiteCustomizationConfig } from './siteCustomization';

export type EditFieldType = 'text' | 'textarea' | 'image' | 'color' | 'number';

export interface EditFieldMeta {
  key: string;
  label: string;
  type: EditFieldType;
  min?: number;
  max?: number;
  step?: number;
}

export const EDIT_FIELD_META: Record<string, EditFieldMeta> = {
  'hero.title': { key: 'hero.title', label: 'Főcím (hero)', type: 'text' },
  'hero.subtitle': { key: 'hero.subtitle', label: 'Alcím (hero)', type: 'textarea' },
  'hero.imageUrl': { key: 'hero.imageUrl', label: 'Főváros háttér (hub kép)', type: 'image' },
  'hero.badgeTop': { key: 'hero.badgeTop', label: 'Központi jelvény (felső)', type: 'text' },
  'hero.badgeBottom': { key: 'hero.badgeBottom', label: 'Központi jelvény (alsó)', type: 'text' },
  'nav.brandSubtitle': { key: 'nav.brandSubtitle', label: 'Logo alcím', type: 'text' },
  'nav.searchPlaceholder': { key: 'nav.searchPlaceholder', label: 'Kereső szöveg', type: 'text' },
  'footer.tagline': { key: 'footer.tagline', label: 'Lábléc leírás', type: 'textarea' },
  'media.logoImageUrl': { key: 'media.logoImageUrl', label: 'Logo kép', type: 'image' },
  'media.ambientBgUrl': { key: 'media.ambientBgUrl', label: 'Ambient háttér', type: 'image' },
  'announcement.text': { key: 'announcement.text', label: 'Bejelentő sáv szöveg', type: 'text' },
  'theme.accent': { key: 'theme.accent', label: 'Fő szín', type: 'color' },
  'theme.background': { key: 'theme.background', label: 'Háttérszín', type: 'color' },
};

const QUARTER_LABELS: Record<QuarterId, string> = {
  'piac-ter': 'Piac tér',
  'munka-negyed': 'Munka negyed',
  'boltok-utcaja': 'Boltok utcája',
  'licit-csarnok': 'Licit csarnok',
  'kozossegi-ter': 'Közösségi tér',
  'adomany-kozpont': 'Adomány központ',
  'termelok-piaca': 'Termelők piaca',
};

export function quarterEditMeta(id: QuarterId, field: 'label' | 'sublabel' | 'desc' | 'img' | 'color'): EditFieldMeta {
  const type = field === 'img' ? 'image' : field === 'color' ? 'color' : 'text';
  const names: Record<string, string> = {
    label: 'címke',
    sublabel: 'alcím',
    desc: 'leírás',
    img: 'kép',
    color: 'szín',
  };
  return {
    key: `quarter.${id}.${field}`,
    label: `${QUARTER_LABELS[id]} — ${names[field]}`,
    type,
  };
}

export function pageEditMeta(path: string, field: 'title' | 'subtitle' | 'bgImage' | 'bgColor'): EditFieldMeta {
  const type = field === 'bgImage' ? 'image' : field === 'bgColor' ? 'color' : 'text';
  const fieldNames: Record<string, string> = {
    title: 'cím',
    subtitle: 'alcím',
    bgImage: 'háttérkép',
    bgColor: 'háttérszín',
  };
  return {
    key: `page.${path}.${field}`,
    label: `${path} oldal — ${fieldNames[field] ?? field}`,
    type,
  };
}

export function getEditMeta(key: string): EditFieldMeta {
  if (EDIT_FIELD_META[key]) return EDIT_FIELD_META[key];
  const qm = key.match(/^quarter\.([^.]+)\.(\w+)$/);
  if (qm) return quarterEditMeta(qm[1] as QuarterId, qm[2] as 'label' | 'sublabel' | 'desc' | 'img' | 'color');
  const pm = key.match(/^page\.(.+)\.(title|subtitle|bgImage|bgColor)$/);
  if (pm) return pageEditMeta(pm[1], pm[2] as 'title' | 'subtitle' | 'bgImage' | 'bgColor');
  return { key, label: key, type: 'text' };
}

function getNested(obj: unknown, parts: string[]): unknown {
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function setNested<T extends object>(obj: T, parts: string[], value: unknown): T {
  if (parts.length === 0) return obj;
  const [head, ...rest] = parts;
  if (rest.length === 0) {
    return { ...obj, [head]: value };
  }
  const prev = getNested(obj, [head]);
  const nextChild =
    prev && typeof prev === 'object' && !Array.isArray(prev)
      ? setNested(prev as object, rest, value)
      : setNested({}, rest, value);
  return { ...obj, [head]: nextChild };
}

export function getConfigValueByEditKey(config: SiteCustomizationConfig, key: string): string {
  if (key.startsWith('quarter.')) {
    const [, id, field] = key.split('.');
    const q = config.quarters.find((x) => x.id === id);
    const v = q?.[field as keyof typeof q];
    return v != null ? String(v) : '';
  }
  if (key.startsWith('page.')) {
    const match = key.match(/^page\.(.+)\.(\w+)$/);
    if (!match) return '';
    const [, path, field] = match;
    const p = config.pages.find((x) => x.path === path);
    const v = p?.[field as keyof typeof p];
    return v != null ? String(v) : '';
  }
  const v = getNested(config, key.split('.'));
  return v != null ? String(v) : '';
}

export function setConfigValueByEditKey(
  config: SiteCustomizationConfig,
  key: string,
  value: string,
): SiteCustomizationConfig {
  if (key.startsWith('quarter.')) {
    const [, id, field] = key.split('.') as [string, QuarterId, string];
    const existing = config.quarters.filter((q) => q.id !== id);
    const prev = config.quarters.find((q) => q.id === id) ?? { id };
    const updated = { ...prev, [field]: value };
    return { ...config, quarters: [...existing, updated] };
  }
  if (key.startsWith('page.')) {
    const match = key.match(/^page\.(.+)\.(\w+)$/);
    if (!match) return config;
    const [, path, field] = match;
    return {
      ...config,
      pages: config.pages.map((p) =>
        p.path === path ? { ...p, [field]: value } : p,
      ),
    };
  }
  const numFields = ['hero.brightness', 'hero.saturation', 'hero.overlayOpacity', 'hero.heightVh'];
  if (numFields.includes(key)) {
    return setNested(config, key.split('.'), Number(value)) as SiteCustomizationConfig;
  }
  let next = setNested(config, key.split('.'), value) as SiteCustomizationConfig;
  if (key === 'hero.imageUrl') {
    next = { ...next, media: { ...next.media, ambientBgUrl: value } };
  } else if (key === 'media.ambientBgUrl') {
    next = { ...next, hero: { ...next.hero, imageUrl: value } };
  }
  return next;
}
