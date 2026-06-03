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
  iconSvgClass: string;
  cardPadding: string;
}

const baseLabel = 'font-black uppercase tracking-wide leading-tight piac-neon-text';
const baseSub = 'text-zinc-400 leading-snug mt-0.5 line-clamp-2';

function glassLike(color: string): BuildingCardPresentation {
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
    iconSvgClass: 'w-5 h-5',
    cardPadding: 'px-3.5 py-3 gap-3',
  };
}

export function getBuildingCardPresentation(
  style: CityCardStyle | undefined,
  color: string,
): BuildingCardPresentation {
  const glow = colorGlow(color, 0.55);
  const glowStrong = colorGlow(color, 0.75);
  const s = style ?? 'glass';

  switch (s) {
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
        iconSvgClass: 'w-5 h-5',
        cardPadding: 'px-3.5 py-3 gap-3',
      };

    case 'minimal':
      return {
        cardClass: 'city-card-minimal min-w-[118px] max-w-[148px]',
        buttonStyle: {
          background: 'rgba(7, 17, 31, 0.52)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${hexToRgba(color, 0.32)}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
        },
        iconWrapClass: 'w-7 h-7 rounded-lg',
        iconWrapStyle: {
          background: hexToRgba(color, 0.12),
          border: `1px solid ${hexToRgba(color, 0.35)}`,
          boxShadow: 'none',
        },
        labelClass: `${baseLabel} text-[9px] tracking-wider`,
        sublabelClass: `${baseSub} text-[9px] mt-0 line-clamp-1`,
        iconSvgClass: 'w-3.5 h-3.5',
        cardPadding: 'px-2 py-2 gap-2',
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
        iconSvgClass: 'w-6 h-6',
        cardPadding: 'px-4 py-4 gap-3.5',
      };

    case 'frosted':
      return {
        cardClass: 'city-card-frosted min-w-[154px] max-w-[196px]',
        buttonStyle: {
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(28px) saturate(120%)',
          WebkitBackdropFilter: 'blur(28px) saturate(120%)',
          border: `1px solid rgba(255,255,255,0.14)`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08)`,
        },
        iconWrapClass: 'w-9 h-9 rounded-full',
        iconWrapStyle: {
          background: hexToRgba(color, 0.1),
          border: `1px solid ${hexToRgba(color, 0.28)}`,
        },
        labelClass: `${baseLabel} text-[10px]`,
        sublabelClass: `${baseSub} text-[9px] text-zinc-500`,
        iconSvgClass: 'w-[1.125rem] h-[1.125rem]',
        cardPadding: 'px-3 py-2.5 gap-2.5',
      };

    case 'hologram':
      return {
        cardClass: 'city-card-hologram min-w-[168px] max-w-[210px]',
        buttonStyle: {
          background: `linear-gradient(135deg, ${hexToRgba(color, 0.18)} 0%, rgba(6,182,212,0.08) 40%, rgba(168,85,247,0.1) 100%)`,
          backdropFilter: 'blur(16px) saturate(220%)',
          WebkitBackdropFilter: 'blur(16px) saturate(220%)',
          border: `1px solid ${hexToRgba(color, 0.45)}`,
          boxShadow: `0 0 28px ${hexToRgba(color, 0.25)}, inset 0 0 20px rgba(6,182,212,0.06)`,
        },
        iconWrapClass: 'w-10 h-10 rounded-xl city-card-hologram__icon',
        iconWrapStyle: {
          background: `linear-gradient(135deg, ${hexToRgba(color, 0.35)}, rgba(6,182,212,0.2))`,
          border: `1px solid ${hexToRgba(color, 0.5)}`,
        },
        labelClass: `${baseLabel} text-[11px]`,
        sublabelClass: `${baseSub} text-[9px] text-cyan-200/70`,
        iconSvgClass: 'w-5 h-5',
        cardPadding: 'px-3.5 py-3 gap-3',
      };

    case 'pill':
      return {
        cardClass: 'city-card-pill min-w-[140px] max-w-[180px] rounded-full',
        buttonStyle: {
          background: hexToRgba(color, 0.14),
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${hexToRgba(color, 0.4)}`,
          borderRadius: '9999px',
          boxShadow: `0 6px 24px rgba(0,0,0,0.3)`,
        },
        iconWrapClass: 'w-8 h-8 rounded-full',
        iconWrapStyle: {
          background: hexToRgba(color, 0.22),
          border: `1px solid ${hexToRgba(color, 0.45)}`,
        },
        labelClass: `${baseLabel} text-[9px]`,
        sublabelClass: `${baseSub} text-[8px] line-clamp-1 hidden sm:block`,
        iconSvgClass: 'w-4 h-4',
        cardPadding: 'px-3 py-2 gap-2 rounded-full',
      };

    case 'outline':
      return {
        cardClass: 'city-card-outline min-w-[150px] max-w-[188px]',
        buttonStyle: {
          background: 'transparent',
          border: `1.5px solid ${hexToRgba(color, 0.55)}`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.25)`,
        },
        iconWrapClass: 'w-8 h-8 rounded-lg',
        iconWrapStyle: {
          background: 'transparent',
          border: `1.5px solid ${hexToRgba(color, 0.6)}`,
        },
        labelClass: `${baseLabel} text-[10px]`,
        sublabelClass: `${baseSub} text-[9px]`,
        iconSvgClass: 'w-[1.125rem] h-[1.125rem]',
        cardPadding: 'px-3 py-2.5 gap-2.5',
      };

    case 'gradient':
      return {
        cardClass: 'city-card-gradient min-w-[164px] max-w-[208px]',
        buttonStyle: {
          background: `linear-gradient(145deg, ${hexToRgba(color, 0.35)} 0%, rgba(7,17,31,0.92) 55%, rgba(7,17,31,0.98) 100%)`,
          border: `1px solid ${hexToRgba(color, 0.38)}`,
          boxShadow: `0 12px 36px rgba(0,0,0,0.4), 0 0 24px ${hexToRgba(color, 0.15)}`,
        },
        iconWrapClass: 'w-10 h-10 rounded-xl',
        iconWrapStyle: {
          background: `linear-gradient(135deg, ${hexToRgba(color, 0.4)}, ${hexToRgba(color, 0.12)})`,
          border: `1px solid ${hexToRgba(color, 0.45)}`,
        },
        labelClass: `${baseLabel} text-[11px]`,
        sublabelClass: `${baseSub} text-[10px] text-zinc-400`,
        iconSvgClass: 'w-5 h-5',
        cardPadding: 'px-3.5 py-3 gap-3',
      };

    case 'royal':
      return {
        cardClass: 'city-card-royal min-w-[178px] max-w-[224px]',
        buttonStyle: {
          background: 'linear-gradient(145deg, rgba(251,191,36,0.12) 0%, rgba(7,17,31,0.92) 45%, rgba(7,17,31,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid rgba(251,191,36,0.35)`,
          boxShadow: `0 0 32px ${hexToRgba(color, 0.2)}, 0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(251,191,36,0.15)`,
        },
        iconWrapClass: 'w-11 h-11 rounded-xl city-card-royal__icon',
        iconWrapStyle: {
          background: `linear-gradient(135deg, rgba(251,191,36,0.2), ${hexToRgba(color, 0.2)})`,
          border: `1px solid rgba(251,191,36,0.4)`,
        },
        labelClass: `${baseLabel} text-[11px] text-amber-100`,
        sublabelClass: `${baseSub} text-[10px] text-amber-200/60`,
        iconSvgClass: 'w-5 h-5',
        cardPadding: 'px-4 py-3.5 gap-3',
      };

    case 'glass':
    default:
      return glassLike(color);
  }
}
