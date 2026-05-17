import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { useNotification } from '../contexts/NotificationContext';
import {
  Sparkles, Upload, X, Image, RefreshCw, ArrowRight,
  Tag, DollarSign, FileText, Search, Wand2, ChevronDown,
  AlertCircle, CheckCircle, Lightbulb, Lock, Clock
} from 'lucide-react';

interface AIResult {
  title: string;
  description: string;
  category: string;
  tags: string[];
  suggestedPrice: number | null;
  seoText: string;
}

interface ImagePreview {
  file: File;
  url: string;
  base64: string;
}

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 5;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix, keep only base64 part
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  icon: Icon,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  icon: React.ElementType;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
        <Icon className="w-3.5 h-3.5 text-emerald-400" />
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder={placeholder}
          className="w-full px-3.5 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm resize-none leading-relaxed"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm"
        />
      )}
    </div>
  );
}

export default function AIAssistantPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useNotification();

  const [accountAgeDays, setAccountAgeDays] = useState<number | null>(null);
  const [userText, setUserText] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  // Editable result fields
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editPrice, setEditPrice] = useState('');
  const [editSeo, setEditSeo] = useState('');
  const [newTag, setNewTag] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const created = new Date(user.created_at ?? '');
    const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    setAccountAgeDays(Math.floor(days));
  }, [user]);

  const applyResult = (r: AIResult) => {
    setResult(r);
    setEditTitle(r.title ?? '');
    setEditDescription(r.description ?? '');
    setEditCategory(r.category ?? '');
    setEditTags(r.tags ?? []);
    setEditPrice(r.suggestedPrice ? String(r.suggestedPrice) : '');
    setEditSeo(r.seoText ?? '');
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      showToast('error', 'Maximum 4 kép tölthető fel');
      return;
    }
    const toAdd = arr.slice(0, remaining);
    const previews: ImagePreview[] = [];
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        showToast('error', `${file.name} túl nagy (max ${MAX_SIZE_MB}MB)`);
        continue;
      }
      const url = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      previews.push({ file, url, base64 });
    }
    setImages((prev) => [...prev, ...previews]);
  }, [images.length, showToast]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await processFiles(e.target.files);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const generate = async () => {
    if (!userText.trim() && images.length === 0) {
      showToast('error', 'Írj le valamit a termékről, vagy tölts fel képet!');
      return;
    }
    if (!user) {
      showToast('error', 'Bejelentkezés szükséges');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const payload = {
        userText: userText.trim(),
        imageBase64List: images.map((img) => img.base64),
        mode: 'generate',
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-listing-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();

      if (!res.ok || json.error) {
        showToast('error', json.error ?? 'Generálás sikertelen');
        return;
      }

      applyResult(json.data);
      showToast('success', 'Hirdetés sikeresen generálva!', 'Szerkeszd meg az adatokat igény szerint.');
    } catch {
      showToast('error', 'Hálózati hiba. Próbáld újra!');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const t = newTag.trim().toLowerCase();
    if (t && !editTags.includes(t) && editTags.length < 8) {
      setEditTags((prev) => [...prev, t]);
    }
    setNewTag('');
  };

  const removeTag = (t: string) => setEditTags((prev) => prev.filter((x) => x !== t));

  const goToCreate = () => {
    if (!result) return;
    const params = new URLSearchParams({
      ai_title: editTitle,
      ai_description: editDescription,
      ai_category: editCategory,
      ai_price: editPrice,
      ai_tags: editTags.join(','),
    });
    navigate(`/create?${params.toString()}`);
  };

  const MIN_DAYS = 90;
  const isEligible = (profile?.ai_access === true) || (accountAgeDays !== null && accountAgeDays >= MIN_DAYS);
  const daysLeft = accountAgeDays !== null ? Math.max(0, MIN_DAYS - accountAgeDays) : MIN_DAYS;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">AI Hirdetés Asszisztens</h1>
            <p className="text-zinc-500 text-sm">Tölts fel képet vagy írj pár szót — az AI megírja a hirdetésedet</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: Wand2, text: 'Cím generálás' },
            { icon: FileText, text: 'Leírás írás' },
            { icon: DollarSign, text: 'Ár becslés' },
            { icon: Tag, text: 'Tagek & kategória' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 glass-bubble rounded-xl px-3 py-2">
              <Icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-zinc-400">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Locked banner */}
      {!isEligible && accountAgeDays !== null && (
        <div className="flex items-center gap-4 px-5 py-4 bg-amber-500/8 border border-amber-500/25 rounded-2xl">
          <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">Funkció zárolva</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Ez a funkció 3 hónapos fiókhoz szükséges. Regisztrációtól számítva {accountAgeDays} / {MIN_DAYS} nap telt el.
            </p>
          </div>
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 border border-amber-500/20 rounded-xl">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-bold text-lg tabular-nums">{daysLeft}</span>
            </div>
            <span className="text-zinc-600 text-[11px] mt-1">nap van hátra</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Input */}
        <div className="space-y-4">
          {/* Image upload */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-400" />
              Képek ({images.length}/{MAX_IMAGES})
            </h2>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-emerald-400/60 bg-emerald-500/5'
                  : 'border-zinc-700/60 hover:border-emerald-500/40 hover:bg-emerald-500/3'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${isDragging ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <p className="text-sm text-zinc-400">
                {isDragging ? 'Engedd el a képeket...' : 'Húzd ide a képeket, vagy kattints'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Max {MAX_IMAGES} kép · {MAX_SIZE_MB}MB/db · JPG, PNG, WebP</p>
            </div>

            {/* Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Termék leírása
            </h2>
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              rows={5}
              placeholder={`Pl: "iPhone 13 Pro 256GB kék, 1 éve vettem, apró karcolás a hátán, minden kiegészítővel, töltővel együtt adom el"`}
              className="w-full px-3.5 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm resize-none leading-relaxed"
            />
            <p className="text-xs text-zinc-600">Minél több részletet adsz meg, annál pontosabb lesz a generálás.</p>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !isEligible}
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] ${
              !isEligible
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400/60'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                AI generál...
              </>
            ) : !isEligible ? (
              <>
                <Lock className="w-4 h-4" />
                Zárolva — még {daysLeft} nap
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {result ? 'Újragenerálás' : 'Hirdetés generálása'}
              </>
            )}
          </button>

          {/* Loading state visual */}
          {loading && (
            <div className="glass rounded-2xl p-4 space-y-2">
              {['Képek elemzése...', 'Cím generálása...', 'Leírás írása...', 'Ár becslése...'].map((step, i) => (
                <div key={step} className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin flex-shrink-0"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                  <span className="text-xs text-zinc-500">{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="glass rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-zinc-800/60 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-400 font-medium">Az AI eredmény itt jelenik meg</p>
                <p className="text-zinc-600 text-sm mt-1">Tölts fel képet vagy írj leírást, majd kattints a generálás gombra</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {['Figyelemfelkeltő cím', 'Részletes leírás', 'Kategória & tagek', 'Ajánlott ár'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-left glass-bubble rounded-xl px-3 py-2">
                    <CheckCircle className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                    <span className="text-xs text-zinc-500">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {/* Success badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-emerald-300 font-medium">Generálás kész — szerkeszd meg az adatokat igény szerint</span>
              </div>

              {/* Title */}
              <div className="glass rounded-2xl p-4">
                <EditableField
                  label="Cím"
                  value={editTitle}
                  onChange={setEditTitle}
                  icon={FileText}
                  placeholder="Hirdetés címe..."
                />
              </div>

              {/* Description */}
              <div className="glass rounded-2xl p-4">
                <EditableField
                  label="Leírás"
                  value={editDescription}
                  onChange={setEditDescription}
                  multiline
                  icon={FileText}
                  placeholder="Hirdetés leírása..."
                />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-2xl p-4">
                  <EditableField
                    label="Kategória"
                    value={editCategory}
                    onChange={setEditCategory}
                    icon={ChevronDown}
                    placeholder="Kategória..."
                  />
                </div>
                <div className="glass rounded-2xl p-4">
                  <EditableField
                    label="Ajánlott ár (Ft)"
                    value={editPrice}
                    onChange={setEditPrice}
                    icon={DollarSign}
                    placeholder="pl. 15000"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="glass rounded-2xl p-4 space-y-3">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  Tagek ({editTags.length}/8)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {editTags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                      #{t}
                      <button onClick={() => removeTag(t)} className="text-emerald-500 hover:text-red-400 transition-colors ml-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                {editTags.length < 8 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Új tag..."
                      className="flex-1 px-3 py-2 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-xs"
                    />
                    <button onClick={addTag} className="px-3 py-2 glass-pill-active text-emerald-300 rounded-xl text-xs transition-all hover:scale-[1.02]">
                      + Hozzáad
                    </button>
                  </div>
                )}
              </div>

              {/* SEO text */}
              <div className="glass rounded-2xl p-4">
                <EditableField
                  label="SEO szöveg"
                  value={editSeo}
                  onChange={setEditSeo}
                  icon={Search}
                  placeholder="Rövid SEO leírás..."
                />
                <p className="text-[10px] text-zinc-600 mt-1.5">{editSeo.length}/160 karakter</p>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-500/8 border border-blue-500/15 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-500">A "Hirdetés létrehozása" gombra kattintva az adatok előtöltve jelennek meg a hirdetésfeladó oldalon.</p>
              </div>

              {/* Create listing button */}
              <button
                onClick={goToCreate}
                className="w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5 bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25 hover:scale-[1.01] active:scale-[0.99]"
              >
                <ArrowRight className="w-4 h-4" />
                Hirdetés létrehozása ezekkel az adatokkal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
