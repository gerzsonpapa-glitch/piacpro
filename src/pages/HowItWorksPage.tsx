import { HelpCircle, MessageCircle, Shield, CreditCard, Store, Leaf, Briefcase, ShoppingBag, Phone, ExternalLink, ChevronRight } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSEO } from '../lib/seo';
import Breadcrumb from '../components/navigation/Breadcrumb';

const FAQ = [
  {
    q: 'Van online fizetés a PiacPro-n?',
    a: 'Nem. A vásárlás, rendelés és jelentkezés üzenetben történik — te és a másik fél egyeztetitek az átvételt, szállítást vagy fizetést.',
    icon: CreditCard,
  },
  {
    q: 'Hogyan vásárolok hirdetésből?',
    a: 'Megnyitod a hirdetést → „Üzenet az eladónak” → megadod a szállítási preferenciát → az eladó válaszol az üzenetekben.',
    icon: ShoppingBag,
  },
  {
    q: 'Hogyan működik a bolt?',
    a: 'A bolt termékére rákattintasz → „Érdeklődöm” → üzenet megy a boltnak → egyeztettek.',
    icon: Store,
  },
  {
    q: 'Hogyan rendelek termelőtől?',
    a: 'Kosárba teszed a termékeket → „Megrendelés elküldése” → a termelő üzenetben visszajelez.',
    icon: Leaf,
  },
  {
    q: 'Hogyan jelentkezem állásra?',
    a: 'Az állás részletein „Jelentkezem” → rövid bemutatkozás → a munkáltató üzenetben válaszol.',
    icon: Briefcase,
  },
  {
    q: 'Mi a Védelem modul és mire jó?',
    a: 'A Védelem a piactértől különálló pénzügyi tanácsadási modul. Nyugdíj, biztosítás, hitel, gyermekjövő, KKV és egyéb élethelyzetekben segít Ákom László Zsolt OVB tanácsadó — nem biztosító-összehasonlító, hanem személyes szakértői útmutatás.',
    icon: Shield,
  },
  {
    q: 'Hogyan használom a Védelem modult?',
    a: 'Főoldalon kattints a Védelem torony pin-re, vagy a menüben a „Védelem” linkre. Válaszd ki élethelyzeted (pl. lakásvásárlás) vagy egy kategóriát (nyugdíj, KGFB stb.). A „Tovább” gomb a tanácsadó OVB oldalára visz. Kérdésedet az oldal alján lévő űrlapon is elküldheted.',
    icon: Shield,
  },
  {
    q: 'A Védelem kapcsolódik a piaci vásárláshoz?',
    a: 'Nem. A hirdetés, bolt és termelő rendelés üzenet-alapú és a piactér része. A Védelem külön szolgáltatás — pénzügyi tervezés, biztosítás, hitel — egy dedikált tanácsadóval.',
    icon: Shield,
  },
  {
    q: 'Biztonságos a platform?',
    a: 'Ellenőrzött profilok, értékelések és megbízhatósági rendszer segít felismerni a megbízható tagokat. Gyanús viselkedést jelenthetsz.',
    icon: Shield,
  },
  {
    q: 'Hol találom az üzeneteimet?',
    a: 'A jobb felső menüben „Üzenetek”, vagy a mobil alsó sáv „Fórum” zónájából is eléred a beszélgetéseket.',
    icon: MessageCircle,
  },
];

const VEDELEM_STEPS = [
  'Nyisd meg a Védelem modult: főoldali torony pin, fejléc menü, vagy a /vedelem oldal.',
  'Válaszd ki az élethelyzeted (pl. „Lakást vennék”, „Gyerekem született”) — azonnal a megfelelő témához kerülsz.',
  'Vagy böngéssz a kategóriák között: nyugdíj, gyermekjövő, hitel/CSOK, életbiztosítás, vagyonvédelem, KKV, KGFB, utasbiztosítás.',
  'Kattints a „Tovább” gombra — személyes OVB tanácsadói oldal nyílik (online kötés vagy konzultáció).',
  'Ha bizonytalan vagy, töltsd ki a kérdés űrlapot az oldal alján — válasz e-mailben vagy telefonon érkezik, kötelezettség nélkül.',
];

const VEDELEM_TOPICS = [
  'Nyugdíj-előtakarékosság és hosszú távú megtakarítás',
  'Gyermekjövő — tanulmány, induló tőke',
  'Lakáshitel, CSOK, hitelkiváltás',
  'Életbiztosítás és családvédelem',
  'Lakás- és vagyonbiztosítás',
  'KKV / vállalkozói megoldások',
  'Online KGFB, asszisztencia, utasbiztosítás',
];

export default function HowItWorksPage() {
  const { navigate } = useRouter();
  useSEO({
    title: 'Hogyan működik? | PiacPro',
    description: 'Használati útmutató: piactér, bolt, termelő, állás, Védelem pénzügyi modul — lépésről lépésre.',
    path: '/hogyan-mukodik',
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <Breadcrumb items={[
        { label: 'Főoldal', path: '/' },
        { label: 'Hogyan működik?' },
      ]} />

      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25">
          <HelpCircle className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white">Hogyan működik a PiacPro?</h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
          Piactér, licit, állás, bolt, termelő — és külön a Védelem pénzügyi modul. Minden lépés itt van.
        </p>
      </div>

      {/* Védelem — külön kiemelt használati útmutató */}
      <section className="glass rounded-3xl p-6 border border-emerald-500/15 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25 flex-shrink-0">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Védelem — pénzügyi tervezés</h2>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
              Nem a piaci vásárlás része. Személyes pénzügyi és biztosítási tanácsadás Ákom László Zsolt OVB fiókvezetővel —
              egy helyen, élethelyzet-alapú megközelítéssel.
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 mb-2">Mire jó?</p>
          <ul className="space-y-1.5">
            {VEDELEM_TOPICS.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-zinc-400">
                <ChevronRight className="w-4 h-4 text-emerald-500/70 flex-shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 mb-2">Használat lépésről lépésre</p>
          <ol className="space-y-2">
            {VEDELEM_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-zinc-400 leading-relaxed">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/vedelem')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-pill-active text-emerald-300 text-sm font-medium"
          >
            Védelem modul megnyitása
            <ExternalLink className="w-4 h-4" />
          </button>
          <a
            href="tel:+36206135808"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-zinc-400 border border-white/10 hover:text-emerald-300 transition-colors"
          >
            <Phone className="w-4 h-4" />
            +36 20 613 5808
          </a>
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed border-t border-white/5 pt-4">
          A Védelem nem reklámfelület és nem biztosító-összehasonlító piactér — kizárólag egy hivatalos tanácsadóhoz irányít,
          átláthatóan és kötelezettség nélküli első kapcsolatfelvétellel.
        </p>
      </section>

      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 px-1">Gyakori kérdések</h2>
        {FAQ.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.q} className="glass rounded-2xl p-5 border border-white/5">
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">{item.q}</h3>
                  <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 justify-center pt-4">
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="px-5 py-3 rounded-xl glass-pill-active text-emerald-300 text-sm font-medium"
        >
          Hirdetések böngészése
        </button>
        <button
          type="button"
          onClick={() => navigate('/vedelem')}
          className="px-5 py-3 rounded-xl glass-pill text-zinc-400 text-sm font-medium hover:text-emerald-300"
        >
          Védelem modul
        </button>
        <button
          type="button"
          onClick={() => navigate('/rules')}
          className="px-5 py-3 rounded-xl glass-pill text-zinc-400 text-sm font-medium hover:text-zinc-200"
        >
          Szabályzat
        </button>
      </div>
    </div>
  );
}
