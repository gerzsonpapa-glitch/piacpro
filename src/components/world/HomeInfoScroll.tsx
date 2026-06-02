import { ChevronDown, Shield, Zap, Users, Heart, Store, CheckCircle2 } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';
import type { Listing } from '../../lib/types';
import HomeQuickNavGrid from './HomeQuickNavGrid';
import HomeHeroDock from './HomeHeroDock';

const BENEFITS = [
  {
    icon: Shield,
    title: 'Biztonságos és hiteles',
    text: 'Ellenőrzött profilok, értékelések és megbízhatósági rendszer — ismerd meg eladódat vagy vevődet.',
    color: '#00E676',
  },
  {
    icon: Zap,
    title: 'Minden egy helyen',
    text: 'Hirdetés, licit, állás, adomány, termelők és helyi boltok — nem kell tíz külön oldal.',
    color: '#FBBF24',
  },
  {
    icon: Users,
    title: 'Magyar közösség',
    text: 'Magyar nyelvű piactér, ahol helyiek adnak el, vesznek és segítenek egymásnak.',
    color: '#38BDF8',
  },
  {
    icon: Heart,
    title: 'Ingyenes indulás',
    text: 'Regisztráció és hirdetésfeladás díjmentes — csak azt használod, amire szükséged van.',
    color: '#F472B6',
  },
  {
    icon: Store,
    title: 'Helyi gazdaság',
    text: 'Támogasd a kistermelőket, helyi vállalkozásokat és a magyar piacot.',
    color: '#4ADE80',
  },
  {
    icon: CheckCircle2,
    title: 'Modern élmény',
    text: 'Élő statisztikák, azonnali üzenet, PiacAI asszisztens — nem egy unalmas hirdetőoldal.',
    color: '#A855F7',
  },
];

export default function HomeInfoScroll({
  listings,
  listingCount,
  loading,
}: {
  listings: Listing[];
  listingCount: number;
  loading: boolean;
}) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { stats } = useLiveWorldStats();

  const statItems = [
    { label: 'aktív hirdetés', value: stats.listings },
    { label: 'élő licit', value: stats.auctions },
    { label: 'nyitott állás', value: stats.jobs },
    { label: 'adomány kampány', value: stats.donations },
  ];

  return (
    <section className="home-info-scroll relative z-10">
      <div className="home-scroll-fade-top" aria-hidden />

      <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-16 space-y-14 md:space-y-16">
        {/* Miért PiacPro */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00C896]/90">
            Miért a PiacPro?
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
            Egy élő digitális város — nem csak piactér
          </h2>
          <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
            Dolgozz, kereskedj, segíts és építs közösséget — minden egy prémium ökoszisztémában.
          </p>
        </div>

        {/* Élő számok */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statItems.map((s) => (
            <div
              key={s.label}
              className="home-glass-panel rounded-2xl p-4 text-center"
            >
              <p className="text-2xl md:text-3xl font-black text-[#00C896] tabular-nums">
                {stats.loading ? '…' : s.value.toLocaleString('hu-HU')}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Előnyök */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="home-glass-panel rounded-2xl p-5 space-y-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${b.color}18`, border: `1px solid ${b.color}33` }}
                >
                  <Icon className="w-5 h-5" style={{ color: b.color }} />
                </div>
                <h3 className="font-bold text-zinc-100 text-sm">{b.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{b.text}</p>
              </div>
            );
          })}
        </div>

        {/* Gyors menü — minden modul */}
        <div className="home-glass-panel rounded-3xl p-5 md:p-7">
          <HomeQuickNavGrid />
        </div>

        {/* Legfrissebb hirdetések */}
        <div>
          <HomeHeroDock listings={listings} loading={loading} totalCount={listingCount} />
        </div>

        {/* CTA */}
        {!user && (
          <div className="home-glass-panel rounded-3xl p-8 md:p-10 text-center space-y-4">
            <h3 className="text-xl md:text-2xl font-black text-white">Csatlakozz ingyen!</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Percek alatt regisztrálhatsz, feladhatod első hirdetésed, vagy felfedezheted a várost.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="px-7 py-3 rounded-xl font-bold text-sm text-[#07111f]"
                style={{ background: 'linear-gradient(135deg, #00C896, #00A67E)', boxShadow: '0 0 24px rgba(0,200,150,0.35)' }}
              >
                Regisztráció — ingyenes
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-[#00C896]"
                style={{ border: '1px solid rgba(0,200,150,0.3)', background: 'rgba(0,200,150,0.06)' }}
              >
                Bejelentkezés
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function HomeScrollHint() {
  return (
    <div className="home-scroll-hint absolute bottom-20 sm:bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none animate-bounce">
      <span className="text-[10px] font-semibold text-zinc-500/80 uppercase tracking-widest">Görgess le</span>
      <ChevronDown className="w-4 h-4 text-zinc-500/60" />
    </div>
  );
}
