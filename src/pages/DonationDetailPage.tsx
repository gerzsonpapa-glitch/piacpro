import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { Donation, DonationContribution, SupportOffer } from '../lib/types';
import {
  Heart, CheckCircle2, MapPin, Clock, Target, Users,
  ArrowLeft, Share2, ChevronDown, ChevronUp, Baby,
  PawPrint, Lightbulb, Package, Activity, Zap,
  GraduationCap, Trophy, Church, Leaf, HandHeart,
  Wrench, Shirt, UtensilsCrossed, Armchair, Gamepad2,
  Car, CalendarDays, Scissors, Plus, MessageCircle,
  Settings, Pencil, XCircle, CheckSquare, Trash2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';
import { useSEO } from '../lib/seo';

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

function OfferCard({ offer, onClaim, onContact, onRepost, currentUserId, navigate }: {
  offer: SupportOffer;
  onClaim: (id: string) => void;
  onContact: (userId: string) => void;
  onRepost: (id: string) => void;
  currentUserId?: string;
  navigate: (path: string) => void;
}) {
  const catInfo = CATEGORY_LABELS[offer.category] ?? CATEGORY_LABELS.egyeb;
  const CatIcon = catInfo.icon;
  const isItem = offer.type === 'item';
  const isOwn = !!currentUserId && currentUserId === offer.user_id;
  const isClaimer = !!currentUserId && currentUserId === offer.claimed_by;
  const convId = (offer as any).conversation_id as string | null;

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
          {(offer.item_type || offer.service_type) && <span className="text-zinc-500">{offer.item_type || offer.service_type}</span>}
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

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {/* Active: claim or contact */}
        {offer.status === 'active' && !isOwn && (
          <button onClick={() => onClaim(offer.id)}
            className="px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 text-xs font-semibold hover:bg-teal-500/25 transition-all whitespace-nowrap">
            Igénylés
          </button>
        )}
        {/* Claimer: open chat */}
        {isClaimer && offer.status === 'claimed' && convId && (
          <button onClick={() => navigate(`/messages?conv=${convId}`)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-all whitespace-nowrap flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3" />Chat
          </button>
        )}
        {/* Contact offer creator */}
        {!isOwn && offer.status === 'active' && (
          <button onClick={() => onContact(offer.user_id)}
            className="px-3 py-1.5 rounded-xl bg-zinc-700/50 border border-white/8 text-zinc-400 text-xs font-semibold hover:bg-zinc-700 hover:text-zinc-200 transition-all whitespace-nowrap flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3" />Üzenet
          </button>
        )}
        {/* Owner repost from claimed/fulfilled */}
        {isOwn && (offer.status === 'claimed' || offer.status === 'fulfilled') && (
          <button onClick={() => onRepost(offer.id)}
            className="px-3 py-1.5 rounded-xl bg-zinc-500/15 border border-zinc-500/25 text-zinc-400 text-xs font-semibold hover:bg-zinc-500/25 transition-all whitespace-nowrap flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" />Újraposzt
          </button>
        )}
        {isOwn && offer.status === 'active' && (
          <span className="px-3 py-1.5 rounded-xl bg-white/4 border border-white/8 text-zinc-600 text-xs whitespace-nowrap text-center">
            Saját
          </span>
        )}
      </div>
    </div>
  );
}

export default function DonationDetailPage() {
  const { params, navigate } = useRouter();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [donation, setDonation] = useState<Donation | null>(null);

  useSEO({
    title: donation ? donation.title : 'Adománygyűjtő kampány',
    description: donation
      ? `${donation.title}${donation.description ? ' – ' + donation.description.slice(0, 120) : ''} | Segíts te is! PiacPro Adományok`
      : undefined,
    image: donation?.images?.[0] ?? undefined,
    path: `/donations/${params.id}`,
    type: 'article',
  });
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
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        .select('*, claimer:profiles!support_offers_claimed_by_fkey(username, full_name, avatar_url)')
        .eq('donation_id', id)
        .in('status', ['active', 'claimed', 'fulfilled'])
        .order('created_at', { ascending: false }),
    ]);
    setDonation(don as Donation);
    setContributions((contribs || []) as DonationContribution[]);

    // Enrich offers with user profiles (user_id FK points to auth.users, not profiles)
    const rawOffers = offerData || [];
    if (rawOffers.length > 0) {
      const userIds = [...new Set(rawOffers.map((o: any) => o.user_id).filter(Boolean))];
      const { data: userProfiles } = await supabase
        .from('profiles').select('id, username, full_name, avatar_url').in('id', userIds);
      const profileMap = Object.fromEntries((userProfiles || []).map((p: any) => [p.id, p]));
      setOffers(rawOffers.map((o: any) => ({ ...o, user: profileMap[o.user_id] ?? null })) as SupportOffer[]);
    } else {
      setOffers([]);
    }
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
      showToast('error', 'Minimum 100 Ft az adományozható összeg'); return;
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
      showToast('error', 'Hiba történt az adományozás során');
    } else {
      showToast('success', `Köszönjük a ${finalAmount.toLocaleString('hu-HU')} Ft-os adományát!`);
      setMessage(''); setCustomAmount('');
      if (params.id) refreshAfterDonate(params.id);
    }
    setDonating(false);
  }

  async function handleContact(targetUserId: string) {
    if (!user) { navigate('/login'); return; }
    if (!targetUserId) { showToast('error', 'A felhasználó nem azonosítható'); return; }
    if (targetUserId === user.id) { showToast('error', 'Saját felajánlásodra nem tudsz üzenni'); return; }
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(buyer_id.eq.${user.id},seller_id.eq.${targetUserId}),and(buyer_id.eq.${targetUserId},seller_id.eq.${user.id})`)
      .is('listing_id', null)
      .maybeSingle();
    let convId = existing?.id ?? null;
    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: targetUserId, listing_id: null })
        .select('id')
        .single();
      convId = newConv?.id ?? null;
    }
    if (convId) navigate(`/messages?conv=${convId}`);
    else showToast('error', 'Nem sikerült megnyitni a beszélgetést');
  }

  async function handleClaim(offerId: string) {
    if (!user) { navigate('/login'); return; }
    const { data: convId, error } = await supabase.rpc('claim_support_offer', { offer_id: offerId });
    if (error) {
      showToast('error', 'Hiba', error.message);
    } else {
      showToast('success', 'Sikeresen igényelted a felajánlást!');
      setOffers((prev) => prev.map((o) => o.id === offerId ? { ...o, status: 'claimed', claimed_by: user.id } : o));
      if (convId) setTimeout(() => navigate(`/messages?conv=${convId}`), 800);
    }
  }

  async function handleRepostOffer(offerId: string) {
    setActionLoading('repost-' + offerId);
    const { error } = await supabase.rpc('repost_support_offer', { offer_id: offerId });
    if (error) showToast('error', 'Hiba', error.message);
    else {
      showToast('success', 'Felajánlás visszaposztolva — újra aktív!');
      setOffers((prev) => prev.map((o) => o.id === offerId ? { ...o, status: 'active', claimed_by: null, claimed_at: null } : o));
    }
    setActionLoading(null);
  }

  async function handleFulfillOffer(offerId: string) {
    setActionLoading(offerId);
    const { error } = await supabase.rpc('fulfill_support_offer', { offer_id: offerId });
    if (error) {
      showToast('error', 'Hiba', error.message);
    } else {
      showToast('success', 'Felajánlás teljesítettnek jelölve');
      setOffers((prev) => prev.map((o) => o.id === offerId ? { ...o, status: 'fulfilled' } : o));
    }
    setActionLoading(null);
  }

  async function handleDeleteOffer(offerId: string) {
    setActionLoading('del-' + offerId);
    const { error } = await supabase.from('support_offers').delete().eq('id', offerId);
    if (error) {
      showToast('error', 'Nem sikerült törölni');
    } else {
      showToast('success', 'Felajánlás törölve');
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    }
    setActionLoading(null);
  }

  async function handleCloseCampaign() {
    if (!donation) return;
    setActionLoading('close');
    const { error } = await supabase.from('donations').update({ status: 'ended' }).eq('id', donation.id);
    if (error) {
      showToast('error', 'Hiba történt a kampány lezárásakor');
    } else {
      showToast('success', 'Kampány lezárva');
      setDonation((prev) => prev ? { ...prev, status: 'ended' } : prev);
      setConfirmClose(false);
    }
    setActionLoading(null);
  }

  async function handleDeleteCampaign() {
    if (!donation) return;
    setActionLoading('delcamp');
    const { error } = await supabase.from('donations').delete().eq('id', donation.id);
    if (error) {
      showToast('error', 'Nem sikerült törölni a kampányt');
    } else {
      showToast('success', 'Kampány törölve');
      navigate('/donations');
    }
    setActionLoading(null);
  }

  async function handleContactDonor(donorId: string) {
    if (!user) { navigate('/login'); return; }
    if (!donorId) { showToast('error', 'A felhasználó nem azonosítható'); return; }
    if (donorId === user.id) { showToast('error', 'Saját magadnak nem tudsz üzenni'); return; }
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(buyer_id.eq.${user.id},seller_id.eq.${donorId}),and(buyer_id.eq.${donorId},seller_id.eq.${user.id})`)
      .is('listing_id', null)
      .maybeSingle();
    let convId = existing?.id ?? null;
    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: donorId, listing_id: null })
        .select('id')
        .single();
      convId = newConv?.id ?? null;
    }
    if (convId) navigate(`/messages?conv=${convId}`);
    else showToast('error', 'Nem sikerült megnyitni a beszélgetést');
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
  const isOwner = !!user && user.id === donation.creator_id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Back + owner controls */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/donations')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Vissza a kampányokhoz
        </button>
        {isOwner && (
          <button
            onClick={() => setShowOwnerPanel(!showOwnerPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${showOwnerPanel ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'glass-bubble border-white/8 text-zinc-400 hover:text-zinc-200'}`}
          >
            <Settings className="w-3.5 h-3.5" />Kezelés
          </button>
        )}
      </div>

      {/* Owner management panel */}
      {isOwner && showOwnerPanel && (
        <div className="glass rounded-3xl p-5 border border-amber-500/20 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-amber-300 text-sm">Kampánykezelő</h3>
              <p className="text-zinc-500 text-xs">Csak te látod ezt a panelt</p>
            </div>
            <div className="ml-auto">
              {donation.status === 'active' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Aktív kampány</span>
              )}
              {donation.status === 'ended' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/20">Lezárt kampány</span>
              )}
            </div>
          </div>

          {/* Felajánlások kezelése */}
          {offers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Felajánlások kezelése</p>
              <div className="space-y-2">
                {offers.map((o) => {
                  const isItem = o.type === 'item';
                  const offererName = (o.user as { full_name?: string; username?: string } | undefined)?.full_name
                    || (o.user as { username?: string } | undefined)?.username
                    || 'Ismeretlen';
                  return (
                    <div key={o.id} className="glass-bubble rounded-2xl p-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isItem ? 'bg-teal-500/10' : 'bg-blue-500/10'}`}>
                        {isItem ? <Package className="w-4 h-4 text-teal-400" /> : <Wrench className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 truncate">{o.title}</p>
                        <p className="text-xs text-zinc-500">{offererName} · {o.status === 'active' ? 'Elérhető' : o.status === 'claimed' ? 'Lefoglalt' : o.status === 'fulfilled' ? 'Teljesített' : o.status}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {o.user_id !== user?.id && (
                          <button
                            onClick={() => handleContact(o.user_id)}
                            title="Üzenet a felajánlónak"
                            className="p-1.5 rounded-lg glass-bubble hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Chat with claimer if claimed */}
                        {o.status === 'claimed' && (o as any).conversation_id && (
                          <button
                            onClick={() => navigate(`/messages?conv=${(o as any).conversation_id}`)}
                            title="Chat az igénylővel"
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {o.status !== 'fulfilled' && (
                          <button
                            onClick={() => handleFulfillOffer(o.id)}
                            disabled={actionLoading === o.id}
                            title="Teljesítettnek jelöl"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-400 transition-all disabled:opacity-50"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Repost button for claimed or fulfilled */}
                        {(o.status === 'claimed' || o.status === 'fulfilled') && o.user_id === user?.id && (
                          <button
                            onClick={() => handleRepostOffer(o.id)}
                            disabled={actionLoading === 'repost-' + o.id}
                            title="Visszaposztolás — újra aktív"
                            className="p-1.5 rounded-lg bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 hover:text-zinc-300 transition-all disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOffer(o.id)}
                          disabled={actionLoading === 'del-' + o.id}
                          title="Felajánlás törlése"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adományozók */}
          {contributions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Adományozók ({contributions.length})</p>
              <div className="space-y-2">
                {contributions.slice(0, 10).map((c) => {
                  const donorName = c.is_anonymous ? 'Névtelen' : (c.donor as { username?: string } | undefined)?.username || 'Ismeretlen';
                  const donorId = c.donor_id;
                  return (
                    <div key={c.id} className="glass-bubble rounded-xl px-3 py-2.5 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-300">{donorName}</p>
                        {c.message && <p className="text-[11px] text-zinc-600 truncate">"{c.message}"</p>}
                      </div>
                      <span className="text-rose-400 font-bold text-xs flex-shrink-0">{c.amount.toLocaleString('hu-HU')} Ft</span>
                      {!c.is_anonymous && donorId && (
                        <button
                          onClick={() => handleContactDonor(donorId)}
                          title="Köszönet üzenet küldése"
                          className="p-1.5 rounded-lg glass-bubble hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all flex-shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kampány szerkesztése / lezárása */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Kampány műveletek</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/donations/edit/${donation.id}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold glass-bubble border border-white/8 text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />Kampány szerkesztése
              </button>
              {donation.status === 'active' && (
                <>
                  {!confirmClose ? (
                    <button
                      onClick={() => setConfirmClose(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />Kampány lezárása
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-xs text-amber-300">Biztosan lezárod?</span>
                      <button
                        onClick={handleCloseCampaign}
                        disabled={actionLoading === 'close'}
                        className="text-xs font-bold text-amber-300 hover:text-amber-200 disabled:opacity-50"
                      >
                        Igen
                      </button>
                      <button onClick={() => setConfirmClose(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Mégse</button>
                    </div>
                  )}
                </>
              )}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />Kampány törlése
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-300">Visszavonhatatlan! Biztosan törlöd?</span>
                  <button
                    onClick={handleDeleteCampaign}
                    disabled={actionLoading === 'delcamp'}
                    className="text-xs font-bold text-red-300 hover:text-red-200 disabled:opacity-50"
                  >
                    Törlés
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Mégse</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                    {itemOffers.map((o) => <OfferCard key={o.id} offer={o} onClaim={handleClaim} onContact={handleContact} onRepost={handleRepostOffer} currentUserId={user?.id} navigate={navigate} />)}
                  </div>
                )}

                {/* Szolgáltatás felajánlások */}
                {serviceOffers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                      <Wrench className="w-3 h-3" />Szolgáltatások ({serviceOffers.length})
                    </p>
                    {serviceOffers.map((o) => <OfferCard key={o.id} offer={o} onClaim={handleClaim} onContact={handleContact} onRepost={handleRepostOffer} currentUserId={user?.id} navigate={navigate} />)}
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

              <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('success', 'Link másolva!'); }}
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
