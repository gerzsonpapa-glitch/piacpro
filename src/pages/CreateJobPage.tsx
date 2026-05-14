import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { useNotification } from '../contexts/NotificationContext';
import {
  Briefcase, Building2, MapPin, ArrowLeft, Send, Banknote, Phone, Mail, Wifi
} from 'lucide-react';

const JOB_CATEGORIES = [
  'IT / Szoftver', 'Kereskedelem', 'Pénzügy', 'Egészségügy',
  'Oktatás', 'Logisztika', 'Építőipar', 'Vendéglátás', 'Marketing', 'Egyéb',
];

const JOB_TYPES = [
  { value: 'teljes',     label: 'Teljes állás' },
  { value: 'reszmunka',  label: 'Részmunka' },
  { value: 'szabaduszo', label: 'Szabadúszó' },
  { value: 'gyakorlat',  label: 'Szakmai gyakorlat' },
];

export default function CreateJobPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useNotification();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT / Szoftver');
  const [type, setType] = useState('teljes');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(false);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const canSubmit = title.trim().length >= 3 && company.trim().length >= 2 && description.trim().length >= 20;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);

    const { error } = await supabase.from('jobs').insert({
      poster_id: user.id,
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      category,
      type,
      location: location.trim(),
      remote,
      salary_min: salaryMin ? parseInt(salaryMin) : null,
      salary_max: salaryMax ? parseInt(salaryMax) : null,
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      status: 'active',
    });

    setSaving(false);

    if (error) {
      showToast('error', 'Hiba', 'A hirdetés feladása sikertelen.');
    } else {
      showToast('success', 'Hirdetés feladva', 'Az állás sikeresen megjelent.');
      navigate('/jobs');
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/jobs')}
        className="flex items-center gap-2 glass-pill px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />Vissza az állásokhoz
      </button>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2.5">
        <Briefcase className="w-6 h-6 text-emerald-400" />Állás hirdetés feladása
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200 text-sm">Alapadatok</h2>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Pozíció megnevezése *</label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="pl. Senior React fejlesztő"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
                maxLength={120} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Cég neve *</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                placeholder="pl. Acme Kft."
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
                maxLength={100} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Kategória</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none cursor-pointer">
                {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Foglalkoztatás típusa</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-3 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm appearance-none cursor-pointer">
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200 text-sm">Helyszín</h2>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Város / helyszín</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="pl. Budapest, XIII. kerület"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setRemote(!remote)}
              className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${remote ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${remote ? 'left-5' : 'left-0.5'}`} />
            </div>
            <div>
              <p className="text-sm text-zinc-200 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-sky-400" />Remote / otthoni munkavégzés lehetséges
              </p>
            </div>
          </label>
        </div>

        {/* Description */}
        <div className="glass rounded-3xl p-6 space-y-3">
          <h2 className="font-semibold text-zinc-200 text-sm">Leírás *</h2>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={7} placeholder="Feladatok, elvárások, amit kínálunk..."
            className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none text-sm leading-relaxed" />
          <p className="text-xs text-zinc-600 text-right">{description.length} karakter</p>
        </div>

        {/* Salary */}
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-400" />Fizetés (opcionális)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Minimum (HUF/hó)</label>
              <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="pl. 500000" min={0}
                className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Maximum (HUF/hó)</label>
              <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="pl. 800000" min={0}
                className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
          </div>
          <p className="text-xs text-zinc-600">Ha nem töltöd ki, nem jelenik meg fizetési információ.</p>
        </div>

        {/* Contact */}
        <div className="glass rounded-3xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200 text-sm">Kapcsolat</h2>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">E-mail cím</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                placeholder="allasok@ceg.hu"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Telefonszám</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+36 30 123 4567"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={!canSubmit || saving}
          className="w-full py-4 glass-pill-active text-emerald-300 font-semibold rounded-2xl transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <Send className="w-5 h-5" />
          {saving ? 'Feladás...' : 'Állás hirdetés feladása'}
        </button>

        <p className="text-xs text-zinc-600 text-center pb-4">
          A hirdetés 30 napig aktív marad.
        </p>
      </form>
    </div>
  );
}
