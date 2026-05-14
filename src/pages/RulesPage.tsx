import { useRouter } from '../lib/router';
import {
  ScrollText, ShieldCheck, Users, AlertTriangle, Gavel, Mail,
  CheckCircle, XCircle, ChevronRight
} from 'lucide-react';

const sections = [
  {
    icon: Users,
    title: 'Regisztráció és fiókhasználat',
    color: 'text-emerald-400',
    items: [
      'A regisztrációhoz valós és érvényes adatok megadása szükséges.',
      'Egy személy csak egy fiókot hozhat létre. Duplikált fiókok törlésre kerülnek.',
      'Fiókodat nem ruházhatod át másra, és nem adhatod kölcsön.',
      'A jelszavad titkosságát Te felelsz meg. Illetéktelen hozzáférést azonnal jelezd.',
      'Minimum életkor: 18 év, vagy szülői felügyelet 18 éves korig.',
    ],
  },
  {
    icon: ScrollText,
    title: 'Hirdetések szabályai',
    color: 'text-blue-400',
    items: [
      'Csak valódi, saját tulajdonodban lévő tárgyakat hirdethetsz.',
      'A hirdetés szövege és képei pontosan kell tükrözzék az eladott terméket.',
      'Tilos tiltott, veszélyes, hamisított, vagy illegális termékek hirdetése.',
      'Egy termékhez csak egy aktív hirdetés adható fel.',
      'Az ár feltüntetése kötelező; rejtett díjak nem megengedettek.',
      'Tilos más hirdetők zavarása, illetve hirdetési spam.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Biztonságos kereskedelem',
    color: 'text-teal-400',
    items: [
      'Javasolt személyes átadás nyilvános helyen.',
      'Előre nem fizetünk ismeretlen személynek banki átutalással.',
      'A vásárló joga ellenőrizni a terméket átvétel előtt.',
      'Megtévesztő leírás esetén joga van visszalépni az üzlettől.',
      'Gyanús hirdetést a Bejelentés gombbal jelezz nekünk.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Tiltott tevékenységek',
    color: 'text-amber-400',
    items: [
      'Csalás, megtévesztés, hamis identitás használata.',
      'Zaklatás, sértő üzenetek küldése más felhasználóknak.',
      'Automatizált eszközök (botok) használata.',
      'Fegyverek, kábítószerek, egyéb tiltott anyagok hirdetése.',
      'Szerzői jogot sértő tartalmak közzététele.',
      'Személyes adatok jogosulatlan gyűjtése vagy megosztása.',
    ],
  },
  {
    icon: Gavel,
    title: 'Moderáció és szankciók',
    color: 'text-red-400',
    items: [
      'Szabálysértő hirdetéseket adminisztrátorink eltávolítják.',
      'Ismételt szabálysértés esetén a fiók korlátozásra, illetve tiltásra kerül.',
      'Súlyos esetekben (pl. csalás) az adatokat hatóságoknak adjuk át.',
      'A döntések ellen bejelentést küldhetsz az ügyfélszolgálatnak.',
      'A PiacPro fenntartja a jogot bármely fiók indoklás nélküli megszüntetésére.',
    ],
  },
  {
    icon: Mail,
    title: 'Adatvédelem és kapcsolat',
    color: 'text-zinc-400',
    items: [
      'Adataidat bizalmasan kezeljük, harmadik félnek nem adjuk el.',
      'Regisztrációkor megadott adataid GDPR szerint törlését kérheted.',
      'Kérdés vagy panasz esetén: support@piacpro.hu',
      'Szabályzat változtatás esetén e-mailben értesítünk.',
    ],
  },
];

export default function RulesPage() {
  const { navigate } = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="glass rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex items-start gap-5">
          <div className="w-14 h-14 glass-bubble rounded-2xl flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">PiacPro</p>
            <h1 className="text-2xl font-bold text-zinc-100">Felhasználási szabályzat</h1>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              A PiacPro platformot Magyarország egyik legmegbízhatóbb online piactereként üzemeltetjük.
              Kérjük, olvasd el az alábbi szabályokat, hogy biztonságos és kellemes legyen a kereskedelem
              minden felhasználó számára.
            </p>
            <p className="text-zinc-600 text-xs mt-3">Utolsó frissítés: 2026. május</p>
          </div>
        </div>
      </div>

      {/* Quick summary */}
      <div className="glass-bubble rounded-3xl p-6">
        <h2 className="font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Rövid összefoglaló
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { ok: true, text: 'Valódi termékek hirdetése' },
            { ok: true, text: 'Pontos és valódi leírások' },
            { ok: true, text: 'Tisztességes kereskedelem' },
            { ok: true, text: 'Más felhasználók tisztelete' },
            { ok: false, text: 'Tiltott termékek hirdetése' },
            { ok: false, text: 'Hamis adatok megadása' },
            { ok: false, text: 'Zaklatás, sértő üzenetek' },
            { ok: false, text: 'Több fiók használata' },
          ].map((item) => (
            <div key={item.text} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm ${item.ok ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
              {item.ok
                ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              <span className={item.ok ? 'text-zinc-300' : 'text-zinc-400'}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
              <section.icon className={`w-5 h-5 ${section.color}`} />
              <h2 className="font-semibold text-zinc-100">{section.title}</h2>
            </div>
            <ul className="px-6 py-4 space-y-2.5">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400 leading-relaxed">
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="glass rounded-3xl p-6 text-center">
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
          A PiacPro használatával elfogadod a fenti szabályzatot. Ha kérdésed van,
          lépj kapcsolatba ügyfélszolgálatunkkal.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate('/')}
            className="px-5 py-2.5 glass-pill text-zinc-300 text-sm font-medium rounded-xl hover:text-zinc-100 transition-colors">
            Vissza a főoldalra
          </button>
          <a href="mailto:support@piacpro.hu"
            className="px-5 py-2.5 glass-pill-active text-emerald-300 text-sm font-medium rounded-xl transition-all hover:scale-[1.02]">
            Kapcsolatfelvétel
          </a>
        </div>
      </div>
    </div>
  );
}
