import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { LocalBusiness, LocalBusinessItem, BusinessType } from '../lib/types';
import { BUSINESS_TYPE_LABELS } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';
import {
  ArrowLeft, MapPin, Star, CheckCircle, Zap, Heart, Globe,
  Phone, Mail, Sprout, Scissors, Store, Briefcase, Home, UserCheck,
  MessageCircle, Package, ChevronLeft, ChevronRight, X, Banknote, Search,
  Pencil, Trash2, PlusCircle, AlertCircle, Tag, Leaf
} from 'lucide-react';
import { useSEO } from '../lib/seo';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<BusinessType, React.ComponentType<{ className?: string }>> = {
  producer: Sprout,
  craftsman: Scissors,
  shop: Store,
  service: Briefcase,
  family: Home,
  specialist: UserCheck,
};

const TYPE_COLORS: Record<BusinessType, string> = {
  producer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  craftsman: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  shop: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  service: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  family: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  specialist: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
};

function formatPrice(price: number | null, compareAt: number | null, unit: string) {
  if (!price) return null;
  const fmt = (n: number) => new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(n) + ' Ft';
  const unitLabel = unit && unit !== 'db' ? `/${unit}` : '';
  if (compareAt && compareAt > price) {
    return { current: fmt(price) + unitLabel, original: fmt(compareAt) + unitLabel, discount: Math.round((1 - price / compareAt) * 100) };
  }
  return { current: fmt(price) + unitLabel, original: null, discount: null };
}

// ── Image gallery ─────────────────────────────────────────────────────────────

function ImageGallery({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) return null;
  return (
    <div className="relative rounded-2xl overflow-hidden bg-zinc-900">
      <img src={images[current]} alt="" className="w-full h-56 object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrent((c) => (c + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────────

function ItemCard({ item, isOwner, onEdit, onDelete }: {
  item: LocalBusinessItem;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const priceInfo = formatPrice(item.price, item.compare_at_price, item.unit);

  return (
    <div className="glass rounded-2xl overflow-hidden group hover:border-white/8 border border-transparent transition-all">
      {item.images.length > 0 && (
        <div className="relative h-40 overflow-hidden bg-zinc-900">
          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {item.is_featured && (
            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/80 text-amber-100">Kiemelt</span>
          )}
          {item.is_fresh && (
            <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/80 text-white">
              <Leaf className="w-2.5 h-2.5" />Friss
            </span>
          )}
          {isOwner && (
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="w-7 h-7 bg-black/70 rounded-lg flex items-center justify-center text-zinc-300 hover:text-emerald-300 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} className="w-7 h-7 bg-black/70 rounded-lg flex items-center justify-center text-zinc-300 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-zinc-200 text-sm line-clamp-2 leading-snug">{item.name}</p>
          {isOwner && item.images.length === 0 && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onEdit} className="p-1 glass-pill rounded-lg text-zinc-500 hover:text-emerald-300 transition-colors"><Pencil className="w-3 h-3" /></button>
              <button onClick={onDelete} className="p-1 glass-pill rounded-lg text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
            </div>
          )}
        </div>
        {item.description && <p className="text-xs text-zinc-600 line-clamp-2">{item.description}</p>}
        <div className="flex items-center justify-between">
          {priceInfo ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-emerald-400">{priceInfo.current}</span>
              {priceInfo.original && (
                <>
                  <span className="text-xs text-zinc-600 line-through">{priceInfo.original}</span>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md">-{priceInfo.discount}%</span>
                </>
              )}
            </div>
          ) : (
            <span className="text-xs text-zinc-600">Ár: egyedi</span>
          )}
          {item.is_seasonal && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">Szezonális</span>
          )}
        </div>
        {item.stock_note && <p className="text-[10px] text-zinc-600">{item.stock_note}</p>}
        {!item.is_available && (
          <p className="text-[10px] text-red-400 font-medium">Nem elérhető</p>
        )}
      </div>
    </div>
  );
}

// ── Item form modal ────────────────────────────────────────────────────────────

interface ItemFormState {
  name: string; description: string; price: string; compareAt: string;
  unit: string; categoryTag: string; isAvailable: boolean; isFeatured: boolean;
  isSeasonal: boolean; isFresh: boolean; stockNote: string; stockQty: string;
}

const EMPTY_ITEM: ItemFormState = {
  name: '', description: '', price: '', compareAt: '', unit: 'db',
  categoryTag: '', isAvailable: true, isFeatured: false, isSeasonal: false,
  isFresh: false, stockNote: '', stockQty: '',
};

const UNIT_OPTIONS = ['db', 'kg', 'g', 'l', 'dl', 'csomag', 'doboz', 'üveg', 'óra', 'alkalom', 'hónap'];

function ItemModal({ initial, onSave, onClose, businessId }: {
  initial: ItemFormState;
  onSave: (d: ItemFormState, images: File[]) => Promise<void>;
  onClose: () => void;
  businessId: string;
}) {
  const [d, setD] = useState<ItemFormState>(initial);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const canSave = d.name.trim().length >= 2;

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImageFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    await onSave(d, imageFiles);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 glass rounded-t-3xl sm:rounded-t-3xl px-6 py-4 flex items-center justify-between border-b border-white/5">
          <h3 className="font-semibold text-zinc-100">Termék / Szolgáltatás</h3>
          <button onClick={onClose} className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-200"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Megnevezés *</label>
            <input type="text" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} maxLength={100}
              placeholder="pl. Házi lekvár, Egyedi ékszer, Kőműves szolgáltatás"
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Leírás</label>
            <textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} rows={3} maxLength={500}
              placeholder="Rövid leírás..."
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1.5">Ár (Ft)</label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="number" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} min="0"
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Egység</label>
              <select value={d.unit} onChange={(e) => setD({ ...d, unit: e.target.value })}
                className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none">
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Eredeti ár (kedvezmény előtt, opcionális)</label>
            <input type="number" value={d.compareAt} onChange={(e) => setD({ ...d, compareAt: e.target.value })} min="0"
              placeholder="0"
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Kategória / Cimke</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={d.categoryTag} onChange={(e) => setD({ ...d, categoryTag: e.target.value })} maxLength={50}
                placeholder="pl. Befőtt, Ékszer, Burkolás"
                className="w-full pl-9 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Képek (max 5)</label>
            <input type="file" accept="image/*" multiple onChange={handleImages}
              className="w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:glass-pill file:text-zinc-300 hover:file:text-zinc-100" />
            {previews.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {previews.map((p, i) => (
                  <img key={i} src={p} alt="" className="h-16 w-16 object-cover rounded-xl flex-shrink-0" />
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Készlet megjegyzés (opcionális)</label>
            <input type="text" value={d.stockNote} onChange={(e) => setD({ ...d, stockNote: e.target.value })} maxLength={100}
              placeholder="pl. Korlátozott készlet, Előrendelésre"
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'isAvailable', label: 'Elérhető', color: 'bg-emerald-500' },
              { key: 'isFeatured', label: 'Kiemelt', color: 'bg-amber-500' },
              { key: 'isSeasonal', label: 'Szezonális', color: 'bg-orange-500' },
              { key: 'isFresh', label: 'Friss', color: 'bg-teal-500' },
            ].map(({ key, label, color }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => setD({ ...d, [key]: !d[key as keyof ItemFormState] })}
                  className={`w-8 h-4 rounded-full transition-all relative flex-shrink-0 ${d[key as keyof ItemFormState] ? color : 'bg-zinc-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${d[key as keyof ItemFormState] ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span className="text-xs text-zinc-400">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={!canSave || saving}
              className="flex-1 py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Mentés...' : 'Mentés'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 glass-pill text-zinc-400 rounded-xl font-medium text-sm hover:text-zinc-200">
              Mégse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Contact / Message modal ────────────────────────────────────────────────────

function ContactModal({ business, onClose }: { business: LocalBusiness; onClose: () => void }) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!user || !message.trim()) return;
    setSending(true);
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', business.owner_id)
      .is('listing_id', null)
      .maybeSingle();
    let convId = existing?.id ?? null;
    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: business.owner_id, listing_id: null })
        .select('id')
        .single();
      convId = newConv?.id ?? null;
    }
    if (convId) {
      await supabase.from('messages').insert({ conversation_id: convId, sender_id: user.id, content: message.trim() });
      showToast('success', 'Üzenet elküldve', 'A vállalkozó értesítést kap.');
    } else {
      showToast('error', 'Hiba', 'Az üzenet küldése sikertelen.');
    }
    setSending(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-100 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" />Üzenet küldése
          </h3>
          <button onClick={onClose} className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="glass-bubble rounded-2xl p-3">
          <p className="text-sm font-medium text-zinc-200">{business.name}</p>
          {business.location && <p className="text-xs text-zinc-500 mt-0.5">{business.location}</p>}
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
          placeholder="Üzeneted a vállalkozónak..."
          className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none" />
        <div className="flex gap-2">
          <button onClick={handleSend} disabled={!message.trim() || sending || !user}
            className="flex-1 py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm disabled:opacity-40 flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" />{sending ? 'Küldés...' : 'Küldés'}
          </button>
          <button onClick={onClose} className="px-5 py-3 glass-pill text-zinc-400 rounded-xl font-medium text-sm hover:text-zinc-200">Mégse</button>
        </div>
        {!user && <p className="text-xs text-zinc-500 text-center">Bejelentkezés szükséges az üzenethez.</p>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BusinessProfilePage({ id }: { id: string }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useNotification();

  const [business, setBusiness] = useState<LocalBusiness | null>(null);

  useSEO({
    title: business ? business.name : 'Helyi vállalkozás',
    description: business
      ? `${business.name}${business.tagline ? ' – ' + business.tagline : ''}${business.location ? ' | ' + business.location : ''} | PiacPro Helyi vállalkozások`
      : undefined,
    image: business?.logo_url ?? undefined,
    path: `/helyi-vallalkozasok/${id}`,
  });
  const [items, setItems] = useState<LocalBusinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [coverErr, setCoverErr] = useState(false);
  const [editingItem, setEditingItem] = useState<LocalBusinessItem | null | 'new'>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => { fetchBusiness(); }, [id]);

  async function fetchBusiness() {
    setLoading(true);
    const { data } = await supabase
      .from('local_businesses')
      .select('*, owner:profiles(id, username, full_name, avatar_url)')
      .or(`slug.eq.${id},id.eq.${id}`)
      .maybeSingle();
    if (data) {
      setBusiness(data as LocalBusiness);
      await fetchItems(data.id);
    }
    setLoading(false);
  }

  async function fetchItems(businessId: string) {
    const { data } = await supabase
      .from('local_business_items')
      .select('*')
      .eq('business_id', businessId)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    setItems((data || []) as LocalBusinessItem[]);
  }

  async function uploadItemImages(files: File[], itemId: string): Promise<string[]> {
    if (!user || !business) return [];
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const ext = files[i].name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${business.id}/${itemId}-${i}.${ext}`;
      const { error } = await supabase.storage.from('business-images').upload(path, files[i], { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('business-images').getPublicUrl(path);
        urls.push(data.publicUrl + `?t=${Date.now()}`);
      }
    }
    return urls;
  }

  async function handleItemSave(d: ItemFormState, imageFiles: File[]) {
    if (!business) return;
    const payload = {
      business_id: business.id,
      name: d.name.trim(),
      description: d.description.trim(),
      price: d.price ? parseFloat(d.price) : null,
      compare_at_price: d.compareAt ? parseFloat(d.compareAt) : null,
      unit: d.unit,
      category_tag: d.categoryTag.trim(),
      is_available: d.isAvailable,
      is_featured: d.isFeatured,
      is_seasonal: d.isSeasonal,
      is_fresh: d.isFresh,
      stock_note: d.stockNote.trim(),
      stock_quantity: d.stockQty ? parseInt(d.stockQty) : null,
    };
    if (editingItem === 'new') {
      const { data: newItem } = await supabase.from('local_business_items').insert(payload).select().single();
      if (newItem && imageFiles.length > 0) {
        const urls = await uploadItemImages(imageFiles, newItem.id);
        if (urls.length) await supabase.from('local_business_items').update({ images: urls }).eq('id', newItem.id);
      }
      showToast('success', 'Hozzáadva', 'Az elem sikeresen hozzáadva.');
    } else if (editingItem) {
      let images = editingItem.images;
      if (imageFiles.length > 0) images = await uploadItemImages(imageFiles, editingItem.id);
      await supabase.from('local_business_items').update({ ...payload, images }).eq('id', editingItem.id);
      showToast('success', 'Mentve', 'Az elem frissítve.');
    }
    setEditingItem(null);
    await fetchItems(business.id);
  }

  async function handleItemDelete(itemId: string) {
    await supabase.from('local_business_items').delete().eq('id', itemId);
    setDeletingItemId(null);
    showToast('success', 'Törölve', 'Az elem eltávolítva.');
    if (business) await fetchItems(business.id);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="glass rounded-3xl h-48 animate-pulse" />
        <div className="glass rounded-3xl h-32 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="glass rounded-2xl h-44 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-24 space-y-4">
        <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
        <p className="text-zinc-400">A vállalkozás nem található.</p>
        <button onClick={() => navigate('/helyi-vallalkozasok')} className="glass-pill text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-xl text-sm transition-colors">
          Vissza a listához
        </button>
      </div>
    );
  }

  const isOwner = user?.id === business.owner_id;
  const TypeIcon = TYPE_ICONS[business.business_type] ?? Store;
  const typeColor = TYPE_COLORS[business.business_type] ?? TYPE_COLORS.shop;

  const filteredItems = items.filter((item) => {
    if (!itemSearch) return true;
    const q = itemSearch.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category_tag.toLowerCase().includes(q);
  });

  const initialForm: ItemFormState = editingItem && editingItem !== 'new' ? {
    name: editingItem.name,
    description: editingItem.description,
    price: editingItem.price?.toString() || '',
    compareAt: editingItem.compare_at_price?.toString() || '',
    unit: editingItem.unit,
    categoryTag: editingItem.category_tag,
    isAvailable: editingItem.is_available,
    isFeatured: editingItem.is_featured,
    isSeasonal: editingItem.is_seasonal,
    isFresh: editingItem.is_fresh,
    stockNote: editingItem.stock_note,
    stockQty: editingItem.stock_quantity?.toString() || '',
  } : EMPTY_ITEM;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/helyi-vallalkozasok')}
        className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />Vissza
      </button>

      {/* Hero / cover */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="relative h-44 bg-zinc-800/60">
          {business.cover_url && !coverErr ? (
            <img src={business.cover_url} alt={business.name} onError={() => setCoverErr(true)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="w-14 h-14 text-zinc-700" />
            </div>
          )}
          {/* Status badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {business.is_verified && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="w-3 h-3" />Ellenőrzött
              </span>
            )}
            {business.is_local_favorite && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-amber-400 border border-amber-500/30">
                <Heart className="w-3 h-3" />Helyi kedvenc
              </span>
            )}
            {business.is_available_today && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-emerald-400 border border-emerald-500/30">
                <Zap className="w-3 h-3" />Ma elérhető
              </span>
            )}
          </div>
          {/* Logo */}
          <div className="absolute -bottom-6 left-5">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-2xl border-2 border-zinc-900 object-cover shadow-xl" />
            ) : (
              <div className="w-16 h-16 rounded-2xl border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center shadow-xl">
                <TypeIcon className="w-7 h-7 text-zinc-400" />
              </div>
            )}
          </div>
          {/* Owner actions */}
          {isOwner && (
            <div className="absolute top-3 right-3">
              <button
                onClick={() => navigate('/vallalkozasom')}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm text-zinc-200 hover:text-white border border-white/10 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />Szerkesztés
              </button>
            </div>
          )}
        </div>

        <div className="pt-9 pb-5 px-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-zinc-100">{business.name}</h1>
              {business.tagline && <p className="text-zinc-400 text-sm mt-0.5">{business.tagline}</p>}
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold flex-shrink-0 ${typeColor}`}>
              <TypeIcon className="w-3.5 h-3.5" />
              {BUSINESS_TYPE_LABELS[business.business_type]}
            </span>
          </div>

          {business.description && (
            <p className="text-zinc-500 text-sm leading-relaxed">{business.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
            {business.location && (
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-zinc-600" />{business.location}</span>
            )}
            {business.avg_rating > 0 && (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                {business.avg_rating.toFixed(1)} ({business.review_count} értékelés)
              </span>
            )}
          </div>

          {business.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {business.categories.map((cat) => (
                <span key={cat} className="text-xs px-2.5 py-1 rounded-xl glass-pill text-zinc-400">{cat}</span>
              ))}
            </div>
          )}

          {/* Contact row */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!isOwner && user && (
              <button
                onClick={() => setShowContact(true)}
                className="flex items-center gap-2 glass-pill-active text-emerald-300 px-4 py-2 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all"
              >
                <MessageCircle className="w-4 h-4" />Kapcsolatfelvétel
              </button>
            )}
            {business.contact_phone && (
              <a href={`tel:${business.contact_phone}`} className="flex items-center gap-1.5 glass-pill text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-xl text-sm transition-colors">
                <Phone className="w-3.5 h-3.5" />{business.contact_phone}
              </a>
            )}
            {business.contact_email && (
              <a href={`mailto:${business.contact_email}`} className="flex items-center gap-1.5 glass-pill text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-xl text-sm transition-colors">
                <Mail className="w-3.5 h-3.5" />{business.contact_email}
              </a>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 glass-pill text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-xl text-sm transition-colors">
                <Globe className="w-3.5 h-3.5" />Weboldal
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Items section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-zinc-200 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            Termékek & szolgáltatások
            <span className="text-zinc-600 font-normal text-sm">({items.length})</span>
          </h2>
          {isOwner && (
            <button
              onClick={() => setEditingItem('new')}
              className="flex items-center gap-1.5 glass-pill-active text-emerald-300 px-3 py-2 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all"
            >
              <PlusCircle className="w-4 h-4" />Hozzáadás
            </button>
          )}
        </div>

        {items.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Keresés a termékek között..."
              className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <Package className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">
              {isOwner ? 'Még nincs termék. Adj hozzá egyet!' : 'Még nincsenek termékek.'}
            </p>
            {isOwner && (
              <button onClick={() => setEditingItem('new')}
                className="mt-3 glass-pill-active text-emerald-300 px-4 py-2 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all inline-flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />Első termék hozzáadása
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isOwner={isOwner}
                onEdit={() => setEditingItem(item)}
                onDelete={() => setDeletingItemId(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showContact && business && <ContactModal business={business} onClose={() => setShowContact(false)} />}

      {editingItem !== null && (
        <ItemModal
          initial={initialForm}
          onSave={handleItemSave}
          onClose={() => setEditingItem(null)}
          businessId={business.id}
        />
      )}

      {deletingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="w-12 h-12 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-zinc-100 mb-1">Törlés megerősítése</h3>
              <p className="text-zinc-400 text-sm">Biztosan törlöd ezt az elemet?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleItemDelete(deletingItemId)}
                className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium text-sm hover:bg-red-500/30 transition-colors">
                Törlés
              </button>
              <button onClick={() => setDeletingItemId(null)}
                className="flex-1 py-3 glass-pill text-zinc-400 rounded-xl font-medium text-sm hover:text-zinc-200 transition-colors">
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
