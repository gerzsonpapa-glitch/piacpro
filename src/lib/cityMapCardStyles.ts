import type { CSSProperties } from 'react';
import type { CityCardStyle } from './cityMapPages';

export function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.trim().replace('#', '');
  if (!raw) return `rgba(0, 230, 118, ${alpha})`;
  let r: number;
  let g: number;
  let b: number;
  if (raw.length === 3) {
    r = parseInt(raw[0] + raw[0], 16);
    g = parseInt(raw[1] + raw[1], 16);
    b = parseInt(raw[2] + raw[2], 16);
  } else if (raw.length >= 6) {
    r = parseInt(raw.slice(0, 2), 16);
    g = parseInt(raw.slice(2, 4), 16);
    b = parseInt(raw.slice(4, 6), 16);
  } else {
    return hex.startsWith('rgba') || hex.startsWith('rgb') ? hex : `rgba(0, 230, 118, ${alpha})`;
  }
  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(0, 230, 118, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function colorGlow(hex: string, alpha = 0.55): string {
  return hexToRgba(hex, alpha);
}

export interface BuildingCardPresentation {
  cardClass: string;
  buttonStyle: CSSProperties;
  iconWrapClass: string;
  iconWrapStyle: CSSProperties;
  labelClass: string;
  sublabelClass: string;
}

export function getBuildingCardPresentation(
  style: CityCardStyle | undefined,
  color: string,
): BuildingCardPresentation {
  const glow = colorGlow(color, 0.55);
  const glowStrong = colorGlow(color, 0.75);

  const baseLabel = 'font-black uppercase tracking-wide leading-tight piac-neon-text';
  const baseSub = 'text-zinc-400 leading-snug mt-0.5 line-clamp-2';

  switch (style) {
    case 'neon':
      return {
        cardClass: 'city-card-neon min-w-[172px] max-w-[220px]',
        buttonStyle: {
          background: `linear-gradient(145deg, ${hexToRgba(color, 0.22)} 0%, rgba(7,17,31,0.88) 55%, rgba(7,17,31,0.96) 100%)`,
          backdropFilter: 'blur(18px) saturate(200%)',
          WebkitBackdropFilter: 'blur(18px) saturate(200%)',
          border: `1px solid ${color}`,
          boxShadow: `0 0 36px ${glowStrong}, 0 0 12px ${color}, 0 8px 28px rgba(0,0,0,0.45), inset 0 0 24px ${hexToRgba(color, 0.12)}`,
        },
        iconWrapClass: 'w-11 h-11 rounded-xl',
        iconWrapStyle: {
          background: hexToRgba(color, 0.28),
          border: `1px solid ${color}`,
          boxShadow: `0 0 22px ${glowStrong}, inset 0 0 12px ${hexToRgba(color, 0.2)}`,
        },
        labelClass: `${baseLabel} text-[12px]`,
        sublabelClass: `${baseSub} text-[10px] text-zinc-300`,
      };

    case 'minimal':
      return {
        cardClass: 'city-card-minimal min-w-[118px] max-w-[148px]',
        buttonStyle: {
          background: 'rgba(7, 17, 31, 0.52)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${hexToRgba(color, 0.32)}`,
          boxShadow: `0 4px 16px rgba(0,0,0,0.28)`,
        },
        iconWrapClass: 'w-7 h-7 rounded-lg',
        iconWrapStyle: {
          background: hexToRgba(color, 0.12),
          border: `1px solid ${hexToRgba(color, 0.35)}`,
          boxShadow: 'none',
        },
        labelClass: `${baseLabel} text-[9px] tracking-wider`,
        sublabelClass: `${baseSub} text-[9px] mt-0 line-clamp-1`,
      };

    case 'bold':
      return {
        cardClass: 'city-card-bold min-w-[196px] max-w-[248px]',
        buttonStyle: {
          background: `linear-gradient(135deg, ${hexToRgba(color, 0.32)} 0%, rgba(7,17,31,0.94) 48%, rgba(7,17,31,0.98) 100%)`,
          backdropFilter: 'blur(22px) saturate(190%)',
          WebkitBackdropFilter: 'blur(22px) saturate(190%)',
          border: `2px solid ${color}`,
          boxShadow: `0 14px 44px rgba(0,0,0,0.55), 0 0 40px ${glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        },
        iconWrapClass: 'w-12 h-12 rounded-2xl',
        iconWrapStyle: {
          background: hexToRgba(color, 0.24),
          border: `2px solid ${color}`,
          boxShadow: `0 0 24px ${glow}`,
        },
        labelClass: `${baseLabel} text-[13px]`,
        sublabelClass: `${baseSub} text-[11px] text-zinc-300`,
      };

    case 'glass':
    default:
      return {
        cardClass: 'city-card-glass city-building-card min-w-[160px] max-w-[200px]',
        buttonStyle: {
          background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(7,17,31,0.55) 50%, rgba(7,17,31,0.78) 100%)',
          backdropFilter: 'blur(22px) saturate(160%)',
          WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          border: `1px solid ${hexToRgba(color, 0.32)}`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.04) inset`,
        },
        iconWrapClass: 'w-9 h-9 rounded-xl',
        iconWrapStyle: {
          background: hexToRgba(color, 0.12),
          border: `1px solid ${hexToRgba(color, 0.35)}`,
          boxShadow: 'none',
        },
        labelClass: `${baseLabel} text-[10px] sm:text-[11px]`,
        sublabelClass: `${baseSub} text-[9px] sm:text-[10px] text-zinc-500`,
      };
  }
}
