import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { SupportOffer, Donation } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';
import Avatar from '../components/Avatar';
import {
  ArrowLeft, Package, Wrench, MapPin, Clock, Users, CheckCircle2,
  MessageCircle, Trash2, ChevronLeft, ChevronRight, HandHeart,
  ExternalLink, AlertCircle, Settings, X, Check, RefreshCw,
  AlertTriangle, Info
} from 'lucide-react';

export default function OfferDetailPage() {
  const { params, navigate } = useRouter();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [offer, setOffer] = useState<SupportOffer | null>(null);
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIdx, setImageIdx] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRepost, setConfirmRepost] = useState(false);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);

  useEffect(() => {
    if (params.id) fetchOffer(params.id);
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchOffer(id: string) {
    setLoading(true);
    const { data } = await supabase
      .from('support_offers')
      .select('*, user:profiles(*), claimer:profiles!support_offers_claimed_by_fkey(*)')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      setOffer(data as SupportOffer);
      if (data.donation_id) {
        const { data: don } = await supabase
          .from('donations')
          .select('id, title, images, location, status')
          .eq('id', data.donation_id)
          .maybeSingle();
        if (don) setDonation(don as Donation);
      }
    }
    setLoading(false);
  }

  // Open or create a conversation with the offer owner
  async function openConversation(withUserId: string): Promise<string | null> {
    if (!user) { navigate('/login'); return null; }
    const { data: existing } = await supabase
      .from('conversations').select('id')
      .or(`and(buyer_id.eq.${user.id},seller_id.eq.${withUserId}),and(buyer_id.eq.${withUserId},seller_id.eq.${user.id})`)
      .is('listing_id', null).maybeSingle();
    if (existing?.id) return existing.id;
    const { data: newConv } = await supabase
      .from('conversations').insert({ buyer_id: user.id, seller_id: withUserId, listing_id: null })
      .select('id').single();
    return newConv?.id ?? null;
  }

  async function handleContact() {
    if (!user) { navigate('/login'); return; }
    if (!offer) return;
    if (offer.user_id === user.id) { showToast('error', 'Saját felajánlásodra nem tudsz üzenni'); return; }
    const convId = await openConversation(offer.user_id);
    if (convId) navigate(`/messages?conv=${convId}`);
    else showToast('error', 'Nem sikerült megnyitni a beszélgetést');
  }

  async function handleOpenClaimChat() {
    if (!offer) return;
    // The conversation_id is stored on the offer after claim
    const convId = (offer as any).conversation_id;
    if (convId) {
      navigate(`/messages?conv=${convId}`);
    } else {
      // Fallback: open conversation with owner
      const id = await openConversation(offer.user_id);
      if (id) navigate(`/messages?conv=${id}`);
    }
  }

  // Claim the offer — RPC now returns conversation_id
  async function handleClaim() {
    if (!user) { navigate('/login'); return; }
    if (!offer) return;
    setActionLoading('claim');
    const { data: convId, error } = await supabase.rpc('claim_support_offer', { offer_id: offer.id });
    if (error) {
      showToast('error', 'Hiba az igénylésnél', error.message);
    } else {
      showToast('success', 'Sikeresen igényelted a felajánlást!');
      await fetchOffer(offer.id);
      // Auto-open chat with the owner
      if (convId) {
        setTimeout(() => navigate(`/messages?conv=${convId}`), 800);
      }
    }
    setActionLoading(null);
  }

  // Owner marks the offer as fulfilled (= handover accepted)
  async function handleFulfill() {
    if (!offer) return;
    setActionLoading('fulfill');
    const { error } = await supabase.rpc('fulfill_support_offer', { offer_id: offer.id });
    if (error) showToast('error', 'Hiba', error.message);
    else { showToast('success', 'Felajánlás teljesítettnek jelölve'); fetchOffer(offer.id); }
    setActionLoading(null);
  }

  // Owner reposts the offer (= rejects claimer, resets to active)
  async function handleRepost() {
    if (!offer) return;
    setActionLoading('repost');
    const { error } = await supabase.rpc('repost_support_offer', { offer_id: offer.id });
    if (error) showToast('error', 'Hiba', error.message);
    else {
      showToast('success', 'Felajánlás visszaposztolva — újra aktív!');
      setConfirmRepost(false);
      fetchOffer(offer.id);
    }
    setActionLoading(null);
  }

  async function handleDelete() {
    if (!offer) return;
    setActionLoading('delete');
    const { error } = await supabase.from('support_offers').delete().eq('id', offer.id);
    if (error) { showToast('error', 'Nem sikerült törölni'); setActionLoading(null); }
    else { showToast('success', 'Felajánlás törölve'); navigate('/donations'); }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 animate-pulse">
        <div className="h-10 glass rounded-xl w-1/3" />
        <div className="aspect-video glass rounded-3xl" />
        <div className="glass rounded-3xl p-6 space-y-3">
          <div className="h-6 bg-white/5 rounded w-2/3" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400">Felajánlás nem található</p>
        <button onClick={() => navigate('/donations')} className="mt-4 px-4 py-2 glass-pill rounded-xl text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
          Vissza
        </button>
      </div>
    );
  }

  const isOwner = !!user && user.id === offer.user_id;
  const isClaimer = !!user && user.id === offer.claimed_by;
  const isItem = offer.type === 'item';
  const images = offer.images || [];
  const hasImages = images.length > 0;
  const convId = (offer as any).conversation_id as string | null;

  const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
    active:    { label: 'Aktív',       color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/20' },
    claimed:   { label: 'Igényelt',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
    fulfilled: { label: 'Teljesített', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  };
  const st = statusMeta[offer.status] ?? statusMeta.active;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Back + owner toggle */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/donations')}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />Vissza a felajánlásokhoz
        </button>
        {isOwner && (
          <button
            onClick={() => setShowOwnerPanel(!showOwnerPanel)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${showOwnerPanel ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'glass-bubble border-white/8 text-zinc-400 hover:text-zinc-200'}`}
          >
            <Settings className="w-3.5 h-3.5" />Kezelés
          </button>
        )}
      </div>

      {/* ── Owner management panel ─────────────────────────────────── */}
      {isOwner && showOwnerPanel && (
        <div className="glass rounded-2xl p-5 border border-amber-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <Settings className="w-4 h-4" />Felajánlás kezelése
            </p>
            <button onClick={() => setShowOwnerPanel(false)} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Claimed state — show who claimed + options */}
          {offer.status === 'claimed' && offer.claimer && (
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar src={offer.claimer.avatar_url} name={offer.claimer.full_name || offer.claimer.username} size="sm" rounded="full" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500">Igénylő felhasználó</p>
                  <p className="text-sm font-semibold text-zinc-200">{offer.claimer.full_name || offer.claimer.username}</p>
                  {offer.claimed_at && <p className="text-[10px] text-zinc-600">{formatRelativeTime(offer.claimed_at)}</p>}
                </div>
                {convId && (
                  <button
                    onClick={() => navigate(`/messages?conv=${convId}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-700/50 border border-white/8 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />Chat
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-white/8">
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Átadtad a felajánlást? Jelöld teljesítettnek. Ha mégsem adod oda, posztold újra.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleFulfill}
                    disabled={actionLoading === 'fulfill'}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {actionLoading === 'fulfill' ? 'Jelölés...' : 'Átadtam — teljesítve'}
                  </button>
                  {!confirmRepost ? (
                    <button
                      onClick={() => setConfirmRepost(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-500/15 border border-zinc-500/25 text-zinc-400 text-xs font-semibold hover:bg-zinc-500/25 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />Nem adom oda — újraposztolás
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-500/15 border border-zinc-500/25">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-xs text-zinc-300">Az igénylő értesítés nélkül kerül le. Biztosan?</span>
                      <button
                        onClick={handleRepost}
                        disabled={actionLoading === 'repost'}
                        className="text-xs font-bold text-teal-400 hover:text-teal-300 disabled:opacity-50"
                      >
                        {actionLoading === 'repost' ? 'Visszaállít...' : 'Igen'}
                      </button>
                      <button onClick={() => setConfirmRepost(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Mégse</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active state controls */}
          {offer.status === 'active' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleFulfill}
                disabled={actionLoading === 'fulfill'}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {actionLoading === 'fulfill' ? 'Jelölés...' : 'Teljesítettnek jelöl'}
              </button>
            </div>
          )}

          {/* Fulfilled state — repost option */}
          {offer.status === 'fulfilled' && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Ha szeretnéd ismét elérhetővé tenni ezt a felajánlást:
              </p>
              {!confirmRepost ? (
                <button
                  onClick={() => setConfirmRepost(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-xs font-semibold hover:bg-teal-500/25 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />Újraposztolás
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <span className="text-xs text-zinc-300">Visszaállítod aktívra?</span>
                  <button
                    onClick={handleRepost}
                    disabled={actionLoading === 'repost'}
                    className="text-xs font-bold text-teal-400 hover:text-teal-300 disabled:opacity-50"
                  >
                    {actionLoading === 'repost' ? 'Visszaállít...' : 'Igen'}
                  </button>
                  <button onClick={() => setConfirmRepost(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Mégse</button>
                </div>
              )}
            </div>
          )}

          {/* Delete */}
          <div className="pt-2 border-t border-white/5">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />Törlés
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/25">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-300">Biztosan törlöd?</span>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === 'delete'}
                  className="text-xs font-bold text-red-300 hover:text-red-200 disabled:opacity-50"
                >
                  {actionLoading === 'delete' ? 'Törlés...' : 'Igen, törlöm'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Mégse</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Image gallery ───────────────────────────────────────────── */}
      {hasImages && (
        <div className="relative glass rounded-3xl overflow-hidden aspect-video bg-zinc-900">
          <img src={images[imageIdx]} alt={offer.title} className="w-full h-full object-contain" />
          {images.length > 1 && (
            <>
              <button onClick={() => setImageIdx((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 glass rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setImageIdx((i) => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 glass rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImageIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === imageIdx ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((url, i) => (
            <button key={i} onClick={() => setImageIdx(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${i === imageIdx ? 'border-teal-500/60' : 'border-white/5 opacity-60 hover:opacity-100'}`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* ── Main info ───────────────────────────────────────────────── */}
      <div className="glass rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-zinc-100 leading-snug">{offer.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${isItem ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                {isItem ? <Package className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                {isItem ? 'Tárgy' : 'Szolgáltatás'}
              </span>
              {(offer.item_type || offer.service_type) && (
                <span className="text-xs text-zinc-500 px-2.5 py-1 rounded-lg bg-white/4">
                  {offer.item_type || offer.service_type}
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${st.bg} ${st.color}`}>
                {st.label}
              </span>
            </div>
          </div>
        </div>

        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{offer.description}</p>

        <div className="flex flex-wrap gap-4 text-xs text-zinc-500 pt-1 border-t border-white/5">
          {offer.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{offer.location}</span>}
          {offer.quantity && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Mennyiség: {offer.quantity}</span>}
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatRelativeTime(offer.created_at)}</span>
        </div>
      </div>

      {/* ── Linked campaign ─────────────────────────────────────────── */}
      {donation && (
        <button onClick={() => navigate(`/donations/${donation.id}`)}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/3 transition-colors text-left">
          {donation.images?.[0] && (
            <img src={donation.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 mb-0.5">Kapcsolt kampány</p>
            <p className="text-sm font-semibold text-zinc-200 line-clamp-1">{donation.title}</p>
            {donation.location && <p className="text-xs text-zinc-500">{donation.location}</p>}
          </div>
          <ExternalLink className="w-4 h-4 text-zinc-600 flex-shrink-0" />
        </button>
      )}

      {/* ── Offerer info ─────────────────────────────────────────────── */}
      {offer.user && (
        <div className="glass rounded-2xl p-4 flex items-center gap-4">
          <button onClick={() => navigate(`/profile/${offer.user_id}`)} className="flex-shrink-0">
            <Avatar src={offer.user.avatar_url} name={offer.user.full_name || offer.user.username} size="md" rounded="full" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 mb-0.5">Felajánló</p>
            <button onClick={() => navigate(`/profile/${offer.user_id}`)}
              className="text-sm font-semibold text-zinc-200 hover:text-emerald-400 transition-colors">
              {offer.user.full_name || offer.user.username}
            </button>
          </div>
        </div>
      )}

      {/* ── Action area ─────────────────────────────────────────────── */}

      {/* Visitor: active offer → claim + contact */}
      {!isOwner && !isClaimer && offer.status === 'active' && (
        <div className="space-y-3">
          <button
            onClick={handleClaim}
            disabled={actionLoading === 'claim'}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 font-bold text-sm transition-all disabled:opacity-50 hover:scale-[1.01]"
          >
            <CheckCircle2 className="w-5 h-5" />
            {actionLoading === 'claim' ? 'Igénylés folyamatban...' : 'Igénylés — szeretném ezt a felajánlást!'}
          </button>
          <button
            onClick={handleContact}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl glass-bubble border border-white/8 text-zinc-300 hover:text-zinc-100 font-semibold text-sm transition-all hover:bg-white/5"
          >
            <MessageCircle className="w-4 h-4" />Kérdezek a felajánlónak
          </button>
          <p className="text-center text-xs text-zinc-600">Az igénylés automatikusan chatet nyit a felajánlóval</p>
        </div>
      )}

      {/* Claimer: claimed state → chat + waiting info */}
      {isClaimer && offer.status === 'claimed' && (
        <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-300 font-semibold text-sm">Igénylésed rögzítve!</p>
              <p className="text-amber-400/70 text-xs mt-0.5">Vedd fel a kapcsolatot a felajánlóval a részletek egyeztetéséhez.</p>
            </div>
          </div>
          <button
            onClick={handleOpenClaimChat}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-sm hover:bg-amber-500/30 transition-all"
          >
            <MessageCircle className="w-4 h-4" />Chat megnyitása a felajánlóval
          </button>
        </div>
      )}

      {/* Claimed by someone else (not claimer, not owner) */}
      {!isOwner && !isClaimer && offer.status === 'claimed' && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/15">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">Ez a felajánlást valaki már igényelte. Ha nem valósul meg az átadás, hamarosan újra elérhető lesz.</p>
        </div>
      )}

      {/* Fulfilled */}
      {offer.status === 'fulfilled' && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-300 font-semibold text-sm">Felajánlás teljesítve!</p>
            <p className="text-emerald-400/70 text-xs mt-0.5">Köszönjük a segítséget a közösségnek!</p>
          </div>
          <HandHeart className="w-6 h-6 text-emerald-500/40 ml-auto flex-shrink-0" />
        </div>
      )}

      {/* Not logged in */}
      {!user && offer.status === 'active' && (
        <div className="glass rounded-2xl p-5 text-center space-y-3">
          <p className="text-zinc-400 text-sm">Igényléshez vagy üzenetküldéshez be kell jelentkezni.</p>
          <button onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-sm hover:bg-teal-500/30 transition-all">
            Bejelentkezés
          </button>
        </div>
      )}
    </div>
  );
}
