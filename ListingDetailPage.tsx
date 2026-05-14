import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import type { Listing, SellerBadge } from '../lib/types';
import { formatPrice, formatRelativeTime, getOnlineStatus, getOnlineLabel } from '../lib/utils';
import {
  Heart, MessageCircle, MapPin, Tag, Clock, ChevronLeft, ChevronRight,
  Share2, Shield, ArrowLeft, Phone, Mail, Pencil, Trash2,
  Star, CheckCircle, XCircle, ShieldCheck, ZoomIn, X
} from 'lucide-react';
import Avatar from '../components/Avatar';

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
  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerBadge, setSellerBadge] = useState<SellerBadge | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const id = params.id;

  useEffect(() => {
    if (id) fetchListing();
  }, [id]);

  async function fetchListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, seller:profiles(*)')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setListing(data);
      supabase.from('listings').update({ views: data.views + 1 }).eq('id', id).then(() => {});

      // Fetch seller badge
      const { data: badge } = await supabase
        .from('seller_badges')
        .select('*')
        .eq('seller_id', data.seller_id)
        .maybeSingle();
      setSellerBadge(badge);

      if (user) {
        const { data: fav } = await supabase
          .from('favorites').select('id')
          .eq('user_id', user.id).eq('listing_id', id).maybeSingle();
        setIsFavorited(!!fav);
      }
    }
    setLoading(false);
  }

  async function toggleFavorite() {
    if (!user || !listing) return;
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listing.id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listing.id });
    }
    setIsFavorited(!isFavorited);
  }

  async function startConversation() {
    if (!user || !listing) return;
    if (user.id === listing.seller_id) return;

    const { data } = await supabase
      .from('conversations').select('id')
      .eq('listing_id', listing.id).eq('buyer_id', user.id).maybeSingle();

    if (data) {
      navigate(`/chat/${data.id}`);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.seller_id })
        .select().single();
      if (newConv) navigate(`/chat/${newConv.id}`);
    }
  }

  async function deleteListing() {
    if (!user || !listing) return;
    setDeleting(true);
    await supabase.from('listings').update({ status: 'deleted' }).eq('id', listing.id).eq('seller_id', user.id);
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

  return (
    <div className="max-w-5xl mx-auto">
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
          <img
            src={images[lightboxIndex]}
            alt={listing?.title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
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

      <button onClick={() => window.history.back()}
        className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Vissza
      </button>

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
                <img src={images[currentImage]} alt={listing.title}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => openLightbox(currentImage)} />
                <button
                  onClick={() => openLightbox(currentImage)}
                  className="absolute top-3 right-3 w-9 h-9 glass-strong rounded-xl flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 glass-strong rounded-full flex items-center justify-center hover:bg-white/20">
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={() => setCurrentImage((currentImage + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 glass-strong rounded-full flex items-center justify-center hover:bg-white/20">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button key={i} onClick={() => setCurrentImage(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === currentImage ? 'bg-white' : 'bg-white/40'}`} />
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
            <p className="text-3xl font-bold text-emerald-400 mt-2">{formatPrice(listing.price)}</p>

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
            <div className="flex gap-2 mt-5 flex-wrap">
              {canBuy && (
                <button onClick={() => navigate(`/checkout/${listing.id}`)}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.02]">
                  <MessageCircle className="w-4 h-4" />Érdekel, felveszem a kapcsolatot
                </button>
              )}
              {!isOwner && listing.status === 'active' && user && (
                <button onClick={startConversation}
                  className="flex items-center gap-2 px-4 py-3 glass-pill text-zinc-300 rounded-xl transition-all hover:bg-white/10">
                  <MessageCircle className="w-4 h-4" />Üzenet
                </button>
              )}
              {!isOwner && listing.status === 'active' && !user && (
                <button onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.02]">
                  <MessageCircle className="w-4 h-4" />Érdekel, felveszem a kapcsolatot
                </button>
              )}
              <button onClick={toggleFavorite} disabled={!user}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${isFavorited ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'glass-pill text-zinc-300'}`}>
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-400' : ''}`} />
              </button>
              <button onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="flex items-center justify-center px-4 py-3 glass-pill rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Owner controls */}
            {isOwner && (
              <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
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
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-zinc-200">
                      {listing.seller.full_name || listing.seller.username || 'Felhasználó'}
                    </p>
                    {listing.seller.verified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    getOnlineStatus(listing.seller.last_seen) === 'online' ? 'text-emerald-400' :
                    getOnlineStatus(listing.seller.last_seen) === 'recently' ? 'text-amber-400' : 'text-zinc-500'
                  }`}>
                    {getOnlineLabel(listing.seller.last_seen)}
                  </p>
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
