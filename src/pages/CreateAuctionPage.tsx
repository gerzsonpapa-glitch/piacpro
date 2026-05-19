import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { useNotification } from '../contexts/NotificationContext';
import type { Category } from '../lib/types';
import { HUNGARIAN_COUNTIES } from '../lib/utils';
import { Upload, X, MapPin, Gavel, Tag, FileText, ImagePlus, Clock, TrendingUp } from 'lucide-react';

const conditions = [
  { value: 'new', label: 'Új', emoji: '✨' },
  { value: 'like-new', label: 'Újszerű', emoji: '💎' },
  { value: 'used', label: 'Használt', emoji: '👍' },
  { value: 'fair', label: 'Közepes', emoji: '🔧' },
  { value: 'poor', label: 'Rossz', emoji: '⚠️' },
];

const BID_INCREMENTS = [100, 250, 500, 1000, 2500, 5000, 10000];

export default function CreateAuctionPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useNotification();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [minIncrement, setMinIncrement] = useState(500);
  const [durationHours, setDurationHours] = useState<24 | 48>(24);
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('used');
  const [location, setLocation] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('categories').select('*').is('parent_id', null).order('sort_order')
      .then(({ data }) => setCategories(data || []));
  }, [user]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (imageUrls.length + newUrls.length >= 8) break;
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('listing-images').upload(path, file);
      if (!error) {
        const { data: u } = supabase.storage.from('listing-images').getPublicUrl(path);
        newUrls.push(`${u.publicUrl}?t=${Date.now()}`);
      }
    }
    setImageUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !startingPrice) return;
    setLoading(true);

    const endsAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

    // Create listing first
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        title,
        description,
        price: parseFloat(startingPrice),
        category_id: categoryId || null,
        condition,
        location,
        images: imageUrls,
        listing_type: 'auction',
        status: 'active',
      })
      .select()
      .single();

    if (listingError || !listing) {
      showToast('error', 'Hiba történt', 'Az aukció létrehozása sikertelen. Kérjük, próbáld újra.');
      setLoading(false);
      return;
    }

    // Create auction record
    const { error: auctionError } = await supabase
      .from('auctions')
      .insert({
        listing_id: listing.id,
        seller_id: user.id,
        starting_price: parseFloat(startingPrice),
        current_price: parseFloat(startingPrice),
        min_bid_increment: minIncrement,
        duration_hours: durationHours,
        ends_at: endsAt,
        status: 'active',
      });

    if (auctionError) {
      // Clean up orphan listing if auction creation failed
      await supabase.from('listings').update({ status: 'deleted' }).eq('id', listing.id);
      showToast('error', 'Hiba történt', 'Az aukció adatainak mentése sikertelen. Kérjük, próbáld újra.');
    } else {
      navigate(`/auction/${listing.id}`);
    }
    setLoading(false);
  }

  const previewEndTime = new Date(Date.now() + durationHours * 3600 * 1000);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 glass-bubble rounded-xl flex items-center justify-center">
          <Gavel className="w-5 h-5 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold">Aukció indítása</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 glass rounded-3xl p-6">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <ImagePlus className="w-4 h-4 inline mr-1" />Képek (max 8)
          </label>
          <div className="grid grid-cols-4 gap-3">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden glass-bubble">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImageUrls((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                  <X className="w-3 h-3 text-white" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] glass-pill-active text-emerald-300 px-1.5 py-0.5 rounded-lg font-medium">Borító</span>}
              </div>
            ))}
            {imageUrls.length < 8 && (
              <label className="aspect-square rounded-2xl glass-subtle border-2 border-dashed border-white/10 hover:border-amber-500/40 flex flex-col items-center justify-center cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                <span className="text-xs text-zinc-500">{uploading ? 'Feltöltés...' : 'Feltöltés'}</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <Tag className="w-4 h-4 inline mr-1" />Termék neve
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
            placeholder="pl. Vintage kerékpár" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <FileText className="w-4 h-4 inline mr-1" />Leírás
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none transition-all"
            placeholder="Részletes leírás..." />
        </div>

        {/* Starting price */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <TrendingUp className="w-4 h-4 inline mr-1" />Kezdő ár (Ft)
          </label>
          <input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} required min="0"
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
            placeholder="pl. 10000" />
        </div>

        {/* Min increment */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Minimum licitlépés</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {BID_INCREMENTS.map((inc) => (
              <button key={inc} type="button" onClick={() => setMinIncrement(inc)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${minIncrement === inc ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
                {inc >= 1000 ? `${inc / 1000}k` : inc}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-1.5">Min. licitlépés: {minIncrement.toLocaleString('hu-HU')} Ft</p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />Aukció időtartama
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([24, 48] as const).map((h) => (
              <button key={h} type="button" onClick={() => setDurationHours(h)}
                className={`flex flex-col items-center py-4 rounded-2xl transition-all ${durationHours === h ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
                <span className="text-2xl font-bold">{h}</span>
                <span className="text-sm">óra</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">
            Vége: {previewEndTime.toLocaleString('hu-HU', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Kategória</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none transition-all">
              <option value="">Kategória</option>
              {categories.filter((c) => !c.parent_id).map((parent) => {
                const children = categories.filter((c) => c.parent_id === parent.id);
                return children.length > 0 ? (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>{parent.name} — összes</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={parent.id} value={parent.id}>{parent.name}</option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Állapot</label>
            <div className="flex gap-1">
              {conditions.map((c) => (
                <button key={c.value} type="button" onClick={() => setCondition(c.value)}
                  title={c.label}
                  className={`flex-1 py-3 rounded-xl text-lg transition-all ${condition === c.value ? 'glass-pill-active scale-[1.05]' : 'glass-pill opacity-60 hover:opacity-100'}`}>
                  {c.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <MapPin className="w-4 h-4 inline mr-1" />Helyszín
          </label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none transition-all">
            <option value="">Válassz megyét</option>
            {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button type="submit" disabled={loading || !title || !startingPrice}
          className="w-full py-3 bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50">
          {loading ? 'Aukció indítása...' : 'Aukció indítása'}
        </button>
      </form>
    </div>
  );
}
