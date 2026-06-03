import { useEffect, useState } from 'react';
import { X, ChevronRight, Map, LayoutGrid, MessageCircle } from 'lucide-react';
import { isHomeTourDone, markHomeTourDone } from '../../lib/userOnboarding';

const STEPS = [
  {
    icon: Map,
    title: 'Ez a digitális városod',
    text: 'A térképen minden épület egy funkció: hirdetések, állások, boltok, termelők.',
  },
  {
    icon: LayoutGrid,
    title: 'Kattints egy negyedre',
    text: 'Vagy válaszd a fenti „Mit szeretnél?” gombokat — azonnal oda visz, ahova kell.',
  },
  {
    icon: MessageCircle,
    title: 'Nincs online fizetés',
    text: 'Vásárlás, rendelés és jelentkezés üzenetben történik — biztonságosan, az eladóval egyeztetve.',
  },
];

export default function HomeMiniTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!isHomeTourDone()) setVisible(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  function close(done = true) {
    setVisible(false);
    if (done) markHomeTourDone();
  }

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto min-h-[100dvh] min-h-[100svh]">
      <div
        className="w-full max-w-md rounded-3xl p-6 space-y-4 border border-emerald-500/25"
        style={{ background: 'rgba(7,17,31,0.96)' }}
        role="dialog"
        aria-labelledby="home-tour-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25">
            <Icon className="w-5 h-5 text-emerald-400" />
          </div>
          <button
            type="button"
            onClick={() => close(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-200"
            aria-label="Bezárás"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80 mb-1">
            Útmutató · {step + 1}/{STEPS.length}
          </p>
          <h2 id="home-tour-title" className="text-lg font-bold text-white">{current.title}</h2>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{current.text}</p>
        </div>
        <div className="flex gap-2">
          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 py-3 rounded-xl font-medium text-sm glass-pill-active text-emerald-300 flex items-center justify-center gap-2"
            >
              Következő <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => close(true)}
              className="flex-1 py-3 rounded-xl font-medium text-sm glass-pill-active text-emerald-300"
            >
              Értem, kezdjük!
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={() => close(true)}
              className="px-4 py-3 rounded-xl text-sm text-zinc-500 hover:text-zinc-300"
            >
              Kihagyom
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
