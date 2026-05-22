import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { useNotification } from '../contexts/NotificationContext';
import { Heart, Upload, X, Baby, PawPrint, Users, Lightbulb, Package, ArrowLeft, ShieldCheck, Clock, Activity, Zap, GraduationCap, Trophy, Church, Leaf } from 'lucide-react';
import { HUNGARIAN_COUNTIES } from '../lib/utils';

const CATEGORIES = [
  { value: 'gyerek', label: 'Gyerekek', icon: Baby },
  { value: 'allatvédelem', label: 'Állatvédelem', icon: PawPrint },
  { value: 'raszorulok', label: 'Rászorulók', icon: Users },
  { value: 'kozossegi', label: 'Közösségi projekt', icon: Lightbulb },
  { value: 'egeszseg', label: 'Egészségügy', icon: Activity },
  { value: 'katasztrofa', label: 'Katasztrófa-segély', icon: Zap },
  { value: 'oktatás', label: 'Oktatás', icon: GraduationCap },
  { value: 'sport', label: 'Sport', icon: Trophy },
  { value: 'vallasi', label: 'Vallási', icon: Church },
  { value: 'kornyezet', label: 'Környezetvédelem', icon: Leaf },
  { value: 'egyeb', label: 'Egyéb', icon: Package },
];

const MIN_TRUST_FOR_DONATION = 2;

export default function CreateDonationPage() {
  const { user, profile } = useAuth();
  const { navigate, path } = useRouter();
  const { showToast } = useNotification();

  // Detect edit mode: /donations/edit/:id
  const editMatch = path.match(/^\/donations\/edit\/([^/]+)$/);
  const editId = editMatch ? editMatch[1] : null;
  const isEdit = !!editId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('egyeb');
  const [goalAmount, setGoalAmount] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (!editId) return;
    supabase.from('donations').select('*').eq('id', editId).maybeSingle().then(({ data }) => {
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || 'egyeb');
        setGoalAmount(data.goal_amount ? String(data.goal_amount) : '');
        setLocation(data.location || '');
        setImages(data.images || []);
      }
      setLoadingData(false);
    });
  }, [editId]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const userTrust = (profile?.trust_level ?? 1) as number;
  const canCreate = userTrust >= MIN_TRUST_FOR_DONATION || profile?.is_admin || profile?.is_super_admin;

  if (!isEdit && !canCreate) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Trust szint szükséges</h1>
          <p className="text-zinc-400 mt-3 leading-relaxed">
            Adománygyűjtési kampány indításához legalább <strong className="text-blue-400">Megbízható</strong> szintű fiókra van szükség (Trust szint 2+).
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            A te szinted jelenleg: <strong className="text-zinc-300">Trust {userTrust}</strong>
          </p>
        </div>
        <div className="glass rounded-2xl p-5 text-left space-y-3">
          <p className="text-sm font-semibold text-zinc-300">Hogyan érheted el a Trust 2 szintet?</p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />Legyél legalább 7 napja regisztrált felhasználó</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />Teljesíts legalább 5 sikeres tranzakciót</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />Tölts ki minden profiladatot</li>
          </ul>
        </div>
        <button onClick={() => navigate('/donations')} className="flex items-center gap-2 mx-auto text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Vissza a kampányokhoz
        </button>
      </div>
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, 4)) {
      const ext = file.name.split('.').pop();
      const path = `${user!.id}/donations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('listing-images').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
    }
    setImages((prev) => [...prev, ...uploaded].slice(0, 4));
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('error', 'Töltsd ki a kötelező mezőket');
      return;
    }
    setLoading(true);

    if (isEdit) {
      const { error } = await supabase.from('donations').update({
        title: title.trim(),
        description: description.trim(),
        category,
        goal_amount: goalAmount ? parseInt(goalAmount) : 0,
        images,
        location,
      }).eq('id', editId!);

      if (error) {
        showToast('error', 'Hiba történt a mentés során');
      } else {
        showToast('success', 'Kampány frissítve!');
        navigate(`/donations/${editId}`);
      }
    } else {
      const isHighTrust = userTrust >= 3 || profile?.is_admin || profile?.is_super_admin;
      const { data, error } = await supabase.from('donations').insert({
        creator_id: user!.id,
        title: title.trim(),
        description: description.trim(),
        category,
        goal_amount: goalAmount ? parseInt(goalAmount) : 0,
        images,
        location,
        moderation_status: isHighTrust ? 'active' : 'pending',
        status: 'active',
      }).select().maybeSingle();

      if (error) {
        showToast('error', 'Hiba történt');
      } else if (isHighTrust) {
        showToast('success', 'Kampány sikeresen létrehozva!');
        navigate(`/donations/${data!.id}`);
      } else {
        showToast('success', 'Kampányod beküldve!', 'Admin jóváhagyás után jelenik meg nyilvánosan.');
        navigate('/donations');
      }
    }
    setLoading(false);
  }

  if (loadingData) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 glass rounded-xl w-1/3" />
        <div className="h-64 glass rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(isEdit ? `/donations/${editId}` : '/donations')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Vissza
      </button>

      <div className="text-center">
        <div className="w-14 h-14 bg-rose-500/15 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold">{isEdit ? 'Kampány szerkesztése' : 'Kampány indítása'}</h1>
        <p className="text-zinc-400 text-sm mt-1">{isEdit ? 'Módosítsd a kampány adatait' : 'Hozz létre egy adománygyűjtési kampányt'}</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-5">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Kampány neve *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="pl. Segítsünk Pistának a műtétre"
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Kategória *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  category === value
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'glass-pill border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Leírás *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Írd le részletesen, miért van szükség az adományokra..."
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none"
          />
        </div>

        {/* Goal amount */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Célösszeg (Ft, opcionális)</label>
          <input
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="pl. 500000"
            min="0"
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Helyszín (opcionális)</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none"
          >
            <option value="">Válassz megyét...</option>
            {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Képek (max. 4)</label>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length < 4 && (
            <label className="flex items-center justify-center gap-2 px-4 py-8 glass-input rounded-xl cursor-pointer hover:bg-white/5 transition-colors border-2 border-dashed border-white/10 hover:border-white/20">
              <Upload className="w-5 h-5 text-zinc-500" />
              <span className="text-sm text-zinc-500">{uploading ? 'Feltöltés...' : 'Kép feltöltése'}</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>

        {/* Trust info banner - only for new campaigns */}
        {!isEdit && userTrust < 3 && !profile?.is_admin && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-semibold">Jóváhagyásra vár</p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                A Trust {userTrust} szintű fiókokkal létrehozott kampányok admin jóváhagyás után jelennek meg nyilvánosan. Trust 3+ szinten azonnal aktív lesz.
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold rounded-2xl hover:bg-rose-500/30 transition-all hover:scale-[1.01] disabled:opacity-50"
        >
          {loading ? (isEdit ? 'Mentés...' : 'Létrehozás...') : (isEdit ? 'Változtatások mentése' : 'Kampány indítása')}
        </button>
      </form>
    </div>
  );
}
