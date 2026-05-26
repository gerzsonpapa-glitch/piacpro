import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { Shop, ShopProduct, ShopPromotion } from '../lib/types';
import { formatPrice } from '../lib/utils';
import { useSEO } from '../lib/seo';
import { Store, Search, MapPin, ShieldCheck, Mail, Phone, Globe, Tag, Package, Percent, Clock, ArrowLeft, ExternalLink, Star, Sparkles, Settings, X, ChevronLeft, ChevronRight, Save, Trash2, MessageCircle, Percent as PercentIcon } from 'lucide-react';

const CAT_LABELS: Record<string, string> = {
  electronics: 'Elektronika', fashion: 'Ruha / Divat', food: 'Élelmiszer',
  sport: 'Sport', furniture: 'Bútor / Lakás', books: 'Könyv / Zene',
  vehicles: 'Jármű', kids: 'Gyerek', pets: 'Állatok',
  beauty: 'Szépség / Egészség', services: 'Szolgáltatás', other: 'Egyéb',
};

// ── Product Detail Modal ──────────────────────────────────────────────────────
function ProductModal({
  product,
  isOwner,
  shopOwnerId,
  onClose,
  onUpdated,
}: {
  product: ShopProduct;
  isOwner: boolean;
  shopOwnerId: string;
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
  const [msgLoading, setMsgLoading] = useState(false);

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

  async function startChat() {
    if (!user) { navigate('/login'); return; }
    if (user.id === shopOwnerId) return;
    setMsgLoading(true);
    // Look for existing conversation for this specific product
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', shopOwnerId)
      .eq('shop_product_id', product.id)
      .maybeSingle();
    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: shopOwnerId, listing_id: null, shop_product_id: product.id })
        .select('id').maybeSingle();
      if (newConv) navigate(`/chat/${newConv.id}`);
    }
    setMsgLoading(false);
    onClose();
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
          {!isOwner && user?.id !== shopOwnerId && (
            <button
              onClick={startChat}
              disabled={msgLoading || product.stock === 0}
              className="w-full flex items-center justify-center gap-2 py-3 glass-pill-active text-emerald-300 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" />
              {msgLoading ? 'Megnyitás...' : 'Üzenet az eladónak'}
            </button>
          )}
          {!user && (
            <button
              onClick={() => { navigate('/login'); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-3 glass-pill text-zinc-400 hover:text-emerald-300 rounded-2xl font-semibold text-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Bejelentkezés az üzenetküldéshez
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }: { product: ShopProduct; onClick: () => void }) {
  const hasDiscount = product.compare_at_price != null && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className="group text-left w-full glass-bubble rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] border border-transparent hover:border-emerald-500/15"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
            -{discountPct}%
          </span>
        )}
        {product.is_featured && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 glass-strong text-amber-300 text-[10px] font-semibold px-2 py-1 rounded-lg">
            <Star className="w-2.5 h-2.5" />Kiemelt
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="glass-strong text-zinc-400 text-sm font-medium px-4 py-2 rounded-xl">Elfogyott</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 truncate group-hover:text-emerald-300 transition-colors">
          {product.name}
        </h3>
        {product.category_tag && (
          <p className="text-[10px] text-zinc-600 mt-0.5 flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />{product.category_tag}
          </p>
        )}
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className={`font-bold text-lg ${product.stock === 0 ? 'text-zinc-500' : 'text-emerald-400'}`}>
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-zinc-600 text-xs line-through">{formatPrice(product.compare_at_price!)}</span>
          )}
        </div>
        {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
          <p className="text-[10px] text-amber-400 mt-1">Csak {product.stock} db maradt</p>
        )}
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShopDetailPage() {
  const { params, navigate } = useRouter();
  const { user, profile } = useAuth();
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

  useEffect(() => { if (slug) loadShop(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadShop() {
    const { data: shopData } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

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

  const isOwner = user?.id === shop?.owner_id || profile?.is_admin;

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

      {/* Product modal */}
      {selectedProduct && shop && (
        <ProductModal
          product={selectedProduct}
          isOwner={!!isOwner}
          shopOwnerId={shop.owner_id}
          onClose={() => setSelectedProduct(null)}
          onUpdated={(updated) => {
            setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            setSelectedProduct(updated);
          }}
        />
      )}

      {/* Back + manage */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/shops')}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />Boltok
        </button>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
          ))}
        </div>
      )}
    </div>
  );
}


