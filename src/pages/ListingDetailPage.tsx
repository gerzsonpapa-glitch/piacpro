import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { Listing, SellerBadge } from '../lib/types';
import { formatPrice, formatRelativeTime, getOnlineStatus, getOnlineLabel, RANK_CONFIG } from '../lib/utils';
import {
  Heart, MessageCircle, MapPin, Tag, Clock, ChevronLeft, ChevronRight,
  Share2, Shield, ArrowLeft, Phone, Mail, Pencil, Trash2,
  Star, CheckCircle, XCircle, ShieldCheck, ZoomIn, X, Play,
  Handshake, RefreshCw, Facebook, Copy, Check, Flag
} from 'lucide-react';
import Avatar from '../components/Avatar';
import ReportModal from '../components/ReportModal';
import { useSEO } from '../lib/seo';
import { findOrCreateConversation } from '../lib/conversations';
import Breadcrumb from '../components/navigation/Breadcrumb';
import FlowInfoBar from '../components/navigation/FlowInfoBar';
import { markChecklistItem } from '../lib/userOnboarding';

const RECENTLY_VIEWED_KEY = 'recently_viewed_listings';
const MAX_RECENTLY_VIEWED = 10;

function addToRecentlyViewed(id: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    const filtered = existing.filter((x) => x !== id);
    const updated = [id, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

function RatingModal({ listingId, sellerId, sellerName, onClose, onSubmitted }: {
  listingId: string; sellerId: string; sellerName: string; onClose: () => void; onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    await supabase.from('listing_ratings').insert({
      listing_id: listingId,
      rater_id: user.id,
      rated_id: sellerId,
      score,
      comment: comment.trim(),
    });
    setDone(true);
    setSubmitting(false);
    setTimeout(() => { onSubmitted(); onClose(); }, 1500);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm space-y-5" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-semibold text-zinc-100">Értékelés elküldve!</p>
            <p className="text-zinc-500 text-sm mt-1">Köszönjük visszajelzésedet.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-100">Értékeld az eladót</h3>
              <button onClick={onClose} className="p-1.5 glass-pill rounded-xl text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-zinc-400 text-sm">
              <span className="font-medium text-zinc-200">{sellerName}</span> — milyen volt az élmény?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setScore(i)}
                  className="transition-transform hover:scale-110">
                  <Star className={`w-8 h-8 transition-colors ${i <= score ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Opcionális megjegyzés..."
              className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none text-sm"
            />
            <div className="flex gap-2">
              <button onClick={submit} disabled={submitting}
                className="flex-1 py-3 glass-pill-active text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.01] disabled:opacity-60 text-sm">
                {submitting ? 'Küldés...' : 'Értékelés küldése'}
              </button>
              <button onClick={onClose} className="px-4 py-3 glass-pill text-zinc-400 rounded-xl text-sm hover:text-zinc-200 transition-colors">
                Mégse
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const conditionLabels: Record<string, string> = {
  new: 'Új', 'like-new': 'Újszerű', used: 'Használt', fair: 'Közepes', poor: 'Rossz',
};

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  active: { label: 'Aktív', className: 'glass-pill-active text-emerald-300', icon: CheckCircle },
  sold: { label: 'Elkelt', className: 'bg-blue-500/15 border border-blue-500/30 text-blue-300', icon: CheckCircle },
  ended: { label: 'Lezárult', className: 'bg-zinc-500/15 border border-zinc-500/30 text-zinc-400', icon: XCircle },
  deleted: { label: 'Törölve', className: 'bg-red-500/15 border border-red-500/30 text-red-400', icon: XCircle },
};

function BadgeDisplay({ badge }: { badge: SellerBadge }) {
  const config = {
    reliable: { label: 'Megbízható eladó', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '⭐' },
    neutral: { label: 'Semleges', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20', icon: '🔘' },
    low_reliability: { label: 'Alacsony megbízhatóság', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '⚠️' },
  }[badge.badge_type];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${config.bg} ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {badge.total_ratings > 0 && (
        <span className="opacity-70">({badge.avg_score.toFixed(1)} · {badge.total_ratings} értékelés)</span>
      )}
    </div>
  );
}

export default function ListingDetailPage() {
  const { user } = useAuth();
  const { params, navigate } = useRouter();
  const { showToast } = useNotification();
  const [listing, setListing] = useState<Listing | null>(null);

  useSEO({
    title: listing ? listing.title : 'Hirdetés',
    description: listing
      ? `${listing.title} – ${listing.price ? new Intl.NumberFormat('hu-HU').format(listing.price) + ' Ft' : 'Ár egyeztetés'} | ${listing.location ?? ''} | PiacPro`
      : undefined,
    image: listing?.images?.[0] ?? undefined,
    path: `/listing/${params.id}`,
    type: 'product',
  });
  const [sellerBadge, setSellerBadge] = useState<SellerBadge | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [bumping, setBumping] = useState(false);
  const [bumpMessage, setBumpMessage] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const id = params.id;

  useEffect(() => {
    if (!showShareMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  useEffect(() => {
    if (id) {
      fetchListing();
      addToRecentlyViewed(id);
    }
  }, [id]);

  async function fetchListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, seller:profiles(*)')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setListing(data);
      markChecklistItem('browsedListings');
      supabase.from('listings').update({ views: data.views + 1 }).eq('id', id).then(() => {});

      // Fetch seller badge
      const { data: badge } = await supabase
        .from('seller_badges')
        .select('*')
        .eq('seller_id', data.seller_id)
        .maybeSingle();
      setSellerBadge(badge);

      if (user) {
        const [favRes, ratingRes] = await Promise.all([
          supabase.from('favorites').select('id').eq('user_id', user.id).eq('listing_id', id).maybeSingle(),
          supabase.from('listing_ratings').select('id').eq('listing_id', id).eq('rater_id', user.id).maybeSingle(),
        ]);
        setIsFavorited(!!favRes.data);
        setAlreadyRated(!!ratingRes.data);
      }
    }
    setLoading(false);
  }

  async function bumpListing() {
    if (!listing || !user) return;
    const lastBump = listing.bumped_at ? new Date(listing.bumped_at) : null;
    const now = new Date();
    if (lastBump) {
      const hoursSince = (now.getTime() - lastBump.getTime()) / 3600000;
      if (hoursSince < 24) {
        const hoursLeft = Math.ceil(24 - hoursSince);
        setBumpMessage(`Következő frissítés ${hoursLeft} óra múlva lehetséges`);
        setTimeout(() => setBumpMessage(''), 3000);
        return;
      }
    }
    setBumping(true);
    const { data: updated } = await supabase
      .from('listings')
      .update({ bumped_at: now.toISOString(), created_at: now.toISOString() })
      .eq('id', listing.id)
      .eq('seller_id', user.id)
      .select()
      .maybeSingle();
    if (updated) {
      setListing((prev) => prev ? { ...prev, bumped_at: now.toISOString(), created_at: now.toISOString() } : prev);
      setBumpMessage('Hirdetés frissítve! Most az élre kerül.');
    }
    setBumping(false);
    setTimeout(() => setBumpMessage(''), 3000);
  }

  async function toggleFavorite() {
    if (!user || !listing) return;
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listing.id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listing.id });
    }
    setIsFavorited(!isFavorited);
    if (!isFavorited) markChecklistItem('savedFavorite');
  }

  async function startConversation() {
    if (!user || !listing) return;
    if (user.id === listing.seller_id) return;

    const { id, error } = await findOrCreateConversation({
      buyerId: user.id,
      sellerId: listing.seller_id,
      context: { kind: 'listing', listingId: listing.id },
    });

    if (error || !id) {
      showToast('error', 'Hiba', error ?? 'A beszélgetés megnyitása sikertelen.');
      return;
    }
    navigate(`/chat/${id}`);
  }

  async function deleteListing() {
    if (!user || !listing) return;
    setDeleting(true);
    const { error } = await supabase.from('listings').update({ status: 'deleted' }).eq('id', listing.id).eq('seller_id', user.id);
    if (error) { setDeleting(false); showToast('error', 'Hiba', 'A törlés sikertelen.'); return; }
    navigate('/');
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="aspect-video glass-bubble rounded-3xl" />
        <div className="space-y-3">
          <div className="h-6 bg-white/5 rounded w-3/4" />
          <div className="h-8 bg-white/5 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400 text-lg">Hirdetés nem található</p>
        <button onClick={() => navigate('/')} className="mt-4 text-emerald-400 hover:text-emerald-300">
          Vissza a kezdőlapra
        </button>
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : [];
  const isOwner = user?.id === listing.seller_id;
  const status = statusConfig[listing.status] || statusConfig.active;
  const StatusIcon = status.icon;
  const canBuy = !isOwner && listing.status === 'active' && user;

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  const sellerName = listing.seller?.full_name || listing.seller?.username || 'Eladó';


  return (
    <div className="max-w-5xl mx-auto">
      {showReport && (
        <ReportModal
          listingId={listing.id}
          userId={listing.seller_id}
          onClose={() => setShowReport(false)}
        />
      )}
      {showRatingModal && listing.seller && (
        <RatingModal
          listingId={listing.id}
          sellerId={listing.seller_id}
          sellerName={sellerName}
          onClose={() => setShowRatingModal(false)}
          onSubmitted={() => setAlreadyRated(true)}
        />
      )}

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 glass rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors z-10"
            onClick={() => setLightboxOpen(false)}>
            <X className="w-5 h-5" />
          </button>
          {images.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 glass rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 glass rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }}>
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {images.map((src, i) => (
              <img key={src} src={src} alt={listing?.title}
                className={`max-w-[90vw] max-h-[90vh] object-contain rounded-2xl transition-opacity duration-300 ${i === lightboxIndex ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'}`} />
            ))}
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === lightboxIndex ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          )}
          <div className="absolute bottom-6 right-6 text-zinc-500 text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}

      <Breadcrumb items={[
        { label: 'Főoldal', path: '/' },
        { label: 'Hirdetések', path: '/search' },
        { label: listing.title },
      ]} />

      {/* Sold / Ended overlay banner */}
      {listing.status !== 'active' && (
        <div className={`rounded-2xl px-5 py-3 mb-4 flex items-center gap-3 border ${status.className}`}>
          <StatusIcon className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            {listing.status === 'sold' && 'Ez a termék már elkelt.'}
            {listing.status === 'ended' && 'Ez a hirdetés lezárult.'}
            {listing.status === 'deleted' && 'Ez a hirdetés törölve lett.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Images */}
        <div className="lg:col-span-3">
          <div className="relative aspect-[4/3] glass-bubble rounded-3xl overflow-hidden group/img">
            {images.length > 0 ? (
              <>
                {images.map((src, i) => (
                  <img key={src} src={src} alt={listing.title}
                    className={`absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-opacity duration-300 ${i === currentImage ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => openLightbox(currentImage)} />
                ))}
                <button
                  onClick={() => openLightbox(currentImage)}
                  className="absolute top-3 right-3 w-9 h-9 glass-strong rounded-xl flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
                  <ZoomIn className="w-4 h-4" />
                </button>
                {listing.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-blue-300 font-bold text-3xl border-4 border-blue-400 px-6 py-3 rounded-2xl rotate-[-15deg] uppercase tracking-wider">Elkelt</span>
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImage((currentImage - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 glass-strong rounded-full flex items-center justify-center hover:bg-white/20 z-10">
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={() => setCurrentImage((currentImage + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 glass-strong rounded-full flex items-center justify-center hover:bg-white/20 z-10">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {images.map((_, i) => (
                        <button key={i} onClick={() => setCurrentImage(i)}
                          className={`h-2 rounded-full transition-all ${i === currentImage ? 'bg-white w-4' : 'w-2 bg-white/40'}`} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-5xl">📷</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {images.map((url, i) => (
                <button key={i}
                  onClick={() => { setCurrentImage(i); }}
                  onDoubleClick={() => openLightbox(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all hover:opacity-90 ${i === currentImage ? 'ring-2 ring-emerald-500' : 'ring-1 ring-white/10'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              <button
                onClick={() => openLightbox(currentImage)}
                className="flex-shrink-0 w-16 h-16 rounded-xl glass-bubble flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors border border-white/10">
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Video Player */}
          {listing.video_url && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-zinc-300">Videó</span>
              </div>
              <div className="relative rounded-2xl overflow-hidden glass-bubble">
                <video
                  src={listing.video_url}
                  controls
                  className="w-full rounded-2xl max-h-72 object-contain bg-black"
                  preload="metadata"
                />
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="text-2xl font-bold leading-snug">{listing.title}</h1>
              <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl ${status.className}`}>
                <StatusIcon className="w-3 h-3" />{status.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <p className="text-3xl font-bold text-emerald-400">{formatPrice(listing.price)}</p>
              {listing.negotiable && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
                  <Handshake className="w-3.5 h-3.5" />Alkuképes
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 text-sm">
              {listing.condition && (
                <span className="flex items-center gap-1.5 glass-pill px-3 py-1.5 rounded-xl text-zinc-300">
                  <Tag className="w-3.5 h-3.5" />{conditionLabels[listing.condition] || listing.condition}
                </span>
              )}
              {listing.location && (
                <span className="flex items-center gap-1.5 glass-pill px-3 py-1.5 rounded-xl text-zinc-300">
                  <MapPin className="w-3.5 h-3.5" />{listing.location}
                </span>
              )}
              <span className="flex items-center gap-1.5 glass-pill px-3 py-1.5 rounded-xl text-zinc-300">
                <Clock className="w-3.5 h-3.5" />{formatRelativeTime(listing.created_at)}
              </span>
              <span className="flex items-center gap-1.5 glass-pill px-3 py-1.5 rounded-xl text-zinc-300">
                <Shield className="w-3.5 h-3.5" />{listing.views} megtekintés
              </span>
            </div>

            {/* Action Buttons */}
            <FlowInfoBar variant="listing" />
            <div className="flex gap-2 mt-3 flex-wrap">
              {canBuy && (
                <button onClick={() => navigate(`/checkout/${listing.id}`)}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.02]">
                  <MessageCircle className="w-4 h-4" />Üzenet az eladónak
                </button>
              )}
              {!isOwner && listing.status === 'active' && user && (
                <button onClick={startConversation}
                  className="flex items-center gap-2 px-4 py-3 glass-pill text-zinc-300 rounded-xl transition-all hover:bg-white/10">
                  <MessageCircle className="w-4 h-4" />Meglévő beszélgetés
                </button>
              )}
              {!isOwner && listing.status === 'active' && !user && (
                <button onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.02]">
                  <MessageCircle className="w-4 h-4" />Üzenet az eladónak
                </button>
              )}
              <button onClick={toggleFavorite} disabled={!user}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${isFavorited ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'glass-pill text-zinc-300'}`}>
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-400' : ''}`} />
              </button>
              <div className="relative" ref={shareRef}>
                <button onClick={() => setShowShareMenu((v) => !v)}
                  className="flex items-center justify-center px-4 py-3 glass-pill rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-52 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50" style={{background: 'rgba(18,18,24,0.97)', backdropFilter: 'blur(16px)'}}>
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-xs text-zinc-500 font-medium">Megosztás</p>
                    </div>
                    <button
                      onClick={() => {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400');
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm text-zinc-300 hover:text-zinc-100">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <Facebook className="w-4 h-4 text-blue-400" />
                      </div>
                      Facebook
                    </button>
                    <button
                      onClick={() => {
                        const url = window.location.href;
                        const subject = encodeURIComponent(`Nézd meg ezt a hirdetést: ${listing?.title ?? ''}`);
                        const body = encodeURIComponent(`Talaltam ezt a hirdetést a PiacPro-n:\n\n${listing?.title ?? ''}\n${url}`);
                        window.location.href = `mailto:?subject=${subject}&body=${body}`;
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm text-zinc-300 hover:text-zinc-100">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-emerald-400" />
                      </div>
                      E-mail
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setCopied(true);
                        setTimeout(() => { setCopied(false); setShowShareMenu(false); }, 1500);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm text-zinc-300 hover:text-zinc-100">
                      <div className="w-7 h-7 rounded-lg bg-zinc-600/40 flex items-center justify-center flex-shrink-0">
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                      </div>
                      {copied ? 'Másolva!' : 'Link másolása'}
                    </button>
                  </div>
                )}
              </div>
              {!isOwner && (
                <button
                  type="button"
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 px-4 py-3 glass-pill rounded-xl text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                >
                  <Flag className="w-4 h-4" />Bejelentés
                </button>
              )}
            </div>

            {/* Owner controls */}
            {isOwner && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/edit-listing/${listing.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 glass-pill text-zinc-300 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                    <Pencil className="w-4 h-4" />Szerkesztés
                  </button>
                  {!deleteConfirm ? (
                    <button onClick={() => setDeleteConfirm(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-medium">
                      <Trash2 className="w-4 h-4" />Törlés
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button onClick={deleteListing} disabled={deleting}
                        className="px-3 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium hover:bg-red-500/30 transition-colors">
                        {deleting ? '...' : 'Biztosan?'}
                      </button>
                      <button onClick={() => setDeleteConfirm(false)}
                        className="px-3 py-2.5 glass-pill text-zinc-400 rounded-xl text-xs hover:text-zinc-200 transition-colors">
                        Mégse
                      </button>
                    </div>
                  )}
                  {listing.status === 'active' && (
                    <button onClick={async () => {
                      await supabase.from('listings').update({ status: 'sold', sold_at: new Date().toISOString() }).eq('id', listing.id);
                      setListing((p) => p ? { ...p, status: 'sold' } : p);
                    }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-colors">
                      <Star className="w-4 h-4" />Elkelt
                    </button>
                  )}
                </div>
                {listing.status === 'active' && (
                  <div>
                    <button onClick={bumpListing} disabled={bumping}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-colors text-sm font-medium disabled:opacity-60">
                      <RefreshCw className={`w-4 h-4 ${bumping ? 'animate-spin' : ''}`} />
                      {bumping ? 'Frissítés...' : 'Hirdetés frissítése (1x/nap)'}
                    </button>
                    {bumpMessage && (
                      <p className="text-xs text-center mt-1.5 text-amber-400/80">{bumpMessage}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Rating button for buyer on sold listing */}
            {!isOwner && listing.status === 'sold' && user && listing.seller && (
              <div className="mt-4 pt-4 border-t border-white/5">
                {alreadyRated ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500 justify-center py-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Már értékelted ezt az eladót
                  </div>
                ) : (
                  <button onClick={() => setShowRatingModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-colors text-sm font-medium">
                    <Star className="w-4 h-4" />Értékelem az eladót
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="glass rounded-3xl p-6">
            <h3 className="font-semibold text-zinc-200 mb-2">Leírás</h3>
            <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed text-sm">
              {listing.description || 'Nincs leírás'}
            </p>
          </div>

          {/* Seller Info */}
          {listing.seller && (
            <div className="glass rounded-3xl p-6">
              <h3 className="font-semibold text-zinc-200 mb-3">Eladó</h3>
              <button onClick={() => navigate(`/profile/${listing.seller!.id}`)}
                className="flex items-center gap-3 glass-pill p-3 rounded-xl transition-colors w-full hover:bg-white/10 mb-3">
                <div className="relative">
                  <Avatar src={listing.seller.avatar_url} name={listing.seller.full_name || listing.seller.username} size="lg" rounded="2xl" />
                  {(() => {
                    const status = getOnlineStatus(listing.seller.last_seen);
                    return (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#050507] ${
                        status === 'online' ? 'bg-emerald-400' :
                        status === 'recently' ? 'bg-amber-400' : 'bg-zinc-600'
                      }`} />
                    );
                  })()}
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium text-zinc-200">
                      {listing.seller.full_name || listing.seller.username || 'Felhasználó'}
                    </p>
                    {listing.seller.verified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    )}
                    {(listing.seller.rank_level ?? 1) > 1 && (() => {
                      const cfg = RANK_CONFIG[listing.seller.rank_level ?? 1] ?? RANK_CONFIG[1];
                      return (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                          {listing.seller.rank_title}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-xs ${
                      getOnlineStatus(listing.seller.last_seen) === 'online' ? 'text-emerald-400' :
                      getOnlineStatus(listing.seller.last_seen) === 'recently' ? 'text-amber-400' : 'text-zinc-500'
                    }`}>
                      {getOnlineLabel(listing.seller.last_seen)}
                    </p>
                    {(listing.seller.avg_rating ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {(listing.seller.avg_rating ?? 0).toFixed(1)}
                        <span className="text-zinc-600">({listing.seller.total_reviews ?? 0})</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
              {sellerBadge && <BadgeDisplay badge={sellerBadge} />}
            </div>
          )}

          {/* Contact Info */}
          {(listing.phone || listing.contact_email) && (
            <div className="glass rounded-3xl p-6">
              <h3 className="font-semibold text-zinc-200 mb-3">Elérhetőség</h3>
              {user ? (
                <div className="space-y-2">
                  {listing.phone && (
                    <a href={`tel:${listing.phone}`}
                      className="flex items-center gap-3 glass-pill p-3 rounded-xl text-zinc-300 hover:text-emerald-300 transition-colors">
                      <div className="w-10 h-10 glass-bubble rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-sm">{listing.phone}</span>
                    </a>
                  )}
                  {listing.contact_email && (
                    <a href={`mailto:${listing.contact_email}`}
                      className="flex items-center gap-3 glass-pill p-3 rounded-xl text-zinc-300 hover:text-emerald-300 transition-colors">
                      <div className="w-10 h-10 glass-bubble rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-sm">{listing.contact_email}</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {listing.phone && (
                    <div className="flex items-center gap-3 glass-pill p-3 rounded-xl">
                      <div className="w-10 h-10 glass-bubble rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4 text-zinc-600" />
                      </div>
                      <span className="text-sm text-zinc-600 select-none blur-sm pointer-events-none">+36 30 000 0000</span>
                    </div>
                  )}
                  {listing.contact_email && (
                    <div className="flex items-center gap-3 glass-pill p-3 rounded-xl">
                      <div className="w-10 h-10 glass-bubble rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-zinc-600" />
                      </div>
                      <span className="text-sm text-zinc-600 select-none blur-sm pointer-events-none">pelda@email.hu</span>
                    </div>
                  )}
                  <button onClick={() => navigate('/login')}
                    className="w-full mt-1 py-2.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors text-center font-medium">
                    Bejelentkezés az elérhetőség megtekintéséhez
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
