import { Store, Leaf, Building2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSEO } from '../lib/seo';
import WorldZonePageHeader from '../components/world/WorldZonePageHeader';
import Breadcrumb from '../components/navigation/Breadcrumb';

const BUSINESS_OPTIONS = [
  {
    title: 'Online bolt nyitása',
    desc: 'Termékek, képek, akciók — ügyfelek üzenetben rendelnek.',
    path: '/shops',
    cta: 'Boltok megtekintése',
    icon: Store,
    color: '#F97316',
  },
  {
    title: 'Termelő vagyok',
    desc: 'Friss termék, kosár, rendelés üzenetben — helyi vásárlóknak.',
    path: '/producers/apply',
    cta: 'Termelői regisztráció',
    icon: Leaf,
    color: '#4ADE80',
  },
  {
    title: 'Helyi szolgáltató vagyok',
    desc: 'Vállalkozás profil, elérhetőség, üzenetek — a környékeden.',
    path: '/vallalkozas-regisztracio',
    cta: 'Vállalkozás regisztráció',
    icon: Building2,
    color: '#38BDF8',
  },
];

export default function BusinessHubPage() {
  const { navigate } = useRouter();
  useSEO({
    title: 'Vállalkozások | PiacPro',
    description: 'Online bolt, termelői profil vagy helyi vállalkozás — válaszd ki, melyik illik hozzád.',
    path: '/uzleti',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: 'Főoldal', path: '/' },
        { label: 'Vállalkozások' },
      ]} />

      <WorldZonePageHeader
        zoneId="business"
        title="Üzleti központ"
        subtitle="Válaszd ki, melyik modell illik hozzád"
        variant="glass"
        compact
      />

      <p className="text-sm text-zinc-400 leading-relaxed">
        Három külön út — mindegyik ingyenes indulás, üzenet-alapú kapcsolatfelvétellel. Nincs online fizetés a platformon.
      </p>

      <div className="grid gap-4">
        {BUSINESS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.path}
              type="button"
              onClick={() => navigate(opt.path)}
              className="group text-left rounded-2xl p-5 border transition-all hover:scale-[1.01]"
              style={{
                background: 'rgba(7,17,31,0.55)',
                borderColor: `${opt.color}33`,
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${opt.color}18`, border: `1px solid ${opt.color}44` }}
                >
                  <Icon className="w-6 h-6" style={{ color: opt.color }} />
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-zinc-100 text-lg">{opt.title}</h2>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{opt.desc}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-emerald-300 group-hover:gap-2 transition-all">
                    {opt.cta} <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Vissza a főoldalra
      </button>
    </div>
  );
}
