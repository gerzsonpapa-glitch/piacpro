import { useRouter } from '../lib/router';
import {
  ScrollText, ShieldCheck, Users, AlertTriangle, Gavel, Mail, Shield,
  CheckCircle, XCircle, ChevronRight, Heart, HandHeart, Package,
  Wrench, Store, Tractor, Hammer, MessageCircle, Star, Trophy,
  BadgeCheck, Megaphone
} from 'lucide-react';
import { useSEO, SEO_PAGES } from '../lib/seo';

const sections = [
  {
    icon: Users,
    title: 'Regisztráció és fiókhasználat',
    color: 'text-emerald-400',
    items: [
      'A regisztrációhoz valós és érvényes adatok megadása szükséges.',
      'Egy személy csak egy fiókot hozhat létre. Duplikált fiókok törlésre kerülnek.',
      'Fiókodat nem ruházhatod át másra, és nem adhatod kölcsön.',
      'A jelszavad titkosságáért te felelsz. Illetéktelen hozzáférést azonnal jelezd.',
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
      'A hirdetések lejárati ideje van — lejárat után automatikusan archiválódnak.',
      'Tilos más hirdetők zavarása, illetve hirdetési spam.',
    ],
  },
  {
    icon: Hammer,
    title: 'Árverések',
    color: 'text-amber-400',
    items: [
      'Az árverésen tett ajánlat kötelező érvényű — visszavonni nem lehet.',
      'Az árverés az első licit leadásakor indul el; a visszaszámlálás csak ekkor kezdődik.',
      'Minden ajánlatnak magasabbnak kell lennie az aktuális legmagasabb ajánlatnál.',
      'Az árverés végén a legmagasabb ajánlattevő nyeri az árverést.',
      'Hamis ajánlat (saját árverésen való licitálás) szigorúan tilos.',
    ],
  },
  {
    icon: Heart,
    title: 'Adománygyűjtési kampányok',
    color: 'text-rose-400',
    items: [
      'Adománygyűjtő kampányt bárki létrehozhat bejelentkezés után, ingyenesen.',
      'A kampány szervezője szerkesztheti, lezárhatja vagy törölheti a saját kampányát.',
      'A kampányhoz kapcsolt felajánlásokat (tárgy, szolgáltatás) a szervező kezelheti: teljesítettnek jelölheti vagy törölheti.',
      'Az adományozóknak a kampány szervezője üzenetet küldhet a beépített üzenetrendszeren keresztül.',
      'Csak valós, jóhiszemű célokra hozható létre kampány. Félrevezető kampányok azonnal eltávolításra kerülnek.',
      'A hitelesített (zöld pipa) kampányokat az adminisztrátorok ellenőrizték.',
      'A pénzügyi adományozás (Ft-átutalás) funkció fejlesztés alatt áll.',
    ],
  },
  {
    icon: HandHeart,
    title: 'Ingyenes felajánlások',
    color: 'text-teal-400',
    items: [
      'Tárgyat és szolgáltatást is lehet felajánlani ingyenesen, admin jóváhagyás nélkül.',
      'A felajánlás opcionálisan kapcsolható egy adománygyűjtő kampányhoz.',
      'A helyszín megadása opcionális — megadhatsz megyét és/vagy várost/települést.',
      'Képek feltöltése opcionális, de segíti az érdeklődőket (max. 3 kép).',
      'A felajánlást bárki igényelheti ("Igénylés" gomb) — a felajánló értesítést kap.',
      'Teljesítés után a felajánlás "Teljesített" státuszt kap.',
      'Saját felajánlásunkat nem igényelhetjük, de módosíthatjuk vagy törölhetjük.',
    ],
  },
  {
    icon: Store,
    title: 'Webshopok és boltok',
    color: 'text-orange-400',
    items: [
      'Webshopot (boltot) csak adminisztrátor által jóváhagyott felhasználók nyithatnak.',
      'A bolt tulajdonosa kezeli a termékeit, árait és a rendeléseket.',
      'A bolt termékeire vevők "Megrendelem" üzenetet küldhetnek a chat-en keresztül.',
      'Bolt létrehozásához kérelem benyújtása szükséges.',
    ],
  },
  {
    icon: Tractor,
    title: 'Termelők (Producers)',
    color: 'text-lime-400',
    items: [
      'A Termelők modul helyi gazdálkodók, kézművesek számára érhető el.',
      'Termelői profil létrehozásához jóváhagyási folyamat szükséges.',
      'A termelő kezeli saját termékeit, képeit és leírásait.',
      'A vásárlók rendelhetnek a termelőktől az üzenetrendszeren keresztül.',
      'A termelői termékek készletmennyisége nyomon követhető.',
    ],
  },
  {
    icon: Megaphone,
    title: 'Álláshirdetések és munkakeresők',
    color: 'text-sky-400',
    items: [
      'Álláshirdetést bárki feladhat (munkáltató és magánszemély egyaránt).',
      'Álláskereső hirdetés (munkát kereső) szintén feladható.',
      'Az álláshirdetések automatikusan lejárnak a megadott határidőn.',
      'Hamis vagy megtévesztő álláshirdetések azonnal eltávolításra kerülnek.',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Üzenetküldés és chat',
    color: 'text-cyan-400',
    items: [
      'Üzenetet hirdetéshez, bolthoz, termelői termékhez, felajánláshoz, adománygyűjtőhöz, vagy felhasználóhoz közvetlenül is lehet küldeni.',
      'Az üzenetrendszer valós idejű — az új üzenetek azonnal megjelennek.',
      'Az olvasott/olvasatlan státusz nyomon követhető.',
      'Zaklatás, sértő üzenetek küldése szigorúan tilos és fiókfelfüggesztéssel jár.',
    ],
  },
  {
    icon: Star,
    title: 'Értékelési és tranzakciós rendszer',
    color: 'text-yellow-400',
    items: [
      'Sikeres tranzakció (eladás/vétel) lezárása után mindkét fél értékelhet.',
      'Az értékelések 1–5 csillag skálán adhatók, szöveges megjegyzéssel.',
      'Az értékelések nyilvánosak és a felhasználói profilon láthatók.',
      'Hamis értékelés leadása szabálysértés.',
    ],
  },
  {
    icon: Trophy,
    title: 'Rangrendszer és szintek',
    color: 'text-amber-400',
    items: [
      'A felhasználók aktivitásuk alapján rangot kapnak (Újonc → Mester szintig).',
      'A rangot hirdetések, tranzakciók, értékelések és aktivitás alapján számítjuk.',
      'Magasabb rang nagyobb bizalmat és láthatóságot jelent a platformon.',
      'A rang manipulálása (pl. fiktív tranzakciók) tiltott és fiókfelfüggesztéssel jár.',
    ],
  },
  {
    icon: BadgeCheck,
    title: 'Biztonságos kereskedelem',
    color: 'text-emerald-400',
    items: [
      'Javasolt személyes átadás nyilvános helyen.',
      'Előre ne fizess ismeretlen személynek banki átutalással.',
      'A vásárló joga ellenőrizni a terméket átvétel előtt.',
      'Megtévesztő leírás esetén jogod van visszalépni az üzlettől.',
      'Gyanús hirdetést a Bejelentés gombbal jelezz nekünk.',
      'Hitelesített (zöld pipa) felhasználók és kampányok az adminisztrátorok által ellenőrzöttek.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Tiltott tevékenységek',
    color: 'text-orange-400',
    items: [
      'Csalás, megtévesztés, hamis identitás használata.',
      'Zaklatás, sértő üzenetek küldése más felhasználóknak.',
      'Automatizált eszközök (botok) használata.',
      'Fegyverek, kábítószerek, egyéb tiltott anyagok hirdetése.',
      'Szerzői jogot sértő tartalmak közzététele.',
      'Személyes adatok jogosulatlan gyűjtése vagy megosztása.',
      'Hamis vagy félrevezető adománygyűjtési kampány indítása.',
      'Saját árverésen való licitálás.',
    ],
  },
  {
    icon: Gavel,
    title: 'Moderáció és szankciók',
    color: 'text-red-400',
    items: [
      'Szabálysértő tartalmakat adminisztrátorink eltávolítják.',
      'Ismételt szabálysértés esetén a fiók korlátozásra, illetve tiltásra kerül.',
      'Súlyos esetekben (pl. csalás) az adatokat hatóságoknak adjuk át.',
      'A döntések ellen bejelentést küldhetsz az ügyfélszolgálatnak.',
      'A PiacPro fenntartja a jogot bármely fiók indoklás nélküli megszüntetésére.',
    ],
  },
  {
    icon: Shield,
    title: 'Védelem — pénzügyi tervezés és biztosítás',
    color: 'text-emerald-400',
    items: [
      'A Védelem a PiacPro külön modulja: pénzügyi tanácsadás és biztosítási megoldások — nem része a hirdetés/üzenet vásárlási folyamatnak.',
      'Hivatalos partner: Ákom László Zsolt OVB fiókvezető. Nem biztosító-összehasonlító oldal — minden út egy szakértőhöz vezet.',
      'Elérhető témák: nyugdíj-előtakarékosság, gyermekjövő, vagyonépítés, lakáshitel és CSOK, adókedvezmény, KKV és cégvédelem, vagyonvédelem, életbiztosítás.',
      'Online megoldások: KGFB, gépjármű asszisztencia, utasbiztosítás — közvetlen online kötési linkekkel.',
      'Az „Élethelyzet” gyorsválasztó segít (pl. lakást vennék, gyerek született, nyugdíjra takarékoskodnék).',
      'Kérdésedet a Védelem oldalon lévő űrlapon is elküldheted — az üzenet közvetlenül a tanácsadóhoz érkezik, kötelezettség nélkül.',
      'A modul nem reklámfelület: egyetlen partner, átlátható kapcsolatfelvétel (telefon, e-mail, OVB profil).',
      'A piactéri tranzakciók (hirdetés, bolt, termelő) és a Védelem szolgáltatás egymástól függetlenek.',
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
  useSEO(SEO_PAGES.rules);
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
              A PiacPro egy komplex közösségi piactér: hirdetések, árverések, adománygyűjtés, felajánlások,
              webshopok, termelők, álláspiác, pénzügyi Védelem modul és közösségi üzenetrendszer egy helyen.
              Kérjük, olvasd el az alábbi szabályokat.
            </p>
            <p className="text-zinc-600 text-xs mt-3">Utolsó frissítés: 2026. május</p>
          </div>
        </div>
      </div>

      {/* Platform modules quick overview */}
      <div className="glass-bubble rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Mit találsz a PiacPro-n?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { icon: ScrollText,  label: 'Hirdetések',        color: 'text-blue-400',    bg: 'bg-blue-500/8' },
            { icon: Hammer,      label: 'Árverések',         color: 'text-amber-400',   bg: 'bg-amber-500/8' },
            { icon: Heart,       label: 'Adománygyűjtés',   color: 'text-rose-400',    bg: 'bg-rose-500/8' },
            { icon: HandHeart,   label: 'Felajánlások',      color: 'text-teal-400',    bg: 'bg-teal-500/8' },
            { icon: Store,       label: 'Webshopok',         color: 'text-orange-400',  bg: 'bg-orange-500/8' },
            { icon: Tractor,     label: 'Termelők',          color: 'text-lime-400',    bg: 'bg-lime-500/8' },
            { icon: Megaphone,   label: 'Álláspiac',         color: 'text-sky-400',     bg: 'bg-sky-500/8' },
            { icon: Shield,      label: 'Védelem',           color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
            { icon: MessageCircle, label: 'Chat',            color: 'text-cyan-400',    bg: 'bg-cyan-500/8' },
            { icon: Trophy,      label: 'Rangrendszer',      color: 'text-amber-400',   bg: 'bg-amber-500/8' },
          ].map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${bg}`}>
              <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
              <span className="text-zinc-300 text-sm">{label}</span>
            </div>
          ))}
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
            { ok: true,  text: 'Valódi termékek és valós kampányok' },
            { ok: true,  text: 'Pontos és valódi leírások' },
            { ok: true,  text: 'Tisztességes kereskedelem' },
            { ok: true,  text: 'Más felhasználók tisztelete' },
            { ok: true,  text: 'Ingyenes felajánlás tárggyal vagy szolgáltatással' },
            { ok: true,  text: 'Üzenet küldése bármely felhasználónak' },
            { ok: false, text: 'Tiltott termékek hirdetése' },
            { ok: false, text: 'Hamis adatok megadása' },
            { ok: false, text: 'Zaklatás, sértő üzenetek' },
            { ok: false, text: 'Több fiók használata' },
            { ok: false, text: 'Félrevezető adománygyűjtés' },
            { ok: false, text: 'Saját árverésen való licitálás' },
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
