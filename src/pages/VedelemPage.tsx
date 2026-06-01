import { useState } from 'react';
import { Shield, TrendingUp, Baby, Briefcase, Home, Percent, Building2, Lock, Heart, ArrowRight, ExternalLink, PhoneCall, Mail, ChevronRight, Car, Globe, Users, SendHorizontal as SendHorizonal, CheckCircle2, MessageSquare } from 'lucide-react';
import { useSEO, SEO_PAGES } from '../lib/seo';

// ── config: per-category links ────────────────────────────────────────────────
export const DEFENSE_LINKS = {
  nyugdij:               'https://azennyugdijam.hu/?t=akom.laszlo',
  gyermek:               'https://csaladipenzugyek.hu/?t=akom.laszlo',
  vagyon:                'https://csaladipenzugyek.hu/?t=akom.laszlo',
  hitel:                 'https://csaladipenzugyek.hu/?t=akom.laszlo',
  ado:                   'https://csaladipenzugyek.hu/?t=akom.laszlo',
  kkv:                   'https://me.ovb.hu/akom.laszlo/',
  vagyonvedelem:         'https://me.ovb.hu/akom.laszlo/',
  elethelyzet:           'https://me.ovb.hu/akom.laszlo/',
  gepjarmu_kgfb:         'https://ovbportal.hu/ovbphp/public/onlineKotesKGFB.php?hash=akom.laszlo',
  gepjarmu_asszisztencia:'https://ovbportal.hu/ovbphp/public/onlineKotesAsszisztencia.php?hash=akom.laszlo',
  utasbiztositas:        'https://ovbportal.hu/ovbphp/public/onlineKotesUtasbiztositas.php?hash=akom.laszlo',
  csatlakozas:           'https://ovbportal.hu/ovbphp/public/mtmenedzsment/felveteliKezeles.php?mthash=akom.laszlo',
  default:               'https://me.ovb.hu/akom.laszlo/',
} as const;

export type DefenseKey = keyof typeof DEFENSE_LINKS;

interface Category {
  key: DefenseKey;
  icon: React.ElementType;
  label: string;
  short: string;
  bullets: string[];
  color: string;
  accent: string;
}

const CATEGORIES: Category[] = [
  {
    key: 'nyugdij', icon: TrendingUp,
    label: 'Nyugdíj-előtakarékosság',
    short: 'Hosszú távú megtakarítás, jövőbiztonság tervezés.',
    bullets: ['Hosszú távú megtakarítás', 'Nyugdíj kiegészítés', 'Jövőbiztonság', 'Adókedvezmény lehetőség'],
    color: 'text-emerald-400', accent: 'bg-emerald-500/20 border-emerald-500/30',
  },
  {
    key: 'gyermek', icon: Baby,
    label: 'Gyermekjövő',
    short: 'Gyermek megtakarítás, tanulmány, induló tőke.',
    bullets: ['Gyermek megtakarítás', 'Tanulmányi célok', 'Induló tőke', 'Családi pénzügyi tervezés'],
    color: 'text-sky-400', accent: 'bg-sky-500/20 border-sky-500/30',
  },
  {
    key: 'vagyon', icon: TrendingUp,
    label: 'Vagyon felépítése',
    short: 'Befektetési jellegű pénzügyi tervezés.',
    bullets: ['Megtakarítási lehetőségek', 'Hosszú távú vagyonépítés', 'Pénzügyi stabilitás', 'Tudatos tervezés'],
    color: 'text-teal-400', accent: 'bg-teal-500/20 border-teal-500/30',
  },
  {
    key: 'hitel', icon: Home,
    label: 'Hiteltermékek & állami támogatások',
    short: 'CSOK, lakáshitel, hitelkiváltás.',
    bullets: ['Lakáshitel', 'CSOK / állami támogatások', 'Hitelkiváltás', 'Családi pénzügyi megoldások'],
    color: 'text-amber-400', accent: 'bg-amber-500/20 border-amber-500/30',
  },
  {
    key: 'ado', icon: Percent,
    label: 'Adókedvezmények & visszatérítések',
    short: 'Adóoptimalizálás, megtakarítási előnyök.',
    bullets: ['Adóvisszatérítés', 'Pénzügyi optimalizálás', 'Megtakarítás növelése'],
    color: 'text-orange-400', accent: 'bg-orange-500/20 border-orange-500/30',
  },
  {
    key: 'kkv', icon: Building2,
    label: 'KKV megoldások',
    short: 'Vállalkozói biztosítás, cégvédelem.',
    bullets: ['Vállalkozásvédelem', 'Cégbiztosítás', 'Üzleti kockázatkezelés', 'Stabil működés'],
    color: 'text-blue-400', accent: 'bg-blue-500/20 border-blue-500/30',
  },
  {
    key: 'vagyonvedelem', icon: Lock,
    label: 'Vagyonvédelem',
    short: 'Lakás, ingatlan és értékek biztosítása.',
    bullets: ['Lakásbiztosítás', 'Ingatlanvédelem', 'Értékvédelem', 'Kockázatcsökkentés'],
    color: 'text-violet-400', accent: 'bg-violet-500/20 border-violet-500/30',
  },
  {
    key: 'elethelyzet', icon: Heart,
    label: 'Biztonság bármely élethelyzetben',
    short: 'Életbiztosítás, családvédelem.',
    bullets: ['Életbiztosítás', 'Családi védelem', 'Váratlan helyzetek kezelése', 'Pénzügyi biztonsági háló'],
    color: 'text-rose-400', accent: 'bg-rose-500/20 border-rose-500/30',
  },
  {
    key: 'gepjarmu_kgfb', icon: Car,
    label: 'Online gépjármű biztosítás',
    short: 'Gyors KGFB kötés online.',
    bullets: ['KGFB kötés', 'Gyors online ügyintézés', 'Járművédelem'],
    color: 'text-cyan-400', accent: 'bg-cyan-500/20 border-cyan-500/30',
  },
  {
    key: 'gepjarmu_asszisztencia', icon: Car,
    label: 'Online gépjármű asszisztencia',
    short: 'Út közbeni segítség, műszaki asszisztencia.',
    bullets: ['Út közbeni segítség', 'Baleseti támogatás', 'Műszaki asszisztencia'],
    color: 'text-indigo-400', accent: 'bg-indigo-500/20 border-indigo-500/30',
  },
  {
    key: 'utasbiztositas', icon: Globe,
    label: 'Online utasbiztosítás',
    short: 'Utazási védelem belföldön és külföldön.',
    bullets: ['Utazási védelem', 'Külföldi biztosítás', 'Egészség és poggyász védelem'],
    color: 'text-teal-300', accent: 'bg-teal-500/20 border-teal-500/30',
  },
  {
    key: 'csatlakozas', icon: Users,
    label: 'Csatlakozzon tanácsadóként',
    short: 'Pénzügyi karrierlehetőség OVB-nél.',
    bullets: ['Pénzügyi karrier', 'Tanácsadói rendszer', 'Csapatépítés', 'Csatlakozási lehetőség'],
    color: 'text-zinc-300', accent: 'bg-zinc-500/20 border-zinc-500/30',
  },
];

const SITUATIONS: { label: string; key: DefenseKey }[] = [
  { label: 'Lakást vennék', key: 'hitel' },
  { label: 'Gyerekem született', key: 'gyermek' },
  { label: 'Nyugdíjra takarékoskodnék', key: 'nyugdij' },
  { label: 'Biztonság kell a családnak', key: 'elethelyzet' },
  { label: 'Hitel érdekel', key: 'hitel' },
  { label: 'Vállalkozást indítok', key: 'kkv' },
];

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    // Build a mailto link and open it — no backend needed
    const subject = encodeURIComponent(`Kérdés a Védelem oldalról — ${name}`);
    const body = encodeURIComponent(
      `Névtől: ${name}\nEmail: ${email}\nTelefon: ${phone}\n\nKérdés:\n${message}`
    );
    window.location.href = `mailto:akom.laszlo@ovb.hu?subject=${subject}&body=${body}`;
    setTimeout(() => { setSending(false); setSent(true); }, 600);
  }

  if (sent) {
    return (
      <div className="rounded-3xl p-10 text-center" style={{ background: '#0f1a14', border: '1px solid rgba(52,211,153,0.2)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: '#34d399' }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#f1f5f9' }}>Köszönjük a kérdést!</h3>
        <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: '#64748b' }}>
          Az üzenetküldő alkalmazásod megnyílt. Ákom László Zsolt hamarosan felveszi Önnel a kapcsolatot.
        </p>
        <button onClick={() => { setSent(false); setName(''); setEmail(''); setPhone(''); setMessage(''); }}
          className="mt-6 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: '#34d399' }}>
          Új kérdés feltevése
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #34d399 40%, #10b981 60%, transparent)' }} />
      <div className="p-7 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>Teljes neve *</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Pl. Kovács János" required
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>Email cím</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@pelda.hu"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>Telefonszám</label>
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+36 30 000 0000"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>Kérdése / Üzenete *</label>
          <textarea
            value={message} onChange={(e) => setMessage(e.target.value)}
            rows={4} required
            placeholder="Pl. Érdeklődni szeretnék a nyugdíj-előtakarékossági lehetőségekről..."
            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all resize-none leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
            Az üzenet az Ön e-mail kliensén keresztül kerül elküldésre közvetlenül Ákom László Zsolt OVB fiókvezető részére.
          </p>
          <button
            type="submit" disabled={sending || !name.trim() || !message.trim()}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#10b981', color: '#fff', boxShadow: '0 4px 20px rgba(16,185,129,0.25)' }}>
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SendHorizonal className="w-4 h-4" />
            )}
            {sending ? 'Megnyitás...' : 'Kérdés elküldése'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function VedelemPage() {
  useSEO(SEO_PAGES.vedelem);
  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* ── HERO + PARTNER — UNIFIED BLOCK ───────────────────────────── */}
      <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1a14 0%, #0a1210 50%, #0d1a16 100%)', border: '1px solid rgba(52,211,153,0.15)' }}>

        {/* Top accent line */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, #34d399 40%, #10b981 60%, transparent)' }} />

        <div className="flex flex-col lg:flex-row items-stretch">

          {/* ── LEFT: photo ── */}
          <div className="lg:w-64 xl:w-72 flex-shrink-0 flex items-end justify-center"
            style={{ background: 'linear-gradient(160deg, rgba(52,211,153,0.06) 0%, transparent 70%)' }}>
            <img
              src="/profile_picture_720.webp"
              alt="Ákom László Zsolt OVB fiókvezető"
              width={240}
              height={320}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              className="w-52 lg:w-full max-w-[240px] lg:max-w-none object-contain object-bottom mt-6 lg:mt-0"
              style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))' }}
            />
          </div>

          {/* ── RIGHT: text + contact ── */}
          <div className="flex-1 px-5 sm:px-8 py-7 sm:py-10 flex flex-col justify-center gap-5 sm:gap-7">

            {/* Badge */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
                <Shield className="w-3.5 h-3.5" />
                Pénzügyi Védelem Központ
              </div>

              {/* Hero headline */}
              <h1 className="text-2xl sm:text-4xl font-bold leading-tight mb-2" style={{ color: '#f1f5f9' }}>
                Védd meg azt,<br />
                <span style={{ color: '#34d399' }}>ami igazán fontos</span>
              </h1>
              <p className="text-sm leading-relaxed max-w-md" style={{ color: '#94a3b8' }}>
                Család, otthon, jövő és pénzügyi biztonság — személyes segítség az élethelyzeted alapján.
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* Partner info */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#34d399' }}>
                Hivatalos pénzügyi partner
              </p>
              <h2 className="text-2xl font-bold mb-0.5" style={{ color: '#f1f5f9' }}>Ákom László Zsolt</h2>
              <p className="text-sm font-semibold mb-3" style={{ color: '#64d2b0' }}>Fiókvezető · OVB</p>
              <p className="text-sm leading-relaxed max-w-md" style={{ color: '#94a3b8' }}>
                Személyes, élethelyzet-alapú pénzügyi és biztosítási tanácsadás.
                Egy ember, egy megoldás — minden élethelyzetben.
              </p>
            </div>

            {/* Contact chips */}
            <div className="flex flex-wrap gap-3">
              <a href="tel:+36206135808"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#d1fae5' }}>
                <PhoneCall className="w-4 h-4" style={{ color: '#34d399' }} />
                <span className="text-sm font-semibold">+36 20 613 5808</span>
              </a>
              <a href="mailto:akom.laszlo@ovb.hu"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#e0f2fe' }}>
                <Mail className="w-4 h-4" style={{ color: '#38bdf8' }} />
                <span className="text-sm font-semibold">akom.laszlo@ovb.hu</span>
              </a>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <a href={DEFENSE_LINKS.default} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02]"
                style={{ background: '#10b981', color: '#fff', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
                OVB profil megtekintése
                <ExternalLink className="w-4 h-4" />
              </a>
              <a href={DEFENSE_LINKS.default} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }}>
                <Briefcase className="w-4 h-4" style={{ color: '#34d399' }} />
                Szakértői segítség
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIFE-SITUATION WIZARD ─────────────────────────────────────── */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Miben segíthetünk?</h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Válaszd ki az élethelyzeted — azonnal a megfelelő szakértőhöz kerülsz</p>
        </div>
        <div className="flex flex-wrap gap-2.5 justify-center">
          {SITUATIONS.map((s) => (
            <a key={s.label} href={DEFENSE_LINKS[s.key]} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] group"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
              {s.label}
              <ChevronRight className="w-3.5 h-3.5 transition-colors" style={{ color: '#475569' }} />
            </a>
          ))}
        </div>
      </div>

      {/* ── CATEGORY GRID ─────────────────────────────────────────────── */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Pénzügyi megoldások</h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Minden kategóriában személyes, szakértői segítség vár</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.key}
                className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:translate-y-[-2px]"
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}>

                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cat.accent}`}>
                    <Icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: '#f1f5f9' }}>{cat.label}</h3>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>{cat.short}</p>
                  </div>
                </div>

                <ul className="space-y-1 pl-1">
                  {cat.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.color.replace('text-', 'bg-')}`} />
                      {b}
                    </li>
                  ))}
                </ul>

                <a href={DEFENSE_LINKS[cat.key]} target="_blank" rel="noopener noreferrer"
                  className={`mt-auto flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-70 ${cat.color}`}>
                  Tovább
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── QUESTION / CONTACT FORM ───────────────────────────────────── */}
      <div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
            <MessageSquare className="w-3.5 h-3.5" />
            Kérdése van?
          </div>
          <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Írjon közvetlenül Ákom László Zsoltnak</h2>
          <p className="text-sm mt-1 max-w-lg mx-auto" style={{ color: '#64748b' }}>
            Nincs kötelezettség, nincs nyomás — csak egy szakértői válasz az Ön helyzetére.
          </p>
        </div>
        <ContactForm />
      </div>

      {/* ── DISCLAIMER ────────────────────────────────────────────────── */}
      <p className="text-center text-xs pb-4" style={{ color: '#374151' }}>
        A Védelem modul nem reklámfelület, nem biztosítói piactér és nem összehasonlító oldal.
        Kizárólag egyetlen partnerre — Ákom László Zsolt OVB fiókvezető — irányít, minden út egy helyre vezet.
      </p>
    </div>
  );
}
