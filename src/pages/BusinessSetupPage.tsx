import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { LocalBusiness, LocalBusinessApplication, BusinessType } from '../lib/types';
import { BUSINESS_TYPE_LABELS } from '../lib/types';
import { HUNGARIAN_COUNTIES } from '../lib/utils';
import {
  Sprout, Scissors, Store, Briefcase, Home, UserCheck,
  Camera, Save, X, MapPin, Phone, Mail, Globe, CheckCircle,
  Clock, AlertCircle, ArrowLeft, Zap, Tag, PlusCircle, Trash2
} from 'lucide-react';

// ── Type selector ─────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<BusinessType, React.ComponentType<{ className?: string }>> = {
  producer: Sprout,
  craftsman: Scissors,
  shop: Store,
  service: Briefcase,
  family: Home,
  specialist: UserCheck,
};

const TYPE_DESCRIPTIONS: Record<BusinessType, string> = {
  producer: 'Zöldség, gyümölcs, méz, tejtermék, házi készítmények',
  craftsman: 'Kézzel készített termékek, egyedi alkotások, ékszerek',
  shop: 'Helyi üzlet, webshop, bolt',
  service: 'Különböző szolgáltatások: takarítás, javítás, marketing…',
  family: 'Kis- és középvállalkozás, önfoglalkoztató',
  specialist: 'Orvos, ügyvéd, villanyszerelő, oktató és más szakemberek',
};

const ALL_TYPES: BusinessType[] = ['producer', 'craftsman', 'shop', 'service', 'family', 'specialist'];

// ── Image uploader helper ─────────────────────────────────────────────────────

function ImageUploader({ label, value, onFile, onClear, accept = 'image/*' }: {
  label: string;
  value: string | null;
  onFile: (f: File) => void;
  onClear: () => void;
  accept?: string;
}) {
  const [preview, setPreview] = useState<string | null>(value);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    onFile(f);
  }
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1.5">{label}</label>
      <div className="relative">
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden">
            <img src={preview} alt="" className="w-full h-32 object-cover" />
            <button type="button" onClick={() => { setPreview(null); onClear(); }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-lg flex items-center justify-center text-zinc-300 hover:text-red-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-24 glass-bubble rounded-2xl border border-dashed border-zinc-700 cursor-pointer hover:border-emerald-500/40 transition-colors">
            <Camera className="w-6 h-6 text-zinc-600 mb-1" />
            <span className="text-xs text-zinc-600">Kattints a feltöltéshez</span>
            <input type="file" accept={accept} onChange={handleChange} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
}

// ── Tag input helper ──────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder={placeholder} maxLength={40}
            className="w-full pl-9 pr-4 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
        <button type="button" onClick={add}
          className="px-3 py-2.5 glass-pill text-zinc-400 hover:text-zinc-200 rounded-xl text-sm transition-colors">
          <PlusCircle className="w-4 h-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl glass-pill text-zinc-400">
              {tag}
              <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="text-zinc-600 hover:text-red-400 transition-colors ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface FormState {
  name: string; tagline: string; description: string;
  businessType: BusinessType; location: string; county: string;
  contactPhone: string; contactEmail: string; website: string;
  categories: string[]; isAvailableToday: boolean;
}

const EMPTY_FORM: FormState = {
  name: '', tagline: '', description: '',
  businessType: 'shop', location: '', county: '',
  contactPhone: '', contactEmail: '', website: '',
  categories: [], isAvailableToday: false,
};

export default function BusinessSetupPage() {
  const { user, profile } = useAuth();
  const { showToast } = useNotification();
  const { navigate } = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myBusiness, setMyBusiness] = useState<LocalBusiness | null>(null);
  const [application, setApplication] = useState<LocalBusinessApplication | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'apply'>('info');

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    const [{ data: biz }, { data: app }] = await Promise.all([
      supabase.from('local_businesses').select('*').eq('owner_id', user!.id).maybeSingle(),
      supabase.from('local_business_applications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (biz) {
      setMyBusiness(biz as LocalBusiness);
      const locParts = (biz.location || '').split(', ');
      const county = HUNGARIAN_COUNTIES.find((c) => locParts.includes(c)) || '';
      const city = locParts.filter((p) => p !== county).join(', ');
      setForm({
        name: biz.name || '',
        tagline: biz.tagline || '',
        description: biz.description || '',
        businessType: biz.business_type as BusinessType,
        location: city,
        county,
        contactPhone: biz.contact_phone || '',
        contactEmail: biz.contact_email || '',
        website: biz.website || '',
        categories: biz.categories || [],
        isAvailableToday: biz.is_available_today || false,
      });
    }
    setApplication(app as LocalBusinessApplication | null);
    setLoading(false);
  }

  async function uploadImage(file: File, path: string): Promise<string | null> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fullPath = `${user!.id}/${path}.${ext}`;
    const { error } = await supabase.storage.from('business-images').upload(fullPath, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('business-images').getPublicUrl(fullPath);
    return data.publicUrl + `?t=${Date.now()}`;
  }

  function buildLocation() {
    const parts = [form.location.trim(), form.county].filter(Boolean);
    return parts.join(', ');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;
    if (form.name.trim().length < 2) { showToast('error', 'Hiba', 'A vállalkozás neve kötelező.'); return; }
    setSaving(true);

    const payload: Partial<LocalBusiness> = {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      business_type: form.businessType,
      location: buildLocation(),
      contact_phone: form.contactPhone.trim(),
      contact_email: form.contactEmail.trim(),
      website: form.website.trim(),
      categories: form.categories,
      is_available_today: form.isAvailableToday,
    };

    // Generate slug from name if new
    if (!myBusiness) {
      const slug = form.name.trim().toLowerCase()
        .replace(/[^a-z0-9áéíóöőüűÁÉÍÓÖŐÜŰ\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 80) + '-' + Math.random().toString(36).slice(2, 6);
      (payload as LocalBusiness).slug = slug;
      (payload as LocalBusiness).owner_id = user.id;
    }

    let bizId = myBusiness?.id;

    if (myBusiness) {
      const { error } = await supabase.from('local_businesses').update(payload).eq('id', myBusiness.id);
      if (error) { showToast('error', 'Hiba', 'Mentés sikertelen.'); setSaving(false); return; }
    } else {
      const { data: newBiz, error } = await supabase.from('local_businesses').insert(payload).select().single();
      if (error || !newBiz) { showToast('error', 'Hiba', 'Vállalkozás létrehozása sikertelen.'); setSaving(false); return; }
      bizId = newBiz.id;
      setMyBusiness(newBiz as LocalBusiness);
      // Mark user as business owner
      await supabase.from('profiles').update({ is_business_owner: true }).eq('id', user.id);
    }

    if (bizId) {
      const updates: Partial<LocalBusiness> = {};
      if (logoFile) {
        const url = await uploadImage(logoFile, `${bizId}/logo`);
        if (url) updates.logo_url = url;
      }
      if (coverFile) {
        const url = await uploadImage(coverFile, `${bizId}/cover`);
        if (url) updates.cover_url = url;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('local_businesses').update(updates).eq('id', bizId);
      }
    }

    showToast('success', myBusiness ? 'Mentve' : 'Létrehozva', myBusiness ? 'Vállalkozásod frissítve.' : 'Vállalkozásod sikeresen regisztrálva!');
    await load();
    setSaving(false);
  }

  async function handleApply(message: string, type: BusinessType) {
    if (!user) return;
    const { error } = await supabase.from('local_business_applications').insert({
      user_id: user.id,
      business_type: type,
      message: message.trim(),
      status: 'pending',
    });
    if (error) { showToast('error', 'Hiba', 'Kérelem küldése sikertelen.'); return; }
    showToast('success', 'Kérelem elküldve', 'Értesítünk, amint elbíráljuk.');
    await load();
  }

  if (!user) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
        <p className="text-zinc-400">Bejelentkezés szükséges.</p>
        <button onClick={() => navigate('/login')} className="glass-pill-active text-emerald-300 px-5 py-2.5 rounded-xl text-sm font-medium">
          Bejelentkezés
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="glass rounded-3xl h-28 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/helyi-vallalkozasok')}
        className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />Vissza
      </button>

      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          <Store className="w-6 h-6 text-emerald-400" />
          {myBusiness ? 'Vállalkozásom' : 'Vállalkozás regisztrálása'}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {myBusiness ? 'Kezeld vállalkozásod profilját és termékeit.' : 'Hozz létre egy digitális profilt a helyi közösség számára.'}
        </p>
      </div>

      {/* Tab navigation (only if business exists) */}
      {myBusiness && (
        <div className="flex gap-2">
          {(['info', 'apply'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
              {tab === 'info' ? 'Profil adatok' : 'Státusz / Ellenőrzés'}
            </button>
          ))}
          <button
            onClick={() => navigate(`/helyi-vallalkozasok/${myBusiness.slug || myBusiness.id}`)}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-medium glass-pill text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5"
          >
            Profil megtekintése →
          </button>
        </div>
      )}

      {/* ── Apply / Status tab ── */}
      {myBusiness && activeTab === 'apply' && (
        <div className="space-y-4">
          {application ? (
            <div className="glass rounded-3xl p-6 space-y-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                application.status === 'approved' ? 'bg-emerald-500/15' :
                application.status === 'rejected' ? 'bg-red-500/15' : 'bg-amber-500/15'
              }`}>
                {application.status === 'approved' ? <CheckCircle className="w-6 h-6 text-emerald-400" /> :
                 application.status === 'rejected' ? <AlertCircle className="w-6 h-6 text-red-400" /> :
                 <Clock className="w-6 h-6 text-amber-400" />}
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-100">
                  {application.status === 'approved' ? 'Ellenőrzött vállalkozás' :
                   application.status === 'rejected' ? 'Kérelem elutasítva' : 'Kérelem elbírálás alatt'}
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  {application.status === 'approved' ? 'Vállalkozásod "Ellenőrzött" jelzést kapott.' :
                   application.status === 'rejected' ? 'A kérelem nem felelt meg a feltételeknek.' :
                   'Értesítünk, amint elbíráljuk (általában 1-3 munkanap).'}
                </p>
              </div>
            </div>
          ) : (
            <VerificationRequest onSubmit={handleApply} businessType={myBusiness.business_type} />
          )}
        </div>
      )}

      {/* ── Info / edit form ── */}
      {(!myBusiness || activeTab === 'info') && (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Business type */}
          {!myBusiness && (
            <div className="glass rounded-3xl p-5 space-y-3">
              <h2 className="font-semibold text-zinc-200 text-sm">Vállalkozás típusa *</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_TYPES.map((t) => {
                  const Icon = TYPE_ICONS[t];
                  const selected = form.businessType === t;
                  return (
                    <button type="button" key={t} onClick={() => setForm({ ...form, businessType: t })}
                      className={`flex flex-col items-start gap-2 p-3 rounded-2xl border text-left transition-all ${selected ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300' : 'border-transparent glass-bubble text-zinc-400 hover:text-zinc-200'}`}>
                      <Icon className={`w-5 h-5 ${selected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <div>
                        <p className="text-xs font-semibold">{BUSINESS_TYPE_LABELS[t]}</p>
                        <p className="text-[10px] text-zinc-600 leading-snug mt-0.5">{TYPE_DESCRIPTIONS[t]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Basic info */}
          <div className="glass rounded-3xl p-5 space-y-4">
            <h2 className="font-semibold text-zinc-200 text-sm">Alapadatok</h2>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Vállalkozás neve *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100}
                placeholder="pl. Kovács Kertészet"
                className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Rövid mottó / tagline</label>
              <input type="text" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} maxLength={120}
                placeholder="pl. Friss zöldségek egyenesen a kertből"
                className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Bemutatkozó szöveg</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} maxLength={1000}
                placeholder="Mesélj rólad és vállalkozásodról..."
                className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Kategóriák / szakterületek</label>
              <TagInput
                tags={form.categories}
                onChange={(cats) => setForm({ ...form, categories: cats })}
                placeholder="pl. Paradicsom, Ékszer, Webfejlesztés — Enter-rel add hozzá"
              />
            </div>
          </div>

          {/* Images */}
          <div className="glass rounded-3xl p-5 space-y-4">
            <h2 className="font-semibold text-zinc-200 text-sm">Képek</h2>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploader
                label="Logó / Profilkép"
                value={myBusiness?.logo_url || null}
                onFile={setLogoFile}
                onClear={() => setLogoFile(null)}
              />
              <ImageUploader
                label="Borítókép"
                value={myBusiness?.cover_url || null}
                onFile={setCoverFile}
                onClear={() => setCoverFile(null)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="glass rounded-3xl p-5 space-y-4">
            <h2 className="font-semibold text-zinc-200 text-sm">Helyszín</h2>
            <select value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })}
              className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none">
              <option value="">Válassz megyét (opcionális)</option>
              {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={100}
                placeholder="Város, utca (opcionális)"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
          </div>

          {/* Contact */}
          <div className="glass rounded-3xl p-5 space-y-4">
            <h2 className="font-semibold text-zinc-200 text-sm">Elérhetőségek</h2>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} maxLength={30}
                placeholder="+36 30 123 4567"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} maxLength={100}
                placeholder="email@pelda.hu"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} maxLength={200}
                placeholder="https://weboldalam.hu (opcionális)"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
          </div>

          {/* Availability toggle */}
          <div className="glass rounded-3xl p-5">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => setForm({ ...form, isAvailableToday: !form.isAvailableToday })}
                className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${form.isAvailableToday ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isAvailableToday ? 'left-6' : 'left-1'}`} />
              </div>
              <div>
                <p className="text-sm text-zinc-300 flex items-center gap-1.5 font-medium">
                  <Zap className="w-4 h-4 text-emerald-400" />Ma elérhető
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">Jelzi, hogy ma nyitva vagy / elérhető vagy személyesen is</p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving || form.name.trim().length < 2}
              className="flex-1 py-4 glass-pill-active text-emerald-300 font-semibold rounded-2xl transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />{saving ? 'Mentés...' : myBusiness ? 'Változások mentése' : 'Vállalkozás létrehozása'}
            </button>
            <button type="button" onClick={() => navigate('/helyi-vallalkozasok')}
              className="px-6 py-4 glass-pill text-zinc-400 font-medium rounded-2xl hover:text-zinc-200 transition-colors">
              Mégse
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Verification request sub-component ───────────────────────────────────────

function VerificationRequest({ onSubmit, businessType }: { onSubmit: (msg: string, type: BusinessType) => void; businessType: BusinessType }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10 || sending) return;
    setSending(true);
    await onSubmit(message, businessType);
    setSending(false);
  }

  return (
    <div className="glass rounded-3xl p-6 space-y-4">
      <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-emerald-400" />Ellenőrzés kérése
      </h2>
      <p className="text-zinc-500 text-sm leading-relaxed">
        Az "Ellenőrzött" jelzés növeli a hitelességet és a láthatóságot. Kérj ellenőrzést az adminisztrátoroktól.
      </p>
      <form onSubmit={handle} className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Mutatkozz be röviden *</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={500}
            placeholder="Rövid bemutatkozás, miért szeretnél ellenőrzött státuszt kapni..."
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none" />
        </div>
        <button type="submit" disabled={message.trim().length < 10 || sending}
          className="w-full py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          {sending ? 'Küldés...' : 'Kérelem beküldése'}
        </button>
      </form>
    </div>
  );
}
