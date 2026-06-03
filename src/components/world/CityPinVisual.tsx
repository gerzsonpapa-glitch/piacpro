import type { ElementType, CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { CityCardStyle, CityPinSize, CityPinVariant } from '../../lib/cityMapPages';
import { getBuildingCardPresentation } from '../../lib/cityMapCardStyles';

function PinScaleWrap({
  scale = 1,
  className = '',
  children,
}: {
  scale?: number;
  className?: string;
  children: ReactNode;
}) {
  if (scale === 1) return <>{children}</>;
  return (
    <span
      className={`city-pin-scale-wrap inline-flex ${className}`}
      style={{ ['--pin-scale' as string]: scale }}
    >
      {children}
    </span>
  );
}

function IconPin({
  Icon,
  color,
  pinGlow,
  pinSize,
  className = '',
  onClick,
  onPointerDown,
  interactive,
  editHighlight,
  ariaLabel,
}: {
  Icon: ElementType;
  color: string;
  pinGlow: string;
  pinSize: CityPinSize;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  interactive?: boolean;
  editHighlight?: boolean;
  ariaLabel: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      whileTap={interactive ? { scale: 0.92 } : undefined}
      className={`city-map-icon-pin city-pin-size-${pinSize} group ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
      style={{ ['--pin-color' as string]: color, ['--pin-glow' as string]: pinGlow }}
      aria-label={ariaLabel}
    >
      <Icon className="city-map-icon-pin__svg" style={{ color }} />
    </motion.button>
  );
}

function FullCard({
  Icon,
  label,
  sublabel,
  color,
  pinGlow,
  cardStyle,
  pinSize,
  showLabel,
  count,
  countLabel,
  interactive,
  editHighlight,
  onClick,
  onPointerDown,
  className = '',
  extraClass = '',
}: {
  Icon: ElementType;
  label: string;
  sublabel: string;
  color: string;
  pinGlow: string;
  cardStyle: CityCardStyle;
  pinSize: CityPinSize;
  showLabel: boolean;
  count?: number;
  countLabel?: string;
  interactive?: boolean;
  editHighlight?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  className?: string;
  extraClass?: string;
}) {
  const card = getBuildingCardPresentation(cardStyle, color);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      whileHover={interactive ? { scale: 1.04, y: -2 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      className={`world-zone-card group flex items-start rounded-2xl text-left border-0 ${card.cardClass} ${card.cardPadding} city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${extraClass} ${className}`}
      style={card.buttonStyle}
      aria-label={`${label} — ${sublabel}`}
    >
      <span
        className={`flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${card.iconWrapClass}`}
        style={card.iconWrapStyle}
      >
        <Icon className={card.iconSvgClass} style={{ color }} />
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

export default function CityPinVisual({
  Icon,
  label,
  sublabel,
  color,
  glow,
  cardStyle = 'glass',
  pinSize = 'sm',
  pinVariant = 'icon-card',
  pinScale = 1,
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
  pinScale?: number;
  showLabel?: boolean;
  count?: number;
  countLabel?: string;
  interactive?: boolean;
  editHighlight?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  className?: string;
}) {
  const pinGlow = glow ?? color;
  const ariaLabel = `${label} — ${sublabel}`;
  const shortLabel = label.split(' ')[0];
  const shortSub = sublabel.split('·')[0]?.trim() ?? sublabel;

  const content = (() => {
    switch (pinVariant) {
      case 'icon':
        return (
          <IconPin
            Icon={Icon}
            color={color}
            pinGlow={pinGlow}
            pinSize={pinSize}
            className={className}
            onClick={onClick}
            onPointerDown={onPointerDown}
            interactive={interactive}
            editHighlight={editHighlight}
            ariaLabel={ariaLabel}
          />
        );

      case 'icon-card':
        return (
          <motion.button
            type="button"
            onClick={onClick}
            onPointerDown={onPointerDown}
            whileTap={interactive ? { scale: 0.96 } : undefined}
            className={`city-pin-stack city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
            aria-label={ariaLabel}
          >
            <IconPin Icon={Icon} color={color} pinGlow={pinGlow} pinSize={pinSize} ariaLabel={ariaLabel} />
            {showLabel && (
              <span className="city-pin-label-pill" style={{ borderColor: `${color}44`, color }}>
                {shortLabel}
              </span>
            )}
          </motion.button>
        );

      case 'compact-card':
        return (
          <motion.button
            type="button"
            onClick={onClick}
            onPointerDown={onPointerDown}
            whileTap={interactive ? { scale: 0.96 } : undefined}
            className={`city-pin-stack city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
            aria-label={ariaLabel}
          >
            <IconPin Icon={Icon} color={color} pinGlow={pinGlow} pinSize={pinSize} ariaLabel={ariaLabel} />
            {showLabel && (
              <>
                <span className="city-pin-label-pill" style={{ borderColor: `${color}44`, color }}>
                  {shortLabel}
                </span>
                <span className="city-pin-sublabel-pill">{shortSub}</span>
              </>
            )}
          </motion.button>
        );

      case 'badge':
        return (
          <motion.button
            type="button"
            onClick={onClick}
            onPointerDown={onPointerDown}
            whileTap={interactive ? { scale: 0.94 } : undefined}
            className={`city-pin-badge city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
            style={{ ['--pin-color' as string]: color, ['--pin-glow' as string]: pinGlow }}
            aria-label={ariaLabel}
          >
            <span className="city-pin-badge__icon-wrap">
              <Icon className="city-map-icon-pin__svg" style={{ color }} />
              <span className="city-pin-badge__dot" aria-hidden />
            </span>
            {showLabel && <span className="city-pin-badge__label">{shortLabel}</span>}
          </motion.button>
        );

      case 'ring':
        return (
          <motion.button
            type="button"
            onClick={onClick}
            onPointerDown={onPointerDown}
            whileTap={interactive ? { scale: 0.94 } : undefined}
            className={`city-pin-ring city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
            style={{ ['--pin-color' as string]: color, ['--pin-glow' as string]: pinGlow }}
            aria-label={ariaLabel}
          >
            <span className="city-pin-ring__outer" aria-hidden />
            <span className="city-pin-ring__inner">
              <Icon className="city-map-icon-pin__svg" style={{ color }} />
            </span>
            {showLabel && <span className="city-pin-label-pill mt-1" style={{ borderColor: `${color}44`, color }}>{shortLabel}</span>}
          </motion.button>
        );

      case 'beacon':
        return (
          <motion.button
            type="button"
            onClick={onClick}
            onPointerDown={onPointerDown}
            whileTap={interactive ? { scale: 0.96 } : undefined}
            className={`city-pin-beacon city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
            style={{ ['--pin-color' as string]: color, ['--pin-glow' as string]: pinGlow }}
            aria-label={ariaLabel}
          >
            <span className="city-pin-beacon__beam" aria-hidden />
            <span className="city-pin-beacon__head">
              <Icon className="city-map-icon-pin__svg" style={{ color }} />
            </span>
            {showLabel && <span className="city-pin-label-pill" style={{ borderColor: `${color}44`, color }}>{shortLabel}</span>}
          </motion.button>
        );

      case 'ribbon':
        return (
          <motion.button
            type="button"
            onClick={onClick}
            onPointerDown={onPointerDown}
            whileTap={interactive ? { scale: 0.97 } : undefined}
            className={`city-pin-ribbon city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
            style={{ ['--pin-color' as string]: color, ['--pin-glow' as string]: pinGlow }}
            aria-label={ariaLabel}
          >
            <IconPin Icon={Icon} color={color} pinGlow={pinGlow} pinSize={pinSize} ariaLabel={ariaLabel} />
            {showLabel && (
              <span className="city-pin-ribbon__banner">
                <span className="city-pin-ribbon__title">{label}</span>
                <span className="city-pin-ribbon__sub">{shortSub}</span>
              </span>
            )}
          </motion.button>
        );

      case 'stack':
        return (
          <motion.button
            type="button"
            onClick={onClick}
            onPointerDown={onPointerDown}
            whileTap={interactive ? { scale: 0.97 } : undefined}
            className={`city-pin-stack-layer city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
            aria-label={ariaLabel}
          >
            <FullCard
              Icon={Icon}
              label={label}
              sublabel={sublabel}
              color={color}
              pinGlow={pinGlow}
              cardStyle={cardStyle}
              pinSize={pinSize}
              showLabel={showLabel}
              count={count}
              countLabel={countLabel}
              interactive={false}
              editHighlight={false}
              extraClass="city-pin-stack-layer__card opacity-90 scale-95 pointer-events-none"
            />
            <span
              className="city-pin-stack-layer__icon city-map-icon-pin pointer-events-none"
              style={{ ['--pin-color' as string]: color, ['--pin-glow' as string]: pinGlow }}
            >
              <Icon className="city-map-icon-pin__svg" style={{ color }} />
            </span>
          </motion.button>
        );

      case 'portal':
        return (
          <motion.button
            type="button"
            onClick={onClick}
            onPointerDown={onPointerDown}
            whileTap={interactive ? { scale: 0.94 } : undefined}
            className={`city-pin-portal city-pin-size-${pinSize} ${editHighlight ? 'city-pin-visual--edit' : ''} ${className}`}
            style={{ ['--pin-color' as string]: color, ['--pin-glow' as string]: pinGlow }}
            aria-label={ariaLabel}
          >
            <span className="city-pin-portal__ring city-pin-portal__ring--outer" aria-hidden />
            <span className="city-pin-portal__ring city-pin-portal__ring--inner" aria-hidden />
            <span className="city-pin-portal__core">
              <Icon className="city-map-icon-pin__svg" style={{ color }} />
            </span>
            {showLabel && <span className="city-pin-label-pill" style={{ borderColor: `${color}44`, color }}>{shortLabel}</span>}
          </motion.button>
        );

      case 'card':
      default:
        return (
          <FullCard
            Icon={Icon}
            label={label}
            sublabel={sublabel}
            color={color}
            pinGlow={pinGlow}
            cardStyle={cardStyle}
            pinSize={pinSize}
            showLabel={showLabel}
            count={count}
            countLabel={countLabel}
            interactive={interactive}
            editHighlight={editHighlight}
            onClick={onClick}
            onPointerDown={onPointerDown}
            className={className}
          />
        );
    }
  })();

  return <PinScaleWrap scale={pinScale}>{content}</PinScaleWrap>;
}
