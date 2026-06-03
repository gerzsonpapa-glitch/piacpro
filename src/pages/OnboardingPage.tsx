import { useState } from 'react';
import { ShoppingCart, Package, Briefcase, Store, CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSEO } from '../lib/seo';
import {
  setUserIntent,
  completeOnboarding,
  getIntentPath,
  type UserIntent,
} from '../lib/userOnboarding';

const OPTIONS: { id: UserIntent; label: string; desc: string; icon: typeof ShoppingCart }[] = [
  { id: 'buy', label: 'Vásárolni szeretnék', desc: 'Böngészek hirdetéseket és termékeket', icon: ShoppingCart },
  { id: 'sell', label: 'Eladni szeretnék', desc: 'Hirdetést adok fel', icon: Package },
  { id: 'job', label: 'Állást keresek', desc: 'Munkát vagy jelentkezést', icon: Briefcase },
  { id: 'business', label: 'Vállalkozó vagyok', desc: 'Bolt, termelő vagy helyi cég', icon: Store },
];

export default function OnboardingPage() {
  const { navigate } = useRouter();
  useSEO({ title: 'Üdvözöl a PiacPro!', path: '/onboarding' });
  const [selected, setSelected] = useState<UserIntent | null>(null);
  const [step, setStep] = useState<'intent' | 'checklist'>('intent');

  function finish(intent: UserIntent) {
    setUserIntent(intent);
    completeOnboarding();
    navigate(getIntentPath(intent));
  }

  if (step === 'checklist') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md glass rounded-3xl p-8 space-y-6 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <div>
            <h1 className="text-xl font-bold text-white">Első lépések</h1>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Böngéssz 3 hirdetést, ments el egy kedvencet, vagy adj fel hirdetést — a profilodban követheted a haladást.
            </p>
          </div>
          <button
            type="button"
            onClick={() => selected && finish(selected)}
            className="w-full py-3 rounded-xl glass-pill-active text-emerald-300 font-semibold flex items-center justify-center gap-2"
          >
            Kezdjük! <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-white">Mi hozott ide?</h1>
          <p className="text-sm text-zinc-400">Segítünk eligazodni — később bármikor váltasz.</p>
        </div>
        <div className="grid gap-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl text-left border transition-all ${
                  active ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/8 bg-white/[0.03] hover:border-white/15'
                }`}
              >
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                  <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-zinc-400'}`} />
                </span>
                <span>
                  <span className="block font-semibold text-zinc-100">{opt.label}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">{opt.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!selected}
          onClick={() => setStep('checklist')}
          className="w-full py-3.5 rounded-xl font-semibold text-sm glass-pill-active text-emerald-300 disabled:opacity-40"
        >
          Tovább
        </button>
        <button
          type="button"
          onClick={() => { completeOnboarding(); navigate('/'); }}
          className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400"
        >
          Kihagyom, a főoldalra megyek
        </button>
      </div>
    </div>
  );
}
