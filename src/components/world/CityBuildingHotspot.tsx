import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import type { CityBuilding } from '../../lib/cityMapBuildings';
import { imagePercentToStagePercent, stagePointToImagePercent } from '../../lib/cityMapImageBounds';
import { useCityMapBounds } from '../../contexts/CityMapBoundsContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import CityPinVisual from './CityPinVisual';

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
  isLivePreview = false,
}: {
  building: CityBuilding;
  count?: number;
  ready: boolean;
  index: number;
  onClick: () => void;
  editMode?: boolean;
  addMode?: boolean;
  onEdit?: () => void;
  onPositionChange?: (pos: { top: string; left: string; imageTop?: string; imageLeft?: string }) => void;
  useLegacyPosition?: boolean;
  isLivePreview?: boolean;
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
      const patch: { top: string; left: string; imageTop?: string; imageLeft?: string } = {
        ...posRef.current,
      };
      if (bounds && !useLegacyPosition) {
        const map = getMapStage(rootRef.current);
        if (map) {
          const rect = map.getBoundingClientRect();
          const topPct = parseFloat(posRef.current.top);
          const leftPct = parseFloat(posRef.current.left);
          const img = stagePointToImagePercent(
            (leftPct / 100) * rect.width,
            (topPct / 100) * rect.height,
            bounds,
          );
          patch.imageTop = `${Math.round(img.top)}%`;
          patch.imageLeft = `${Math.round(img.left)}%`;
        }
      }
      onPositionChange(patch);
    }
  }, [onPositionChange, bounds, useLegacyPosition]);

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
  const pinSize = building.pinSize ?? 'sm';
  const pinVariant = building.pinVariant ?? (isMobile ? 'icon-card' : 'card');
  const showLabel = building.showLabel !== false;

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
      transition={{ delay: ready ? index * 0.04 : 0, duration: 0.35 }}
      className={`city-building-pin absolute z-20 ${interactive ? 'pointer-events-auto' : 'pointer-events-none'} ${canDrag ? 'city-building-pin--edit' : ''} ${isLivePreview ? 'city-building-pin--live-preview' : ''}`}
      style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
    >
      {canDrag && (
        <button
          type="button"
          onPointerDown={startDrag}
          className="city-building-pin__drag-handle"
          title="Húzd a zóna gombot"
          aria-label="Zóna mozgatása"
        >
          <GripVertical className="w-3 h-3" />
        </button>
      )}
      <CityPinVisual
        Icon={Icon}
        label={building.label}
        sublabel={building.sublabel}
        color={building.color}
        glow={building.glow}
        cardStyle={building.cardStyle}
        pinSize={pinSize}
        pinVariant={pinVariant}
        showLabel={showLabel}
        count={count}
        countLabel={countLabel}
        interactive={interactive}
        editHighlight={canDrag}
        onClick={handleClick}
        onPointerDown={canDrag ? startDrag : undefined}
      />
    </motion.div>
  );
}
