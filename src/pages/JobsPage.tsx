import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { Job, JobSeekerAd } from '../lib/types';
import { formatRelativeTime, HUNGARIAN_COUNTIES, JOB_CATEGORIES } from '../lib/utils';
import {
  Briefcase, MapPin, Search, PlusCircle, Building2, Clock,
  Wifi, ChevronRight, SlidersHorizontal, X, Banknote, Pencil,
  Trash2, Camera, Save, Phone, Mail, ArrowLeft, CheckCircle, AlertCircle,
  UserSearch, Send, User, GraduationCap, MessageCircle, Lock
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const JOB_CATEGORIES_NO_ALL = (JOB_CATEGORIES as readonly string[]).filter((c) => c !== 'Összes');

const JOB_TYPES: Record<string, { label: string; color: string }> = {
  teljes:     { label: 'Teljes állás',      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  reszmunka:  { label: 'Részmunka',         color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  szabaduszo: { label: 'Szabadúszó',        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  gyakorlat:  { label: 'Szakmai gyakorlat', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
};
const JOB_TYPE_LIST = [
  { value: 'teljes', label: 'Teljes állás' },
  { value: 'reszmunka', label: 'Részmunka' },
  { value: 'szabaduszo', label: 'Szabadúszó' },
  { value: 'gyakorlat', label: 'Szakmai gyakorlat' },
];

const EXPERIENCE_LIST = [
  { value: '', label: 'Nem megadott' },
  { value: 'no-exp', label: 'Tapasztalat nélkül' },
  { value: '1-2', label: '1–2 év' },
  { value: '3-5', label: '3–5 év' },
  { value: '5+', label: '5+ év' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSalary(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return null;
  const fmt = (n: number) => new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(n) + ' ' + currency;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `–${fmt(max)}`;
  return null;
}

function CompanyLogo({ src, name, size = 'md' }: { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const [err, setErr] = useState(false);
  const dims = { sm: 'w-9 h-9', md: 'w-11 h-11', lg: 'w-16 h-16' };
  const iconDims = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };
  const textDims = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };
  if (src && !err) {
    return <img src={src} alt={name} onError={() => setErr(true)}
      className={`${dims[size]} object-cover rounded-xl flex-shrink-0`} />;
  }
  const initials = name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  if (initials) {
    return (
      <div className={`${dims[size]} glass-bubble rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-emerald-400 ${textDims[size]}`}>
        {initials}
      </div>
    );
  }
  return (
    <div className={`${dims[size]} glass-bubble rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Building2 className={`${iconDims[size]} text-emerald-400`} />
    </div>
  );
}

// ── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-sm space-y-4">
        <div className="w-12 h-12 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-zinc-100 mb-1">Hirdetés törlése</h3>
          <p className="text-zinc-400 text-sm">Biztosan törlöd a <span className="text-zinc-200 font-medium">"{title}"</span> hirdetést?</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm}
            className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium text-sm hover:bg-red-500/30 transition-colors">
            Törlés
          </button>
          <button onClick={onCancel}
            className="flex-1 py-3 glass-pill text-zinc-400 rounded-xl font-medium text-sm hover:text-zinc-200 transition-colors">
            Mégse
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contact modal (employer → seeker) ────────────────────────────────────────

function ContactSeekerModal({ seekerAd, onClose }: { seekerAd: JobSeekerAd; onClose: () => void }) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!user || !message.trim()) return;
    setSending(true);

    // Find or create a conversation — we use a pseudo-listing approach via direct message
    // Since conversations require a listing_id, we'll use the existing messages infra
    // by checking if a direct message conversation exists. Here we send via supabase directly.
    const senderName = 'Munkáltató';
    const fullMsg = `Üzenet állást kereső hirdetésedre ("${seekerAd.title}"):\n\n${message.trim()}`;

    // Create a conversation record with listing_id = null workaround: we'll use a special
    // system message approach. Instead, open a new conversation linked to seekerAd user.
    // We reuse the conversations table with a NULL listing_id by casting.
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', seekerAd.user_id)
      .is('listing_id', null)
      .maybeSingle();

    let convId: string | null = existingConv?.id ?? null;

    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: seekerAd.user_id, listing_id: null })
        .select('id')
        .single();
      convId = newConv?.id ?? null;
    }

    if (convId) {
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        content: fullMsg,
      });
      showToast('success', 'Üzenet elküldve', 'Az álláskeresőnek értesítést küldtünk.');
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
            <MessageCircle className="w-5 h-5 text-emerald-400" />Jelzés az álláskeresőnek
          </h3>
          <button onClick={onClose} className="w-8 h-8 glass-pill rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="glass-bubble rounded-2xl p-4">
          <p className="text-sm font-medium text-zinc-200">{seekerAd.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {seekerAd.user?.full_name || seekerAd.user?.username || 'Ismeretlen felhasználó'}
          </p>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Üzenet az álláskeresőnek *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="pl. Érdekes a profilod, szeretnénk felvenni Önnel a kapcsolatot egy pozíciónkkal kapcsolatban..."
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none text-sm leading-relaxed"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending || !user}
            className="flex-1 py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />{sending ? 'Küldés...' : 'Üzenet küldése'}
          </button>
          <button onClick={onClose}
            className="px-5 py-3 glass-pill text-zinc-400 rounded-xl font-medium text-sm hover:text-zinc-200 transition-colors">
            Mégse
          </button>
        </div>
        {!user && <p className="text-xs text-zinc-500 text-center">Be kell jelentkezni az üzenet küldéséhez.</p>}
      </div>
    </div>
  );
}

// ── Job offer form ────────────────────────────────────────────────────────────

interface JobFormState {
  title: string; company: string; description: string; category: string;
  type: string; location: string; remote: boolean; salaryMin: string;
  salaryMax: string; contactEmail: string; contactPhone: string; logoPreview: string | null;
}

function parseLocationParts(raw: string): [string, string] {
  const idx = raw.lastIndexOf(', ');
  if (idx > -1) return [raw.slice(0, idx), raw.slice(idx + 2)];
  return ['', raw];
}

function buildLocation(city: string, county: string): string {
  return city.trim() ? `${city.trim()}, ${county}` : county;
}

function JobOfferForm({ initial, onSave, onCancel }: {
  initial: JobFormState;
  onSave: (data: JobFormState, logoFile: File | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = useState<JobFormState>(initial);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const [locCounty, setLocCounty] = useState(() => parseLocationParts(initial.location)[1]);
  const [locCity, setLocCity] = useState(() => parseLocationParts(initial.location)[0]);
  const canSave = d.title.trim().length >= 3 && d.company.trim().length >= 2 && d.description.trim().length >= 20;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setD((prev) => ({ ...prev, logoPreview: URL.createObjectURL(file) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    await onSave({ ...d, location: buildLocation(locCity, locCounty) }, logoFile);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-200 text-sm">Alapadatok</h2>
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => logoRef.current?.click()}>
            <CompanyLogo src={d.logoPreview} name={d.company || 'C'} size="lg" />
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <button type="button" onClick={() => logoRef.current?.click()}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium flex items-center gap-1.5">
              <Camera className="w-4 h-4" />Logó feltöltése
            </button>
            <p className="text-xs text-zinc-600 mt-0.5">JPG, PNG, WebP — max 2 MB</p>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Pozíció megnevezése *</label>
          <input type="text" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })}
            placeholder="pl. Senior React fejlesztő" maxLength={120}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Cég neve *</label>
          <input type="text" value={d.company} onChange={(e) => setD({ ...d, company: e.target.value })}
            placeholder="pl. Acme Kft." maxLength={100}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Kategória</label>
            <select value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}
              className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none cursor-pointer">
              {JOB_CATEGORIES_NO_ALL.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Típus</label>
            <select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })}
              className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none cursor-pointer">
              {JOB_TYPE_LIST.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-200 text-sm">Helyszín</h2>
        <select value={locCounty} onChange={(e) => setLocCounty(e.target.value)}
          className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none cursor-pointer">
          <option value="">Válassz megyét</option>
          {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" value={locCity} onChange={(e) => setLocCity(e.target.value)}
            placeholder="Város / falu / kerület (opcionális)" maxLength={80}
            className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setD({ ...d, remote: !d.remote })}
            className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${d.remote ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${d.remote ? 'left-5' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-zinc-300 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-sky-400" />Remote / otthoni munkavégzés
          </span>
        </label>
      </div>
      <div className="glass rounded-3xl p-6 space-y-3">
        <h2 className="font-semibold text-zinc-200 text-sm">Leírás *</h2>
        <textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })}
          rows={7} placeholder="Feladatok, elvárások, amit kínálunk..."
          className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none text-sm leading-relaxed" />
        <p className="text-xs text-zinc-600 text-right">{d.description.length} karakter</p>
      </div>
      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-400" />Fizetés (opcionális)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Minimum (HUF/hó)</label>
            <input type="number" value={d.salaryMin} onChange={(e) => setD({ ...d, salaryMin: e.target.value })}
              placeholder="500 000" min={0}
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Maximum (HUF/hó)</label>
            <input type="number" value={d.salaryMax} onChange={(e) => setD({ ...d, salaryMax: e.target.value })}
              placeholder="800 000" min={0}
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          </div>
        </div>
      </div>
      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-200 text-sm">Kapcsolat <span className="text-zinc-600 font-normal">(opcionális)</span></h2>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="email" value={d.contactEmail} onChange={(e) => setD({ ...d, contactEmail: e.target.value })}
            placeholder="allasok@ceg.hu"
            className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="tel" value={d.contactPhone} onChange={(e) => setD({ ...d, contactPhone: e.target.value })}
            placeholder="+36 30 123 4567"
            className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={!canSave || saving}
          className="flex-1 py-4 glass-pill-active text-emerald-300 font-semibold rounded-2xl transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />{saving ? 'Mentés...' : 'Mentés'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-4 glass-pill text-zinc-400 font-medium rounded-2xl hover:text-zinc-200 transition-colors">
          Mégse
        </button>
      </div>
    </form>
  );
}

// ── Job seeker ad form ────────────────────────────────────────────────────────

interface SeekerFormState {
  title: string; description: string; category: string; type: string;
  location: string; remote: boolean; salaryMin: string; salaryMax: string;
  contactEmail: string; contactPhone: string; experience: string;
}

function JobSeekerForm({ initial, onSave, onCancel }: {
  initial: SeekerFormState;
  onSave: (data: SeekerFormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = useState<SeekerFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [locCounty, setLocCounty] = useState(() => parseLocationParts(initial.location)[1]);
  const [locCity, setLocCity] = useState(() => parseLocationParts(initial.location)[0]);
  const canSave = d.title.trim().length >= 3 && d.description.trim().length >= 20;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    await onSave({ ...d, location: buildLocation(locCity, locCounty) });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-200 text-sm">Keresett pozíció</h2>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Pozíció / munkakör megnevezése *</label>
          <input type="text" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })}
            placeholder="pl. Asztalos segédmunkás, Könyvelő, React fejlesztő" maxLength={120}
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Kategória</label>
            <select value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}
              className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none cursor-pointer">
              {JOB_CATEGORIES_NO_ALL.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Foglalkoztatás típusa</label>
            <select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })}
              className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none cursor-pointer">
              {JOB_TYPE_LIST.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Tapasztalat</label>
          <select value={d.experience} onChange={(e) => setD({ ...d, experience: e.target.value })}
            className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none cursor-pointer">
            {EXPERIENCE_LIST.map((exp) => <option key={exp.value} value={exp.value}>{exp.label}</option>)}
          </select>
        </div>
      </div>
      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-200 text-sm">Helyszín preferencia</h2>
        <select value={locCounty} onChange={(e) => setLocCounty(e.target.value)}
          className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none cursor-pointer">
          <option value="">Válassz megyét (opcionális)</option>
          {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" value={locCity} onChange={(e) => setLocCity(e.target.value)}
            placeholder="Város / falu / kerület (opcionális)" maxLength={80}
            className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setD({ ...d, remote: !d.remote })}
            className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${d.remote ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${d.remote ? 'left-5' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-zinc-300 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-sky-400" />Remote munkát is vállalok
          </span>
        </label>
      </div>
      <div className="glass rounded-3xl p-6 space-y-3">
        <h2 className="font-semibold text-zinc-200 text-sm">Bemutatkozás *</h2>
        <textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })}
          rows={7} placeholder="Mutatkozz be! Mik a tapasztalataid, mit keresel, mikor tudsz kezdeni..."
          className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none text-sm leading-relaxed" />
        <p className="text-xs text-zinc-600 text-right">{d.description.length} karakter</p>
      </div>
      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-400" />Elvárt fizetés (opcionális)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Minimum (HUF/hó)</label>
            <input type="number" value={d.salaryMin} onChange={(e) => setD({ ...d, salaryMin: e.target.value })}
              placeholder="350 000" min={0}
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Maximum (HUF/hó)</label>
            <input type="number" value={d.salaryMax} onChange={(e) => setD({ ...d, salaryMax: e.target.value })}
              placeholder="600 000" min={0}
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          </div>
        </div>
      </div>
      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-200 text-sm">Elérhetőség <span className="text-zinc-600 font-normal">(opcionális)</span></h2>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="email" value={d.contactEmail} onChange={(e) => setD({ ...d, contactEmail: e.target.value })}
            placeholder="email@pelda.hu"
            className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="tel" value={d.contactPhone} onChange={(e) => setD({ ...d, contactPhone: e.target.value })}
            placeholder="+36 30 123 4567"
            className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={!canSave || saving}
          className="flex-1 py-4 glass-pill-active text-emerald-300 font-semibold rounded-2xl transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />{saving ? 'Mentés...' : 'Mentés'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-4 glass-pill text-zinc-400 font-medium rounded-2xl hover:text-zinc-200 transition-colors">
          Mégse
        </button>
      </div>
    </form>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

type MainTab = 'offers' | 'seekers';
type View = 'list' | 'detail' | 'create' | 'edit' | 'seeker-create' | 'seeker-detail' | 'seeker-edit';

export default function JobsPage() {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const { navigate } = useRouter();

  // Tab
  const [mainTab, setMainTab] = useState<MainTab>('offers');

  // Job offers state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Összes');
  const [typeFilter, setTypeFilter] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [view, setView] = useState<View>('list');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Job seekers state
  const [seekerAds, setSeekerAds] = useState<JobSeekerAd[]>([]);
  const [seekersLoading, setSeekersLoading] = useState(true);
  const [seekerSearch, setSeekerSearch] = useState('');
  const [seekerCategory, setSeekerCategory] = useState('Összes');
  const [seekerRemoteOnly, setSeekerRemoteOnly] = useState(false);
  const [selectedSeekerAd, setSelectedSeekerAd] = useState<JobSeekerAd | null>(null);
  const [editingSeekerAd, setEditingSeekerAd] = useState<JobSeekerAd | null>(null);
  const [deletingSeekerAdId, setDeletingSeekerAdId] = useState<string | null>(null);
  const [contactSeekerAd, setContactSeekerAd] = useState<JobSeekerAd | null>(null);

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { fetchSeekerAds(); }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function fetchJobs() {
    setJobsLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('*, poster:profiles(id, username, full_name, avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(200);
    setJobs(data || []);
    setJobsLoading(false);
  }

  async function fetchSeekerAds() {
    setSeekersLoading(true);
    const { data } = await supabase
      .from('job_seeker_ads')
      .select('*, user:profiles(id, username, full_name, avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(200);
    setSeekerAds(data || []);
    setSeekersLoading(false);
  }

  // ── Job offer CRUD ─────────────────────────────────────────────────────────

  async function uploadLogo(file: File, jobId: string): Promise<string | null> {
    if (!user) return null;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${jobId}.${ext}`;
    const { error } = await supabase.storage.from('job-images').upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('job-images').getPublicUrl(path);
    return data.publicUrl + `?t=${Date.now()}`;
  }

  async function handleJobCreate(d: JobFormState, logoFile: File | null) {
    if (!user) return;
    setUploadingLogo(true);
    const { data: newJob, error } = await supabase.from('jobs').insert({
      poster_id: user.id,
      title: d.title.trim(), company: d.company.trim(), description: d.description.trim(),
      category: d.category, type: d.type, location: d.location.trim(), remote: d.remote,
      salary_min: d.salaryMin ? parseInt(d.salaryMin) : null,
      salary_max: d.salaryMax ? parseInt(d.salaryMax) : null,
      contact_email: d.contactEmail.trim(), contact_phone: d.contactPhone.trim(), status: 'active',
    }).select().single();
    if (error || !newJob) { setUploadingLogo(false); showToast('error', 'Hiba', 'A hirdetés feladása sikertelen.'); return; }
    if (logoFile) {
      const url = await uploadLogo(logoFile, newJob.id);
      if (url) await supabase.from('jobs').update({ logo_url: url }).eq('id', newJob.id);
    }
    setUploadingLogo(false);
    showToast('success', 'Hirdetés feladva', 'Az állás sikeresen megjelent.');
    await fetchJobs();
    setView('list');
  }

  async function handleJobEdit(d: JobFormState, logoFile: File | null) {
    if (!editingJob) return;
    setUploadingLogo(true);
    let logoUrl = editingJob.logo_url;
    if (logoFile) { const url = await uploadLogo(logoFile, editingJob.id); if (url) logoUrl = url; }
    const { error } = await supabase.from('jobs').update({
      title: d.title.trim(), company: d.company.trim(), description: d.description.trim(),
      category: d.category, type: d.type, location: d.location.trim(), remote: d.remote,
      salary_min: d.salaryMin ? parseInt(d.salaryMin) : null,
      salary_max: d.salaryMax ? parseInt(d.salaryMax) : null,
      contact_email: d.contactEmail.trim(), contact_phone: d.contactPhone.trim(), logo_url: logoUrl,
    }).eq('id', editingJob.id);
    setUploadingLogo(false);
    if (error) { showToast('error', 'Hiba', 'Mentés sikertelen.'); return; }
    showToast('success', 'Mentve', 'Hirdetés frissítve.');
    await fetchJobs();
    setView('list'); setEditingJob(null);
  }

  async function handleJobDelete(id: string) {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    setDeletingJobId(null);
    if (error) { showToast('error', 'Hiba', 'A törlés sikertelen.'); return; }
    showToast('success', 'Törölve', 'Hirdetés eltávolítva.');
    await fetchJobs();
    if (selectedJob?.id === id) { setSelectedJob(null); setView('list'); }
  }

  // ── Job seeker ad CRUD ─────────────────────────────────────────────────────

  async function handleSeekerCreate(d: SeekerFormState) {
    if (!user) return;
    const { error } = await supabase.from('job_seeker_ads').insert({
      user_id: user.id,
      title: d.title.trim(), description: d.description.trim(),
      category: d.category, type: d.type, location: d.location.trim(), remote: d.remote,
      expected_salary_min: d.salaryMin ? parseInt(d.salaryMin) : null,
      expected_salary_max: d.salaryMax ? parseInt(d.salaryMax) : null,
      contact_email: d.contactEmail.trim(), contact_phone: d.contactPhone.trim(),
      experience: d.experience, status: 'active',
    });
    if (error) { showToast('error', 'Hiba', 'A hirdetés feladása sikertelen.'); return; }
    showToast('success', 'Hirdetés feladva', 'Álláskeresési hirdetésed megjelent.');
    await fetchSeekerAds();
    setView('list');
  }

  async function handleSeekerEdit(d: SeekerFormState) {
    if (!editingSeekerAd) return;
    const { error } = await supabase.from('job_seeker_ads').update({
      title: d.title.trim(), description: d.description.trim(),
      category: d.category, type: d.type, location: d.location.trim(), remote: d.remote,
      expected_salary_min: d.salaryMin ? parseInt(d.salaryMin) : null,
      expected_salary_max: d.salaryMax ? parseInt(d.salaryMax) : null,
      contact_email: d.contactEmail.trim(), contact_phone: d.contactPhone.trim(),
      experience: d.experience,
    }).eq('id', editingSeekerAd.id);
    if (error) { showToast('error', 'Hiba', 'Mentés sikertelen.'); return; }
    showToast('success', 'Mentve', 'Hirdetés frissítve.');
    await fetchSeekerAds();
    setView('list'); setEditingSeekerAd(null);
  }

  async function handleSeekerDelete(id: string) {
    const { error } = await supabase.from('job_seeker_ads').delete().eq('id', id);
    setDeletingSeekerAdId(null);
    if (error) { showToast('error', 'Hiba', 'A törlés sikertelen.'); return; }
    showToast('success', 'Törölve', 'Hirdetés eltávolítva.');
    await fetchSeekerAds();
    if (selectedSeekerAd?.id === id) { setSelectedSeekerAd(null); setView('list'); }
  }

  // ── Filtered data ──────────────────────────────────────────────────────────

  // Category of the current user's own active job seeker ad (for prioritizing job offers)
  const mySeekingCategory = user
    ? seekerAds.find((s) => s.user_id === user.id)?.category ?? null
    : null;

  // Category of the current user's own active job offer (for prioritizing seekers)
  const myPostingCategory = user
    ? jobs.find((j) => j.poster_id === user.id)?.category ?? null
    : null;

  const filteredJobs = jobs
    .filter((j) => {
      if (search && !j.title.toLowerCase().includes(search.toLowerCase()) &&
          !j.company.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== 'Összes' && j.category !== category) return false;
      if (typeFilter && j.type !== typeFilter) return false;
      if (remoteOnly && !j.remote) return false;
      return true;
    })
    .sort((a, b) => {
      if (mySeekingCategory && category === 'Összes') {
        const aMatch = a.category === mySeekingCategory ? 0 : 1;
        const bMatch = b.category === mySeekingCategory ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      return 0;
    });

  const filteredSeekers = seekerAds
    .filter((s) => {
      if (seekerSearch && !s.title.toLowerCase().includes(seekerSearch.toLowerCase()) &&
          !s.description.toLowerCase().includes(seekerSearch.toLowerCase())) return false;
      if (seekerCategory !== 'Összes' && s.category !== seekerCategory) return false;
      if (seekerRemoteOnly && !s.remote) return false;
      return true;
    })
    .sort((a, b) => {
      if (myPostingCategory && seekerCategory === 'Összes') {
        const aMatch = a.category === myPostingCategory ? 0 : 1;
        const bMatch = b.category === myPostingCategory ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      return 0;
    });

  // ── Sub-view renders ───────────────────────────────────────────────────────

  if (view === 'create') {
    const emptyJob: JobFormState = {
      title: '', company: '', description: '', category: 'Targoncavezető',
      type: 'teljes', location: '', remote: false, salaryMin: '', salaryMax: '',
      contactEmail: '', contactPhone: '', logoPreview: null,
    };
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Vissza
        </button>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2.5">
          <Briefcase className="w-6 h-6 text-emerald-400" />Állás hirdetés feladása
        </h1>
        <JobOfferForm initial={emptyJob} onSave={handleJobCreate} onCancel={() => setView('list')} />
        {uploadingLogo && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="glass rounded-2xl px-6 py-4 text-emerald-300 text-sm font-medium">Képfeltöltés...</div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'edit' && editingJob) {
    const initial: JobFormState = {
      title: editingJob.title, company: editingJob.company, description: editingJob.description,
      category: editingJob.category, type: editingJob.type, location: editingJob.location,
      remote: editingJob.remote,
      salaryMin: editingJob.salary_min?.toString() || '',
      salaryMax: editingJob.salary_max?.toString() || '',
      contactEmail: editingJob.contact_email, contactPhone: editingJob.contact_phone,
      logoPreview: editingJob.logo_url,
    };
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => { setView('list'); setEditingJob(null); }} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Vissza
        </button>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2.5">
          <Pencil className="w-6 h-6 text-emerald-400" />Hirdetés szerkesztése
        </h1>
        <JobOfferForm initial={initial} onSave={handleJobEdit} onCancel={() => { setView('list'); setEditingJob(null); }} />
        {uploadingLogo && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="glass rounded-2xl px-6 py-4 text-emerald-300 text-sm font-medium">Képfeltöltés...</div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'seeker-create') {
    const emptySeekerAd: SeekerFormState = {
      title: '', description: '', category: 'Egyéb', type: 'teljes',
      location: '', remote: false, salaryMin: '', salaryMax: '',
      contactEmail: '', contactPhone: '', experience: '',
    };
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Vissza
        </button>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2.5">
          <UserSearch className="w-6 h-6 text-sky-400" />Álláskeresési hirdetés feladása
        </h1>
        <div className="glass rounded-2xl p-4 mb-5 flex items-start gap-3 border border-sky-500/20">
          <div className="w-8 h-8 bg-sky-500/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <p className="text-sm text-zinc-200 font-medium">Állást keresel?</p>
            <p className="text-xs text-zinc-500 mt-0.5">Adj fel hirdetést, hogy a munkáltatók megtaláljanak és felvegyék veled a kapcsolatot.</p>
          </div>
        </div>
        <JobSeekerForm initial={emptySeekerAd} onSave={handleSeekerCreate} onCancel={() => setView('list')} />
      </div>
    );
  }

  if (view === 'seeker-edit' && editingSeekerAd) {
    const initial: SeekerFormState = {
      title: editingSeekerAd.title, description: editingSeekerAd.description,
      category: editingSeekerAd.category, type: editingSeekerAd.type,
      location: editingSeekerAd.location, remote: editingSeekerAd.remote,
      salaryMin: editingSeekerAd.expected_salary_min?.toString() || '',
      salaryMax: editingSeekerAd.expected_salary_max?.toString() || '',
      contactEmail: editingSeekerAd.contact_email, contactPhone: editingSeekerAd.contact_phone,
      experience: editingSeekerAd.experience,
    };
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => { setView('list'); setEditingSeekerAd(null); }} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Vissza
        </button>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2.5">
          <Pencil className="w-6 h-6 text-sky-400" />Álláskeresési hirdetés szerkesztése
        </h1>
        <JobSeekerForm initial={initial} onSave={handleSeekerEdit} onCancel={() => { setView('list'); setEditingSeekerAd(null); }} />
      </div>
    );
  }

  if (view === 'detail' && selectedJob) {
    const typeInfo = JOB_TYPES[selectedJob.type] ?? JOB_TYPES.teljes;
    const salary = formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency);
    const isOwn = user?.id === selectedJob.poster_id;
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setView('list'); setSelectedJob(null); }} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />Vissza
          </button>
          {isOwn && (
            <div className="flex gap-2">
              <button onClick={() => { setEditingJob(selectedJob); setView('edit'); }} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-emerald-300 transition-colors text-sm">
                <Pencil className="w-3.5 h-3.5" />Szerkesztés
              </button>
              <button onClick={() => setDeletingJobId(selectedJob.id)} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-red-400 transition-colors text-sm">
                <Trash2 className="w-3.5 h-3.5" />Törlés
              </button>
            </div>
          )}
        </div>
        <div className="glass rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <CompanyLogo src={selectedJob.logo_url} name={selectedJob.company} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-zinc-100 leading-tight">{selectedJob.title}</h1>
              <p className="text-zinc-400 mt-1">{selectedJob.company}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                {selectedJob.remote && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium text-sky-400 bg-sky-500/10 border-sky-500/20">
                    <Wifi className="w-3.5 h-3.5" />Remote
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="glass-bubble rounded-xl p-3">
              <p className="text-xs text-zinc-500 mb-1">Helyszín</p>
              <p className="text-sm text-zinc-200 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" />{selectedJob.location || '—'}</p>
            </div>
            <div className="glass-bubble rounded-xl p-3">
              <p className="text-xs text-zinc-500 mb-1">Kategória</p>
              <p className="text-sm text-zinc-200">{selectedJob.category}</p>
            </div>
            {salary && (
              <div className="glass-bubble rounded-xl p-3">
                <p className="text-xs text-zinc-500 mb-1">Fizetés</p>
                <p className="text-sm text-emerald-400 font-semibold">{salary}</p>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-zinc-200 mb-3 text-sm">Leírás</h2>
            <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{selectedJob.description}</div>
          </div>
          {(selectedJob.contact_email || selectedJob.contact_phone) && (
            <div className="border-t border-white/5 pt-5 space-y-3">
              <h2 className="font-semibold text-zinc-200 text-sm">Kapcsolat</h2>
              {user ? (
                <div className="flex flex-wrap gap-3">
                  {selectedJob.contact_email && (
                    <a href={`mailto:${selectedJob.contact_email}`} className="flex items-center gap-2 glass-pill px-4 py-2.5 rounded-xl text-sm text-emerald-300 hover:text-emerald-200 transition-colors font-medium">
                      <Mail className="w-4 h-4" />{selectedJob.contact_email}
                    </a>
                  )}
                  {selectedJob.contact_phone && (
                    <a href={`tel:${selectedJob.contact_phone}`} className="flex items-center gap-2 glass-pill px-4 py-2.5 rounded-xl text-sm text-emerald-300 hover:text-emerald-200 transition-colors font-medium">
                      <Phone className="w-4 h-4" />{selectedJob.contact_phone}
                    </a>
                  )}
                </div>
              ) : (
                <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors">
                  <Lock className="w-4 h-4" /> Bejelentkezés az elérhetőség megtekintéséhez
                </button>
              )}
            </div>
          )}
          <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs text-zinc-600">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Feladva: {formatRelativeTime(selectedJob.created_at)}</span>
            <span>Lejár: {new Date(selectedJob.expires_at).toLocaleDateString('hu-HU')}</span>
          </div>
        </div>
        {deletingJobId && (
          <DeleteModal
            title={jobs.find((j) => j.id === deletingJobId)?.title || ''}
            onConfirm={() => handleJobDelete(deletingJobId)}
            onCancel={() => setDeletingJobId(null)}
          />
        )}

        {/* Matching job seekers for this category */}
        {(() => {
          const matched = seekerAds.filter(
            (s) => s.status === 'active' && s.category === selectedJob.category
          );
          if (matched.length === 0) return null;
          return (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <UserSearch className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-zinc-100">
                  Munkát keresők ebben a kategóriában
                </h2>
                <span className="text-xs glass-pill px-2.5 py-0.5 rounded-full text-zinc-400 ml-auto">
                  {matched.length} személy
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Ezek a személyek <span className="text-zinc-300 font-medium">{selectedJob.category}</span> kategóriában keresnek munkát — felveheted velük a kapcsolatot.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matched.map((s) => {
                  const expLabel = EXPERIENCE_LIST.find((e) => e.value === s.experience)?.label;
                  const salary = formatSalary(s.expected_salary_min, s.expected_salary_max, s.salary_currency);
                  const typeInfo = JOB_TYPES[s.type] ?? JOB_TYPES.teljes;
                  return (
                    <div key={s.id} className="glass-bubble rounded-2xl p-4 space-y-2.5 border border-emerald-500/10 hover:border-emerald-500/25 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 glass rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/10">
                          <User className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-100 text-sm truncate">{s.title}</p>
                          <p className="text-xs text-zinc-500">{s.user?.full_name || s.user?.username || 'Névtelen'}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
                        {s.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{s.location}
                          </span>
                        )}
                        {s.remote && (
                          <span className="flex items-center gap-1 text-sky-400">
                            <Wifi className="w-3 h-3" />Remote
                          </span>
                        )}
                        {expLabel && expLabel !== 'Nem megadott' && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />{expLabel}
                          </span>
                        )}
                        {salary && (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <Banknote className="w-3 h-3" />{salary}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedSeekerAd(s); setView('seeker-detail'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-pill text-zinc-400 hover:text-zinc-200 rounded-xl text-xs transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />Profil megtekintése
                        </button>
                        {user && user.id !== s.user_id && (
                          <button
                            onClick={() => setContactSeekerAd(s)}
                            className="flex items-center gap-1.5 px-3 py-2 glass-pill-active text-emerald-300 rounded-xl text-xs font-medium transition-all hover:scale-[1.02]"
                          >
                            <Send className="w-3.5 h-3.5" />Kapcsolat
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {contactSeekerAd && (
          <ContactSeekerModal seekerAd={contactSeekerAd} onClose={() => setContactSeekerAd(null)} />
        )}
      </div>
    );
  }

  if (view === 'seeker-detail' && selectedSeekerAd) {
    const typeInfo = JOB_TYPES[selectedSeekerAd.type] ?? JOB_TYPES.teljes;
    const salary = formatSalary(selectedSeekerAd.expected_salary_min, selectedSeekerAd.expected_salary_max, selectedSeekerAd.salary_currency);
    const isOwn = user?.id === selectedSeekerAd.user_id;
    const expLabel = EXPERIENCE_LIST.find((e) => e.value === selectedSeekerAd.experience)?.label || 'Nem megadott';

    return (
      <div className="max-w-3xl mx-auto">
        {contactSeekerAd && (
          <ContactSeekerModal seekerAd={contactSeekerAd} onClose={() => setContactSeekerAd(null)} />
        )}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setView('list'); setSelectedSeekerAd(null); }} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />Vissza
          </button>
          {isOwn && (
            <div className="flex gap-2">
              <button onClick={() => { setEditingSeekerAd(selectedSeekerAd); setView('seeker-edit'); }} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-sky-300 transition-colors text-sm">
                <Pencil className="w-3.5 h-3.5" />Szerkesztés
              </button>
              <button onClick={() => setDeletingSeekerAdId(selectedSeekerAd.id)} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-red-400 transition-colors text-sm">
                <Trash2 className="w-3.5 h-3.5" />Törlés
              </button>
            </div>
          )}
        </div>
        <div className="glass rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 glass-bubble rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-zinc-100 leading-tight">{selectedSeekerAd.title}</h1>
              <p className="text-zinc-400 mt-1 text-sm">
                {selectedSeekerAd.user?.full_name || selectedSeekerAd.user?.username || 'Felhasználó'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                {selectedSeekerAd.remote && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium text-sky-400 bg-sky-500/10 border-sky-500/20">
                    <Wifi className="w-3.5 h-3.5" />Remote OK
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="glass-bubble rounded-xl p-3">
              <p className="text-xs text-zinc-500 mb-1">Helyszín</p>
              <p className="text-sm text-zinc-200 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-sky-400" />{selectedSeekerAd.location || '—'}</p>
            </div>
            <div className="glass-bubble rounded-xl p-3">
              <p className="text-xs text-zinc-500 mb-1">Tapasztalat</p>
              <p className="text-sm text-zinc-200 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-sky-400" />{expLabel}</p>
            </div>
            {salary && (
              <div className="glass-bubble rounded-xl p-3">
                <p className="text-xs text-zinc-500 mb-1">Elvárt fizetés</p>
                <p className="text-sm text-sky-400 font-semibold">{salary}</p>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-zinc-200 mb-3 text-sm">Bemutatkozás</h2>
            <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{selectedSeekerAd.description}</div>
          </div>
          {!isOwn && user && (
            <div className="border-t border-white/5 pt-5">
              <h2 className="font-semibold text-zinc-200 text-sm mb-3">Jelzés küldése</h2>
              <p className="text-xs text-zinc-500 mb-3">Ha megfelel a profilja, küldj üzenetet az álláskeresőnek a platformon keresztül.</p>
              <button onClick={() => setContactSeekerAd(selectedSeekerAd)}
                className="flex items-center gap-2 glass-pill-active text-emerald-300 px-5 py-3 rounded-xl font-medium text-sm hover:scale-[1.02] transition-all">
                <MessageCircle className="w-4 h-4" />Üzenet / Jelzés küldése
              </button>
            </div>
          )}
          {(selectedSeekerAd.contact_email || selectedSeekerAd.contact_phone) && !isOwn && (
            <div className="border-t border-white/5 pt-5 space-y-3">
              <h2 className="font-semibold text-zinc-200 text-sm">Közvetlen elérhetőség</h2>
              {user ? (
                <div className="flex flex-wrap gap-3">
                  {selectedSeekerAd.contact_email && (
                    <a href={`mailto:${selectedSeekerAd.contact_email}`} className="flex items-center gap-2 glass-pill px-4 py-2.5 rounded-xl text-sm text-sky-300 hover:text-sky-200 transition-colors font-medium">
                      <Mail className="w-4 h-4" />{selectedSeekerAd.contact_email}
                    </a>
                  )}
                  {selectedSeekerAd.contact_phone && (
                    <a href={`tel:${selectedSeekerAd.contact_phone}`} className="flex items-center gap-2 glass-pill px-4 py-2.5 rounded-xl text-sm text-sky-300 hover:text-sky-200 transition-colors font-medium">
                      <Phone className="w-4 h-4" />{selectedSeekerAd.contact_phone}
                    </a>
                  )}
                </div>
              ) : (
                <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors">
                  <Lock className="w-4 h-4" /> Bejelentkezés az elérhetőség megtekintéséhez
                </button>
              )}
            </div>
          )}
          <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs text-zinc-600">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Feladva: {formatRelativeTime(selectedSeekerAd.created_at)}</span>
            <span>Lejár: {new Date(selectedSeekerAd.expires_at).toLocaleDateString('hu-HU')}</span>
          </div>
        </div>

        {/* Matching job offers for this category */}
        {(() => {
          const matched = jobs.filter(
            (j) => j.status === 'active' && j.category === selectedSeekerAd.category
          );
          if (matched.length === 0) return null;
          return (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-400" />
                <h2 className="font-bold text-zinc-100">
                  Állásajánlatok ebben a kategóriában
                </h2>
                <span className="text-xs glass-pill px-2.5 py-0.5 rounded-full text-zinc-400 ml-auto">
                  {matched.length} ajánlat
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Ezek a cégek <span className="text-zinc-300 font-medium">{selectedSeekerAd.category}</span> kategóriában hirdetnek munkát — jelentkezhetsz náluk.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matched.map((j) => {
                  const salary = formatSalary(j.salary_min, j.salary_max, j.salary_currency);
                  const typeInfo = JOB_TYPES[j.type] ?? JOB_TYPES.teljes;
                  return (
                    <div key={j.id} className="glass-bubble rounded-2xl p-4 space-y-2.5 border border-sky-500/10 hover:border-sky-500/25 transition-colors">
                      <div className="flex items-start gap-3">
                        {j.logo_url ? (
                          <img src={j.logo_url} alt={j.company} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 glass rounded-xl flex items-center justify-center flex-shrink-0 bg-sky-500/10">
                            <Building2 className="w-5 h-5 text-sky-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-100 text-sm truncate">{j.title}</p>
                          <p className="text-xs text-zinc-500">{j.company}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
                        {j.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{j.location}
                          </span>
                        )}
                        {j.remote && (
                          <span className="flex items-center gap-1 text-sky-400">
                            <Wifi className="w-3 h-3" />Remote
                          </span>
                        )}
                        {salary && (
                          <span className="flex items-center gap-1 text-sky-400 font-medium">
                            <Banknote className="w-3 h-3" />{salary}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => { setSelectedJob(j); setView('detail'); }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 glass-pill text-zinc-400 hover:text-zinc-200 rounded-xl text-xs transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />Hirdetés megtekintése
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {deletingSeekerAdId && (
          <DeleteModal
            title={seekerAds.find((s) => s.id === deletingSeekerAdId)?.title || ''}
            onConfirm={() => handleSeekerDelete(deletingSeekerAdId)}
            onCancel={() => setDeletingSeekerAdId(null)}
          />
        )}
      </div>
    );
  }

  // ── Main list view ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Modals */}
      {deletingJobId && (
        <DeleteModal
          title={jobs.find((j) => j.id === deletingJobId)?.title || ''}
          onConfirm={() => handleJobDelete(deletingJobId)}
          onCancel={() => setDeletingJobId(null)}
        />
      )}
      {deletingSeekerAdId && (
        <DeleteModal
          title={seekerAds.find((s) => s.id === deletingSeekerAdId)?.title || ''}
          onConfirm={() => handleSeekerDelete(deletingSeekerAdId)}
          onCancel={() => setDeletingSeekerAdId(null)}
        />
      )}
      {contactSeekerAd && (
        <ContactSeekerModal seekerAd={contactSeekerAd} onClose={() => setContactSeekerAd(null)} />
      )}

      {/* ── HERO ── */}
      <section className="relative overflow-hidden rounded-3xl glass p-8 md:p-10">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-sky-500/[0.05] rounded-full blur-[80px] pointer-events-none" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-2">
            Állásbörzé<span className="text-emerald-400">nk</span>
          </h1>
          <p className="text-zinc-400 text-base mb-8 max-w-xl leading-relaxed">
            Munkáltatók és álláskeresők egy helyen. Adj fel hirdetést, vagy találd meg álmaid állását percek alatt.
          </p>

          {/* Two big CTA cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Munkát hirdetek */}
            <div
              onClick={() => { setMainTab('offers'); user ? setView('create') : window.location.assign('/login'); }}
              className="group cursor-pointer glass-bubble rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all hover:scale-[1.02]"
            >
              <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/25 transition-colors">
                <Briefcase className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors mb-1">Munkát hirdetek</h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                Állásajánlatot adok fel, hogy a legjobb jelöltek megtaláljanak.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">{jobs.length} aktív hirdetés</span>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold group-hover:gap-2 transition-all">
                  Hirdetés feladása <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Munkát keresek */}
            <div
              onClick={() => { setMainTab('seekers'); user ? setView('seeker-create') : window.location.assign('/login'); }}
              className="group cursor-pointer glass-bubble rounded-2xl p-5 border border-sky-500/20 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all hover:scale-[1.02]"
            >
              <div className="w-12 h-12 bg-sky-500/15 border border-sky-500/25 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-sky-500/25 transition-colors">
                <UserSearch className="w-6 h-6 text-sky-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100 group-hover:text-sky-300 transition-colors mb-1">Munkát keresek</h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                Bemutatkozom, és várom, hogy a megfelelő munkáltató megtaláljon.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">{seekerAds.length} álláskeresési hirdetés</span>
                <span className="flex items-center gap-1 text-sky-400 text-xs font-semibold group-hover:gap-2 transition-all">
                  Hirdetés feladása <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN TABS ── */}
      <div className="glass rounded-2xl p-1.5 flex gap-1">
        <button
          onClick={() => setMainTab('offers')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            mainTab === 'offers'
              ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}>
          <Briefcase className="w-4 h-4" />
          Munkát hirdetek
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${mainTab === 'offers' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/60 text-zinc-500'}`}>
            {jobs.length}
          </span>
        </button>
        <button
          onClick={() => setMainTab('seekers')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            mainTab === 'seekers'
              ? 'bg-sky-500/15 border border-sky-500/25 text-sky-300'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}>
          <UserSearch className="w-4 h-4" />
          Munkát keresek
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${mainTab === 'seekers' ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-700/60 text-zinc-500'}`}>
            {seekerAds.length}
          </span>
        </button>
      </div>

      {/* ── JOB OFFERS TAB ── */}
      {mainTab === 'offers' && (
        <>
          {/* My own listings strip */}
          {user && jobs.some((j) => j.poster_id === user.id) && (
            <div className="glass rounded-2xl p-4 border border-emerald-500/10">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />Saját álláshirdetéseim
              </p>
              <div className="space-y-2">
                {jobs.filter((j) => j.poster_id === user.id).map((job) => (
                  <div key={job.id} className="flex items-center gap-3 glass-pill px-3 py-2.5 rounded-xl">
                    <CompanyLogo src={job.logo_url} name={job.company} size="sm" />
                    <div className="flex-1 min-w-0">
                      <button onClick={() => { setSelectedJob(job); setView('detail'); }}
                        className="text-sm font-medium text-zinc-200 hover:text-emerald-300 transition-colors truncate block text-left">
                        {job.title}
                      </button>
                      <p className="text-xs text-zinc-600">{job.company}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingJob(job); setView('edit'); }} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-emerald-300 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletingJobId(job.id)} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search bar + action */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés: pozíció, cég..."
                className="w-full pl-10 pr-4 py-3 glass-input rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm transition-all ${showFilters ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
              <SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline">Szűrők</span>
            </button>
            {user && (
              <button onClick={() => setView('create')}
                className="flex items-center gap-2 px-4 py-3 glass-pill-active text-emerald-300 rounded-2xl font-medium text-sm hover:scale-[1.02] transition-all whitespace-nowrap">
                <PlusCircle className="w-4 h-4" /><span className="hidden sm:inline">Feladás</span>
              </button>
            )}
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="glass rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-200">Szűrők</p>
                <button onClick={() => { setCategory('Összes'); setTypeFilter(''); setRemoteOnly(false); }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                  <X className="w-3 h-3" />Törlés
                </button>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2 font-medium">Kategória</p>
                <div className="flex flex-wrap gap-1.5">
                  {JOB_CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${category === cat ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2 font-medium">Foglalkoztatás típusa</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setTypeFilter('')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${!typeFilter ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
                    Mind
                  </button>
                  {JOB_TYPE_LIST.map((t) => (
                    <button key={t.value} onClick={() => setTypeFilter(t.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${typeFilter === t.value ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div onClick={() => setRemoteOnly(!remoteOnly)}
                  className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${remoteOnly ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${remoteOnly ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-zinc-300 flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-sky-400" />Csak remote állások</span>
              </label>
            </div>
          )}

          {/* Category quick chips */}
          {!showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {JOB_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${category === cat ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              <span className="text-zinc-200 font-semibold">{filteredJobs.length}</span> állás ajánlat
              {mySeekingCategory && category === 'Összes' && (
                <span className="ml-2 text-xs text-sky-400">· <span className="text-zinc-300 font-medium">{mySeekingCategory}</span> kategória elöl</span>
              )}
            </p>
            {(category !== 'Összes' || typeFilter || remoteOnly || search) && (
              <button onClick={() => { setCategory('Összes'); setTypeFilter(''); setRemoteOnly(false); setSearch(''); }}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" />Szűrők törlése
              </button>
            )}
          </div>

          {/* Job list */}
          {jobsLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="glass-bubble rounded-2xl h-28 animate-pulse" />)}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl space-y-4">
              <div className="w-16 h-16 glass-bubble rounded-2xl flex items-center justify-center mx-auto">
                <Briefcase className="w-7 h-7 text-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-400 font-medium">Nem található állás</p>
                <p className="text-zinc-600 text-sm mt-1">Próbálj más szűrőkkel keresni</p>
              </div>
              {user && (
                <button onClick={() => setView('create')} className="glass-pill-active text-emerald-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all">
                  + Hirdetés feladása
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const typeInfo = JOB_TYPES[job.type] ?? JOB_TYPES.teljes;
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
                const isOwn = user?.id === job.poster_id;
                return (
                  <button
                    key={job.id}
                    onClick={() => { setSelectedJob(job); setView('detail'); }}
                    className="w-full text-left glass rounded-2xl p-5 group hover:bg-white/[0.03] hover:border-emerald-500/15 border border-transparent transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <CompanyLogo src={job.logo_url} name={job.company} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-100 leading-snug group-hover:text-emerald-300 transition-colors">{job.title}</p>
                            <p className="text-zinc-400 text-sm mt-0.5">{job.company}</p>
                          </div>
                          {isOwn && (
                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { setEditingJob(job); setView('edit'); }} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-emerald-300 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setDeletingJobId(job.id)} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                          {job.remote && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold text-sky-400 bg-sky-500/10 border-sky-500/20"><Wifi className="w-3 h-3" />Remote</span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-zinc-500 glass-pill">{job.category}</span>
                          {job.location && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                              <MapPin className="w-3 h-3 text-zinc-600" />{job.location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          {salary ? (
                            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
                              <Banknote className="w-3.5 h-3.5" />{salary}<span className="text-zinc-600 font-normal text-xs">/hó</span>
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-600">Fizetés: megegyezés szerint</span>
                          )}
                          <span className="text-xs text-zinc-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatRelativeTime(job.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── JOB SEEKERS TAB ── */}
      {mainTab === 'seekers' && (
        <>
          {/* My own seeker ads strip */}
          {user && seekerAds.some((s) => s.user_id === user.id) && (
            <div className="glass rounded-2xl p-4 border border-sky-500/10">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-sky-400" />Saját hirdetéseim
              </p>
              <div className="space-y-2">
                {seekerAds.filter((s) => s.user_id === user.id).map((ad) => (
                  <div key={ad.id} className="flex items-center gap-3 glass-pill px-3 py-2.5 rounded-xl">
                    <div className="w-9 h-9 glass-bubble rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => { setSelectedSeekerAd(ad); setView('seeker-detail'); }}
                        className="text-sm font-medium text-zinc-200 hover:text-sky-300 transition-colors truncate block text-left">
                        {ad.title}
                      </button>
                      <p className="text-xs text-zinc-600">{ad.category}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingSeekerAd(ad); setView('seeker-edit'); }} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-sky-300 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingSeekerAdId(ad.id)} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employer info banner */}
          <div className="glass rounded-2xl p-4 border border-sky-500/15 flex items-center gap-4">
            <div className="w-10 h-10 bg-sky-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200">Munkaadó vagy?</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Böngészd az álláskeresők profilját, és küldj nekik közvetlen üzenetet a platformon.
              </p>
            </div>
          </div>

          {/* Search + action */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={seekerSearch} onChange={(e) => setSeekerSearch(e.target.value)}
                placeholder="Keresés: pozíció, leírás..."
                className="w-full pl-10 pr-4 py-3 glass-input rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
            <label className="flex items-center gap-2 px-4 glass-pill rounded-2xl cursor-pointer select-none">
              <div onClick={() => setSeekerRemoteOnly(!seekerRemoteOnly)}
                className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${seekerRemoteOnly ? 'bg-sky-500' : 'bg-zinc-700'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${seekerRemoteOnly ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-zinc-400 whitespace-nowrap hidden sm:block">Remote</span>
            </label>
            {user && (
              <button onClick={() => setView('seeker-create')}
                className="flex items-center gap-2 px-4 py-3 bg-sky-500/15 border border-sky-500/25 text-sky-300 rounded-2xl font-medium text-sm hover:scale-[1.02] transition-all whitespace-nowrap">
                <PlusCircle className="w-4 h-4" /><span className="hidden sm:inline">Hirdetés</span>
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {JOB_CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setSeekerCategory(cat)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${seekerCategory === cat ? 'bg-sky-500/15 border border-sky-500/25 text-sky-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              <span className="text-zinc-200 font-semibold">{filteredSeekers.length}</span> álláskeresési hirdetés
              {myPostingCategory && seekerCategory === 'Összes' && (
                <span className="ml-2 text-xs text-emerald-400">· <span className="text-zinc-300 font-medium">{myPostingCategory}</span> kategória elöl</span>
              )}
            </p>
          </div>

          {/* Seeker ads grid */}
          {seekersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-bubble rounded-2xl h-40 animate-pulse" />)}</div>
          ) : filteredSeekers.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl space-y-4">
              <div className="w-16 h-16 glass-bubble rounded-2xl flex items-center justify-center mx-auto">
                <UserSearch className="w-7 h-7 text-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-400 font-medium">Még nincs álláskeresési hirdetés</p>
                <p className="text-zinc-600 text-sm mt-1">Legyél az első, aki megtalálható itt</p>
              </div>
              {user && (
                <button onClick={() => setView('seeker-create')} className="bg-sky-500/15 border border-sky-500/25 text-sky-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all">
                  + Hirdetés feladása
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredSeekers.map((ad) => {
                const typeInfo = JOB_TYPES[ad.type] ?? JOB_TYPES.teljes;
                const salary = formatSalary(ad.expected_salary_min, ad.expected_salary_max, ad.salary_currency);
                const expLabel = EXPERIENCE_LIST.find((e) => e.value === ad.experience)?.label;
                const isOwn = user?.id === ad.user_id;
                return (
                  <div key={ad.id} className="glass rounded-2xl p-5 flex flex-col gap-4 group hover:bg-white/[0.03] hover:border-sky-500/15 border border-transparent transition-all">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-sky-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-100 leading-snug group-hover:text-sky-300 transition-colors line-clamp-1">{ad.title}</p>
                        <p className="text-zinc-500 text-xs mt-0.5 truncate">
                          {ad.user?.full_name || ad.user?.username || 'Felhasználó'}
                        </p>
                      </div>
                      {isOwn && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => { setEditingSeekerAd(ad); setView('seeker-edit'); }} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-sky-300 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeletingSeekerAdId(ad.id)} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                      {ad.remote && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold text-sky-400 bg-sky-500/10 border-sky-500/20"><Wifi className="w-3 h-3" />Remote OK</span>
                      )}
                      {expLabel && expLabel !== 'Nem megadott' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-zinc-500 glass-pill">{expLabel}</span>
                      )}
                    </div>

                    {/* Description snippet */}
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{ad.description}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                      {ad.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ad.location}</span>}
                      {salary && <span className="flex items-center gap-1 text-sky-400 font-semibold"><Banknote className="w-3 h-3" />{salary}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(ad.created_at)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t border-white/5">
                      <button onClick={() => { setSelectedSeekerAd(ad); setView('seeker-detail'); }}
                        className="flex-1 text-xs text-zinc-400 hover:text-sky-300 flex items-center justify-center gap-1.5 py-2 glass-pill rounded-xl transition-colors font-medium">
                        Profil megtekintése <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      {!isOwn && user && (
                        <button onClick={() => setContactSeekerAd(ad)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl text-xs font-medium hover:bg-sky-500/20 transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" />Üzenet
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
