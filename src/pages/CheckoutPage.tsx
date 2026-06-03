import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import type { Listing } from '../lib/types';
import { formatPrice } from '../lib/utils';
import {
  Package, Truck, MapPin, CheckCircle, ArrowLeft,
  MessageCircle, Phone, Mail, Handshake
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { findOrCreateConversation, sendConversationMessage } from '../lib/conversations';
import Breadcrumb from '../components/navigation/Breadcrumb';
import FlowInfoBar from '../components/navigation/FlowInfoBar';
import Avatar from '../components/Avatar';

const DELIVERY_OPTIONS = [
  {
    id: 'gls',
    name: 'GLS futár',
    desc: '1–2 munkanap',
    note: 'A vevő intézi: hívd a GLS-t (06-29-886-660) a csomag felvételéhez.',
    price: 1790,
    Icon: Truck,
  },
  {
    id: 'magyar-posta',
    name: 'Magyar Posta',
    desc: '2–4 munkanap',
    note: 'Az eladó adja fel a csomagot a legközelebbi postán.',
    price: 1490,
    Icon: Package,
  },
  {
    id: 'personal',
    name: 'Személyes átvétel',
    desc: 'Egyeztetett időpontban, ingyenes',
    note: 'Az eladóval egyeztetett helyen és időpontban veszed át személyesen.',
    price: 0,
    Icon: Handshake,
  },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { params, navigate } = useRouter();
  const { showToast } = useNotification();
  const id = params.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!id) return;
    supabase.from('listings').select('*, seller:profiles(*)').eq('id', id).maybeSingle()
      .then(({ data }) => {
        if (!data || data.status !== 'active') { navigate('/'); return; }
        if (data.seller_id === user.id) { navigate(`/listing/${id}`); return; }
        setListing(data);
        setMessage(`Szia! Érdeklődöm a(z) "${data.title}" hirdetésed iránt. Megvan még?`);
      });
  }, [user, id]);

  const availableDelivery = listing?.delivery_options?.length
    ? DELIVERY_OPTIONS.filter((d) => listing.delivery_options.includes(d.id))
    : DELIVERY_OPTIONS;
  const deliveryOption = DELIVERY_OPTIONS.find((d) => d.id === selectedDelivery);
  const canProceed = !!selectedDelivery && (selectedDelivery === 'personal' || deliveryAddress.trim().length > 5) && message.trim();

  async function confirmAndContact() {
    if (!listing || !user || !canProceed) return;
    setLoading(true);

    const { id: cid, error: convError } = await findOrCreateConversation({
      buyerId: user.id,
      sellerId: listing.seller_id,
      context: { kind: 'listing', listingId: listing.id },
    });

    if (!cid) {
      showToast('error', 'Hiba történt', convError ?? 'A kapcsolatfelvétel sikertelen. Kérjük, próbáld újra.');
      setLoading(false);
      return;
    }

    const deliveryInfo = selectedDelivery === 'personal'
      ? 'Személyes átvételt szeretnék.'
      : `Szállítást kérek: ${deliveryOption?.name}${deliveryAddress ? ` — Cím: ${deliveryAddress}` : ''}.`;

    const fullMessage = `${message}\n\n${deliveryInfo}`;

    const { error: msgError } = await sendConversationMessage({
      conversationId: cid,
      senderId: user.id,
      content: fullMessage,
    });

    if (msgError) {
      showToast('error', 'Hiba történt', msgError);
      setLoading(false);
      return;
    }

    setConvId(cid);
    setLoading(false);
    setDone(true);
  }

  if (done && convId) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-5">
        <div className="w-20 h-20 glass-bubble rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Üzenet elküldve!</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Az eladó értesítést kapott. Folytasd az egyeztetést az üzenetek között.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(`/chat/${convId}`)}
            className="flex items-center gap-2 glass-pill-active text-emerald-300 px-5 py-3 rounded-xl font-medium text-sm">
            <MessageCircle className="w-4 h-4" />Üzenetek megnyitása
          </button>
          <button onClick={() => navigate('/')}
            className="glass-pill text-zinc-400 px-5 py-3 rounded-xl font-medium text-sm hover:text-zinc-200 transition-colors">
            Főoldal
          </button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return <div className="text-center py-20 text-zinc-500">Betöltés...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb items={[
        { label: 'Főoldal', path: '/' },
        { label: 'Hirdetések', path: '/search' },
        { label: listing.title, path: `/listing/${listing.id}` },
        { label: 'Üzenet az eladónak' },
      ]} />

      <h1 className="text-2xl font-bold mb-4">Üzenet az eladónak</h1>
      <FlowInfoBar variant="checkout" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">

          {/* Delivery selection */}
          <div className="glass rounded-3xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-zinc-100">
              <Truck className="w-5 h-5 text-emerald-400" />Átvételi mód
            </h2>
            <div className="space-y-2">
              {availableDelivery.map((opt) => {
                const Icon = opt.Icon;
                const active = selectedDelivery === opt.id;
                return (
                  <div key={opt.id}>
                    <button type="button" onClick={() => setSelectedDelivery(opt.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                        active
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'glass-pill border-transparent hover:border-white/10'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-emerald-500/20' : 'glass-bubble'}`}>
                        <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium text-sm ${active ? 'text-emerald-300' : 'text-zinc-200'}`}>{opt.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                      </div>
                      <span className={`font-semibold text-sm flex-shrink-0 ${active ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {opt.price === 0 ? 'Ingyenes' : formatPrice(opt.price)}
                      </span>
                    </button>
                    {active && (
                      <div className="mx-1 -mt-1 mb-1 px-4 py-2.5 bg-blue-500/8 border border-blue-500/20 rounded-b-2xl flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0 text-xs">i</span>
                        <p className="text-xs text-blue-300/80 leading-relaxed">{opt.note}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedDelivery && selectedDelivery !== 'personal' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />Szállítási cím
                </label>
                <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2} placeholder="Irányítószám, város, utca, házszám"
                  className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none text-sm" />
              </div>
            )}
          </div>

          {/* Message to seller */}
          <div className="glass rounded-3xl p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2 text-zinc-100">
              <MessageCircle className="w-5 h-5 text-emerald-400" />Üzenet az eladónak
            </h2>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              rows={4} placeholder="Írj üzenetet az eladónak..."
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none text-sm leading-relaxed" />
            <p className="text-xs text-zinc-600">Az átvételi mód és cím automatikusan hozzáadódik az üzenethez.</p>
          </div>

          {/* Submit */}
          <button onClick={confirmAndContact} disabled={!canProceed || loading}
            className="w-full py-4 glass-pill-active text-emerald-300 font-semibold rounded-2xl transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {loading ? 'Küldés...' : 'Üzenet elküldése'}
          </button>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass rounded-3xl p-5 sticky top-24 space-y-4">
            {/* Product */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Hirdetés</p>
              <div className="flex gap-3">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title}
                    className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 glass-bubble rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-zinc-200">{listing.title}</p>
                  <p className="text-emerald-400 font-bold text-sm mt-0.5">{formatPrice(listing.price)}</p>
                </div>
              </div>
            </div>

            {/* Seller info */}
            {listing.seller && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-zinc-500 mb-2">Eladó</p>
                <div className="flex items-center gap-2">
                  <Avatar src={listing.seller.avatar_url} name={listing.seller.full_name || listing.seller.username} size="sm" rounded="xl" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {listing.seller.full_name || listing.seller.username || 'Névtelen'}
                    </p>
                    {listing.seller.location && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{listing.seller.location}
                      </p>
                    )}
                  </div>
                </div>
                {(listing.seller.phone || listing.seller.contact_email) && (
                  <div className="mt-2 space-y-1">
                    {listing.seller.phone && (
                      <a href={`tel:${listing.seller.phone}`}
                        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-emerald-300 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />{listing.seller.phone}
                      </a>
                    )}
                    {listing.seller.contact_email && (
                      <a href={`mailto:${listing.seller.contact_email}`}
                        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-emerald-300 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />{listing.seller.contact_email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {deliveryOption && (
              <div className="border-t border-white/5 pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Termék</span>
                  <span>{formatPrice(listing.price)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Szállítás</span>
                  <span>{deliveryOption.price === 0 ? 'Ingyenes' : formatPrice(deliveryOption.price)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-100 pt-1.5 border-t border-white/5">
                  <span>Becsült összeg</span>
                  <span className="text-emerald-400">{formatPrice(listing.price + deliveryOption.price)}</span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  A pontos árat és fizetési módot az eladóval egyezteted az üzenetekben.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
