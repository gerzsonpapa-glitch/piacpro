import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { useNotification } from '../contexts/NotificationContext';
import type { Category } from '../lib/types';
import { HUNGARIAN_COUNTIES } from '../lib/utils';
import {
  Upload, X, MapPin, DollarSign, Tag, FileText, ImagePlus, Phone, Mail,
  Truck, Package, Handshake, Video, Play, Shield, Sparkles, PenLine,
  RefreshCw, ChevronRight, Wand2, Image as ImageIcon, Gift
} from 'lucide-react';

const FREE_CATEGORY_ID = 'cf52d829-a11f-4b71-95a0-c7c2bcfc38e5';

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
  { value: 'new', label: 'Új', desc: 'Bontatlan, eredeti csomagolásban', emoji: '✨' },
  { value: 'like-new', label: 'Újszerű', desc: 'Alig használt, hibátlan', emoji: '💎' },
  { value: 'used', label: 'Használt', desc: 'Jó állapot, nyomokkal', emoji: '👍' },
  { value: 'fair', label: 'Közepes', desc: 'Látható kopás, működik', emoji: '🔧' },
  { value: 'poor', label: 'Rossz', desc: 'Javításra szorul', emoji: '⚠️' },
];

const HUNGARIAN_CATEGORIES = [
  'Elektronika', 'Ruházat és divat', 'Otthon és kert', 'Sport és szabadidő',
  'Játékok és gyerekfelszerelés', 'Könyvek, filmek, zene', 'Autó és motor',
  'Ingatlan', 'Állatok és állatfelszerelés', 'Élelmiszer és ital',
  'Egészség és szépség', 'Hobbi és gyűjtők', 'Bútorok és lakberendezés',
  'Számítógép és IT', 'Egyéb',
];

interface ImagePreview {
  file: File;
  url: string;
  base64: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Mode = 'manual' | 'ai';

const SCAM_KEYWORDS = [
  'előre utalás', 'előre fizet', 'előre pénz', 'crypto only', 'bitcoin only',
  'csak átutalás', 'kriptovaluta', 'western union', 'moneygram',
  'bit.ly', 'tinyurl', 't.me/', 'whatsapp.com/invite',
  'nem találkozom', 'ajándék küldök',
  'nigéria', 'örökség', 'nyeremény', '100% biztos',
];

export default function CreateListingPage() {
  const { user } = useAuth();
  const { navigate, search } = useRouter();
  const { showToast } = useNotification();

  const [mode, setMode] = useState<Mode>('manual');

  // --- AI mode state ---
  const [aiText, setAiText] = useState('');
  const [aiImages, setAiImages] = useState<ImagePreview[]>([]);
  const [aiIsDragging, setAiIsDragging] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const aiFileRef = useRef<HTMLInputElement>(null);

  // --- Shared form fields ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('used');
  const [locationCounty, setLocationCounty] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<string[]>(['personal']);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [scamWarning, setScamWarning] = useState<string[]>([]);
  const [scamConfirmed, setScamConfirmed] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchCategories();
    loadProfileContact();
  }, [user]);

  useEffect(() => {
    if (!search) return;
    const params = new URLSearchParams(search);
    const aiTitle = params.get('ai_title');
    const aiDescription = params.get('ai_description');
    const aiPrice = params.get('ai_price');
    if (aiTitle) setTitle(aiTitle);
    if (aiDescription) setDescription(aiDescription);
    if (aiPrice) setPrice(aiPrice);
  }, [search]);

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

  // --- AI image handling ---
  const processAiFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = 4 - aiImages.length;
    if (remaining <= 0) { showToast('error', 'Maximum 4 kép tölthető fel'); return; }
    const toAdd = arr.slice(0, remaining);
    const previews: ImagePreview[] = [];
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) { showToast('error', `${file.name} túl nagy (max 5MB)`); continue; }
      const url = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      previews.push({ file, url, base64 });
    }
    setAiImages((prev) => [...prev, ...previews]);
  }, [aiImages.length, showToast]);

  const handleAiDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setAiIsDragging(false);
    await processAiFiles(e.dataTransfer.files);
  }, [processAiFiles]);

  const removeAiImage = (idx: number) => {
    setAiImages((prev) => { URL.revokeObjectURL(prev[idx].url); return prev.filter((_, i) => i !== idx); });
  };

  async function generateWithAI() {
    if (!aiText.trim() && aiImages.length === 0) {
      showToast('error', 'Írj le valamit a termékről, vagy tölts fel képet!');
      return;
    }
    if (!user) { showToast('error', 'Bejelentkezés szükséges'); navigate('/login'); return; }

    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-listing-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            userText: aiText.trim(),
            imageBase64List: aiImages.map((img) => img.base64),
            mode: 'generate',
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || json.error) { showToast('error', json.error ?? 'Generálás sikertelen'); return; }

      const result = json.data;
      setTitle(result.title ?? '');
      setDescription(result.description ?? '');
      setPrice(result.suggestedPrice ? String(result.suggestedPrice) : '');

      // Match AI category name to DB category id
      if (result.category && categories.length > 0) {
        const match = categories.find(
          (c) => c.name.toLowerCase() === result.category.toLowerCase()
        );
        if (match) setCategoryId(match.id);
      }

      setAiGenerated(true);
      showToast('success', 'AI generálás kész!', 'Ellenőrizd és egészítsd ki az adatokat.');
    } catch {
      showToast('error', 'Hálózati hiba. Próbáld újra!');
    } finally {
      setAiLoading(false);
    }
  }

  // --- Manual image upload ---
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (imageUrls.length + newUrls.length >= 8) break;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error } = await supabase.storage.from('listing-images').upload(fileName, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
        newUrls.push(urlData.publicUrl);
      }
    }
    setImageUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingVideo(true);
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('listing-videos').upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('listing-videos').getPublicUrl(fileName);
      setVideoUrl(urlData.publicUrl);
    }
    setUploadingVideo(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!scamConfirmed) {
      const text = `${title} ${description} ${phone} ${contactEmail}`.toLowerCase();
      const matched = SCAM_KEYWORDS.filter((kw) => text.includes(kw));
      if (matched.length > 0) { setScamWarning(matched); return; }
    }

    setLoading(true);
    const finalPrice = parseFloat(price) || 0;
    const finalCategoryId = finalPrice === 0 ? FREE_CATEGORY_ID : (categoryId || null);

    const { data, error } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        title,
        description,
        price: finalPrice,
        category_id: finalCategoryId,
        condition,
        location: locationCity.trim() ? `${locationCity.trim()}, ${locationCounty}` : locationCounty,
        phone,
        contact_email: contactEmail,
        images: imageUrls,
        video_url: videoUrl || null,
        negotiable,
        delivery_options: selectedDelivery,
      })
      .select()
      .single();

    if (error) {
      showToast('error', 'Hiba történt', 'A hirdetés létrehozása sikertelen. Kérjük, próbáld újra.');
    } else if (data) {
      navigate(`/listing/${data.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Új hirdetés létrehozása</h1>

      {/* Mode toggle */}
      <div className="glass rounded-2xl p-1.5 flex gap-1.5 mb-6">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === 'manual'
              ? 'bg-zinc-700/60 text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <PenLine className="w-4 h-4" />
          Magam írom meg
        </button>
        <button
          type="button"
          onClick={() => setMode('ai')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === 'ai'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI generálás
        </button>
      </div>

      {/* AI panel */}
      {mode === 'ai' && (
        <div className="glass rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">AI Hirdetés Asszisztens</p>
              <p className="text-xs text-zinc-500">Írj pár szót vagy tölts fel képet — az AI megírja helyetted</p>
            </div>
          </div>

          {/* AI image drop zone */}
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              Képek az AI-nak ({aiImages.length}/4)
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setAiIsDragging(true); }}
              onDragLeave={() => setAiIsDragging(false)}
              onDrop={handleAiDrop}
              onClick={() => aiFileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                aiIsDragging
                  ? 'border-emerald-400/60 bg-emerald-500/5'
                  : 'border-zinc-700/60 hover:border-emerald-500/40 hover:bg-emerald-500/3'
              }`}
            >
              <input
                ref={aiFileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => { if (e.target.files) await processAiFiles(e.target.files); e.target.value = ''; }}
                className="hidden"
              />
              <Upload className={`w-6 h-6 mx-auto mb-1.5 transition-colors ${aiIsDragging ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <p className="text-xs text-zinc-400">{aiIsDragging ? 'Engedd el...' : 'Húzd ide a képeket, vagy kattints'}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Max 4 kép · 5 MB/db</p>
            </div>
            {aiImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {aiImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                    <button
                      type="button"
                      onClick={() => removeAiImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI text input */}
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2">Rövid leírás a termékről</p>
            <textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              rows={3}
              placeholder={`Pl: "Toyota Corolla 2018, 120 000 km, benzin, klíma, szervizkönyv megvan"`}
              className="w-full px-3.5 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm resize-none leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={generateWithAI}
            disabled={aiLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
          >
            {aiLoading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />AI generál...</>
            ) : (
              <><Sparkles className="w-4 h-4" />{aiGenerated ? 'Újragenerálás' : 'Hirdetés adatok generálása'}</>
            )}
          </button>

          {aiGenerated && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-300">Adatok kitöltve — ellenőrizd és egészítsd ki az alábbi mezőket, majd töltsd fel a hirdetés képeit.</p>
            </div>
          )}
        </div>
      )}

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
              <video src={videoUrl} controls className="w-full rounded-2xl max-h-52 object-cover" />
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
                <p className="text-sm text-zinc-300 font-medium">{uploadingVideo ? 'Feltöltés...' : 'Videó hozzáadása'}</p>
                <p className="text-xs text-zinc-600 mt-0.5">MP4, MOV, AVI, WebM — max 100 MB</p>
              </div>
              <input type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/ogg" onChange={handleVideoUpload} className="hidden" disabled={uploadingVideo} />
            </label>
          )}
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
            min="0"
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
            placeholder="0 — ha ingyen adod oda, hagyd üresen"
          />
          {(price === '' || price === '0') && (
            <div className="mt-2 flex items-start gap-2.5 px-3.5 py-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
              <Gift className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300 leading-relaxed">
                Ha nem adsz meg árat, a hirdetés <strong>Ingyen elvihető</strong> kategóriába kerül — tökéletes, ha csak szabadulni akarsz a tárgytól.
              </p>
            </div>
          )}
        </div>

        {/* Negotiable toggle */}
        <div>
          <button
            type="button"
            onClick={() => setNegotiable((v) => !v)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all ${
              negotiable ? 'bg-emerald-500/10 border-emerald-500/30' : 'glass-pill border-transparent hover:border-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${negotiable ? 'bg-emerald-500/20' : 'glass-bubble'}`}>
              <DollarSign className={`w-5 h-5 ${negotiable ? 'text-emerald-400' : 'text-zinc-400'}`} />
            </div>
            <div className="flex-1 text-left">
              <p className={`font-medium text-sm ${negotiable ? 'text-emerald-300' : 'text-zinc-200'}`}>Alkuképes ár</p>
              <p className="text-xs text-zinc-500 mt-0.5">A vevők alkudozhatnak az áron</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${negotiable ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}`}>
              {negotiable && <span className="w-2 h-2 rounded-full bg-white block" />}
            </div>
          </button>
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
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Állapot</label>
          <div className="grid grid-cols-5 gap-2">
            {conditions.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCondition(c.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all ${
                  condition === c.value ? 'glass-pill-active text-emerald-300 scale-[1.02]' : 'glass-pill text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="text-xs font-medium">{c.label}</span>
              </button>
            ))}
          </div>
          {conditions.find((c) => c.value === condition) && (
            <p className="text-xs text-zinc-500 mt-2 text-center">{conditions.find((c) => c.value === condition)?.desc}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            <MapPin className="w-4 h-4 inline mr-1" />
            Helyszín
          </label>
          <select
            value={locationCounty}
            onChange={(e) => setLocationCounty(e.target.value)}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none transition-all"
          >
            <option value="">Válassz megyét</option>
            {HUNGARIAN_COUNTIES.map((county) => (
              <option key={county} value={county}>{county}</option>
            ))}
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

        {/* Scam warning */}
        {scamWarning.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">Gyanús tartalom észlelve</p>
                <p className="text-xs text-zinc-400 leading-relaxed">A hirdetésed gyanúsnak tűnő kifejezést tartalmaz. Ha biztosan valódi a hirdetésed, erősítsd meg.</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {scamWarning.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-lg text-[11px] text-red-300 font-medium">"{kw}"</span>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setScamConfirmed(true); setScamWarning([]); }}
              className="w-full py-2.5 bg-red-500/15 border border-red-500/25 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/25 transition-colors"
            >
              Megértettem, a hirdetésem valódi — közzéteszem
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !title}
          className="w-full py-3 glass-pill-active text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50"
        >
          {loading ? 'Közzététel...' : 'Hirdetés közzététele'}
        </button>
      </form>
    </div>
  );
}
