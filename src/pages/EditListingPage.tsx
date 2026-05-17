import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import type { Category, Listing } from '../lib/types';
import { HUNGARIAN_COUNTIES } from '../lib/utils';
import { Upload, X, MapPin, DollarSign, Tag, FileText, Phone, Mail, Save, Truck, Package, Handshake, Video, Play } from 'lucide-react';

const DELIVERY_OPTIONS = [
  {
    id: 'gls',
    name: 'GLS futár',
    price: 1790,
    sellerNote: 'Te fizeted a szállítást (1 790 Ft), a vevő intézi a GLS felvételt.',
    Icon: Truck,
  },
  {
    id: 'magyar-posta',
    name: 'Magyar Posta',
    price: 1490,
    sellerNote: 'Te adod fel a csomagot a legközelebbi postán (1 490 Ft szállítási költség).',
    Icon: Package,
  },
  {
    id: 'personal',
    name: 'Személyes átvétel',
    price: 0,
    sellerNote: 'Ingyenes — egyeztetett helyen és időpontban veszi át a vevő.',
    Icon: Handshake,
  },
];

const conditions = [
  { value: 'new', label: 'Új', emoji: '✨' },
  { value: 'like-new', label: 'Újszerű', emoji: '💎' },
  { value: 'used', label: 'Használt', emoji: '👍' },
  { value: 'fair', label: 'Közepes', emoji: '🔧' },
  { value: 'poor', label: 'Rossz', emoji: '⚠️' },
];

export default function EditListingPage() {
  const { user } = useAuth();
  const { params, navigate } = useRouter();
  const id = params.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('used');
  const [locationCounty, setLocationCounty] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<string[]>(['personal']);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!id) return;

    Promise.all([
      supabase.from('listings').select('*').eq('id', id).maybeSingle(),
      supabase.from('categories').select('*').is('parent_id', null).order('sort_order'),
    ]).then(([{ data: listingData }, { data: catData }]) => {
      if (!listingData) { navigate('/'); return; }
      if (listingData.seller_id !== user.id) { navigate('/'); return; }

      setListing(listingData);
      setTitle(listingData.title);
      setDescription(listingData.description || '');
      setPrice(String(listingData.price));
      setCategoryId(listingData.category_id || '');
      setCondition(listingData.condition || 'used');
      {
        const raw = listingData.location || '';
        const commaIdx = raw.lastIndexOf(', ');
        if (commaIdx > -1) {
          setLocationCity(raw.slice(0, commaIdx));
          setLocationCounty(raw.slice(commaIdx + 2));
        } else {
          setLocationCounty(raw);
          setLocationCity('');
        }
      }
      setPhone(listingData.phone || '');
      setContactEmail(listingData.contact_email || '');
      setImageUrls(listingData.images || []);
      setVideoUrl(listingData.video_url || '');
      setNegotiable(listingData.negotiable || false);
      setSelectedDelivery(listingData.delivery_options?.length ? listingData.delivery_options : ['personal']);
      setCategories(catData || []);
      setPageLoading(false);
    });
  }, [user, id]);

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingVideo(true);
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('listing-videos')
      .upload(fileName, file);

    if (!error) {
      const { data: urlData } = supabase.storage
        .from('listing-videos')
        .getPublicUrl(fileName);
      setVideoUrl(urlData.publicUrl);
    }
    setUploadingVideo(false);
  }

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
        newUrls.push(u.publicUrl);
      }
    }
    setImageUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !listing) return;
    setLoading(true);
    setError('');

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        title,
        description,
        price: parseFloat(price) || 0,
        category_id: categoryId || null,
        condition,
        location: locationCity.trim() ? `${locationCity.trim()}, ${locationCounty}` : locationCounty,
        phone,
        contact_email: contactEmail,
        images: imageUrls,
        video_url: videoUrl || null,
        negotiable,
        delivery_options: selectedDelivery,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listing.id)
      .eq('seller_id', user.id);

    if (updateError) {
      setError('Hiba a mentés során. Kérjük próbáld újra.');
    } else {
      navigate(`/listing/${listing.id}`);
    }
    setLoading(false);
  }

  if (pageLoading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-white/5 rounded w-1/3" />
        <div className="h-64 glass-bubble rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Hirdetés szerkesztése</h1>

      <form onSubmit={handleSubmit} className="space-y-6 glass rounded-3xl p-6">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Képek (max 8)
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
              <label className="aspect-square rounded-2xl glass-subtle border-2 border-dashed border-white/10 hover:border-emerald-500/40 flex flex-col items-center justify-center cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                <span className="text-xs text-zinc-500">{uploading ? 'Feltöltés...' : 'Feltöltés'}</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        {/* Video Upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <Video className="w-4 h-4 inline mr-1" />
            Videó (opcionális, max 100 MB)
          </label>
          {videoUrl ? (
            <div className="relative rounded-2xl overflow-hidden glass-bubble">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-2xl max-h-52 object-cover"
              />
              <button
                type="button"
                onClick={() => setVideoUrl('')}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
              <span className="absolute bottom-2 left-2 text-[10px] glass-pill-active text-emerald-300 px-1.5 py-0.5 rounded-lg font-medium flex items-center gap-1">
                <Play className="w-2.5 h-2.5" />Videó feltöltve
              </span>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-2 py-8 rounded-2xl glass-subtle border-2 border-dashed border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all ${uploadingVideo ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="w-12 h-12 glass-bubble rounded-2xl flex items-center justify-center">
                <Video className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-zinc-300 font-medium">
                  {uploadingVideo ? 'Feltöltés...' : 'Videó hozzáadása'}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">MP4, MOV, AVI, WebM — max 100 MB</p>
              </div>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/ogg"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={uploadingVideo}
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <Tag className="w-4 h-4 inline mr-1" />Termék neve
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <FileText className="w-4 h-4 inline mr-1" />Leírás
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none transition-all" />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <DollarSign className="w-4 h-4 inline mr-1" />Ár (Ft)
          </label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0"
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all" />
        </div>

        {/* Negotiable toggle */}
        <div>
          <button
            type="button"
            onClick={() => setNegotiable((v) => !v)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all ${
              negotiable
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'glass-pill border-transparent hover:border-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${negotiable ? 'bg-emerald-500/20' : 'glass-bubble'}`}>
              <DollarSign className={`w-5 h-5 ${negotiable ? 'text-emerald-400' : 'text-zinc-400'}`} />
            </div>
            <div className="flex-1 text-left">
              <p className={`font-medium text-sm ${negotiable ? 'text-emerald-300' : 'text-zinc-200'}`}>Alkuképes ár</p>
              <p className="text-xs text-zinc-500 mt-0.5">A vevők alkudozhatnak az áron</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
              negotiable ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
            }`}>
              {negotiable && <span className="w-2 h-2 rounded-full bg-white block" />}
            </div>
          </button>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Kategória</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none transition-all">
            <option value="">Kategória nélkül</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Állapot</label>
          <div className="grid grid-cols-5 gap-2">
            {conditions.map((c) => (
              <button key={c.value} type="button" onClick={() => setCondition(c.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-center transition-all ${condition === c.value ? 'glass-pill-active text-emerald-300 scale-[1.02]' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
                <span className="text-xl">{c.emoji}</span>
                <span className="text-xs font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            <MapPin className="w-4 h-4 inline mr-1" />Helyszín
          </label>
          <select value={locationCounty} onChange={(e) => setLocationCounty(e.target.value)}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none transition-all">
            <option value="">Válassz megyét</option>
            {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              placeholder="Város / falu / kerület (opcionális)"
              className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all text-sm"
              maxLength={80}
            />
          </div>
        </div>

        {/* Delivery Options */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            <Truck className="w-4 h-4 inline mr-1" />
            Szállítási módok
          </label>
          <p className="text-xs text-zinc-500 mb-3">Válaszd ki melyeket ajánlod a vevőnek. Legalább egyet kötelező.</p>
          <div className="space-y-2">
            {DELIVERY_OPTIONS.map((opt) => {
              const Icon = opt.Icon;
              const active = selectedDelivery.includes(opt.id);
              return (
                <div key={opt.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (active) {
                        if (selectedDelivery.length > 1) setSelectedDelivery(selectedDelivery.filter((d) => d !== opt.id));
                      } else {
                        setSelectedDelivery([...selectedDelivery, opt.id]);
                      }
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                      active ? 'bg-emerald-500/10 border-emerald-500/30' : 'glass-pill border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-emerald-500/20' : 'glass-bubble'}`}>
                      <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium text-sm ${active ? 'text-emerald-300' : 'text-zinc-200'}`}>{opt.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{opt.price === 0 ? 'Ingyenes' : `${opt.price.toLocaleString('hu-HU')} Ft`}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${active ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}`}>
                      {active && <span className="w-2 h-2 rounded-full bg-white block" />}
                    </div>
                  </button>
                  {active && (
                    <div className="mx-1 -mt-1 mb-1 px-4 py-2.5 bg-amber-500/8 border border-amber-500/20 rounded-b-2xl flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0 text-xs font-bold">TE:</span>
                      <p className="text-xs text-amber-300/80 leading-relaxed">{opt.sellerNote}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Elérhetőség</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefonszám"
                className="w-full pl-9 pr-3 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email cím"
                className="w-full pl-9 pr-3 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(`/listing/${id}`)}
            className="flex-1 py-3 glass-pill text-zinc-400 font-semibold rounded-xl transition-all hover:text-zinc-200">
            Mégse
          </button>
          <button type="submit" disabled={loading || !title || !price}
            className="flex-1 py-3 glass-pill-active text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {loading ? 'Mentés...' : 'Változások mentése'}
          </button>
        </div>
      </form>
    </div>
  );
}
