import { CheckCircle2, Circle } from 'lucide-react';
import { useRouter } from '../../lib/router';
import {
  getOnboardingState,
  checklistProgress,
  type OnboardingState,
} from '../../lib/userOnboarding';
import { useEffect, useState } from 'react';

const ITEMS = [
  { key: 'browsedListings' as const, label: 'Böngéssz hirdetéseket', path: '/search' },
  { key: 'savedFavorite' as const, label: 'Ments el egy kedvencet', path: '/search' },
  { key: 'createdListing' as const, label: 'Adj fel hirdetést (opcionális)', path: '/create' },
];

export default function OnboardingChecklist() {
  const { navigate } = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);

  useEffect(() => {
    setState(getOnboardingState());
    const onStorage = () => setState(getOnboardingState());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!state || !state.intent) return null;
  if (checklistProgress(state) >= ITEMS.length) return null;

  return (
    <div className="glass rounded-2xl p-4 border border-emerald-500/15 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-zinc-200">Első lépések</p>
        <span className="text-xs text-emerald-400 font-bold">{checklistProgress(state)}/{ITEMS.length}</span>
      </div>
      <ul className="space-y-2">
        {ITEMS.map((item) => {
          const checked = state.checklist[item.key];
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => !checked && navigate(item.path)}
                className={`w-full flex items-center gap-2.5 text-left text-sm py-1.5 ${checked ? 'text-zinc-500' : 'text-zinc-300 hover:text-emerald-300'}`}
              >
                {checked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                )}
                <span className={checked ? 'line-through' : ''}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
