import type { CityPinSize, CityPinVariant } from './cityMapPages';

/** Alapértelmezett hub gomb-pozíciók (kép %-ban) — széles 16:9 hub (zones-source/hub.png v4). */
export const HUB_HOTSPOT_DEFAULTS: Record<
  string,
  {
    imageTop: string;
    imageLeft: string;
    pinSize?: CityPinSize;
    pinVariant?: CityPinVariant;
    pinScale?: number;
  }
> = {
  'piac-ter': { imageTop: '42', imageLeft: '28', pinSize: 'md', pinVariant: 'icon-card' },
  munka: { imageTop: '30', imageLeft: '48', pinSize: 'sm', pinVariant: 'icon-card' },
  licit: { imageTop: '50', imageLeft: '30', pinSize: 'sm', pinVariant: 'icon-card' },
  termelok: { imageTop: '58', imageLeft: '58', pinSize: 'sm', pinVariant: 'icon-card' },
  boltok: { imageTop: '40', imageLeft: '65', pinSize: 'md', pinVariant: 'icon-card' },
  kozossegi: { imageTop: '52', imageLeft: '70', pinSize: 'sm', pinVariant: 'icon-card' },
  segitsegkozpont: { imageTop: '46', imageLeft: '36', pinSize: 'xs', pinVariant: 'icon-card' },
  'templom-adomany': { imageTop: '58', imageLeft: '42', pinSize: 'sm', pinVariant: 'icon-card' },
  'hirnev-torony': { imageTop: '20', imageLeft: '14', pinSize: 'xs', pinVariant: 'icon' },
  vedelem: { imageTop: '24', imageLeft: '16', pinSize: 'xs', pinVariant: 'icon-card' },
};
