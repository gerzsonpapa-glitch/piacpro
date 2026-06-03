import type { SiteCustomizationConfig } from './siteCustomization';

export type HomeWowFeature =
  | 'cinematicEntry'
  | 'livePulse'
  | 'ambientMotion'
  | 'pinHoverPreview'
  | 'dayNightCycle'
  | 'hubLoop'
  | 'firstClickReward';

export interface SiteHomeWowConfig {
  /** Fő kapcsoló — kikapcsolva minden wow effekt off */
  enabled: boolean;
  cinematicEntry: boolean;
  livePulse: boolean;
  ambientMotion: boolean;
  pinHoverPreview: boolean;
  dayNightCycle: boolean;
  hubLoop: boolean;
  firstClickReward: boolean;
}

export const DEFAULT_HOME_WOW: SiteHomeWowConfig = {
  enabled: true,
  cinematicEntry: true,
  livePulse: true,
  ambientMotion: true,
  pinHoverPreview: true,
  dayNightCycle: true,
  hubLoop: false,
  firstClickReward: true,
};

export const HOME_WOW_STORAGE = {
  worldEntered: 'piacpro_world_entered',
  firstPinClick: 'piacpro_first_pin_click',
} as const;

export type BudapestDayPhase = 'night' | 'dawn' | 'day' | 'dusk';

export function getHomeWowConfig(config: SiteCustomizationConfig): SiteHomeWowConfig {
  return { ...DEFAULT_HOME_WOW, ...(config.homeWow ?? {}) };
}

export function isHomeWowFeatureEnabled(
  config: SiteCustomizationConfig,
  feature: HomeWowFeature,
): boolean {
  const wow = getHomeWowConfig(config);
  return wow.enabled && wow[feature];
}

export function getBudapestHour(): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Budapest',
    hour: 'numeric',
    hour12: false,
  }).format(new Date());
  return parseInt(hour, 10);
}

export function getBudapestDayPhase(): BudapestDayPhase {
  const h = getBudapestHour();
  if (h >= 6 && h < 8) return 'dawn';
  if (h >= 8 && h < 18) return 'day';
  if (h >= 18 && h < 21) return 'dusk';
  return 'night';
}

export function shouldShowCinematicEntry(config: SiteCustomizationConfig): boolean {
  if (!isHomeWowFeatureEnabled(config, 'cinematicEntry')) return false;
  try {
    return !sessionStorage.getItem(HOME_WOW_STORAGE.worldEntered);
  } catch {
    return false;
  }
}

export function resetWowSessionExperience() {
  try {
    sessionStorage.removeItem(HOME_WOW_STORAGE.worldEntered);
    sessionStorage.removeItem(HOME_WOW_STORAGE.firstPinClick);
  } catch {
    /* ignore */
  }
}

export function markFirstPinClick(): boolean {
  try {
    if (sessionStorage.getItem(HOME_WOW_STORAGE.firstPinClick)) return false;
    sessionStorage.setItem(HOME_WOW_STORAGE.firstPinClick, '1');
    return true;
  } catch {
    return false;
  }
}
