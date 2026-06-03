/** Alapértelmezett hub gomb-pozíciók (kép %-ban) — hub-v3 képhez igazítva. */
export const HUB_HOTSPOT_DEFAULTS: Record<
  string,
  { imageTop: string; imageLeft: string; pinSize?: 'xs' | 'sm' | 'md' | 'lg'; pinVariant?: 'icon' | 'card' | 'icon-card' | 'compact-card' }
> = {
  'piac-ter': { imageTop: '58', imageLeft: '9', pinSize: 'md', pinVariant: 'icon-card' },
  munka: { imageTop: '32', imageLeft: '71', pinSize: 'sm', pinVariant: 'icon-card' },
  licit: { imageTop: '34', imageLeft: '19', pinSize: 'sm', pinVariant: 'icon-card' },
  termelok: { imageTop: '46', imageLeft: '90', pinSize: 'sm', pinVariant: 'icon-card' },
  boltok: { imageTop: '54', imageLeft: '82', pinSize: 'md', pinVariant: 'icon-card' },
  kozossegi: { imageTop: '38', imageLeft: '57', pinSize: 'sm', pinVariant: 'icon-card' },
  segitsegkozpont: { imageTop: '42', imageLeft: '28', pinSize: 'xs', pinVariant: 'icon-card' },
  'templom-adomany': { imageTop: '50', imageLeft: '41', pinSize: 'sm', pinVariant: 'icon-card' },
  'hirnev-torony': { imageTop: '18', imageLeft: '48', pinSize: 'xs', pinVariant: 'icon' },
  vedelem: { imageTop: '28', imageLeft: '38', pinSize: 'xs', pinVariant: 'icon-card' },
};
