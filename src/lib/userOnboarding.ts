export type UserIntent = 'buy' | 'sell' | 'job' | 'business';

export interface OnboardingChecklist {
  browsedListings: boolean;
  savedFavorite: boolean;
  createdListing: boolean;
}

export interface OnboardingState {
  intent: UserIntent | null;
  checklist: OnboardingChecklist;
  onboardingDone: boolean;
}

const ONBOARDING_KEY = 'piacpro_onboarding';
const TOUR_KEY = 'piacpro_home_tour_done';

const DEFAULT_STATE: OnboardingState = {
  intent: null,
  checklist: {
    browsedListings: false,
    savedFavorite: false,
    createdListing: false,
  },
  onboardingDone: false,
};

function readState(): OnboardingState {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return { ...DEFAULT_STATE, checklist: { ...DEFAULT_STATE.checklist } };
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      intent: parsed.intent ?? null,
      checklist: { ...DEFAULT_STATE.checklist, ...parsed.checklist },
      onboardingDone: !!parsed.onboardingDone,
    };
  } catch {
    return { ...DEFAULT_STATE, checklist: { ...DEFAULT_STATE.checklist } };
  }
}

function writeState(state: OnboardingState) {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
}

export function getOnboardingState(): OnboardingState {
  return readState();
}

export function setUserIntent(intent: UserIntent) {
  const state = readState();
  state.intent = intent;
  writeState(state);
}

export function markChecklistItem(item: keyof OnboardingChecklist) {
  const state = readState();
  if (state.checklist[item]) return;
  state.checklist[item] = true;
  writeState(state);
}

export function completeOnboarding() {
  const state = readState();
  state.onboardingDone = true;
  writeState(state);
}

export function shouldShowOnboarding(): boolean {
  return !readState().onboardingDone;
}

export function getIntentPath(intent: UserIntent): string {
  switch (intent) {
    case 'buy': return '/search';
    case 'sell': return '/create';
    case 'job': return '/jobs';
    case 'business': return '/uzleti';
  }
}

export function isHomeTourDone(): boolean {
  return localStorage.getItem(TOUR_KEY) === '1';
}

export function markHomeTourDone() {
  localStorage.setItem(TOUR_KEY, '1');
}

export function checklistProgress(state: OnboardingState): number {
  const items = Object.values(state.checklist);
  return items.filter(Boolean).length;
}
