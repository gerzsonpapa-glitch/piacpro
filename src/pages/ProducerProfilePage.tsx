import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { Producer, ProducerProduct } from '../lib/types';
import { MapPin, Star, CheckCircle2, Leaf, MessageCircle, Phone, Mail, Award, Clock, Package, Plus, Trash2, X, Save, ToggleLeft, ToggleRight, ChevronLeft, Sprout, Sun, Apple, Egg, Beef, MilkOff, FlaskConical, UtensilsCrossed, Tag, User, Camera, ImagePlus, CreditCard as Edit2, ChevronRight, ChevronLeft as ChevLeft, ShoppingCart, Minus, Send, Search, Loader2, Lock } from 'lucide-react';
import { useSEO } from '../lib/seo';

// ── Hungarian counties ─────────────────────────────────────────────────────────
const HU_COUNTIES = [
  'Bács-Kiskun', 'Baranya', 'Békés', 'Borsod-Abaúj-Zemplén', 'Budapest',
  'Csongrád-Csanád', 'Fejér', 'Győr-Moson-Sopron', 'Hajdú-Bihar', 'Heves',
  'Jász-Nagykun-Szolnok', 'Komárom-Esztergom', 'Nógrád', 'Pest', 'Somogy',
  'Szabolcs-Szatmár-Bereg', 'Tolna', 'Vas', 'Veszprém', 'Zala',
];

interface LocationValue {
  county: string;
  city: string;
  street: string;
  housenumber: string;
  display: string;
  lat: number | null;
  lng: number | null;
}

function parseInitialLocation(raw: string): LocationValue {
  return { county: '', city: '', street: '', housenumber: '', display: raw, lat: null, lng: null };
}

// ── LocationPicker component ───────────────────────────────────────────────────
function LocationPicker({ value, onChange }: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}) {
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [cityInput, setCityInput] = useState(value.city);
  const [streetInput, setStreetInput] = useState(value.street);
  const cityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function geocodeAndSet(county: string, city: string, street: string, housenumber: string) {
    const parts = [housenumber, street, city, county ? `${county} megye` : '', 'Magyarország'].filter(Boolean);
    const q = parts.join(', ');
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}&countrycodes=hu`, {
        headers: { 'Accept-Language': 'hu' },
      });
      const data = await res.json();
      const hit = data[0];
      const displayParts = [city, county ? `${county} megye` : ''].filter(Boolean);
      onChange({
        county, city, street, housenumber,
        display: displayParts.join(', '),
        lat: hit ? parseFloat(hit.lat) : null,
        lng: hit ? parseFloat(hit.lon) : null,
      });
    } catch {
      onChange({ ...value, county, city, street, housenumber, display: [city, county].filter(Boolean).join(', ') });
    }
    setGeocoding(false);
  }

  function searchCities(county: string, q: string) {
    if (cityTimer.current) clearTimeout(cityTimer.current);
    if (q.length < 2) { setCitySuggestions([]); return; }
    cityTimer.current = setTimeout(async () => {
      const countyQ = county ? `${county} megye, Magyarország` : 'Magyarország';
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(q + ', ' + countyQ)}&addressdetails=1&countrycodes=hu`, {
          headers: { 'Accept-Language': 'hu' },
        });
        const data = await res.json();
        const cities = [...new Set<string>(data.map((d: { address: { city?: string; town?: string; village?: string; municipality?: string } }) =>
          d.address?.city || d.address?.town || d.address?.village || d.address?.municipality
        ).filter(Boolean))];
        setCitySuggestions(cities);
      } catch { setCitySuggestions([]); }
    }, 350);
  }

  function searchStreets(city: string, q: string) {
    if (streetTimer.current) clearTimeout(streetTimer.current);
    if (q.length < 3 || !city) { setStreetSuggestions([]); return; }
    streetTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(q + ', ' + city + ', Magyarország')}&addressdetails=1&countrycodes=hu`, {
          headers: { 'Accept-Language': 'hu' },
        });
        const data = await res.json();
        const streets = [...new Set<string>(data.map((d: { address: { road?: string } }) => d.address?.road).filter(Boolean))];
        setStreetSuggestions(streets);
      } catch { setStreetSuggestions([]); }
    }, 350);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        Helyszín
        {geocoding && <Loader2 className="w-3 h-3 animate-spin text-zinc-500 ml-1" />}
        {value.lat && value.lng && !geocoding && (
          <span className="text-emerald-500 text-[10px]">· GPS rögzítve ({value.lat.toFixed(4)}, {value.lng.toFixed(4)})</span>
        )}
      </p>

      {/* County */}
      <select
        value={value.county}
        onChange={(e) => {
          const county = e.target.value;
          onChange({ ...value, county, city: '', street: '', housenumber: '', display: county ? `${county} megye` : '', lat: null, lng: null });
          setCityInput('');
          setStreetInput('');
          setCitySuggestions([]);
        }}
        className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 text-sm focus:outline-none bg-transparent"
      >
        <option value="">Megye kiválasztása</option>
        {HU_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* City */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        <input
          value={cityInput}
          onChange={(e) => {
            setCityInput(e.target.value);
            searchCities(value.county, e.target.value);
          }}
          onBlur={() => setTimeout(() => setCitySuggestions([]), 200)}
          placeholder="Város / Falu keresése..."
          className="w-full pl-9 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
        />
        {citySuggestions.length > 0 && (
          <div className="absolute z-10 top-full mt-1 w-full glass rounded-xl overflow-hidden shadow-xl border border-white/10">
            {citySuggestions.map((city) => (
              <button key={city} type="button"
                onMouseDown={() => {
                  setCityInput(city);
                  setCitySuggestions([]);
                  setStreetInput('');
                  geocodeAndSet(value.county, city, '', '');
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Street + housenumber — only if city set */}
      {value.city && (
        <div className="grid grid-cols-3 gap-2">
          <div className="relative col-span-2">
            <input
              value={streetInput}
              onChange={(e) => {
                setStreetInput(e.target.value);
                searchStreets(value.city, e.target.value);
              }}
              onBlur={() => setTimeout(() => setStreetSuggestions([]), 200)}
              placeholder="Utca (opcionális)"
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
            />
            {streetSuggestions.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full glass rounded-xl overflow-hidden shadow-xl border border-white/10">
                {streetSuggestions.map((street) => (
                  <button key={street} type="button"
                    onMouseDown={() => {
                      setStreetInput(street);
                      setStreetSuggestions([]);
                      geocodeAndSet(value.county, value.city, street, value.housenumber);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                  >
                    {street}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={value.housenumber}
            onChange={(e) => {
              onChange({ ...value, housenumber: e.target.value });
              if (e.target.value) geocodeAndSet(value.county, value.city, streetInput, e.target.value);
            }}
            placeholder="Házszám"
            className="px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
          />
        </div>
      )}

      {/* Summary chip */}
      {value.display && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-300 truncate">{value.display}</span>
        </div>
      )}
    </div>
  );
}

interface CartItem {
  product: ProducerProduct;
  quantity: number;
}

const CAT_LABELS: Record<string, string> = {
  vegetable: 'Zöldség', fruit: 'Gyümölcs', honey: 'Méz', egg: 'Tojás',
  meat: 'Hús', dairy: 'Tejtermék', bio: 'Bio', homemade: 'Házi készítmény',
};
const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vegetable: Sprout, fruit: Apple, honey: Sun, egg: Egg,
  meat: Beef, dairy: MilkOff, bio: FlaskConical, homemade: UtensilsCrossed,
};
const CATEGORIES = Object.entries(CAT_LABELS).map(([key, label]) => ({ key, label, icon: CAT_ICONS[key] }));

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

async function uploadImage(file: File, path: string): Promise<string | null> {
  const { error } = await supabase.storage.from('producer-images').upload(path, file, { upsert: true });
  if (error) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/producer-images/${path}`;
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
      ))}
      <span className="text-sm text-zinc-500 ml-1">{rating.toFixed(1)} ({count} értékelés)</span>
    </div>
  );
}

// ── Image gallery with navigation ─────────────────────────────────────────────
function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return (
    <div className="w-full aspect-video bg-zinc-800 rounded-2xl flex items-center justify-center">
      <Package className="w-10 h-10 text-zinc-600" />
    </div>
  );
  return (
    <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-video">
      {images.map((src, i) => (
        <img key={src} src={src} alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${i === idx ? 'opacity-100' : 'opacity-0'}`} />
      ))}
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
          >
            <ChevLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-3' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Product card (view mode) ───────────────────────────────────────────────────
function ProductCard({ product, isOwner, onEdit, onDelete, cartQty, onAddToCart, onChangeQty }: {
  product: ProducerProduct; isOwner: boolean;
  onEdit: () => void; onDelete: () => void;
  cartQty: number;
  onAddToCart: () => void;
  onChangeQty: (delta: number) => void;
}) {
  const CatIcon = product.category_tag ? (CAT_ICONS[product.category_tag] ?? Tag) : Tag;
  const inCart = cartQty > 0;

  return (
    <div className={`glass-bubble rounded-2xl overflow-hidden group flex flex-col transition-all duration-200 ${inCart ? 'ring-1 ring-emerald-500/40' : ''}`}>
      <ImageGallery images={product.images ?? []} alt={product.name} />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-zinc-100 text-sm leading-snug">{product.name}</p>
          {isOwner && (
            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="p-1 rounded-lg glass text-zinc-400 hover:text-emerald-400 transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} className="p-1 rounded-lg glass text-zinc-400 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        {product.price != null && (
          <p className="text-emerald-400 font-bold text-base">
            {new Intl.NumberFormat('hu-HU').format(product.price)} Ft
            <span className="text-zinc-500 font-normal text-sm"> / {product.unit}</span>
          </p>
        )}
        {product.description && (
          <p className="text-xs text-zinc-500 leading-relaxed">{product.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {product.category_tag && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-700/50 text-zinc-400 flex items-center gap-0.5">
              <CatIcon className="w-2.5 h-2.5" /> {CAT_LABELS[product.category_tag] ?? product.category_tag}
            </span>
          )}
          {product.is_fresh_harvest && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/15 text-green-400 border border-green-500/20">Frissen szüretelt</span>
          )}
          {product.is_seasonal && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/20">Szezonális</span>
          )}
          {!product.is_available && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-700/50 text-zinc-500">Nem elérhető</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {product.stock_quantity != null && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${product.stock_quantity <= 0 ? 'bg-red-500/15 text-red-400' : product.stock_quantity <= 5 ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-700/50 text-zinc-400'}`}>
              {product.stock_quantity <= 0 ? 'Elfogyott' : `${product.stock_quantity} ${product.unit} készleten`}
            </span>
          )}
          {product.stock_note && <p className="text-xs text-zinc-600">{product.stock_note}</p>}
        </div>

        {/* Cart controls — only for non-owners */}
        {!isOwner && product.is_available && (
          <div className="mt-auto pt-2">
            {!inCart ? (
              <button
                onClick={onAddToCart}
                className="w-full py-2 rounded-xl glass text-zinc-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Kosárba
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChangeQty(-1)}
                  className="w-8 h-8 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 text-center">
                  <span className="font-bold text-emerald-300 text-sm">{cartQty}</span>
                  <span className="text-zinc-500 text-xs ml-1">{product.unit}</span>
                </div>
                <button
                  onClick={() => onChangeQty(1)}
                  className="w-8 h-8 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Order request modal ────────────────────────────────────────────────────────
function OrderModal({ cart, producer, onClose, onSent }: {
  cart: CartItem[]; producer: Producer;
  onClose: () => void; onSent: (convId: string) => void;
}) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const total = cart.reduce((sum, item) =>
    sum + (item.product.price != null ? item.product.price * item.quantity : 0), 0);

  async function send() {
    if (!user) return;
    setSending(true);

    // Build message text
    const lines = cart.map((item) => {
      const price = item.product.price != null
        ? ` — ${new Intl.NumberFormat('hu-HU').format(item.product.price * item.quantity)} Ft`
        : '';
      return `• ${item.product.name}: ${item.quantity} ${item.product.unit}${price}`;
    });
    const totalLine = total > 0 ? `\n\nBecsült összeg: ${new Intl.NumberFormat('hu-HU').format(total)} Ft` : '';
    const noteText = note.trim() ? `\n\nMegjegyzés: ${note.trim()}` : '';
    const msgText = `Szia! Szeretnék rendelni:\n\n${lines.join('\n')}${totalLine}${noteText}`;

    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations').select('id')
      .eq('buyer_id', user.id).eq('seller_id', producer.user_id)
      .is('listing_id', null).is('shop_product_id', null)
      .maybeSingle();

    let convId: string | null = null;
    if (existing) {
      convId = existing.id;
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: producer.user_id, listing_id: null })
        .select('id').maybeSingle();
      convId = newConv?.id ?? null;
    }

    if (!convId) { showToast('error', 'Hiba', 'Nem sikerült megnyitni a beszélgetést'); setSending(false); return; }

    // Send message
    const { error } = await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      content: msgText,
    });

    setSending(false);
    if (error) { showToast('error', 'Hiba', error.message); return; }
    showToast('success', 'Megrendelés elküldve!', 'A termelő hamarosan válaszol.');
    onSent(convId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 glass-bubble rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-zinc-100 text-lg">Megrendelés</h3>
        </div>
        <p className="text-xs text-zinc-500">Elküldöd {producer.name} termelőnek:</p>

        {/* Items */}
        <div className="space-y-2">
          {cart.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                {product.images?.[0]
                  ? <img src={product.images[0]} alt={product.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0"><Package className="w-3.5 h-3.5 text-zinc-600" /></div>
                }
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{product.name}</p>
                  {product.price != null && (
                    <p className="text-[10px] text-zinc-500">{new Intl.NumberFormat('hu-HU').format(product.price)} Ft / {product.unit}</p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-emerald-300">{quantity} {product.unit}</p>
                {product.price != null && (
                  <p className="text-xs text-zinc-500">{new Intl.NumberFormat('hu-HU').format(product.price * quantity)} Ft</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-zinc-400">Becsült összeg</span>
            <span className="font-bold text-emerald-300">{new Intl.NumberFormat('hu-HU').format(total)} Ft</span>
          </div>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Megjegyzés a termelőnek (szállítás, átvétel, egyéb kérés...)"
          rows={3}
          className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none"
        />

        <button
          onClick={send}
          disabled={sending}
          className="w-full py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Küldés...' : 'Megrendelés elküldése'}
        </button>
      </div>
    </div>
  );
}

// ── Product edit/add modal ─────────────────────────────────────────────────────
interface ProductFormData {
  name: string; description: string; price: string; unit: string;
  category_tag: string; stock_note: string; stock_quantity: string;
  is_seasonal: boolean; is_fresh_harvest: boolean; is_available: boolean;
  existingImages: string[]; newImageFiles: File[]; newImagePreviews: string[];
}

function ProductModal({
  producerId, product, onClose, onSaved,
}: {
  producerId: string; product: ProducerProduct | null;
  onClose: () => void; onSaved: () => void;
}) {
  const { showToast } = useNotification();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductFormData>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price != null ? String(product.price) : '',
    unit: product?.unit ?? 'kg',
    category_tag: product?.category_tag ?? '',
    stock_note: product?.stock_note ?? '',
    stock_quantity: product?.stock_quantity != null ? String(product.stock_quantity) : '',
    is_seasonal: product?.is_seasonal ?? false,
    is_fresh_harvest: product?.is_fresh_harvest ?? false,
    is_available: product?.is_available ?? true,
    existingImages: product?.images ?? [],
    newImageFiles: [],
    newImagePreviews: [],
  });

  function addImages(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const previews = arr.map((f) => URL.createObjectURL(f));
    setForm((f) => ({
      ...f,
      newImageFiles: [...f.newImageFiles, ...arr],
      newImagePreviews: [...f.newImagePreviews, ...previews],
    }));
  }

  function removeExisting(idx: number) {
    setForm((f) => ({ ...f, existingImages: f.existingImages.filter((_, i) => i !== idx) }));
  }
  function removeNew(idx: number) {
    setForm((f) => ({
      ...f,
      newImageFiles: f.newImageFiles.filter((_, i) => i !== idx),
      newImagePreviews: f.newImagePreviews.filter((_, i) => i !== idx),
    }));
  }

  async function save() {
    if (!form.name.trim()) { showToast('error', 'Add meg a termék nevét'); return; }
    setSaving(true);

    // Upload new images
    const uploadedUrls: string[] = [];
    for (let i = 0; i < form.newImageFiles.length; i++) {
      const file = form.newImageFiles[i];
      const ext = file.name.split('.').pop();
      const path = `${user!.id}/${Date.now()}-${i}.${ext}`;
      const url = await uploadImage(file, path);
      if (url) uploadedUrls.push(url);
    }

    const images = [...form.existingImages, ...uploadedUrls];
    const payload = {
      producer_id: producerId,
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price ? parseFloat(form.price) : null,
      unit: form.unit.trim() || 'db',
      category_tag: form.category_tag || null,
      stock_note: form.stock_note.trim() || null,
      stock_quantity: form.stock_quantity ? parseFloat(form.stock_quantity) : null,
      is_seasonal: form.is_seasonal,
      is_fresh_harvest: form.is_fresh_harvest,
      is_available: form.is_available,
      images,
    };

    let error;
    if (product) {
      ({ error } = await supabase.from('producer_products').update(payload).eq('id', product.id));
    } else {
      ({ error } = await supabase.from('producer_products').insert(payload));
    }

    setSaving(false);
    if (error) { showToast('error', 'Hiba', error.message); return; }
    showToast('success', product ? 'Termék frissítve' : 'Termék hozzáadva');
    onSaved();
    onClose();
  }

  const allImages = [
    ...form.existingImages.map((url) => ({ url, isNew: false, idx: form.existingImages.indexOf(url) })),
    ...form.newImagePreviews.map((url, idx) => ({ url, isNew: true, idx })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg glass rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 glass-bubble rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-zinc-100 text-lg">{product ? 'Termék szerkesztése' : 'Új termék'}</h3>

        {/* Image upload area */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Képek (több is feltölthető)</p>
          <div className="grid grid-cols-3 gap-2">
            {allImages.map(({ url, isNew, idx }) => (
              <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => isNew ? removeNew(idx) : removeExisting(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-emerald-400 transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-[10px]">Kép hozzáadása</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
        </div>

        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Termék neve (pl. Akácméz)" className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Leírás — méret, szín, íz, felhasználás, termelési mód..." rows={3}
          className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Ár (Ft)" type="number" min="0"
            className="px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none" />
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="px-4 py-3 glass-input rounded-xl text-zinc-100 text-sm focus:outline-none bg-transparent">
            {[
              { label: 'Súly', options: ['kg', 'dkg', 'g', 'tonna'] },
              { label: 'Folyadék', options: ['liter', 'dl', 'ml'] },
              { label: 'Darab', options: ['db', 'csomag', 'köteg', 'láda', 'rekesz', 'zsák', 'doboz'] },
              { label: 'Egyéb', options: ['üveg', 'tégely', 'palack', 'csomó', 'adag'] },
            ].map(({ label, options }) => (
              <optgroup key={label} label={label}>
                {options.map((u) => <option key={u} value={u}>{u}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <select value={form.category_tag} onChange={(e) => setForm({ ...form, category_tag: e.target.value })}
          className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 text-sm focus:outline-none bg-transparent">
          <option value="">Kategória kiválasztása</option>
          {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              placeholder="Készlet mennyisége" type="number" min="0" step="0.1"
              className="w-full pl-4 pr-14 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-400 pointer-events-none">
              {form.unit || 'kg'}
            </span>
          </div>
          <input value={form.stock_note} onChange={(e) => setForm({ ...form, stock_note: e.target.value })}
            placeholder="Megjegyzés (pl. heti szüret)"
            className="px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none" />
        </div>

        <div className="flex flex-wrap gap-4">
          {[
            { key: 'is_seasonal', label: 'Szezonális' },
            { key: 'is_fresh_harvest', label: 'Frissen szüretelt' },
            { key: 'is_available', label: 'Elérhető' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, [key]: !f[key as keyof ProductFormData] }))}
                className="text-zinc-400">
                {form[key as keyof ProductFormData]
                  ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                  : <ToggleLeft className="w-5 h-5" />}
              </button>
              <span className="text-sm text-zinc-400">{label}</span>
            </label>
          ))}
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Mentés...' : product ? 'Változtatások mentése' : 'Termék hozzáadása'}
        </button>
      </div>
    </div>
  );
}

// ── Profile edit modal ─────────────────────────────────────────────────────────
function ProfileEditModal({ producer, onClose, onSaved }: {
  producer: Producer; onClose: () => void; onSaved: () => void;
}) {
  const { showToast } = useNotification();
  const { user } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: producer.name,
    bio: producer.bio ?? '',
    contact_phone: producer.contact_phone ?? '',
    contact_email: producer.contact_email ?? '',
    categories: producer.categories ?? [],
    is_available_today: producer.is_available_today,
  });
  const [locationVal, setLocationVal] = useState<LocationValue>(
    parseInitialLocation(producer.location ?? '')
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(producer.avatar_url);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(producer.cover_url);

  function toggleCategory(key: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(key) ? f.categories.filter((c) => c !== key) : [...f.categories, key],
    }));
  }

  async function save() {
    if (!form.name.trim()) { showToast('error', 'Add meg a termelő nevét'); return; }
    setSaving(true);

    let avatar_url = producer.avatar_url;
    let cover_url = producer.cover_url;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `${user!.id}/avatar.${ext}`;
      const url = await uploadImage(avatarFile, path);
      if (url) avatar_url = url;
    }
    if (coverFile) {
      const ext = coverFile.name.split('.').pop();
      const path = `${user!.id}/cover.${ext}`;
      const url = await uploadImage(coverFile, path);
      if (url) cover_url = url;
    }

    const { error } = await supabase.from('producers').update({
      name: form.name.trim(),
      bio: form.bio.trim(),
      location: locationVal.display || locationVal.city || producer.location,
      lat: locationVal.lat ?? producer.lat,
      lng: locationVal.lng ?? producer.lng,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      categories: form.categories,
      is_available_today: form.is_available_today,
      avatar_url,
      cover_url,
    }).eq('id', producer.id);

    setSaving(false);
    if (error) { showToast('error', 'Hiba', error.message); return; }
    showToast('success', 'Profil frissítve');
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg glass rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 glass-bubble rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-zinc-100 text-lg">Profil szerkesztése</h3>

        {/* Cover + avatar upload */}
        <div className="relative">
          <div
            className="relative h-32 rounded-2xl overflow-hidden bg-zinc-800 cursor-pointer group"
            onClick={() => coverRef.current?.click()}
          >
            {coverPreview
              ? <img src={coverPreview} alt="borítókép" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Leaf className="w-10 h-10 text-zinc-600" /></div>
            }
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium">
              <Camera className="w-4 h-4" /> Borítókép csere
            </div>
          </div>
          <div
            className="absolute -bottom-5 left-4 w-14 h-14 rounded-2xl border-2 border-zinc-900 overflow-hidden bg-zinc-800 cursor-pointer group"
            onClick={() => avatarRef.current?.click()}
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-zinc-500" /></div>
            }
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
          }} />
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
          }} />
        </div>

        <div className="pt-6 space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Termelő neve" className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none" />
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Bemutatkozás — gazdaságod, termelési módszerek, specialitások..." rows={4}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none" />
          <LocationPicker value={locationVal} onChange={setLocationVal} />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              placeholder="Telefon" className="px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none" />
            <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="E-mail" className="px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none" />
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-2">Kategóriák</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => toggleCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  form.categories.includes(key) ? 'glass-pill-active text-emerald-300' : 'glass-bubble text-zinc-400 hover:text-zinc-200'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <button type="button" onClick={() => setForm({ ...form, is_available_today: !form.is_available_today })}>
            {form.is_available_today
              ? <ToggleRight className="w-6 h-6 text-emerald-400" />
              : <ToggleLeft className="w-6 h-6 text-zinc-500" />}
          </button>
          <div>
            <p className="text-sm text-zinc-300 font-medium">Ma elérhető</p>
            <p className="text-xs text-zinc-600">Jelöld be, ha ma személyesen vagy átvételre elérhető vagy</p>
          </div>
        </label>

        <button onClick={save} disabled={saving}
          className="w-full py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Mentés...' : 'Profil mentése'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProducerProfilePage() {
  const { params, navigate } = useRouter();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const producerId = params?.id as string;
  const [producer, setProducer] = useState<Producer | null>(null);

  useSEO({
    title: producer ? producer.name : 'Termelő profil',
    description: producer
      ? `${producer.name} – helyi termelő${producer.location ? ', ' + producer.location : ''}${producer.bio ? ' | ' + producer.bio.slice(0, 100) : ''} | PiacPro Termelők`
      : undefined,
    image: producer?.avatar_url ?? undefined,
    path: `/producers/${producerId}`,
  });
  const [products, setProducts] = useState<ProducerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProducerProduct | null | 'new'>('new' as any);
  const [showProductModal, setShowProductModal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const isOwner = user?.id === producer?.user_id;

  function getCartQty(productId: string) {
    return cart.find((c) => c.product.id === productId)?.quantity ?? 0;
  }

  function addToCart(product: ProducerProduct) {
    setCart((prev) => {
      const exists = prev.find((c) => c.product.id === product.id);
      if (exists) return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) => {
      const updated = prev.map((c) => c.product.id === productId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c);
      return updated.filter((c) => c.quantity > 0);
    });
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  useEffect(() => {
    if (producerId) fetchProducer();
  }, [producerId]);

  async function fetchProducer() {
    setLoading(true);
    const { data: prod } = await supabase
      .from('producers')
      .select('*, products:producer_products(*)')
      .eq('id', producerId)
      .maybeSingle();
    if (prod) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', prod.user_id)
        .maybeSingle();
      setProducer({ ...prod, profile: profileData ?? undefined } as Producer);
      setProducts((prod.products ?? []) as ProducerProduct[]);
    }
    setLoading(false);
  }

  async function deleteProduct(productId: string) {
    const { error } = await supabase.from('producer_products').delete().eq('id', productId);
    if (error) { showToast('error', 'Hiba', error.message); return; }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('success', 'Termék törölve');
  }

  async function startChat() {
    if (!user) { navigate('/login'); return; }
    if (!producer || user.id === producer.user_id) return;
    const { data: existing } = await supabase
      .from('conversations').select('id')
      .eq('buyer_id', user.id).eq('seller_id', producer.user_id)
      .is('listing_id', null).is('shop_product_id', null)
      .maybeSingle();
    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: producer.user_id, listing_id: null })
        .select('id').maybeSingle();
      if (newConv) navigate(`/chat/${newConv.id}`);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-56 glass rounded-3xl" />
        <div className="h-32 glass rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 glass rounded-2xl" />
          <div className="h-64 glass rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="max-w-5xl mx-auto glass rounded-3xl p-12 text-center space-y-3">
        <Leaf className="w-10 h-10 text-zinc-600 mx-auto" />
        <p className="text-zinc-400">Ez a termelői profil nem található.</p>
        <button onClick={() => navigate('/producers')} className="text-sm text-emerald-400 hover:underline">Vissza a termelőkhöz</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/producers')} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Vissza a termelőkhöz
      </button>

      {/* ── Cover + header ── */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="relative h-56 bg-gradient-to-br from-emerald-950 to-zinc-900">
          {producer.cover_url
            ? <img src={producer.cover_url} alt={producer.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Leaf className="w-16 h-16 text-emerald-800/40" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            {producer.is_verified && (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/90 text-white font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Hitelesített
              </span>
            )}
            {producer.is_local_favorite && (
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/90 text-white font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Helyi kedvenc
              </span>
            )}
          </div>
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 rounded-2xl border-2 border-zinc-900 overflow-hidden bg-zinc-800 shadow-xl">
              {producer.avatar_url
                ? <img src={producer.avatar_url} alt={producer.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-zinc-500" /></div>
              }
            </div>
          </div>
        </div>

        <div className="px-6 pt-12 pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-100">{producer.name}</h1>
                {producer.is_available_today && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Ma elérhető
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-zinc-500 text-sm">
                <MapPin className="w-3.5 h-3.5" /> {producer.location || 'Helyszín nem megadott'}
              </div>
              {producer.avg_rating > 0 && <StarRow rating={producer.avg_rating} count={producer.review_count} />}
            </div>
            <div className="flex gap-2 flex-wrap">
              {isOwner ? (
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl glass-bubble text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Profil szerkesztése
                </button>
              ) : (
                <button
                  onClick={startChat}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-pill-active text-emerald-300 text-sm font-medium transition-all hover:scale-[1.02]"
                >
                  <MessageCircle className="w-4 h-4" /> Üzenet küldése
                </button>
              )}
            </div>
          </div>

          {producer.bio && <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">{producer.bio}</p>}

          {(producer.contact_phone || producer.contact_email) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {user ? (
                <>
                  {producer.contact_phone && (
                    <a href={`tel:${producer.contact_phone}`} className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {producer.contact_phone}
                    </a>
                  )}
                  {producer.contact_email && (
                    <a href={`mailto:${producer.contact_email}`} className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 transition-colors">
                      <Mail className="w-3.5 h-3.5" /> {producer.contact_email}
                    </a>
                  )}
                </>
              ) : (
                <button onClick={() => navigate('/login')} className="flex items-center gap-1.5 text-zinc-600 hover:text-emerald-400 transition-colors text-xs">
                  <Lock className="w-3.5 h-3.5" /> Bejelentkezés az elérhetőség megtekintéséhez
                </button>
              )}
            </div>
          )}

          {(producer.categories ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {producer.categories.map((cat) => {
                const Icon = CAT_ICONS[cat] ?? Tag;
                return (
                  <span key={cat} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl glass-bubble text-zinc-400">
                    <Icon className="w-3 h-3" /> {CAT_LABELS[cat] ?? cat}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Products ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" /> Termékek
            <span className="text-sm font-normal text-zinc-500">({products.length})</span>
          </h2>
          {isOwner && (
            <button
              onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-pill-active text-emerald-300 text-sm font-medium hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" /> Új termék
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center space-y-3">
            <Package className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-zinc-500 text-sm">
              {isOwner ? 'Adj hozzá terméket a profilodhoz!' : 'Ez a termelő még nem adott hozzá termékeket.'}
            </p>
            {isOwner && (
              <button
                onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-pill-active text-emerald-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Termék hozzáadása
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isOwner={isOwner}
                onEdit={() => { setEditingProduct(p); setShowProductModal(true); }}
                onDelete={() => deleteProduct(p.id)}
                cartQty={getCartQty(p.id)}
                onAddToCart={() => addToCart(p)}
                onChangeQty={(delta) => changeQty(p.id, delta)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating cart bar ── */}
      {!isOwner && cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
          <button
            onClick={() => {
              if (!user) { navigate('/login'); return; }
              setShowOrderModal(true);
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm shadow-2xl shadow-emerald-900/50 transition-all hover:scale-[1.02] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Megrendelés küldése</span>
            </div>
            <span className="bg-white/20 rounded-xl px-2.5 py-0.5 text-sm font-bold">{cartCount} tétel</span>
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {showEditProfile && (
        <ProfileEditModal
          producer={producer}
          onClose={() => setShowEditProfile(false)}
          onSaved={fetchProducer}
        />
      )}
      {showProductModal && (
        <ProductModal
          producerId={producer.id}
          product={editingProduct instanceof Object && editingProduct !== null ? editingProduct as ProducerProduct : null}
          onClose={() => setShowProductModal(false)}
          onSaved={fetchProducer}
        />
      )}
      {showOrderModal && producer && (
        <OrderModal
          cart={cart}
          producer={producer}
          onClose={() => setShowOrderModal(false)}
          onSent={(convId) => { setShowOrderModal(false); setCart([]); navigate(`/chat/${convId}`); }}
        />
      )}
    </div>
  );
}
