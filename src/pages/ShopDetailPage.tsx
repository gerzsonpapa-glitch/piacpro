import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { Shop, ShopProduct, ShopPromotion } from '../lib/types';
import { formatPrice } from '../lib/utils';
import { useSEO } from '../lib/seo';
import { openConversationWithMessage } from '../lib/conversations';
import FlowInfoBar from '../components/navigation/FlowInfoBar';
import Breadcrumb from '../components/navigation/Breadcrumb';
import {
  Store, Search, MapPin, ShieldCheck, Mail, Phone, Globe, Tag, Package, Percent, Clock,
  ArrowLeft, ExternalLink, Star, Sparkles, Settings, X, ChevronLeft, ChevronRight, Save, Trash2,
  MessageCircle, Percent as PercentIcon, Plus, Minus, Send, ShoppingCart,
} from 'lucide-react';

const CAT_LABELS: Record<string, string> = {
  electronics: 'Elektronika', fashion: 'Ruha / Divat', food: 'Élelmiszer',
  sport: 'Sport', furniture: 'Bútor / Lakás', books: 'Könyv / Zene',
  vehicles: 'Jármű', kids: 'Gyerek', pets: 'Állatok',
  beauty: 'Szépség / Egészség', services: 'Szolgáltatás', other: 'Egyéb',
};

interface ShopCartItem {
  product: ShopProduct;
  quantity: number;
}

interface StoredShopCartItem {
  productId: string;
  quantity: number;
}

function shopCartStorageKey(shopId: string) {
  return `piacpro_shop_cart_${shopId}`;
}

function loadStoredShopCart(shopId: string): StoredShopCartItem[] {
  try {
    const raw = localStorage.getItem(shopCartStorageKey(shopId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredShopCart(shopId: string, items: StoredShopCartItem[]) {
  if (items.length === 0) {
    localStorage.removeItem(shopCartStorageKey(shopId));
    return;
  }
  localStorage.setItem(shopCartStorageKey(shopId), JSON.stringify(items));
}

function maxShopOrderQty(product: ShopProduct, currentQty: number) {
  if (product.stock == null) return Infinity;
  return Math.max(0, product.stock - currentQty);
}

function ShopOrderModal({
  cart,
  shop,
  onClose,
  onSent,
}: {
  cart: ShopCartItem[];
  shop: Shop;
  onClose: () => void;
  onSent: (convId: string) => void;
}) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  async function send() {
    if (!user) return;
    setSending(true);

    const lines = cart.map((item) =>
      `• ${item.product.name}: ${item.quantity} db — ${formatPrice(item.product.price * item.quantity)}`,
    );
    const noteText = note.trim() ? `\n\nMegjegyzés: ${note.trim()}` : '';
    const msgText = `Szia! Szeretnék rendelni:\n\n${lines.join('\n')}\n\nBecsült összeg: ${formatPrice(total)}${noteText}`;

    const { conversationId, error } = await openConversationWithMessage({
      buyerId: user.id,
      sellerId: shop.owner_id,
      context: { kind: 'shop', shopId: shop.id },
      message: msgText,
    });

    setSending(false);
    if (error || !conversationId) {
      showToast('error', 'Hiba', error ?? 'Nem sikerült elküldeni a megrendelést');
      return;
    }
    showToast('success', 'Megrendelés elküldve!', 'A bolt hamarosan válaszol.');
    onSent(conversationId);
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
        <p className="text-xs text-zinc-500">Elküldöd a(z) {shop.name} boltnak:</p>
        <div className="space-y-2">
          {cart.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5">
              <div className="min-w-0">
                <p className="text-sm text-zinc-200 truncate">{product.name}</p>
                <p className="text-[10px] text-zinc-500">{formatPrice(product.price)} / db</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-emerald-300">{quantity} db</p>
                <p className="text-xs text-zinc-500">{formatPrice(product.price * quantity)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-zinc-400">Becsült összeg</span>
          <span className="font-bold text-emerald-300">{formatPrice(total)}</span>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Megjegyzés (átvétel, szállítás, egyéb kérés...)"
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

// ── Product Detail Modal ──────────────────────────────────────────────────────
function ProductModal({
  product,
  isOwner,
  shopOwnerId,
  cartQty,
  onAddToCart,
  onClose,
  onUpdated,
}: {
  product: ShopProduct;
  isOwner: boolean;
  shopOwnerId: string;
  cartQty: number;
  onAddToCart: () => void;
  onClose: () => void;
  onUpdated: (p: ShopProduct) => void;
}) {
  const { showToast } = useNotification();
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [imgIdx, setImgIdx] = useState(0);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(String(product.price));
  const [newCompare, setNewCompare] = useState(product.compare_at_price != null ? String(product.compare_at_price) : '');
  const [saving, setSaving] = useState(false);

  const images = product.images ?? [];
  const hasDiscount = product.compare_at_price != null && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  async function savePrice() {
    const p = parseFloat(newPrice);
    const c = newCompare ? parseFloat(newCompare) : null;
    if (isNaN(p) || p <= 0) { showToast('error', 'Érvénytelen ár'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('shop_products')
      .update({ price: p, compare_at_price: c ?? null })
      .eq('id', product.id);
    if (error) { showToast('error', 'Hiba'); }
    else {
      showToast('success', 'Ár frissítve');
      onUpdated({ ...product, price: p, compare_at_price: c });
      setEditingPrice(false);
    }
    setSaving(false);
  }

  async function removeDiscount() {
    const origPrice = product.compare_at_price ?? product.price;
    const { error } = await supabase
      .from('shop_products')
      .update({ price: origPrice, compare_at_price: null })
      .eq('id', product.id);
    if (!error) {
      showToast('success', 'Akció eltávolítva');
      onUpdated({ ...product, price: origPrice, compare_at_price: null });
    }
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg glass rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 glass-bubble rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image carousel */}
        <div className="relative aspect-[4/3] bg-zinc-900 overflow-hidden flex">
          {images.length > 0 ? (
            <>
              {images.map((src, i) => (
                <img key={src} src={src} alt={product.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${i === imgIdx ? 'opacity-100' : 'opacity-0'}`} />
              ))}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 glass-bubble rounded-full flex items-center justify-center text-zinc-200 hover:text-white transition-colors z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 glass-bubble rounded-full flex items-center justify-center text-zinc-200 hover:text-white transition-colors z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-3' : 'w-1.5 bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-zinc-700" />
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-xl">
              -{discountPct}%
            </span>
          )}
          {product.is_featured && (
            <span className="absolute top-3 right-10 flex items-center gap-1 glass-strong text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-xl">
              <Star className="w-3 h-3" />Kiemelt
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{product.name}</h2>
            {product.category_tag && (
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                <Tag className="w-3 h-3" />{product.category_tag}
              </p>
            )}
          </div>

          {/* Price block */}
          {editingPrice ? (
            <div className="glass-bubble rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-400">Ár szerkesztése</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 mb-1 block">Akciós / aktuális ár (Ft)</label>
                  <input
                    type="number" min="0" value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 mb-1 block">Eredeti ár (áthúzva, Ft)</label>
                  <input
                    type="number" min="0" value={newCompare}
                    onChange={(e) => setNewCompare(e.target.value)}
                    placeholder="Elhagyható"
                    className="w-full px-3 py-2 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm"
                  />
                </div>
              </div>
              {newCompare && newPrice && parseFloat(newCompare) > parseFloat(newPrice) && (
                <p className="text-xs text-amber-400">
                  -{Math.round((1 - parseFloat(newPrice) / parseFloat(newCompare)) * 100)}% kedvezmény
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={savePrice} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-pill-active text-emerald-300 rounded-xl text-sm font-medium transition-all disabled:opacity-60">
                  <Save className="w-4 h-4" />{saving ? 'Mentés...' : 'Mentés'}
                </button>
                <button onClick={() => setEditingPrice(false)}
                  className="px-4 py-2 glass-pill text-zinc-400 rounded-xl text-sm hover:text-zinc-200 transition-colors">
                  Mégse
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-2xl font-bold ${product.stock === 0 ? 'text-zinc-500' : 'text-emerald-400'}`}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-zinc-500 line-through text-base">{formatPrice(product.compare_at_price!)}</span>
                  <span className="text-xs bg-amber-500/15 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-xl font-semibold">
                    -{discountPct}% kedvezmény
                  </span>
                </>
              )}
              {isOwner && (
                <div className="ml-auto flex gap-1.5">
                  <button onClick={() => { setNewPrice(String(product.price)); setNewCompare(product.compare_at_price != null ? String(product.compare_at_price) : ''); setEditingPrice(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 glass-pill text-zinc-400 hover:text-amber-300 rounded-xl text-xs transition-colors">
                    <PercentIcon className="w-3 h-3" />Akció beállítása
                  </button>
                  {hasDiscount && (
                    <button onClick={removeDiscount}
                      className="flex items-center gap-1 px-3 py-1.5 glass-pill text-amber-400 hover:text-red-400 rounded-xl text-xs transition-colors">
                      <Trash2 className="w-3 h-3" />Akció le
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {product.description && (
            <p className="text-sm text-zinc-400 leading-relaxed">{product.description}</p>
          )}

          {/* Stock */}
          {product.stock !== null && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              product.stock === 0
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : product.stock <= 5
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
            }`}>
              <Package className="w-3.5 h-3.5" />
              {product.stock === 0 ? 'Elfogyott' : product.stock <= 5 ? `Csak ${product.stock} db maradt` : `${product.stock} db készleten`}
            </div>
          )}

          {/* Message button — only for non-owner logged-in users */}
          <FlowInfoBar variant="shop" />
          {!isOwner && user?.id !== shopOwnerId && product.stock !== 0 && (
            <button
              type="button"
              onClick={() => { onAddToCart(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-3 glass-pill-active text-emerald-300 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              {cartQty > 0 ? `Kosárban: ${cartQty} db — még egy?` : 'Kosárba teszem'}
            </button>
          )}
          {!user && product.stock !== 0 && (
            <button
              type="button"
              onClick={() => { navigate('/login'); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-3 glass-pill text-zinc-400 hover:text-emerald-300 rounded-2xl font-semibold text-sm transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              Bejelentkezés a rendeléshez
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({
  product,
  cartQty,
  isOwner,
  onOpen,
  onAddToCart,
  onChangeQty,
}: {
  product: ShopProduct;
  cartQty: number;
  isOwner: boolean;
  onOpen: () => void;
  onAddToCart: () => void;
  onChangeQty: (delta: number) => void;
}) {
  const hasDiscount = product.compare_at_price != null && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;
  const inCart = cartQty > 0;
  const outOfStock = product.stock === 0;

  return (
    <div className={`glass-bubble rounded-3xl overflow-hidden transition-all duration-300 border border-transparent hover:border-emerald-500/15 flex flex-col ${inCart ? 'ring-1 ring-emerald-500/40' : ''}`}>
      <button type="button" onClick={onOpen} className="text-left w-full group">
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-zinc-700" /></div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg">-{discountPct}%</span>
          )}
          {product.is_featured && (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 glass-strong text-amber-300 text-[10px] font-semibold px-2 py-1 rounded-lg">
              <Star className="w-2.5 h-2.5" />Kiemelt
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="glass-strong text-zinc-400 text-sm font-medium px-4 py-2 rounded-xl">Elfogyott</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-zinc-100 truncate group-hover:text-emerald-300 transition-colors">{product.name}</h3>
          {product.category_tag && (
            <p className="text-[10px] text-zinc-600 mt-0.5 flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{product.category_tag}</p>
          )}
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className={`font-bold text-lg ${outOfStock ? 'text-zinc-500' : 'text-emerald-400'}`}>{formatPrice(product.price)}</span>
            {hasDiscount && <span className="text-zinc-600 text-xs line-through">{formatPrice(product.compare_at_price!)}</span>}
          </div>
          {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
            <p className="text-[10px] text-amber-400 mt-1">Csak {product.stock} db maradt</p>
          )}
        </div>
      </button>
      {!isOwner && !outOfStock && (
        <div className="px-4 pb-4 mt-auto">
          {!inCart ? (
            <button type="button" onClick={onAddToCart} className="w-full py-2 rounded-xl glass text-zinc-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-xs font-medium transition-all flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Kosárba
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onChangeQty(-1)} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors flex-shrink-0">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 text-center">
                <span className="font-bold text-emerald-300 text-sm">{cartQty}</span>
                <span className="text-zinc-500 text-xs ml-1">db</span>
              </div>
              <button type="button" onClick={() => onChangeQty(1)} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-emerald-400 transition-colors flex-shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShopDetailPage() {
  const { params, navigate } = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useNotification();
  const slug = params.slug as string;

  const [shop, setShop] = useState<Shop | null>(null);

  useSEO({
    title: shop ? shop.name : 'Bolt',
    description: shop
      ? `${shop.name}${shop.description ? ' – ' + shop.description.slice(0, 120) : ''} | ${shop.location ?? ''} | PiacPro Boltok`
      : undefined,
    image: shop?.logo_url ?? undefined,
    path: `/shops/${slug}`,
  });
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [promotions, setPromotions] = useState<ShopPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [cart, setCart] = useState<ShopCartItem[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const cartHydratedRef = useRef(false);

  const isOwner = user?.id === shop?.owner_id || profile?.is_admin;

  function getCartQty(productId: string) {
    return cart.find((c) => c.product.id === productId)?.quantity ?? 0;
  }

  function addToCart(product: ShopProduct) {
    if (product.stock === 0) {
      showToast('error', 'Elfogyott', 'Ez a termék jelenleg nincs készleten.');
      return;
    }
    setCart((prev) => {
      const exists = prev.find((c) => c.product.id === product.id);
      const currentQty = exists?.quantity ?? 0;
      if (maxShopOrderQty(product, currentQty) <= 0) {
        showToast('error', 'Készlet limit', product.stock != null ? `Maximum ${product.stock} db rendelhető.` : 'Nincs több készlet.');
        return prev;
      }
      if (exists) {
        return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) => {
      const item = prev.find((c) => c.product.id === productId);
      if (!item) return prev;
      if (delta > 0 && maxShopOrderQty(item.product, item.quantity) <= 0) {
        showToast('error', 'Készlet limit', item.product.stock != null ? `Maximum ${item.product.stock} db rendelhető.` : 'Nincs több készlet.');
        return prev;
      }
      const updated = prev.map((c) => c.product.id === productId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c);
      return updated.filter((c) => c.quantity > 0);
    });
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  useEffect(() => {
    if (!shop?.id || isOwner) return;
    const stored = loadStoredShopCart(shop.id);
    const hydrated: ShopCartItem[] = [];
    for (const row of stored) {
      const product = products.find((p) => p.id === row.productId);
      if (product && row.quantity > 0) hydrated.push({ product, quantity: row.quantity });
    }
    setCart(hydrated);
    cartHydratedRef.current = true;
  }, [shop?.id, isOwner, products]);

  useEffect(() => {
    if (!shop?.id || isOwner || !cartHydratedRef.current) return;
    saveStoredShopCart(shop.id, cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })));
  }, [cart, shop?.id, isOwner]);

  useEffect(() => { if (slug) loadShop(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadShop() {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let shopQuery = supabase.from('shops').select('*');
    shopQuery = isUuid ? shopQuery.eq('id', slug) : shopQuery.eq('slug', slug);
    const { data: shopData } = await shopQuery.maybeSingle();

    if (!shopData) { setLoading(false); return; }
    setShop(shopData);

    const [pr, pm] = await Promise.all([
      supabase.from('shop_products').select('*').eq('shop_id', shopData.id).eq('is_active', true)
        .order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('shop_promotions').select('*').eq('shop_id', shopData.id).eq('is_active', true)
        .order('created_at', { ascending: false }),
    ]);

    setProducts(pr.data ?? []);
    setPromotions((pm.data ?? []).filter((p) =>
      !p.valid_until || new Date(p.valid_until).getTime() > Date.now()
    ));
    setLoading(false);
  }

  const tags = Array.from(new Set(products.map((p) => p.category_tag).filter(Boolean)));

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);
    const matchTag = !selectedTag || p.category_tag === selectedTag;
    return matchSearch && matchTag;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-3xl h-52 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-bubble rounded-3xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-5 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-24 glass rounded-3xl">
        <Store className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-400 text-lg font-medium">A bolt nem található</p>
        <button onClick={() => navigate('/shops')} className="mt-4 text-sm text-emerald-400 hover:text-emerald-300">
          Vissza a boltokhoz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Főoldal', path: '/' },
        { label: 'Boltok', path: '/shops' },
        { label: shop.name },
      ]} />

      {/* Product modal */}
      {selectedProduct && shop && (
        <ProductModal
          product={selectedProduct}
          isOwner={!!isOwner}
          shopOwnerId={shop.owner_id}
          cartQty={getCartQty(selectedProduct.id)}
          onAddToCart={() => addToCart(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          onUpdated={(updated) => {
            setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            setSelectedProduct(updated);
          }}
        />
      )}

      {showOrderModal && shop && (
        <ShopOrderModal
          cart={cart}
          shop={shop}
          onClose={() => setShowOrderModal(false)}
          onSent={(convId) => {
            setShowOrderModal(false);
            setCart([]);
            if (shop.id) saveStoredShopCart(shop.id, []);
            navigate(`/chat/${convId}`);
          }}
        />
      )}

      {/* Manage */}
      <div className="flex items-center justify-end">
        {isOwner && (
          <button
            onClick={() => navigate('/my-shop')}
            className="flex items-center gap-1.5 glass-pill text-zinc-400 hover:text-emerald-300 px-3.5 py-2 rounded-xl text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />Kezelés
          </button>
        )}
      </div>

      {/* Shop header */}
      <section className="glass rounded-3xl overflow-hidden">
        <div className="relative h-40 sm:h-52 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
          {shop.banner_url ? (
            <img src={shop.banner_url} alt="" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end gap-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center overflow-hidden shadow-xl flex-shrink-0">
              {shop.logo_url
                ? <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                : <Store className="w-7 h-7 text-emerald-400" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow">{shop.name}</h1>
                {shop.is_verified && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />Hitelesített
                  </span>
                )}
              </div>
              {shop.category && (
                <span className="text-xs text-zinc-400">{CAT_LABELS[shop.category] ?? shop.category}</span>
              )}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {shop.description && (
            <p className="text-sm text-zinc-400 leading-relaxed w-full">{shop.description}</p>
          )}
          {shop.location && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="w-3.5 h-3.5" />{shop.location}
            </span>
          )}
          {shop.contact_email && (
            <a href={`mailto:${shop.contact_email}`} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-400 transition-colors">
              <Mail className="w-3.5 h-3.5" />{shop.contact_email}
            </a>
          )}
          {shop.contact_phone && (
            <a href={`tel:${shop.contact_phone}`} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-400 transition-colors">
              <Phone className="w-3.5 h-3.5" />{shop.contact_phone}
            </a>
          )}
          {shop.website && (
            <a href={shop.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              <Globe className="w-3.5 h-3.5" /><ExternalLink className="w-3 h-3" />Weboldal
            </a>
          )}
          <span className="flex items-center gap-1 text-xs text-zinc-600 ml-auto">
            <Package className="w-3.5 h-3.5" />{products.length} termék
          </span>
        </div>
      </section>

      {/* Active promotions */}
      {promotions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-amber-400" />Aktuális akciók
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {promotions.map((promo) => {
              const expiringSoon = promo.valid_until
                ? new Date(promo.valid_until).getTime() - Date.now() < 24 * 3600000
                : false;
              return (
                <div key={promo.id} className="flex gap-4 p-4 glass-bubble rounded-2xl border border-amber-500/15">
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    {promo.discount_percent
                      ? <span className="text-amber-400 font-bold text-sm">-{promo.discount_percent}%</span>
                      : <Sparkles className="w-5 h-5 text-amber-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-100 text-sm">{promo.title}</p>
                    {promo.description && <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{promo.description}</p>}
                    {promo.valid_until && (
                      <p className={`flex items-center gap-1 text-[10px] mt-1.5 ${expiringSoon ? 'text-red-400' : 'text-zinc-600'}`}>
                        <Clock className="w-3 h-3" />
                        Lejár: {new Date(promo.valid_until).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                        {expiringSoon && ' — hamarosan!'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Search + tags */}
      {products.length > 0 && (
        <>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Termék keresése..."
              className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${!selectedTag ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
              >
                Összes
              </button>
              {tags.map((tag) => (
                <button key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedTag === tag ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl">
          <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">Még nincsenek termékek ebben a boltban</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl">
          <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">Nincs találat</p>
          <button onClick={() => { setSearch(''); setSelectedTag(''); }} className="mt-3 text-sm text-emerald-400 hover:text-emerald-300">
            Szűrők törlése
          </button>
        </div>
      ) : (
        <>
          {!isOwner && filtered.length > 0 && <FlowInfoBar variant="shop" />}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-28">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                cartQty={getCartQty(p.id)}
                isOwner={!!isOwner}
                onOpen={() => setSelectedProduct(p)}
                onAddToCart={() => addToCart(p)}
                onChangeQty={(delta) => changeQty(p.id, delta)}
              />
            ))}
          </div>
        </>
      )}

      {!isOwner && cartCount > 0 && shop && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
          <button
            type="button"
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
    </div>
  );
}


