import { ShoppingCart, Package, Briefcase, Store } from 'lucide-react';
import { useRouter } from '../../lib/router';

const INTENTS = [
  { id: 'buy', label: 'Vásárolok', icon: ShoppingCart, path: '/search', color: '#00C896' },
  { id: 'sell', label: 'Eladok', icon: Package, path: '/create', color: '#38BDF8' },
  { id: 'job', label: 'Állást keresek', icon: Briefcase, path: '/jobs', color: '#60A5FA' },
  { id: 'business', label: 'Boltom van', icon: Store, path: '/uzleti', color: '#FBBF24' },
] as const;

type HomeIntentBarVariant = 'default' | 'sidebar' | 'dock';

export default function HomeIntentBar({ variant = 'default' }: { variant?: HomeIntentBarVariant }) {
  const { navigate } = useRouter();

  return (
    <div
      className={`home-intent-bar home-intent-bar--${variant} pointer-events-auto`}
      role="region"
      aria-label="Mit szeretnél csinálni?"
    >
      <div
        className="home-intent-bar__panel rounded-2xl px-3 py-3 sm:px-4 sm:py-3.5 border backdrop-blur-xl"
        style={{
          background: 'rgba(7,17,31,0.78)',
          borderColor: 'rgba(0,200,150,0.22)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}
      >
        <p className="home-intent-bar__heading text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] text-emerald-400/90 mb-2 text-center sm:text-left">
          Mit szeretnél?
        </p>
        <div className="home-intent-bar__grid grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INTENTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className="home-intent-bar__btn flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] min-h-[44px]"
                style={{
                  background: `${item.color}12`,
                  border: `1px solid ${item.color}33`,
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                <span className="home-intent-bar__label text-[11px] sm:text-xs font-bold text-zinc-100 leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
