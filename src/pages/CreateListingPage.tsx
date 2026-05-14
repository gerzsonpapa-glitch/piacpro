import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import type { Category } from '../lib/types';
import { HUNGARIAN_COUNTIES } from '../lib/utils';
import { Upload, X, MapPin, DollarSign, Tag, FileText, ImagePlus, Phone, Mail, Truck, Package, Handshake } from 'lucide-react';

const DELIVERY_OPTIONS = [
  {
    id: 'gls',
    name: 'GLS futár',
    price: 1790,
    sellerNote: 'Te fizeted a szállítást (1 790 Ft), a vevő intézi a GLS felvételt.',
    buyerNote: 'A vevő hívja a GLS-t a csomag felvételéhez.',
    Icon: Truck,
  },
  {
    id: 'magyar-posta',
    name: 'Magyar Posta',
    price: 1490,
    sellerNote: 'Te adod fel a csomagot a legközelebbi postán (1 490 Ft szállítási költség).',
    buyerNote: 'Az eladó adja fel postán, a vevő megkapja a csomagot.',
    Icon: Package,
  },
  {
    id: 'personal',
    name: 'Személyes átvétel',
    price: 0,
    sellerNote: 'Ingyenes — egyeztetett helyen és időpontban veszi át a vevő.',
    buyerNote: 'Egyeztetett időpontban és helyen veszed át személyesen.',
    Icon: Handshake,
  },
];

const conditions = [
  { value: 'new', label: 'Új', desc: 'Bontatlan, eredeti csomagolásban', emoji: '✨' },
  { value: 'like-new', label: 'Újszerű', desc: 'Alig használt, hibátlan', emoji: '💎' },
  { value: 'used', label: 'Használt', desc: 'Jó állapot, nyomokkal', emoji: '👍' },
  { value: 'fair', label: 'Közepes', desc: 'Látható kopás, működik', emoji: '🔧' },
  { value: 'poor', label: 'Rossz', desc: 'Javításra szorul', emoji: '⚠️' },
];

export default function CreateListingPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('used');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string[]>(['personal']);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCategories();
    loadProfileContact();
  }, [user]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data || []);
  }

  async function loadProfileContact() {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('phone, contact_email')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setPhone(data.phone || '');
      setContactEmail(data.contact_email || '');
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (imageUrls.length + newUrls.length >= 8) break;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file);

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);
        newUrls.push(urlData.publicUrl);
      }
    }

    setImageUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        title,
        description,
        price: parseFloat(price) || 0,
        category_id: categoryId || null,
        condition,
        location,
        phone,
        contact_email: contactEmail,
        images: imageUrls,
        delivery_options: selectedDelivery,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating listing:', error);
    } else if (data) {
      navigate(`/listing/${data.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Új hirdetés létrehozása</h1>

      <form onSubmit={handleSubmit} className="space-y-6 glass rounded-3xl p-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <ImagePlus className="w-4 h-4 inline mr-1" />
            Képek (max 8)
          </label>
          <div className="grid grid-cols-4 gap-3">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden glass-bubble">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] glass-pill-active text-emerald-300 px-1.5 py-0.5 rounded-lg font-medium">
                    Borító
                  </span>
                )}
              </div>
            ))}
            {imageUrls.length < 8 && (
              <label className="aspect-square rounded-2xl glass-subtle border-2 border-dashed border-white/10 hover:border-emerald-500/40 flex flex-col items-center justify-center cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                <span className="text-xs text-zinc-500">
                  {uploading ? 'Feltöltés...' : 'Feltöltés'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <Tag className="w-4 h-4 inline mr-1" />
            Cím
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
            placeholder="pl. iPhone 15 Pro Max 256GB"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <FileText className="w-4 h-4 inline mr-1" />
            Leírás
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none transition-all"
            placeholder="Írd le a termék állapotát, tartozékait..."
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Ár (Ft)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
            placeholder="0"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Kategória</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none transition-all"
          >
            <option value="">Válassz kategóriát</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Condition - Visual Selector */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Állapot</label>
          <div className="grid grid-cols-5 gap-2">
            {conditions.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCondition(c.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all ${
                  condition === c.value
                    ? 'glass-pill-active text-emerald-300 scale-[1.02]'
                    : 'glass-pill text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="text-xs font-medium">{c.label}</span>
              </button>
            ))}
          </div>
          {conditions.find((c) => c.value === condition) && (
            <p className="text-xs text-zinc-500 mt-2 text-center">
              {conditions.find((c) => c.value === condition)?.desc}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            <MapPin className="w-4 h-4 inline mr-1" />
            Helyszín
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none transition-all"
          >
            <option value="">Válassz megyét</option>
            {HUNGARIAN_COUNTIES.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
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
                      active
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'glass-pill border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-emerald-500/20' : 'glass-bubble'}`}>
                      <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium text-sm ${active ? 'text-emerald-300' : 'text-zinc-200'}`}>{opt.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {opt.price === 0 ? 'Ingyenes' : `${opt.price.toLocaleString('hu-HU')} Ft`}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      active ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
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
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefonszám"
                className="w-full pl-9 pr-3 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email cím"
                className="w-full pl-9 pr-3 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-600 mt-1.5">Profilodból automatikusan átvettük. Módosíthatod vagy üresen hagyhatod.</p>
        </div>

        <button
          type="submit"
          disabled={loading || !title || !price}
          className="w-full py-3 glass-pill-active text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50"
        >
          {loading ? 'Közzététel...' : 'Hirdetés közzététele'}
        </button>
      </form>
    </div>
  );
}
