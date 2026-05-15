import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { useNotification } from '../contexts/NotificationContext';
import type { Shop, ShopProduct, ShopPromotion } from '../lib/types';
import { formatPrice } from '../lib/utils';
import { Store, Plus, CreditCard as Edit2, Trash2, X, Upload, Package, Percent, Clock, Check, Tag, Image as ImageIcon, Globe, MapPin, Mail, Phone, Eye, EyeOff, Star, Sparkles, ChevronDown, ShieldCheck, Save } from 'lucide-react';
import { HUNGARIAN_COUNTIES } from '../lib/utils';

const SHOP_CATEGORIES = [
  { value: 'electronics', label: 'Elektronika' },
  { value: 'fashion', label: 'Ruha / Divat' },
  { value: 'food', label: 'Élelmiszer' },
  { value: 'sport', label: 'Sport' },
  { value: 'furniture', label: 'Bútor / Lakás' },
  { value: 'books', label: 'Könyv / Zene' },
  { value: 'vehicles', label: 'Jármű' },
  { value: 'kids', label: 'Gyerek' },
  { value: 'pets', label: 'Állatok' },
  { value: 'beauty', label: 'Szépség / Egészség' },
  { value: 'services', label: 'Szolgáltatás' },
  { value: 'other', label: 'Egyéb' },
];

type Tab = 'info' | 'products' | 'promotions';

// ── Product Form ──────────────────────────────────────────────────────────────
function ProductForm({
  shopId,
  initial,
  onSave,
  onCancel,
}: {
  shopId: string;
  initial?: ShopProduct;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [compareAt, setCompareAt] = useState(initial?.compare_at_price != null ? String(initial.compare_at_price) : '');
  const [categoryTag, setCategoryTag] = useState(initial?.category_tag ?? '');
  const [stock, setStock] = useState(initial?.stock != null ? String(initial.stock) : '');
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/shop-product-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('listing-images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
      setImages((prev) => [...prev, data.publicUrl]);
    }
    setUploading(false);
    e.target.value = '';
  }

  async function save() {
    if (!name.trim() || !price) { showToast('error', 'Név és ár megadása kötelező'); return; }
    setSaving(true);
    const payload = {
      shop_id: shopId,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      compare_at_price: compareAt ? parseFloat(compareAt) : null,
      category_tag: categoryTag.trim(),
      stock: stock !== '' ? parseInt(stock) : null,
      is_featured: isFeatured,
      images,
    };

    let error;
    if (initial) {
      ({ error } = await supabase.from('shop_products').update(payload).eq('id', initial.id));
    } else {
      ({ error } = await supabase.from('shop_products').insert(payload));
    }

    if (error) { showToast('error', 'Hiba történt'); }
    else { showToast('success', initial ? 'Termék frissítve' : 'Termék hozzáadva'); onSave(); }
    setSaving(false);
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-zinc-100">{initial ? 'Termék szerkesztése' : 'Új termék'}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-zinc-400 mb-1.5">Terméknév *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120}
            className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
            placeholder="pl. Nyári póló, Fehér" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs text-zinc-400 mb-1.5">Leírás</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none"
            placeholder="Termék részletei..." />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Ár (Ft) *</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0"
            className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
            placeholder="4990" />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Eredeti ár – akció előtti ár (Ft)</label>
          <input type="number" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} min="0"
            className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
            placeholder="Ha van akció, ide írd az eredeti árat" />
          {compareAt && price && parseFloat(compareAt) > parseFloat(price) && (
            <p className="text-[11px] text-amber-400 mt-1">
              -{Math.round((1 - parseFloat(price) / parseFloat(compareAt)) * 100)}% kedvezmény
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Kategória (belső cimke)</label>
          <input value={categoryTag} onChange={(e) => setCategoryTag(e.target.value)} maxLength={60}
            className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
            placeholder="pl. Nyári kollekció, Akció" />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Készlet (elhagyható)</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0"
            className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
            placeholder="Korlátlan" />
        </div>
      </div>

      {/* Kiemelt toggle */}
      <button type="button" onClick={() => setIsFeatured((v) => !v)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all ${isFeatured ? 'bg-amber-500/10 border-amber-500/30' : 'glass-pill border-transparent hover:border-white/10'}`}>
        <Star className={`w-5 h-5 ${isFeatured ? 'text-amber-400' : 'text-zinc-500'}`} />
        <div className="flex-1 text-left">
          <p className={`font-medium text-sm ${isFeatured ? 'text-amber-300' : 'text-zinc-300'}`}>Kiemelt termék</p>
          <p className="text-xs text-zinc-500">A bolt tetején jelenik meg</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isFeatured ? 'bg-amber-500 border-amber-500' : 'border-zinc-600'}`}>
          {isFeatured && <span className="w-2 h-2 rounded-full bg-white block" />}
        </div>
      </button>

      {/* Images */}
      <div>
        <label className="block text-xs text-zinc-400 mb-2"><ImageIcon className="w-3.5 h-3.5 inline mr-1" />Képek (max 6)</label>
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden glass-bubble">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <label className="aspect-square rounded-xl glass-subtle border-2 border-dashed border-white/10 hover:border-emerald-500/40 flex flex-col items-center justify-center cursor-pointer transition-all">
              <Upload className="w-5 h-5 text-zinc-500 mb-1" />
              <span className="text-[10px] text-zinc-500">{uploading ? '...' : 'Kép'}</span>
              <input type="file" accept="image/*" onChange={uploadImage} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving || !name || !price}
          className="flex-1 py-2.5 glass-pill-active text-emerald-300 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />{saving ? 'Mentés...' : 'Mentés'}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 glass-pill text-zinc-400 hover:text-zinc-200 rounded-xl text-sm transition-colors">
          Mégse
        </button>
      </div>
    </div>
  );
}

// ── Promo Form ─────────────────────────────────────────────────────────────────
function PromoForm({
  shopId,
  initial,
  onSave,
  onCancel,
}: {
  shopId: string;
  initial?: ShopPromotion;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { showToast } = useNotification();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [discountPct, setDiscountPct] = useState(initial?.discount_percent != null ? String(initial.discount_percent) : '');
  const [validUntil, setValidUntil] = useState(
    initial?.valid_until ? initial.valid_until.slice(0, 16) : ''
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) { showToast('error', 'Cím megadása kötelező'); return; }
    setSaving(true);
    const payload = {
      shop_id: shopId,
      title: title.trim(),
      description: description.trim(),
      discount_percent: discountPct ? parseInt(discountPct) : null,
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
    };
    let error;
    if (initial) {
      ({ error } = await supabase.from('shop_promotions').update(payload).eq('id', initial.id));
    } else {
      ({ error } = await supabase.from('shop_promotions').insert(payload));
    }
    if (error) { showToast('error', 'Hiba történt'); }
    else { showToast('success', initial ? 'Akció frissítve' : 'Akció létrehozva'); onSave(); }
    setSaving(false);
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-zinc-100">{initial ? 'Akció szerkesztése' : 'Új akció'}</h3>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Akció neve *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
          className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
          placeholder="pl. Nyári vásár — 20% minden termékre" />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Leírás</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none"
          placeholder="Részletek az akcióról..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Kedvezmény (%)</label>
          <input type="number" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} min="1" max="100"
            className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
            placeholder="pl. 20" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Érvényes eddig</label>
          <input type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm" />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving || !title}
          className="flex-1 py-2.5 glass-pill-active text-emerald-300 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />{saving ? 'Mentés...' : 'Mentés'}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 glass-pill text-zinc-400 hover:text-zinc-200 rounded-xl text-sm transition-colors">
          Mégse
        </button>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function ShopDashboardPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useNotification();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [promotions, setPromotions] = useState<ShopPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');

  // Shop form
  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopCategory, setShopCategory] = useState('other');
  const [shopLocation, setShopLocation] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopWebsite, setShopWebsite] = useState('');
  const [shopLogoUrl, setShopLogoUrl] = useState('');
  const [shopBannerUrl, setShopBannerUrl] = useState('');
  const [shopIsActive, setShopIsActive] = useState(true);
  const [shopSaving, setShopSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Products / Promos UI
  const [editingProduct, setEditingProduct] = useState<ShopProduct | 'new' | null>(null);
  const [editingPromo, setEditingPromo] = useState<ShopPromotion | 'new' | null>(null);
  const [quickDiscountProductId, setQuickDiscountProductId] = useState<string | null>(null);
  const [quickDiscountPct, setQuickDiscountPct] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    const { data: shopData } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user!.id)
      .maybeSingle();

    if (shopData) {
      setShop(shopData);
      fillForm(shopData);
      const [pr, pm] = await Promise.all([
        supabase.from('shop_products').select('*').eq('shop_id', shopData.id).order('created_at', { ascending: false }),
        supabase.from('shop_promotions').select('*').eq('shop_id', shopData.id).order('created_at', { ascending: false }),
      ]);
      setProducts(pr.data || []);
      setPromotions(pm.data || []);
    }
    setLoading(false);
  }

  function fillForm(s: Shop) {
    setShopName(s.name);
    setShopSlug(s.slug);
    setShopDesc(s.description);
    setShopCategory(s.category);
    setShopLocation(s.location);
    setShopEmail(s.contact_email);
    setShopPhone(s.contact_phone);
    setShopWebsite(s.website);
    setShopLogoUrl(s.logo_url || '');
    setShopBannerUrl(s.banner_url || '');
    setShopIsActive(s.is_active);
  }

  function slugify(text: string) {
    return text.toLowerCase()
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
      .replace(/ó/g, 'o').replace(/ö/g, 'o').replace(/ő/g, 'o')
      .replace(/ú/g, 'u').replace(/ü/g, 'u').replace(/ű/g, 'u')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  async function uploadShopImage(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    type === 'logo' ? setUploadingLogo(true) : setUploadingBanner(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/shop-${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('listing-images').upload(path, file);
    if (error) {
      showToast('error', 'Feltöltési hiba: ' + error.message);
    } else {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
      type === 'logo' ? setShopLogoUrl(data.publicUrl) : setShopBannerUrl(data.publicUrl);
    }
    type === 'logo' ? setUploadingLogo(false) : setUploadingBanner(false);
    e.target.value = '';
  }

  async function saveShop() {
    if (!shopName.trim() || !shopSlug.trim()) { showToast('error', 'Név és URL kötelező'); return; }
    setShopSaving(true);

    const payload = {
      owner_id: user!.id,
      name: shopName.trim(),
      slug: shopSlug.trim(),
      description: shopDesc.trim(),
      category: shopCategory,
      location: shopLocation,
      contact_email: shopEmail,
      contact_phone: shopPhone,
      website: shopWebsite,
      logo_url: shopLogoUrl || null,
      banner_url: shopBannerUrl || null,
      is_active: shopIsActive,
    };

    let error, newShop: Shop | null = null;
    if (shop) {
      const res = await supabase.from('shops').update(payload).eq('id', shop.id).select().single();
      error = res.error; newShop = res.data;
    } else {
      const res = await supabase.from('shops').insert(payload).select().single();
      error = res.error; newShop = res.data;
      if (!error) {
        await supabase.from('profiles').update({ is_shop_owner: true }).eq('id', user!.id);
      }
    }

    if (error) { showToast('error', 'Hiba: ' + (error.message || 'Ismeretlen hiba')); }
    else if (newShop) {
      setShop(newShop);
      showToast('success', 'Bolt mentve!');
    }
    setShopSaving(false);
  }

  async function deleteProduct(id: string) {
    if (!confirm('Biztosan törlöd a terméket?')) return;
    await supabase.from('shop_products').delete().eq('id', id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('success', 'Termék törölve');
  }

  async function deletePromo(id: string) {
    if (!confirm('Biztosan törlöd az akciót?')) return;
    await supabase.from('shop_promotions').delete().eq('id', id);
    setPromotions((prev) => prev.filter((p) => p.id !== id));
    showToast('success', 'Akció törölve');
  }

  async function toggleProductActive(product: ShopProduct) {
    await supabase.from('shop_products').update({ is_active: !product.is_active }).eq('id', product.id);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
  }

  async function togglePromoActive(promo: ShopPromotion) {
    await supabase.from('shop_promotions').update({ is_active: !promo.is_active }).eq('id', promo.id);
    setPromotions((prev) => prev.map((p) => p.id === promo.id ? { ...p, is_active: !p.is_active } : p));
  }

  async function applyQuickDiscount(product: ShopProduct) {
    const pct = parseFloat(quickDiscountPct);
    if (isNaN(pct) || pct <= 0 || pct >= 100) { showToast('error', 'Adj meg egy 1-99 közötti százalékot'); return; }
    const salePrice = Math.round(product.price * (1 - pct / 100));
    const { error } = await supabase.from('shop_products')
      .update({ compare_at_price: product.price, price: salePrice })
      .eq('id', product.id);
    if (error) { showToast('error', 'Hiba'); return; }
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, compare_at_price: product.price, price: salePrice } : p));
    setQuickDiscountProductId(null);
    setQuickDiscountPct('');
    showToast('success', `-${pct}% akció beállítva`);
  }

  async function removeDiscount(product: ShopProduct) {
    const origPrice = product.compare_at_price ?? product.price;
    const { error } = await supabase.from('shop_products')
      .update({ price: origPrice, compare_at_price: null })
      .eq('id', product.id);
    if (error) { showToast('error', 'Hiba'); return; }
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, price: origPrice, compare_at_price: null } : p));
    showToast('success', 'Akció eltávolítva');
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="glass rounded-3xl h-32 animate-pulse" />
        <div className="glass rounded-2xl h-48 animate-pulse" />
      </div>
    );
  }

  if (!profile?.is_shop_owner && !profile?.is_admin && !shop) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="glass rounded-3xl p-10 space-y-4">
          <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-zinc-500" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Nincs bolt-nyitási jogosultságod</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Bolt létrehozásához az adminisztrátor jóváhagyása szükséges. Vedd fel a kapcsolatot az oldal üzemeltetőjével, hogy megkapd a jogosultságot.
          </p>
          <button onClick={() => navigate('/shops')} className="mt-2 glass-pill text-emerald-400 hover:text-emerald-300 px-5 py-2.5 rounded-xl text-sm transition-colors">
            Boltok böngészése
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 glass-bubble rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{shop ? shop.name : 'Bolt kezelése'}</h1>
            {shop && (
              <button onClick={() => navigate(`/shops/${shop.slug}`)} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                Bolt megtekintése →
              </button>
            )}
          </div>
        </div>
        {shop?.is_verified && (
          <span className="flex items-center gap-1 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />Hitelesített
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { value: 'info', label: 'Bolt adatai', icon: Store },
          { value: 'products', label: `Termékek (${products.length})`, icon: Package },
          { value: 'promotions', label: `Akciók (${promotions.length})`, icon: Percent },
        ] as const).map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => setTab(value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === value ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ──────────────────────────────────────────────────────── */}
      {tab === 'info' && (
        <div className="glass rounded-3xl p-6 space-y-5">
          {!shop && (
            <div className="flex items-start gap-3 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
              <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Nyiss boltot ingyen!</p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Saját online boltban értékesítheted a termékeid és hirdedhetsz akciókat. A bolt különálló a piactértől.
                </p>
              </div>
            </div>
          )}

          {/* Logo + Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-2">Logó</label>
              <div className="relative">
                <div className="w-full aspect-square max-w-[100px] rounded-2xl overflow-hidden glass-bubble flex items-center justify-center">
                  {shopLogoUrl ? <img src={shopLogoUrl} alt="" className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-zinc-600" />}
                </div>
                <label className="mt-2 flex items-center gap-1.5 cursor-pointer text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  <Upload className="w-3.5 h-3.5" />{uploadingLogo ? 'Feltöltés...' : 'Logó feltöltése'}
                  <input type="file" accept="image/*" onChange={(e) => uploadShopImage(e, 'logo')} className="hidden" disabled={uploadingLogo} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-2">Banner kép</label>
              <div className="w-full aspect-[3/1] rounded-2xl overflow-hidden glass-bubble flex items-center justify-center">
                {shopBannerUrl ? <img src={shopBannerUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-zinc-600" />}
              </div>
              <label className="mt-2 flex items-center gap-1.5 cursor-pointer text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                <Upload className="w-3.5 h-3.5" />{uploadingBanner ? 'Feltöltés...' : 'Banner feltöltése'}
                <input type="file" accept="image/*" onChange={(e) => uploadShopImage(e, 'banner')} className="hidden" disabled={uploadingBanner} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Bolt neve *</label>
            <input value={shopName} onChange={(e) => { setShopName(e.target.value); if (!shop) setShopSlug(slugify(e.target.value)); }}
              className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
              placeholder="pl. Kovács Elektronika" maxLength={80} />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">URL azonosító (slug) *</label>
            <div className="flex items-center glass-input rounded-xl overflow-hidden">
              <span className="pl-3.5 text-xs text-zinc-600 whitespace-nowrap">/shops/</span>
              <input value={shopSlug} onChange={(e) => setShopSlug(slugify(e.target.value))}
                className="flex-1 px-2 py-2.5 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
                placeholder="kovacs-elektronika" maxLength={60} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Leírás</label>
            <textarea value={shopDesc} onChange={(e) => setShopDesc(e.target.value)} rows={3}
              className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none"
              placeholder="Rövid bemutatkozó..." maxLength={400} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5"><Tag className="w-3 h-3 inline mr-1" />Kategória</label>
              <select value={shopCategory} onChange={(e) => setShopCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm">
                {SHOP_CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5"><MapPin className="w-3 h-3 inline mr-1" />Helyszín</label>
              <select value={shopLocation} onChange={(e) => setShopLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm">
                <option value="">Nem megadott</option>
                {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} type="email"
                className="w-full pl-8 pr-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
                placeholder="kapcsolat@bolt.hu" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} type="tel"
                className="w-full pl-8 pr-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
                placeholder="+36 30 123 4567" />
            </div>
          </div>

          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input value={shopWebsite} onChange={(e) => setShopWebsite(e.target.value)} type="url"
              className="w-full pl-8 pr-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
              placeholder="https://www.boltom.hu" />
          </div>

          {/* Active toggle */}
          <button type="button" onClick={() => setShopIsActive((v) => !v)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all ${shopIsActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'glass-pill border-transparent hover:border-white/10'}`}>
            {shopIsActive ? <Eye className="w-5 h-5 text-emerald-400" /> : <EyeOff className="w-5 h-5 text-zinc-500" />}
            <div className="flex-1 text-left">
              <p className={`font-medium text-sm ${shopIsActive ? 'text-emerald-300' : 'text-zinc-400'}`}>{shopIsActive ? 'Bolt nyilvánosan látható' : 'Bolt elrejtve'}</p>
              <p className="text-xs text-zinc-500">Kapcsold ki, ha átmenetileg nem fogadsz megrendelést</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${shopIsActive ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}`}>
              {shopIsActive && <span className="w-2 h-2 rounded-full bg-white block" />}
            </div>
          </button>

          <button onClick={saveShop} disabled={shopSaving || !shopName || !shopSlug}
            className="w-full py-3 glass-pill-active text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />{shopSaving ? 'Mentés...' : shop ? 'Bolt adatainak mentése' : 'Bolt létrehozása'}
          </button>
        </div>
      )}

      {/* ── PRODUCTS TAB ──────────────────────────────────────────────────── */}
      {tab === 'products' && shop && (
        <div className="space-y-4">
          {editingProduct === 'new' || editingProduct ? (
            <ProductForm
              shopId={shop.id}
              initial={editingProduct !== 'new' ? editingProduct : undefined}
              onSave={async () => { setEditingProduct(null); await loadData(); }}
              onCancel={() => setEditingProduct(null)}
            />
          ) : (
            <button onClick={() => setEditingProduct('new')}
              className="w-full py-3 flex items-center justify-center gap-2 glass-pill text-zinc-300 hover:text-emerald-300 rounded-2xl border border-dashed border-white/10 hover:border-emerald-500/30 transition-all text-sm font-medium">
              <Plus className="w-4 h-4" />Új termék hozzáadása
            </button>
          )}

          {products.length === 0 && editingProduct === null && (
            <div className="text-center py-12 glass rounded-2xl">
              <Package className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Még nincs termék. Adj hozzá egyet!</p>
            </div>
          )}

          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className={`glass-bubble rounded-2xl overflow-hidden transition-all ${!product.is_active ? 'opacity-50' : ''}`}>
                <div className="p-4 flex items-center gap-4">
                  {/* Image */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden glass flex-shrink-0">
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-5 h-5 text-zinc-600 m-auto" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-100 text-sm truncate">{product.name}</p>
                      {product.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-emerald-400 text-sm font-semibold">{formatPrice(product.price)}</span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <>
                          <span className="text-xs text-zinc-600 line-through">{formatPrice(product.compare_at_price)}</span>
                          <span className="text-[10px] bg-amber-500/15 border border-amber-500/25 text-amber-400 px-1.5 py-0.5 rounded-lg font-semibold">
                            -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
                          </span>
                        </>
                      )}
                      {product.stock !== null && (
                        <span className={`text-[10px] ${product.stock === 0 ? 'text-red-400' : 'text-zinc-600'}`}>{product.stock} db</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Quick discount toggle */}
                    {product.compare_at_price && product.compare_at_price > product.price ? (
                      <button onClick={() => removeDiscount(product)} title="Akció eltávolítása"
                        className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-amber-400 hover:text-red-400 transition-colors">
                        <Percent className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => { setQuickDiscountProductId(product.id); setQuickDiscountPct(''); }} title="Akciós ár beállítása"
                        className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-amber-400 transition-colors">
                        <Percent className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => toggleProductActive(product)} title={product.is_active ? 'Elrejtés' : 'Megjelenítés'}
                      className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors">
                      {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setEditingProduct(product)}
                      className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-emerald-400 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProduct(product.id)}
                      className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline quick discount panel */}
                {quickDiscountProductId === product.id && (
                  <div className="px-4 pb-4 flex items-center gap-2 border-t border-white/5 pt-3">
                    <Percent className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <input
                      type="number" min="1" max="99" value={quickDiscountPct}
                      onChange={(e) => setQuickDiscountPct(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyQuickDiscount(product)}
                      autoFocus
                      className="w-20 px-3 py-1.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm text-center"
                      placeholder="%" />
                    {quickDiscountPct && !isNaN(parseFloat(quickDiscountPct)) && parseFloat(quickDiscountPct) > 0 && parseFloat(quickDiscountPct) < 100 && (
                      <span className="text-xs text-zinc-400">
                        → <span className="text-emerald-400 font-semibold">{formatPrice(Math.round(product.price * (1 - parseFloat(quickDiscountPct) / 100)))}</span>
                        <span className="text-zinc-600 ml-1">(volt: {formatPrice(product.price)})</span>
                      </span>
                    )}
                    <div className="ml-auto flex gap-1.5">
                      <button onClick={() => applyQuickDiscount(product)}
                        className="px-3 py-1.5 glass-pill-active text-emerald-300 rounded-xl text-xs font-medium">
                        Alkalmaz
                      </button>
                      <button onClick={() => setQuickDiscountProductId(null)}
                        className="px-3 py-1.5 glass-pill text-zinc-400 rounded-xl text-xs">
                        Mégse
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROMOTIONS TAB ────────────────────────────────────────────────── */}
      {tab === 'promotions' && shop && (
        <div className="space-y-4">
          {editingPromo === 'new' || editingPromo ? (
            <PromoForm
              shopId={shop.id}
              initial={editingPromo !== 'new' ? editingPromo : undefined}
              onSave={async () => { setEditingPromo(null); await loadData(); }}
              onCancel={() => setEditingPromo(null)}
            />
          ) : (
            <button onClick={() => setEditingPromo('new')}
              className="w-full py-3 flex items-center justify-center gap-2 glass-pill text-zinc-300 hover:text-emerald-300 rounded-2xl border border-dashed border-white/10 hover:border-emerald-500/30 transition-all text-sm font-medium">
              <Plus className="w-4 h-4" />Új akció létrehozása
            </button>
          )}

          {promotions.length === 0 && editingPromo === null && (
            <div className="text-center py-12 glass rounded-2xl">
              <Percent className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Még nincs akció. Hirdess egyet!</p>
            </div>
          )}

          <div className="space-y-2">
            {promotions.map((promo) => (
              <div key={promo.id} className={`glass-bubble rounded-2xl p-4 flex items-start gap-4 transition-all ${!promo.is_active ? 'opacity-50' : ''}`}>
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  {promo.discount_percent
                    ? <span className="text-amber-400 font-bold text-sm">-{promo.discount_percent}%</span>
                    : <Sparkles className="w-5 h-5 text-amber-400" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-100 text-sm truncate">{promo.title}</p>
                  {promo.description && <p className="text-xs text-zinc-500 mt-0.5 truncate">{promo.description}</p>}
                  {promo.valid_until && (
                    <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />Lejár: {new Date(promo.valid_until).toLocaleDateString('hu-HU')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => togglePromoActive(promo)} title={promo.is_active ? 'Szüneteltetés' : 'Aktiválás'}
                    className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors">
                    {promo.is_active ? <Check className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditingPromo(promo)}
                    className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-emerald-400 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deletePromo(promo.id)}
                    className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No shop yet — products/promos tabs locked */}
      {(tab === 'products' || tab === 'promotions') && !shop && (
        <div className="text-center py-12 glass rounded-2xl">
          <Store className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">Előbb hozd létre a boltot a "Bolt adatai" lapon.</p>
          <button onClick={() => setTab('info')} className="mt-3 text-sm text-emerald-400 hover:text-emerald-300">Bolt adatai →</button>
        </div>
      )}
    </div>
  );
}