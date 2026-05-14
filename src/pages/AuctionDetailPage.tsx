import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { Listing, AuctionBid } from '../lib/types';
import { formatPrice, formatRelativeTime, getOnlineStatus, getOnlineLabel, normalizeListingAuction } from '../lib/utils';
import ReportModal from '../components/ReportModal';
import {
  Gavel, Timer, TrendingUp, User, MapPin, ArrowLeft,
  ChevronLeft, ChevronRight, Crown, AlertCircle, Tag, Clock,
  CheckCircle, XCircle, Zap, Flag, RefreshCw, Undo2, ShieldCheck
} from 'lucide-react';
import Avatar from '../components/Avatar';


function Countdown({ endsAt, timerStarted, extensionCount }: { endsAt: string; timerStarted: boolean; extensionCount: number }) {
  const calc = useCallback(() => {
    if (!timerStarted) return { h: 0, m: 0, s: 0, done: false, waiting: true, lastFive: false };
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, done: true, waiting: false, lastFive: false };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      done: false, waiting: false,
      lastFive: diff < 5 * 60 * 1000,
    };
  }, [endsAt, timerStarted]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  if (time.waiting) return (
    <div className="flex items-center gap-2 text-zinc-400 text-sm">
      <Clock className="w-4 h-4 flex-shrink-0" />
      <span>Az első licit indítja el az időzítőt</span>
    </div>
  );
  if (time.done) return (
    <div className="flex items-center gap-2 text-red-400 font-semibold">
      <XCircle className="w-4 h-4" /><span>Lejárt</span>
    </div>
  );
  return (
    <div>
      <div className={`flex items-center gap-2 ${time.lastFive ? 'text-red-400' : 'text-amber-400'}`}>
        <Timer className={`w-4 h-4 ${time.lastFive ? 'animate-pulse' : ''}`} />
        <span className="font-mono text-2xl font-bold tracking-tight">
          {String(time.h).padStart(2, '0')}:{String(time.m).padStart(2, '0')}:{String(time.s).padStart(2, '0')}
        </span>
      </div>
      {time.lastFive && (
        <p className="text-xs text-red-400/80 mt-1 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Utolsó 5 perc! Minden új licit +3 percet ad.
          {extensionCount > 0 && ` (${extensionCount}× hosszabbítva)`}
        </p>
      )}
    </div>
  );
}

function UndoTimer({ seconds, onUndo }: { seconds: number; onUndo: () => void }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setLeft((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (left <= 0) return null;
  return (
    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 text-amber-300 px-4 py-3 rounded-2xl">
      <div className="flex items-center gap-2 text-sm">
        <Undo2 className="w-4 h-4" />
        <span>Visszavonható: <strong>{left}s</strong></span>
      </div>
      <button onClick={onUndo}
        className="text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl font-medium transition-colors">
        Visszavon
      </button>
    </div>
  );
}

const conditionLabels: Record<string, string> = {
  new: 'Új', 'like-new': 'Újszerű', used: 'Használt', fair: 'Közepes', poor: 'Rossz',
};

const statusConfig = {
  active: { label: 'Aktív', cls: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300', icon: CheckCircle },
  ended: { label: 'Lezárult', cls: 'bg-zinc-500/15 border border-zinc-500/30 text-zinc-400', icon: XCircle },
  sold: { label: 'Elkelt', cls: 'bg-blue-500/15 border border-blue-500/30 text-blue-300', icon: CheckCircle },
  cancelled: { label: 'Visszavont', cls: 'bg-red-500/15 border border-red-500/30 text-red-400', icon: XCircle },
};

const UNDO_WINDOW_SECONDS = 60;

export default function AuctionDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useNotification();
  const { params, navigate } = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [undoBid, setUndoBid] = useState<{ bidId: string; auctionId: string; prevPrice: number; placedAt: number } | null>(null);
  const [undoLoading, setUndoLoading] = useState(false);

  // Ref to track top bidder without stale closure
  const topBidderRef = useRef<string | null>(null);
  const listingRef = useRef<Listing | null>(null);
  listingRef.current = listing;

  const id = params.id;

  const fetchListing = useCallback(async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, seller:profiles(*), auction:auctions(*)')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      setListing(normalizeListingAuction(data));
    }
    setLoading(false);
  }, [id]);

  const fetchBids = useCallback(async (auctionId: string) => {
    const { data } = await supabase
      .from('auction_bids')
      .select('*, bidder:profiles(id, username, full_name)')
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false })
      .limit(50);
    const newBids = data || [];
    setBids(newBids);
    // Update top bidder ref
    topBidderRef.current = newBids.length > 0 ? newBids[0].bidder_id : null;
  }, []);

  useEffect(() => { if (id) fetchListing(); }, [id, fetchListing]);
  useEffect(() => {
    if (listing?.auction?.id) fetchBids(listing.auction.id);
  }, [listing?.auction?.id, fetchBids]);

  // Realtime subscription for auction bids — instant updates
  useEffect(() => {
    if (!listing?.auction?.id) return;
    const auctionId = listing.auction.id;

    const channel = supabase
      .channel(`auction-bids-${auctionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'auction_bids',
        filter: `auction_id=eq.${auctionId}`,
      }, async () => {
        const prevTopBidder = topBidderRef.current;

        // Refresh bids and listing price
        await fetchBids(auctionId);
        await fetchListing();

        // Check if current user was outbid
        if (user && prevTopBidder === user.id && topBidderRef.current !== user.id) {
          showToast('outbid', 'Túllicitáltak!', 'Adj le magasabb ajánlatot, hogy visszaszerezd a vezetést.');
        }

        // If current user is now top bidder (just placed a bid via another tab etc.)
        if (user && topBidderRef.current === user.id && prevTopBidder !== user.id) {
          showToast('success', 'Te vezeted a licitet!');
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'auction_bids',
        filter: `auction_id=eq.${auctionId}`,
      }, async () => {
        await fetchBids(auctionId);
        await fetchListing();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listing?.auction?.id, user, fetchBids, fetchListing, showToast]);

  // Realtime subscription for auction status change (ended/sold → notify winner and seller)
  useEffect(() => {
    if (!listing?.auction?.id) return;
    const auctionId = listing.auction.id;

    const channel = supabase
      .channel(`auction-status-${auctionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auctions',
        filter: `id=eq.${auctionId}`,
      }, async (payload) => {
        const updated = payload.new as { status: string; winner_id: string | null; current_price: number };
        await fetchListing();
        await fetchBids(auctionId);

        if (!user) return;

        const currentListing = listingRef.current;
        if (!currentListing) return;

        if (updated.status === 'ended' || updated.status === 'sold') {
          if (updated.winner_id && updated.winner_id === user.id) {
            // This user won
            showToast('winner', 'Gratulálunk! Te nyerted az aukciót!', `Nyerő ajánlat: ${formatPrice(updated.current_price)}`, 10000);
          } else if (currentListing.seller_id === user.id) {
            // Seller notification
            if (updated.winner_id) {
              showToast('auction_end', 'Az aukció lezárult!', `Végső ár: ${formatPrice(updated.current_price)}`, 10000);
            } else {
              showToast('info', 'Az aukció lejárt — nem volt nyertes.');
            }
          } else if (updated.winner_id && updated.winner_id !== user.id) {
            // Someone else won
            showToast('info', 'Az aukció lezárult', 'Sajnos egy másik ajánlattevő nyert.');
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listing?.auction?.id, user, fetchListing, fetchBids, showToast]);

  // Fallback: poll every 30s as safety net (not relying on it)
  useEffect(() => {
    if (!listing?.auction?.id) return;
    const auctionId = listing.auction.id;
    const iv = setInterval(async () => {
      await fetchListing();
      await fetchBids(auctionId);
    }, 30000);
    return () => clearInterval(iv);
  }, [listing?.auction?.id, fetchListing, fetchBids]);

  // Auto-clear undo after window
  useEffect(() => {
    if (!undoBid) return;
    const remaining = UNDO_WINDOW_SECONDS * 1000 - (Date.now() - undoBid.placedAt);
    if (remaining <= 0) { setUndoBid(null); return; }
    const t = setTimeout(() => setUndoBid(null), remaining);
    return () => clearTimeout(t);
  }, [undoBid]);

  async function placeBid(amount: number) {
    if (!user || !listing?.auction) return;
    setBidError('');
    if (isNaN(amount) || amount <= 0) { setBidError('Érvénytelen összeg.'); return; }

    setBidLoading(true);
    const prevPrice = listing.auction.current_price;
    const auctionId = listing.auction.id;

    const { data, error } = await supabase.rpc('place_bid', {
      p_auction_id: auctionId,
      p_amount: amount,
    });

    if (error || !data?.success) {
      setBidError(data?.error || 'Hiba a licit leadásakor. Próbáld újra.');
      setBidLoading(false);
      return;
    }

    const { data: latestBid } = await supabase
      .from('auction_bids').select('id')
      .eq('auction_id', auctionId).eq('bidder_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (latestBid) setUndoBid({ bidId: latestBid.id, auctionId, prevPrice, placedAt: Date.now() });

    setBidAmount('');
    await fetchListing();
    await fetchBids(auctionId);
    setBidLoading(false);
  }

  async function handleUndo() {
    if (!undoBid || !listing?.auction) return;
    const topBid = bids[0];
    if (!topBid || topBid.id !== undoBid.bidId) {
      setBidError('Nem vonható vissza: valaki már felülicitált.');
      setUndoBid(null);
      return;
    }
    setUndoLoading(true);
    await supabase.from('auction_bids').delete().eq('id', undoBid.bidId);
    await supabase.from('auctions').update({ current_price: undoBid.prevPrice }).eq('id', undoBid.auctionId);
    setUndoBid(null);
    await fetchListing();
    await fetchBids(undoBid.auctionId);
    setUndoLoading(false);
  }

  async function handleBidSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(bidAmount);
    if (!isNaN(val)) await placeBid(val);
  }

  if (loading || authLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-5xl mx-auto">
        <div className="h-10 bg-white/5 rounded-xl w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 aspect-[4/3] glass-bubble rounded-3xl" />
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 glass-bubble rounded-3xl" />
            <div className="h-48 glass-bubble rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing || !listing.auction) {
    return (
      <div className="text-center py-20">
        <Gavel className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-400 text-lg">Aukció nem található</p>
        <button onClick={() => navigate('/auctions')} className="mt-4 text-emerald-400 hover:text-emerald-300">
          ← Vissza a licitekhez
        </button>
      </div>
    );
  }

  const { auction } = listing;
  const images = listing.images?.length ? listing.images : [];
  const isOwner = user?.id === listing.seller_id;
  const timerExpired = auction.timer_started && new Date(auction.ends_at) <= new Date();
  const canBid = auction.status === 'active' && !isOwner && !!user && !timerExpired;
  const minNextBid = auction.current_price + auction.min_bid_increment;

  const quickBids = [
    { label: 'Min', amount: minNextBid },
    { label: '+' + formatPrice(auction.min_bid_increment * 2), amount: auction.current_price + auction.min_bid_increment * 2 },
    { label: '+' + formatPrice(auction.min_bid_increment * 5), amount: auction.current_price + auction.min_bid_increment * 5 },
    { label: '+' + formatPrice(auction.min_bid_increment * 10), amount: auction.current_price + auction.min_bid_increment * 10 },
  ];

  const sc = statusConfig[auction.status] || statusConfig.active;
  const StatusIcon = sc.icon;
  const userIsWinning = !!user && bids.length > 0 && bids[0].bidder_id === user.id;
  const undoSecondsLeft = undoBid
    ? Math.max(0, Math.round((UNDO_WINDOW_SECONDS * 1000 - (Date.now() - undoBid.placedAt)) / 1000))
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {showReport && (
        <ReportModal
          listingId={listing.id}
          reportedUserId={listing.seller_id}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Back */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/auctions')}
          className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Vissza
        </button>
        <button onClick={() => setShowReport(true)}
          className="flex items-center gap-2 glass-pill px-3 py-2 rounded-xl text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          <Flag className="w-3.5 h-3.5" />Bejelentés
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Images + Description + Bid history */}
        <div className="lg:col-span-3 space-y-4">
          {/* Gallery */}
          <div className="relative aspect-[4/3] glass-bubble rounded-3xl overflow-hidden">
            {images.length > 0 ? (
              <>
                <img src={images[currentImage]} alt={listing.title}
                  className="w-full h-full object-cover" />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImage((currentImage - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 glass-strong rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={() => setCurrentImage((currentImage + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 glass-strong rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
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
              <div className="w-full h-full flex items-center justify-center">
                <Gavel className="w-20 h-20 text-zinc-700" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url, i) => (
                <button key={i} onClick={() => setCurrentImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all ${i === currentImage ? 'ring-2 ring-emerald-500' : 'opacity-60 hover:opacity-100'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="glass rounded-3xl p-5">
            <h3 className="font-semibold text-zinc-300 mb-2 text-sm uppercase tracking-wide">Leírás</h3>
            <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed text-sm">
              {listing.description || 'Nincs leírás megadva.'}
            </p>
          </div>

          {/* Bid history */}
          <div className="glass rounded-3xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Licitek
              <span className="ml-auto text-zinc-600 font-normal">{bids.length} ajánlat</span>
            </h3>
            {bids.length > 0 ? (
              <div className="space-y-2">
                {bids.map((bid, i) => (
                  <div key={bid.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl ${i === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'glass-subtle'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 'glass-bubble text-zinc-500'}`}>
                        {i === 0 ? <Crown className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${i === 0 ? 'text-emerald-300' : 'text-zinc-300'}`}>
                          {bid.bidder?.full_name || bid.bidder?.username || 'Névtelen'}
                          {user && bid.bidder_id === user.id && (
                            <span className="ml-1.5 text-[10px] text-zinc-600 font-normal">(Te)</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-600">{formatRelativeTime(bid.created_at)}</p>
                      </div>
                    </div>
                    <p className={`font-bold tabular-nums ${i === 0 ? 'text-emerald-400 text-base' : 'text-zinc-400 text-sm'}`}>
                      {formatPrice(Number(bid.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gavel className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">Még senki nem licitált</p>
                <p className="text-zinc-700 text-xs mt-1">Légy az első — az első licit indítja az aukciót!</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Info + Bid form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Title + status + price */}
          <div className="glass rounded-3xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold leading-snug">{listing.title}</h1>
              <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl ${sc.cls}`}>
                <StatusIcon className="w-3 h-3" />{sc.label}
              </span>
            </div>

            {userIsWinning && auction.status === 'active' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                <Crown className="w-4 h-4" />Te vezeted a licitet!
              </div>
            )}

            {/* Winner banner — shown when auction ended and this user won */}
            {(auction.status === 'ended' || auction.status === 'sold') && auction.winner_id && auction.winner_id === user?.id && (
              <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Crown className="w-4 h-4" />Gratulálunk! Te nyerted az aukciót!
              </div>
            )}

            {/* Seller banner — auction ended */}
            {(auction.status === 'ended' || auction.status === 'sold') && isOwner && (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {auction.winner_id ? 'Az aukció lezárult — vedd fel a kapcsolatot a nyertessel.' : 'Az aukció lejárt — nem volt nyertes.'}
              </div>
            )}

            {/* Current price */}
            <div className="glass-subtle rounded-2xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Jelenlegi legmagasabb ajánlat</p>
              <p className="text-3xl font-bold text-emerald-400 tabular-nums">{formatPrice(auction.current_price)}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                <span>Kezdő ár: {formatPrice(auction.starting_price)}</span>
                <span>·</span>
                <span>Min. lépés: {formatPrice(auction.min_bid_increment)}</span>
              </div>
              {bids.length === 0 && (
                <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />Még nincs licit — az első indítja az órát
                </p>
              )}
            </div>

            {/* Timer */}
            <div className="glass-subtle rounded-2xl p-4">
              <p className="text-xs text-zinc-500 mb-2">{auction.timer_started ? 'Hátralévő idő' : 'Időzítő'}</p>
              <Countdown endsAt={auction.ends_at} timerStarted={auction.timer_started} extensionCount={auction.extension_count} />
              {auction.timer_started && (
                <p className="text-xs text-zinc-600 mt-2">{auction.duration_hours} órás aukció · {bids.length} licit</p>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {listing.condition && (
                <span className="flex items-center gap-1 glass-pill px-3 py-1.5 rounded-xl text-zinc-400 text-xs">
                  <Tag className="w-3 h-3" />{conditionLabels[listing.condition] || listing.condition}
                </span>
              )}
              {listing.location && (
                <span className="flex items-center gap-1 glass-pill px-3 py-1.5 rounded-xl text-zinc-400 text-xs">
                  <MapPin className="w-3 h-3" />{listing.location}
                </span>
              )}
            </div>
          </div>

          {/* ── BID SECTION ── */}
          {canBid ? (
            <div className="glass rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-amber-400" />
                  {bids.length === 0 ? 'Első licit' : 'Licit leadása'}
                </h2>
                <span className="text-xs text-zinc-500">Min: <span className="text-emerald-400 font-semibold">{formatPrice(minNextBid)}</span></span>
              </div>

              {bids.length === 0 && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-3 py-2.5 rounded-xl">
                  <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Az első licit elindítja az aukciót. Ezután {auction.duration_hours} óra van lezárásig.
                </div>
              )}

              {/* Quick bid buttons */}
              <div>
                <p className="text-xs text-zinc-600 mb-2">Gyors licit (csak kitölti a mezőt)</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickBids.map(({ label, amount }, i) => (
                    <button key={i} type="button"
                      onClick={() => setBidAmount(String(amount))}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                        bidAmount === String(amount)
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'glass-pill border-transparent text-zinc-300 hover:border-zinc-600'
                      }`}>
                      <span className="block text-[10px] text-zinc-500 font-normal">{label}</span>
                      {formatPrice(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual input + submit */}
              <form onSubmit={handleBidSubmit} className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5">Vagy adj meg egyedi összeget</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={String(minNextBid)}
                        min={minNextBid}
                        step={auction.min_bid_increment}
                        className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all font-semibold pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">Ft</span>
                    </div>
                    <button
                      type="submit"
                      disabled={bidLoading || !bidAmount}
                      className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:text-amber-600 text-black font-bold rounded-xl transition-all flex items-center gap-1.5 text-sm whitespace-nowrap">
                      {bidLoading
                        ? <RefreshCw className="w-4 h-4 animate-spin text-amber-800" />
                        : <><Zap className="w-4 h-4" />Licit!</>}
                    </button>
                  </div>
                </div>
                {bidError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{bidError}
                  </div>
                )}
              </form>
            </div>
          ) : auction.status === 'active' ? (
            <div className="glass rounded-3xl p-6 text-center space-y-3">
              <Gavel className="w-8 h-8 text-zinc-600 mx-auto" />
              {!user ? (
                <>
                  <p className="text-zinc-400 text-sm">Licitáláshoz be kell jelentkezned</p>
                  <button onClick={() => navigate('/login')}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors text-sm">
                    Bejelentkezés / Regisztráció
                  </button>
                </>
              ) : isOwner ? (
                <p className="text-zinc-500 text-sm">Ez a te aukciód — saját licitedre nem ajánlhatsz.</p>
              ) : timerExpired ? (
                <p className="text-zinc-500 text-sm">Az aukció lejárt.</p>
              ) : null}
            </div>
          ) : (
            <div className="glass rounded-3xl p-6 text-center">
              <XCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm font-medium">
                {auction.status === 'sold' ? 'Ez az aukció lezárult és el is kelt.' : 'Ez az aukció véget ért.'}
              </p>
              {auction.winner_id && auction.winner_id === user?.id && (
                <p className="text-emerald-400 text-sm mt-2 font-semibold">Gratulálunk — te nyerted!</p>
              )}
            </div>
          )}

          {/* Undo banner */}
          {undoBid && undoSecondsLeft > 0 && (
            <UndoTimer seconds={undoSecondsLeft} onUndo={handleUndo} />
          )}
          {undoLoading && (
            <div className="flex items-center gap-2 glass-pill px-4 py-3 rounded-xl text-zinc-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />Visszavonás...
            </div>
          )}

          {/* Seller */}
          {listing.seller && (
            <div className="glass rounded-3xl p-5">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Eladó</h3>
              <button onClick={() => navigate(`/profile/${listing.seller!.id}`)}
                className="flex items-center gap-3 w-full hover:bg-white/5 rounded-2xl p-2 -m-2 transition-colors">
                <div className="relative flex-shrink-0">
                  <Avatar src={listing.seller.avatar_url} name={listing.seller.full_name || listing.seller.username} size="md" rounded="xl" />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050507] ${
                    getOnlineStatus(listing.seller.last_seen) === 'online' ? 'bg-emerald-400' :
                    getOnlineStatus(listing.seller.last_seen) === 'recently' ? 'bg-amber-400' : 'bg-zinc-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-zinc-200 text-sm">
                      {listing.seller.full_name || listing.seller.username || 'Felhasználó'}
                    </p>
                    {listing.seller.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className={`text-xs ${
                    getOnlineStatus(listing.seller.last_seen) === 'online' ? 'text-emerald-400' :
                    getOnlineStatus(listing.seller.last_seen) === 'recently' ? 'text-amber-400' : 'text-zinc-500'
                  }`}>
                    {getOnlineLabel(listing.seller.last_seen)}
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
