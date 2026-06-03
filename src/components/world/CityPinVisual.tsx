import type { ElementType, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { CityCardStyle, CityPinSize, CityPinVariant } from '../../lib/cityMapPages';
import { getBuildingCardPresentation } from '../../lib/cityMapCardStyles';

export default function CityPinVisual({
  Icon,
  label,
  sublabel,
  color,
  glow,
  cardStyle = 'glass',
  pinSize = 'sm',
  pinVariant = 'icon-card',
  showLabel = true,
  count,
  countLabel,
  interactive = false,
  editHighlight = false,
  onClick,
  onPointerDown,
  className = '',
}: {
  Icon: ElementType;
  label: string;
  sublabel: string;
  color: string;
  glow?: string;
  cardStyle?: CityCardStyle;
  pinSize?: CityPinSize;
  pinVariant?: CityPinVariant;
  showLabel?: boolean;
  count?: number;
  countLabel?: string;
  interactive?: boolean;
  editHighlight?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  className?: string;
}) {
  const card = getBuildingCardPresentation(cardStyle, color);
  const iconSize =
    cardStyle === 'minimal' ? 'w-3.5 h-3.5' : cardStyle === 'bold' ? 'w-6 h-6' : 'w-5 h-5';
  const cardPadding =
    cardStyle === 'minimal' ? 'px-2 py-2 gap-2' : cardStyle === 'bold' ? 'px-4 py-4 gap-3.5' : 'px-3.5 py-3 gap-3';
  const pinGlow = glow ?? color;

  if (pinVariant === 'icon') {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        whileTap={interactive ? { scale: 0.92 } : undefined}
        className={`city-map-icon-pin city-pin-size-${pinSize} group ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
        style={{ ['--pin-color' as string]: color, ['--pin-glow' as string]: pinGlow }}
        aria-label={`${label} — ${sublabel}`}
      >
        <Icon className="city-map-icon-pin__svg" style={{ color }} />
      </motion.button>
    );
  }

  if (pinVariant === 'icon-card' || pinVariant === 'compact-card') {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        whileTap={interactive ? { scale: 0.96 } : undefined}
        className={`city-pin-stack city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
        aria-label={`${label} — ${sublabel}`}
      >
        <span
          className="city-map-icon-pin group"
          style={{ ['--pin-color' as string]: color, ['--pin-glow' as string]: pinGlow }}
        >
          <Icon className="city-map-icon-pin__svg" style={{ color }} />
        </span>
        {showLabel && (
          <span className="city-pin-label-pill" style={{ borderColor: `${color}44`, color }}>
            {label.split(' ')[0]}
          </span>
        )}
        {pinVariant === 'compact-card' && showLabel && (
          <span className="city-pin-sublabel-pill">{sublabel.split('·')[0]?.trim()}</span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      whileHover={interactive ? { scale: 1.04, y: -2 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      className={`world-zone-card group flex items-start rounded-2xl text-left border-0 ${card.cardClass} ${cardPadding} city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
      style={card.buttonStyle}
      aria-label={`${label} — ${sublabel}`}
    >
      <span
        className={`flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${card.iconWrapClass}`}
        style={card.iconWrapStyle}
      >
        <Icon className={iconSize} style={{ color }} />
      </span>
      <span className="flex flex-col min-w-0 pt-0.5">
        <span className={card.labelClass} style={{ color, '--neon-color': pinGlow } as CSSProperties}>
          {label}
        </span>
        {showLabel && <span className={card.sublabelClass}>{sublabel}</span>}
        {count !== undefined && countLabel && (
          <span className="text-[10px] font-semibold text-zinc-500 mt-1">
            <strong className="text-zinc-300">{count.toLocaleString('hu-HU')}</strong> {countLabel}
          </span>
        )}
      </span>
    </motion.button>
  );
}
