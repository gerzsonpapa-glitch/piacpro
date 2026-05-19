import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { Donation, DonationContribution, SupportOffer } from '../lib/types';
import {
  Heart, CheckCircle2, MapPin, Clock, Target, Users,
  ArrowLeft, Share2, ChevronDown, ChevronUp, Send, Baby,
  PawPrint, Lightbulb, Package, Activity, Zap,
  GraduationCap, Trophy, Church, Leaf, HandHeart,
  Wrench, Shirt, UtensilsCrossed, Armchair, Gamepad2,
  Car, CalendarDays, Scissors, Plus
} from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  gyerek:       { label: 'Gyerekek',           icon: Baby },
  allatvédelem: { label: 'Állatvédelem',        icon: PawPrint },
  raszorulok:   { label: 'Rászorulók',          icon: Users },
  kozossegi:    { label: 'Közösségi',           icon: Lightbulb },
  egeszseg:     { label: 'Egészségügy',         icon: Activity },
  katasztrofa:  { label: 'Katasztrófa-segély',  icon: Zap },
  'oktatás':    { label: 'Oktatás',             icon: GraduationCap },
  sport:        { label: 'Sport',               icon: Trophy },
  vallasi:      { label: 'Vallási',             icon: Church },
  kornyezet:    { label: 'Környezetvédelem',    icon: Leaf },
  ruha:         { label: 'Ruha, cipő',          icon: Shirt },
  elelmiszer:   { label: 'Élelmiszer',          icon: UtensilsCrossed },
  butor:        { label: 'Bútor',               icon: Armchair },
  jatekok:      { label: 'Játékok',             icon: Gamepad2 },
  felszereles:  { label: 'Felszerelés',         icon: Wrench },
  fuvar:        { label: 'Fuvar',               icon: Car },
  rendezvenysegites: { label: 'Rendezvény',     icon: CalendarDays },
  szaksegitseg: { label: 'Szakmai segítség',    icon: Scissors },
  egyeb:        { label: 'Egyéb',               icon: Package },
};

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

function ProgressBar({ current, goal }: { current: number; goal: number }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-rose-400 font-bold">{current.toLocaleString('hu-HU')} Ft összegyűlt</span>
        {goal > 0 && (
          <span className="text-zinc-500">célösszeg: {goal.toLocaleString('hu-HU')} Ft ({Math.round(pct)}%)</span>
        )}
      </div>
    </div>
  );
}

function OfferCard({ offer, onClaim }: { offer: SupportOffer; onClaim: (id: string) => void }) {
  const catInfo = CATEGORY_LABELS[offer.category] ?? CATEGORY_LABELS.egyeb;
  const CatIcon = catInfo.icon;
  const isItem = offer.type === 'item';

  const statusColors: Record<string, string> = {
    active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    claimed:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    fulfilled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    pending:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  const statusLabels: Record<string, string> = {
    active: 'Elérhető', claimed: 'Lefoglalt', fulfilled: 'Teljesített', pending: 'Jóváhagyás alatt',
  };

  return (
    <div className="glass-bubble rounded-2xl p-4 flex items-start gap-3 group transition-all">
      {/* Icon / image */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isItem ? 'bg-teal-500/10' : 'bg-blue-500/10'}`}>
        {offer.images?.[0]
          ? <img src={offer.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
          : isItem
            ? <Package className="w-5 h-5 text-teal-400" />
            : <Wrench className="w-5 h-5 text-blue-400" />
        }
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${isItem ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
            {isItem ? <Package className="w-2.5 h-2.5" /> : <Wrench className="w-2.5 h-2.5" />}
            {isItem ? 'Tárgy' : 'Szolgáltatás'}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${statusColors[offer.status] ?? statusColors.active}`}>
            {statusLabels[offer.status] ?? offer.status}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600 px-1.5 py-0.5 rounded-lg glass-bubble">
            <CatIcon className="w-2.5 h-2.5" />{catInfo.label}
          </span>
        </div>
        <p className="text-sm font-semibold text-zinc-200">{offer.title}</p>
        <p className="text-xs text-zinc-500 line-clamp-2">{offer.description}</p>
        <div className="flex items-center gap-3 text-[11px] text-zinc-600 flex-wrap">
          {offer.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{offer.location}</span>}
          {offer.quantity && <span>{offer.quantity} db</span>}
          {(offer.item_type || offer.service_type) && (
            <span className="text-zinc-500">{offer.item_type || offer.service_type}</span>
          )}
          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{formatRelativeTime(offer.created_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span>Felajánló:</span>
          <span className="text-zinc-400 font-medium">
            {(offer.user as { username?: string; full_name?: string } | undefined)?.full_name
              || (offer.user as { username?: string } | undefined)?.username
              || 'Ismeretlen'}
          </span>
        </div>
      </div>

      {offer.status === 'active' && (
        <button
          onClick={() => onClaim(offer.id)}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 text-xs font-semibold hover:bg-teal-500/25 transition-all whitespace-nowrap"
        >
          Igénylés
        </button>
      )}
    </div>
  );
}

export default function DonationDetailPage() {
  const { params, navigate } = useRouter();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [contributions, setContributions] = useState<DonationContribution[]>([]);
  const [offers, setOffers] = useState<SupportOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllContribs, setShowAllContribs] = useState(false);
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donating, setDonating] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'money' | 'offers'>('money');

  useEffect(() => {
    if (params.id) fetchAll(params.id);
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAll(id: string) {
    const [{ data: don }, { data: contribs }, { data: offerData }] = await Promise.all([
      supabase.from('donations').select('*, creator:profiles(*)').eq('id', id).maybeSingle(),
      supabase.from('donation_contributions')
        .select('*, donor:profiles(username, avatar_url)')
        .eq('donation_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('support_offers')
        .select('*, user:profiles(username, full_name, avatar_url)')
        .eq('donation_id', id)
        .in('status', ['active', 'claimed', 'fulfilled'])
        .order('created_at', { ascending: false }),
    ]);
    setDonation(don as Donation);
    setContributions((contribs || []) as DonationContribution[]);
    setOffers((offerData || []) as SupportOffer[]);
    setLoading(false);
  }

  async function refreshAfterDonate(id: string) {
    const [{ data: don }, { data: contribs }] = await Promise.all([
      supabase.from('donations').select('current_amount').eq('id', id).maybeSingle(),
      supabase.from('donation_contributions')
        .select('*, donor:profiles(username, avatar_url)')
        .eq('donation_id', id).order('created_at', { ascending: false }).limit(50),
    ]);
    if (don) setDonation((prev) => prev ? { ...prev, current_amount: (don as { current_amount: number }).current_amount } : prev);
    setContributions((contribs || []) as DonationContribution[]);
  }

  async function handleDonate() {
    if (!user) { navigate('/login'); return; }
    const finalAmount = customAmount ? parseInt(customAmount) : amount;
    if (!finalAmount || finalAmount < 100) {
      showToast('Minimum 100 Ft az adományozható összeg', 'error'); return;
    }
    setDonating(true);
    const { error } = await supabase.from('donation_contributions').insert({
      donation_id: params.id,
      donor_id: isAnonymous ? null : user.id,
      amount: finalAmount,
      message: message.trim(),
      is_anonymous: isAnonymous,
    });
    if (error) {
      showToast('Hiba történt az adományozás során', 'error');
    } else {
      showToast(`Köszönjük a ${finalAmount.toLocaleString('hu-HU')} Ft-os adományát!`, 'success');
      setMessage(''); setCustomAmount('');
      if (params.id) refreshAfterDonate(params.id);
    }
    setDonating(false);
  }

  async function handleClaim(offerId: string) {
    if (!user) { navigate('/login'); return; }
    const { error } = await supabase.rpc('claim_support_offer', { offer_id: offerId });
    if (error) {
      showToast(error.message || 'Hiba történt', 'error');
    } else {
      showToast('Felajánlást sikeresen igényelted!', 'success');
      setOffers((prev) => prev.map((o) => o.id === offerId ? { ...o, status: 'claimed' } : o));
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="glass-bubble rounded-3xl aspect-video animate-pulse" />
        <div className="h-8 glass-bubble rounded-2xl animate-pulse w-2/3" />
        <div className="h-4 glass-bubble rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="glass rounded-3xl p-16 text-center">
        <Heart className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500">A kampány nem található</p>
        <button onClick={() => navigate('/donations')} className="mt-4 text-rose-400 hover:text-rose-300 text-sm">
          Vissza a kampányokhoz
        </button>
      </div>
    );
  }

  const catInfo = CATEGORY_LABELS[donation.category] ?? CATEGORY_LABELS.egyeb;
  const CatIcon = catInfo.icon;
  const visibleContribs = showAllContribs ? contributions : contributions.slice(0, 5);
  const itemOffers = offers.filter((o) => o.type === 'item');
  const serviceOffers = offers.filter((o) => o.type === 'service');

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Back */}
      <button onClick={() => navigate('/donations')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />Vissza a kampányokhoz
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Main content ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Image gallery */}
          <div className="rounded-3xl overflow-hidden relative aspect-video bg-zinc-900">
            {donation.images?.length ? (
              <>
                {donation.images.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={donation.title}
                    style={{ willChange: 'opacity' }}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${i === currentImage ? 'opacity-100' : 'opacity-0'}`}
                  />
                ))}
                {donation.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {donation.images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImage(i)}
                        className={`h-2 rounded-full transition-all ${i === currentImage ? 'bg-white w-4' : 'w-2 bg-white/40'}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="w-16 h-16 text-zinc-700" />
              </div>
            )}
          </div>

          {/* Title + badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg glass-bubble text-zinc-400">
                <CatIcon className="w-3 h-3" />{catInfo.label}
              </span>
              {donation.is_verified && (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />Hitelesített kampány
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{donation.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              {donation.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{donation.location}</span>}
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatRelativeTime(donation.created_at)}</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{contributions.length} adományozó</span>
              {offers.length > 0 && (
                <span className="flex items-center gap-1.5"><HandHeart className="w-3.5 h-3.5 text-teal-400" /><span className="text-teal-400">{offers.length} felajánlás</span></span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="glass-bubble rounded-2xl p-5">
            <ProgressBar current={donation.current_amount} goal={donation.goal_amount} />
          </div>

          {/* Description */}
          <div className="glass rounded-3xl p-6">
            <h2 className="text-lg font-bold mb-3">A kampányról</h2>
            <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap text-sm">{donation.description}</p>
          </div>

          {/* Creator */}
          {donation.creator && (
            <div className="glass-bubble rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                {donation.creator.avatar_url
                  ? <img src={donation.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-sm">
                      {(donation.creator.username || 'U')[0].toUpperCase()}
                    </div>
                }
              </div>
              <div>
                <p className="text-zinc-300 text-sm font-medium">{donation.creator.full_name || donation.creator.username}</p>
                <p className="text-zinc-600 text-xs">Kampány szervezője</p>
              </div>
              <button onClick={() => navigate(`/profile/${donation.creator_id}`)}
                className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Profil megtekintése
              </button>
            </div>
          )}

          {/* ── Felajánlások szekció ───────────────────────────── */}
          <div className="glass rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <HandHeart className="w-5 h-5 text-teal-400" />
                Felajánlások
                {offers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 text-xs font-bold border border-teal-500/20">
                    {offers.length}
                  </span>
                )}
              </h2>
              <button
                onClick={() => navigate(`/offers/create?donation=${donation.id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-xs font-semibold hover:bg-teal-500/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />Felajánlok
              </button>
            </div>

            {offers.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <HandHeart className="w-10 h-10 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 text-sm">Még nincs felajánlás ehhez a kampányhoz</p>
                <p className="text-zinc-600 text-xs">Felajánlhatsz tárgyakat vagy szolgáltatásokat is — nem csak pénzt!</p>
                <button
                  onClick={() => navigate(`/offers/create?donation=${donation.id}`)}
                  className="mx-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-sm font-semibold hover:bg-teal-500/25 transition-all"
                >
                  <Plus className="w-4 h-4" />Legyek az első felajánló
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tárgy felajánlások */}
                {itemOffers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                      <Package className="w-3 h-3" />Tárgyak ({itemOffers.length})
                    </p>
                    {itemOffers.map((o) => <OfferCard key={o.id} offer={o} onClaim={handleClaim} />)}
                  </div>
                )}

                {/* Szolgáltatás felajánlások */}
                {serviceOffers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                      <Wrench className="w-3 h-3" />Szolgáltatások ({serviceOffers.length})
                    </p>
                    {serviceOffers.map((o) => <OfferCard key={o.id} offer={o} onClaim={handleClaim} />)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contributions list */}
          {contributions.length > 0 && (
            <div className="glass rounded-3xl p-5 space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-400" />
                Pénz adományozók ({contributions.length})
              </h2>
              <div className="space-y-2">
                {visibleContribs.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-300">
                        {c.is_anonymous ? 'Névtelen adományozó' : (c.donor as { username?: string } | undefined)?.username || 'Ismeretlen'}
                      </p>
                      {c.message && <p className="text-xs text-zinc-500 truncate">"{c.message}"</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-rose-400 font-bold text-sm">{c.amount.toLocaleString('hu-HU')} Ft</p>
                      <p className="text-zinc-700 text-[10px]">{formatRelativeTime(c.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {contributions.length > 5 && (
                <button onClick={() => setShowAllContribs(!showAllContribs)}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors py-1">
                  {showAllContribs ? <><ChevronUp className="w-4 h-4" />Kevesebb</> : <><ChevronDown className="w-4 h-4" />Összes megtekintése</>}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Action panel ─────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Tab selector */}
          <div className="glass rounded-2xl p-1.5 flex gap-1">
            <button onClick={() => setActiveTab('money')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'money' ? 'bg-rose-500/20 text-rose-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <Heart className="w-4 h-4" />Pénz adomány
            </button>
            <button onClick={() => setActiveTab('offers')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'offers' ? 'bg-teal-500/20 text-teal-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <HandHeart className="w-4 h-4" />Felajánlok
            </button>
          </div>

          {activeTab === 'money' ? (
            <div className="glass rounded-3xl p-6 space-y-5 sticky top-20">
              <div className="text-center">
                <Target className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Adományozz!</h2>
                <p className="text-zinc-500 text-sm mt-1">Minden összeg számít</p>
              </div>

              {/* Fejlesztés alatt banner */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 flex gap-3 items-start">
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-amber-300 font-semibold text-sm">Adomány rendszer fejlesztés alatt</p>
                  <p className="text-amber-400/70 text-xs mt-1 leading-relaxed">
                    A pénzügyi adományozás hamarosan elérhető lesz. Addig is támogathatsz tárgyakkal vagy szolgáltatásokkal a <span className="text-amber-300 font-medium">Felajánlások</span> fülön!
                  </p>
                </div>
              </div>

              {!user && (
                <p className="text-center text-zinc-600 text-xs">
                  Adományozáshoz{' '}
                  <button onClick={() => navigate('/login')} className="text-rose-400 hover:text-rose-300">be kell jelentkezni</button>
                </p>
              )}

              <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Link másolva!', 'success'); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 glass-pill rounded-xl text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                <Share2 className="w-4 h-4" />Kampány megosztása
              </button>
            </div>
          ) : (
            <div className="glass rounded-3xl p-6 space-y-4 sticky top-20">
              <div className="text-center">
                <HandHeart className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Felajánlok valamit</h2>
                <p className="text-zinc-500 text-sm mt-1">Tárgy vagy szolgáltatás</p>
              </div>

              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>Ingyenes, azonnal megjelenik</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>Nincs admin jóváhagyás szükséges</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>Automatikusan ehhez a kampányhoz kapcsolódik</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/offers/create?donation=${donation.id}`)}
                className="w-full py-3.5 bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold rounded-2xl hover:bg-teal-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />Felajánlás rögzítése
              </button>

              <button
                onClick={() => navigate('/offers/create')}
                className="w-full flex items-center justify-center gap-2 py-2.5 glass-pill rounded-xl text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
              >
                <HandHeart className="w-4 h-4" />Általános felajánlás (kampány nélkül)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
