/** object-fit: contain — a háttérkép tényleges téglalapja a stage-en belül. */
export interface CityMapImageRect {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  stageWidth: number;
  stageHeight: number;
}

function parseObjectPosition(value: string): { x: number; y: number } {
  const parts = value.trim().split(/\s+/);
  const parseAxis = (token: string | undefined, fallback: number) => {
    if (!token || token === 'center') return fallback;
    if (token.endsWith('%')) return parseFloat(token) / 100;
    if (token === 'left' || token === 'top') return 0;
    if (token === 'right' || token === 'bottom') return 1;
    return fallback;
  };
  return {
    x: parseAxis(parts[0], 0.5),
    y: parseAxis(parts[1] ?? parts[0], 0.5),
  };
}

export function computeContainedImageRect(
  stageWidth: number,
  stageHeight: number,
  imageAspect: number,
  objectPosition = 'center center',
): CityMapImageRect | null {
  if (stageWidth <= 0 || stageHeight <= 0 || !Number.isFinite(imageAspect) || imageAspect <= 0) {
    return null;
  }

  const pos = parseObjectPosition(objectPosition);
  const stageAspect = stageWidth / stageHeight;

  let width: number;
  let height: number;

  if (stageAspect > imageAspect) {
    height = stageHeight;
    width = stageHeight * imageAspect;
  } else {
    width = stageWidth;
    height = stageWidth / imageAspect;
  }

  const freeX = stageWidth - width;
  const freeY = stageHeight - height;

  return {
    offsetX: freeX * pos.x,
    offsetY: freeY * pos.y,
    width,
    height,
    stageWidth,
    stageHeight,
  };
}

/** Kép %-ból stage %-ba (top/left a city-map-stage-hez igazítva). */
export function imagePercentToStagePercent(
  imageTop: number,
  imageLeft: number,
  rect: CityMapImageRect,
): { top: number; left: number } {
  const y = rect.offsetY + (imageTop / 100) * rect.height;
  const x = rect.offsetX + (imageLeft / 100) * rect.width;
  return {
    top: (y / rect.stageHeight) * 100,
    left: (x / rect.stageWidth) * 100,
  };
}

/** Stage koordinátából kép % (fejlesztői húzáshoz). */
export function stagePointToImagePercent(
  stageX: number,
  stageY: number,
  rect: CityMapImageRect,
): { top: number; left: number } {
  const x = stageX - rect.offsetX;
  const y = stageY - rect.offsetY;
  return {
    left: Math.max(0, Math.min(100, (x / rect.width) * 100)),
    top: Math.max(0, Math.min(100, (y / rect.height) * 100)),
  };
}

export function findHeroMapImage(stage: HTMLElement | null): HTMLImageElement | null {
  if (!stage) return null;
  const viewport = stage.closest('.world-home-hero-viewport');
  const root = viewport ?? stage.parentElement;
  if (!root) return null;
  return root.querySelector<HTMLImageElement>(
    '.home-hero-backdrop-media, .zone-screen-backdrop--hero .zone-screen-media, .zone-screen-backdrop--hero .zone-screen-loop',
  );
}
