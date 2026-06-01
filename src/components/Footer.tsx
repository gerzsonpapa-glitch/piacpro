import { useState } from 'react';
import { useRouter } from '../lib/router';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import PiacEditable from './PiacEditable';
import {
  ShoppingBag, ScrollText, Shield, Mail, Heart, Phone, Users,
  ChevronDown, ChevronUp, Gavel, Briefcase, Store, Leaf,
  Star, Award, Zap, MessageCircle, Search, PlusCircle,
  TrendingUp, Lock, CheckCircle, Sparkles, Package, HandHeart,
  PhoneCall, ExternalLink
} from 'lucide-react';

const RANK_LEVELS = [
  {
    level: 1, name: 'Kezdő', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20',
    desc: 'Új regisztráció. Az első hirdetések és vásárlások megalapozzák a profilod.',
    req: 'Regisztráció után automatikusan',
  },
  {
    level: 2, name: 'Aktív', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
    desc: 'Rendszeres részvétel a piacon. Értékelések gyűjtése, sikeres tranzakciók.',
    req: '5+ tranzakció, 3+ értékelés',
  },
  {
    level: 3, name: 'Tapasztalt', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20',
    desc: 'Megbízható eladó/vevő. A közösség már ismeri és értékeli.',
    req: '20+ tranzakció, 4+ átlagos értékelés',
  },
  {
    level: 4, name: 'Megbízható', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',
    desc: 'Kiemelkedő megbízhatóság. Zöld pecsét jelzi a profil hitelességét.',
    req: '50+ tranzakció, 4.5+ átlag, 3+ hónap aktivitás',
  },
  {
    level: 5, name: 'VIP', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
    desc: 'A platform legmegbízhatóbb tagjai. Prémium megjelenés és kiemelt láthatóság.',
    req: '100+ tranzakció, 4.8+ átlag, admin jóváhagyás',
  },
];

const FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Hirdetések',
    color: 'text-emerald-400',
    points: [
      'Ingyen feladható apróhirdetések bármilyen kategóriában',
      'Max 8 kép + videó feltöltése hirdetésenként',
      'Alkuképes ár beállítása, szállítási opciók (GLS, Posta, személyes)',
      'Keresés szűrőkkel: kategória, hely, ár, állapot',
      'Kedvencek lista — mentsd el a neked tetsző hirdetéseket',
      'Hirdetés bump funkció: emeld vissza az elejére',
      'AI Asszisztens (3+ hónapos fiókoknak): automatikus szöveggenerálás',
    ],
  },
  {
    icon: Gavel,
    title: 'Licitalás',
    color: 'text-amber-400',
    points: [
      'Online licit termékekre — valós idejű ajánlattétel',
      'Az első licit elindítja a visszaszámlálót',
      'Automatikus időhosszabbítás az utolsó percekben',
      'Ajánlattétel értesítések azonnal megjelennek',
      'Minimálajánlat és kikiáltási ár beállítható',
    ],
  },
  {
    icon: Briefcase,
    title: 'Álláskeresés',
    color: 'text-sky-400',
    points: [
      'Álláshirdetések feladása cégeknek és vállalkozóknak',
      'Munkakeresési hirdetések — mutasd meg magad a munkáltatóknak',
      'Kategóriák: fizikai munka, IT, egészségügy, oktatás, stb.',
      'Helyszín, fizetési sáv, foglalkoztatás típusa megadható',
      'Elérhetőség csak bejelentkezett felhasználóknak látható',
    ],
  },
  {
    icon: Store,
    title: 'Boltok',
    color: 'text-teal-400',
    points: [
      'Saját online bolt nyitása vállalkozásoknak',
      'Egyedi bolt URL, logó, bemutatkozás, nyitvatartás',
      'Korlátlan termék feltöltés képekkel',
      'Kedvezmény és akciós ár beállítása',
      'Üzenet küldés közvetlenül a boltnak',
    ],
  },
  {
    icon: Leaf,
    title: 'Termelők',
    color: 'text-lime-400',
    points: [
      'Helyi termelők és kézművesek számára dedikált profil',
      'Termékek kategorizálása (bioélelmiszer, tejtermék, zöldség stb.)',
      'Rendelés leadása közvetlenül üzenetben',
      'Termelő profil megtekinthető bejelentkezés nélkül',
      'Elérhetőség és rendelés csak bejelentkezett felhasználóknak',
    ],
  },
  {
    icon: Heart,
    title: 'Adománygyűjtés',
    color: 'text-rose-400',
    points: [
      'Adománygyűjtő kampány indítása ingyenesen, bejelentkezés után',
      'Cél összeg, képek, helyszín és leírás megadható',
      'A kampányhoz felajánlások kapcsolhatók (tárgy, szolgáltatás)',
      'Kampány lezárása, szerkesztése, törlése a szervező által',
      'Hitelesített (zöld pipa) kampányok admin által ellenőrzöttek',
    ],
  },
  {
    icon: HandHeart,
    title: 'Ingyenes felajánlások',
    color: 'text-teal-400',
    points: [
      'Tárgy vagy szolgáltatás felajánlása teljesen ingyenesen',
      'Felajánlás opcionálisan kapcsolható adománygyűjtő kampányhoz',
      'Képek feltöltése (max 3), helyszín és leírás megadható',
      'Bárki igényelheti az "Igénylés" gombbal',
      'A felajánló kezelheti: teljesítettnek jelöl, töröl, újraaktivál',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Üzenetküldés',
    color: 'text-blue-400',
    points: [
      'Valós idejű chat eladóval/vevővel',
      'Automatikus értesítés új üzenetnél',
      'Hirdetéshez, bolthoz, felajánláshoz, adománygyűjtőhöz kötött chat',
      'Olvasott visszaigazolás (kék pipa)',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Közösségi Fórum',
    color: 'text-sky-400',
    points: [
      'Kategóriák: Általános, Kérdések, Piactér tippek, Ötletek, Hirdetések',
      'Téma létrehozása, válaszolás, idézés (reply-to)',
      'Reakciók: Tetszik, Szuper, Vicces, Hasznos',
      'Megoldásnak jelölés — a legjobb válasz kiemelve',
      'Szerkesztés és törlés saját hozzászólásoknál',
      'Bug tracker & fejlesztési ötlet beküldés státuszkövetéssel',
    ],
  },
  {
    icon: Shield,
    title: 'Védelem — Pénzügyi tervezés',
    color: 'text-emerald-400',
    points: [
      'Nyugdíj-előtakarékosság és hosszú távú vagyonépítés',
      'Gyermekjövő: megtakarítás, tanulmány, induló tőke',
      'Hiteltermékek: lakáshitel, CSOK, hitelkiváltás',
      'Életbiztosítás, vagyonvédelem, KKV megoldások',
      'Online KGFB kötés, gépjármű asszisztencia, utasbiztosítás',
      'Adókedvezmény és visszatérítés optimalizálás',
      'Személyes tanácsadó: Ákom László Zsolt OVB fiókvezető',
      'Közvetlen kapcsolatfelvétel: telefon, email, kontakt form',
    ],
  },
];

const GUIDE_SECTIONS = [
  {
    title: 'Hogyan adjak fel hirdetést?',
    content: '1. Regisztrálj vagy lépj be. 2. Kattints a "Hirdetés feladása" gombra. 3. Töltsd ki a termék nevét, leírást, árat. 4. Tölts fel képeket (max 8). 5. Adj meg elérhetőséget és szállítási módot. 6. Kattints a "Közzétenni" gombra. A hirdetés azonnal aktív lesz.',
  },
  {
    title: 'Hogyan működik a licit?',
    content: 'Az eladó minimálajánlatot és kikiáltási árat ad meg. Az első licit elindítja a visszaszámlálót. Minden új ajánlat után az időszámláló visszaáll. A legmagasabb ajánlatot tevő nyeri a licitálást és értesítést kap.',
  },
  {
    title: 'Mi a Rank rendszer?',
    content: 'A rang automatikusan emelkedik a tranzakciók és értékelések alapján. 1-es szint az alapértelmezett regisztrációnál. Minél magasabb a szinted, annál hitelesebb a profilod mások szemében. Az 5-ös (VIP) szint admin jóváhagyáshoz kötött.',
  },
  {
    title: 'Mikor érhető el az AI Asszisztens?',
    content: 'Az AI Hirdetés Asszisztens csak legalább 3 hónapos fiókkal rendelkező felhasználóknak elérhető. Ez a funkció képek alapján automatikusan generálja a hirdetés szövegét, árát és kategóriáját.',
  },
  {
    title: 'Hogyan leszek Termelő?',
    content: 'A Termelők oldalon kattints a "Jelentkezés termelőnek" gombra. Töltsd ki az adatokat (név, kategóriák, telephely, bemutatkozás). Az admin jóváhagyja a kérelmet. Jóváhagyás után saját termelői profilod lesz termékek feltöltésével.',
  },
  {
    title: 'Hogyan nyithatok boltot?',
    content: 'Boltnyitáshoz admin engedély szükséges. Vedd fel a kapcsolatot az adminisztrátorral. Engedély után a "Saját boltom" menüponton keresztül hozhatod létre a boltot: add meg a nevet, leírást, logót és nyitvatartást.',
  },
  {
    title: 'Hogyan indíthatok adománygyűjtő kampányt?',
    content: 'Az "Adományok" oldalon kattints a "+ Kampány indítása" gombra. Add meg a kampány nevét, leírást, célösszeget és képeket. Alap szintű fióknál az admin jóváhagyása szükséges. Magasabb rangú (3+) felhasználók kampánya azonnal megjelenik. A kampányhoz felajánlásokat is lehet csatolni.',
  },
  {
    title: 'Hogyan ajánlhatok fel valamit ingyen?',
    content: 'Az "Adományok" oldalon kattints a "+ Felajánlok valamit" gombra. Válaszd ki, hogy tárgyat vagy szolgáltatást ajánlasz. Add meg a leírást, helyszínt, feltöltj képet (opcionális). A felajánlást bárki igényelheti, te pedig a saját felajánlásod oldalán kezelheted: teljesítettnek jelölheted, törölheted vagy visszaállíthatod aktívra.',
  },
];

function GuideAccordion({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
      >
        <span className="font-medium pr-4">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
      </button>
      {open && (
        <p className="pb-4 text-xs text-zinc-500 leading-relaxed">{content}</p>
      )}
    </div>
  );
}

export default function Footer() {
  const { navigate: routerNavigate } = useRouter();
  const { config } = useSiteCustomization();
  const [showGuide, setShowGuide] = useState(false);

  function navigate(path: string) {
    setShowGuide(false);
    routerNavigate(path);
  }

  return (
    <footer className="relative z-10 border-t border-white/5 mt-16">

      {/* Guide section toggle banner */}
      <div className="border-b border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <ScrollText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Útmutató és funkciók — hogyan használd a PiacPro-t?</span>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showGuide ? 'Bezárás' : 'Megnyitás'}
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Guide expanded section */}
      {showGuide && (
        <div className="border-b border-white/5 bg-white/1">
          <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">

            {/* Feature overview */}
            <div>
              <h2 className="text-base font-bold text-zinc-100 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                Platform funkciók
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FEATURES.map((f) => (
                  <div key={f.title} className="glass rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 glass-bubble rounded-xl flex items-center justify-center flex-shrink-0">
                        <f.icon className={`w-4 h-4 ${f.color}`} />
                      </div>
                      <h3 className={`font-semibold text-sm ${f.color}`}>{f.title}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {f.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-xs text-zinc-500">
                          <CheckCircle className="w-3 h-3 text-zinc-600 mt-0.5 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Rank system */}
            <div>
              <h2 className="text-base font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Rang rendszer
              </h2>
              <p className="text-zinc-500 text-xs mb-5">A rangod tükrözi a megbízhatóságodat a közösségben. Minél több sikeres tranzakciód és jó értékelésed van, annál magasabb szintre jutsz.</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {RANK_LEVELS.map((r) => (
                  <div key={r.level} className={`rounded-2xl p-4 border ${r.bg} space-y-2`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${r.color}`}>{r.level}</span>
                      <span className={`text-sm font-semibold ${r.color}`}>{r.name}</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{r.desc}</p>
                    <p className={`text-[10px] font-medium ${r.color} opacity-70`}>{r.req}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI feature note */}
            <div className="flex items-start gap-4 glass rounded-2xl p-5">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm mb-1">AI Hirdetés Asszisztens</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Tölts fel képeket vagy írj pár szót a termékről — az AI automatikusan megírja a hirdetés szövegét, becsüli az árat és ajánl kategóriát.
                  Ez a funkció legalább <span className="text-amber-400 font-medium">3 hónapos</span> fiókhoz kötött a visszaélések elkerülése érdekében.
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 text-xs font-medium">3 hónap+</span>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-400" />
                Gyakran ismételt kérdések
              </h2>
              <div className="glass rounded-2xl px-5">
                {GUIDE_SECTIONS.map((s) => (
                  <GuideAccordion key={s.title} title={s.title} content={s.content} />
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 mb-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 glass-bubble rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Piac<span className="text-emerald-400">Pro</span>
              </span>
            </button>
            <PiacEditable editKey="footer.tagline" as="p" className="text-zinc-500 text-sm leading-relaxed">
              {config.footer.tagline}
            </PiacEditable>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { icon: Star, text: 'Értékelések' },
                { icon: Award, text: 'Rangok' },
                { icon: Shield, text: 'Moderálás' },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1 text-[10px] text-zinc-600 bg-white/4 px-2 py-1 rounded-lg">
                  <Icon className="w-2.5 h-2.5 text-emerald-500" />{text}
                </span>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Platform</p>
            <ul className="space-y-2">
              {[
                { label: 'Hirdetések', path: '/search', icon: Search },
                { label: 'Licitek', path: '/auctions', icon: Gavel },
                { label: 'Adományok', path: '/donations', icon: Heart },
                { label: 'Állások', path: '/jobs', icon: Briefcase },
                { label: 'Boltok', path: '/shops', icon: Store },
                { label: 'Termelők', path: '/producers', icon: Leaf },
                { label: 'Hirdetés feladása', path: '/create', icon: PlusCircle },
                { label: 'Regisztráció', path: '/register', icon: Users },
              ].map((item) => (
                <li key={item.path}>
                  <button onClick={() => navigate(item.path)}
                    aria-label={`Ugrás: ${item.label}`}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                    <item.icon className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Információ</p>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate('/rules')}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                  <ScrollText className="w-3.5 h-3.5" aria-hidden="true" />Felhasználási szabályzat
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/rules')}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                  <Shield className="w-3.5 h-3.5" aria-hidden="true" />Adatvédelem
                </button>
              </li>
              <li>
                <button onClick={() => setShowGuide(true)}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 text-sm transition-colors">
                  <ScrollText className="w-3.5 h-3.5" aria-hidden="true" />Használati útmutató
                </button>
              </li>
            </ul>

            {/* Rank mini overview */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-2">Rang szintek</p>
              <div className="space-y-1">
                {RANK_LEVELS.map((r) => (
                  <div key={r.level} className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold w-4 text-center ${r.color}`}>{r.level}</span>
                    <span className={`text-xs ${r.color}`}>{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Kapcsolat</p>
            <ul className="space-y-2.5">
              <li className="text-zinc-400 text-sm font-medium">Vörös Gergely Richárd</li>
              <li>
                <a href="tel:+36301725181"
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />+36 30 172 5181
                </a>
              </li>
              <li>
                <a href="mailto:gerzsonpapa@gmail.com"
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />gerzsonpapa@gmail.com
                </a>
              </li>
              <li className="pt-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-2">Facebook csoportok</p>
                <ul className="space-y-1.5">
                  <li>
                    <a href="https://www.facebook.com/groups/391889140975247" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-400 text-sm transition-colors">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Adok-veszek <span className="text-zinc-600">(19 ezer tag)</span></span>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.facebook.com/groups/175432696584567" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-400 text-sm transition-colors">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Állás hirdetések <span className="text-zinc-600">(40 ezer tag)</span></span>
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-600 text-xs">© 2026 PiacPro. Minden jog fenntartva.</p>
          <p className="text-zinc-700 text-xs flex items-center gap-1">
            Készült <Heart className="w-3 h-3 text-red-500/60" /> Magyarországon
          </p>
        </div>
      </div>
    </footer>
  );
}
