import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import type { CityBuilding } from '../../lib/cityMapBuildings';
import { getBuildingCardPresentation } from '../../lib/cityMapCardStyles';
import { imagePercentToStagePercent } from '../../lib/cityMapImageBounds';
import { useCityMapBounds } from '../../contexts/CityMapBoundsContext';
import { useIsMobile } from '../../hooks/useMediaQuery';

const COUNT_LABELS: Record<string, string> = {
  listing: 'aktív hirdetés',
  auction: 'aktív licit',
  job: 'nyitott állás',
  donations: 'adomány kampány',
  producers: 'termelő',
  shops: 'bolt',
};

function getMapStage(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  return el.closest('.city-map-stage') as HTMLElement | null;
}

function resolvePinPosition(
  building: CityBuilding,
  bounds: ReturnType<typeof useCityMapBounds>,
  useLegacyPosition: boolean,
): { top: string; left: string } {
  if (
    !useLegacyPosition &&
    bounds &&
    building.imageTop != null &&
    building.imageLeft != null
  ) {
    const { top, left } = imagePercentToStagePercent(
      parseFloat(building.imageTop),
      parseFloat(building.imageLeft),
      bounds,
    );
    return {
      top: `${Math.max(2, Math.min(98, top)).toFixed(2)}%`,
      left: `${Math.max(2, Math.min(98, left)).toFixed(2)}%`,
    };
  }

  return { top: building.top, left: building.left };
}

export default function CityBuildingHotspot({
  building,
  count,
  ready,
  index,
  onClick,
  editMode = false,
  addMode = false,
  onEdit,
  onPositionChange,
  useLegacyPosition = false,
}: {
  building: CityBuilding;
  count?: number;
  ready: boolean;
  index: number;
  onClick: () => void;
  editMode?: boolean;
  addMode?: boolean;
  onEdit?: () => void;
  onPositionChange?: (top: string, left: string) => void;
  useLegacyPosition?: boolean;
}) {
  const Icon = building.icon;
  const rootRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const bounds = useCityMapBounds();

  const anchor = useMemo(
    () => resolvePinPosition(building, bounds, useLegacyPosition),
    [building, bounds, useLegacyPosition],
  );

  const [pos, setPos] = useState(anchor);
  const posRef = useRef(anchor);
  const dragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const captureEl = useRef<HTMLElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    setPos(anchor);
    posRef.current = anchor;
  }, [anchor.top, anchor.left]);

  const updatePositionFromPointer = useCallback((clientX: number, clientY: number) => {
    const map = getMapStage(rootRef.current);
    if (!map) return;
    const rect = map.getBoundingClientRect();
    const top = `${Math.max(4, Math.min(96, Math.round(((clientY - rect.top) / rect.height) * 100)))}%`;
    const left = `${Math.max(4, Math.min(96, Math.round(((clientX - rect.left) / rect.width) * 100)))}%`;
    posRef.current = { top, left };
    setPos({ top, left });
  }, []);

  const endDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (captureEl.current && pointerIdRef.current !== null) {
      try {
        captureEl.current.releasePointerCapture(pointerIdRef.current);
      } catch {
        /* ignore */
      }
    }
    captureEl.current = null;
    pointerIdRef.current = null;
    if (moved.current && onPositionChange) {
      onPositionChange(posRef.current.top, posRef.current.left);
    }
  }, [onPositionChange]);

  useEffect(() => {
    if (!editMode) return;

    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      if (Math.abs(e.clientX - start.current.x) + Math.abs(e.clientY - start.current.y) > 4) {
        moved.current = true;
      }
      updatePositionFromPointer(e.clientX, e.clientY);
    }

    function onUp() {
      endDrag();
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [editMode, endDrag, updatePositionFromPointer]);

  function startDrag(e: React.PointerEvent) {
    if (!editMode || addMode || !onPositionChange) return;
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    moved.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    captureEl.current = e.currentTarget as HTMLElement;
    pointerIdRef.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleClick(e: React.MouseEvent) {
    if (moved.current) {
      moved.current = false;
      return;
    }
    if (editMode && onEdit && !addMode) {
      e.preventDefault();
      e.stopPropagation();
      onEdit();
      return;
    }
    if (!editMode) onClick();
  }

  const interactive = !addMode;
  const countLabel = building.countKey ? COUNT_LABELS[building.countKey] : undefined;
  const canDrag = editMode && !addMode && !!onPositionChange;
  const card = useMemo(
    () => getBuildingCardPresentation(building.cardStyle, building.color),
    [building.cardStyle, building.color],
  );
  const iconSize =
    building.cardStyle === 'minimal' ? 'w-3.5 h-3.5' : building.cardStyle === 'bold' ? 'w-6 h-6' : 'w-5 h-5';
  const cardPadding =
    building.cardStyle === 'minimal' ? 'px-2 py-2 gap-2' : building.cardStyle === 'bold' ? 'px-4 py-4 gap-3.5' : 'px-3.5 py-3 gap-3';
  const showIconPin = isMobile && !editMode;

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
      transition={{ delay: ready ? index * 0.04 : 0, duration: 0.35 }}
      className={`city-building-pin absolute z-20 ${interactive ? 'pointer-events-auto' : 'pointer-events-none'} ${canDrag ? 'city-building-pin--edit' : ''} ${showIconPin ? 'city-building-pin--icon' : ''}`}
      style={{
        top: pos.top,
        left: pos.left,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {canDrag && (
        <button
          type="button"
          onPointerDown={startDrag}
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 h-6 rounded-lg bg-amber-400 text-[#07111f] cursor-grab active:cursor-grabbing z-30 shadow-lg border border-amber-200/50"
          title="Húzd a zóna gombot"
          aria-label="Zóna mozgatása"
        >
          <GripVertical className="w-3.5 h-3.5" />
          <span className="text-[9px] font-black uppercase tracking-wide">Húzd</span>
        </button>
      )}

      {showIconPin ? (
        <motion.button
          type="button"
          onClick={handleClick}
          whileTap={interactive ? { scale: 0.92 } : undefined}
          className="city-map-icon-pin group"
          style={{
            ['--pin-color' as string]: building.color,
            ['--pin-glow' as string]: building.glow,
          }}
          aria-label={`${building.label} — ${building.sublabel}`}
        >
          <Icon className="city-map-icon-pin__svg" style={{ color: building.color }} />
        </motion.button>
      ) : (
        <motion.button
          type="button"
          onClick={handleClick}
          onPointerDown={canDrag ? startDrag : undefined}
          whileHover={interactive && !canDrag ? { scale: 1.04, y: -2 } : undefined}
          whileTap={interactive && !canDrag ? { scale: 0.98 } : undefined}
          className={`world-zone-card group flex items-start rounded-2xl text-left border-0 ${card.cardClass} ${cardPadding} ${canDrag ? 'cursor-grab active:cursor-grabbing ring-2 ring-amber-400/50' : ''}`}
          style={card.buttonStyle}
          aria-label={`${building.label} — ${building.sublabel}`}
        >
          <span
            className={`flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${card.iconWrapClass}`}
            style={card.iconWrapStyle}
          >
            <Icon className={iconSize} style={{ color: building.color }} />
          </span>
          <span className="flex flex-col min-w-0 pt-0.5">
            <span
              className={card.labelClass}
              style={{ color: building.color, '--neon-color': building.glow } as React.CSSProperties}
            >
              {building.label}
            </span>
            <span className={card.sublabelClass}>
              {building.sublabel}
            </span>
            {count !== undefined && countLabel && (
              <span className="text-[10px] font-semibold text-zinc-500 mt-1">
                <strong className="text-zinc-300">{count.toLocaleString('hu-HU')}</strong> {countLabel}
              </span>
            )}
          </span>
          {canDrag && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#07111f] animate-pulse" />
          )}
        </motion.button>
      )}
    </motion.div>
  );
}
