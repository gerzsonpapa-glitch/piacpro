import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { ProducerApplication } from '../lib/types';
import { Leaf, CheckCircle2, Clock, XCircle, ChevronLeft, Sprout, Sun, Apple, Egg, Beef, MilkOff, FlaskConical, UtensilsCrossed, Save, ToggleLeft, ToggleRight } from 'lucide-react';

const CATEGORIES = [
  { key: 'vegetable', label: 'Zöldség', icon: Sprout },
  { key: 'fruit', label: 'Gyümölcs', icon: Apple },
  { key: 'honey', label: 'Méz', icon: Sun },
  { key: 'egg', label: 'Tojás', icon: Egg },
  { key: 'meat', label: 'Hús', icon: Beef },
  { key: 'dairy', label: 'Tejtermék', icon: MilkOff },
  { key: 'bio', label: 'Bio', icon: FlaskConical },
  { key: 'homemade', label: 'Házi készítmény', icon: UtensilsCrossed },
];

export default function ProducerSetupPage() {
  const { navigate } = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useNotification();

  const [application, setApplication] = useState<ProducerApplication | null>(null);
  const [hasProducer, setHasProducer] = useState(false);
  const [producerId, setProducerId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(true);

  // Application form
  const [appMessage, setAppMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Producer setup form
  const [form, setForm] = useState({
    name: '',
    bio: '',
    location: '',
    contact_phone: '',
    contact_email: '',
    categories: [] as string[],
    is_available_today: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) checkStatus();
  }, [user]);

  async function checkStatus() {
    setLoadingState(true);
    // Check existing application
    const { data: app } = await supabase
      .from('producer_applications')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    setApplication(app ?? null);

    // Check existing producer profile
    const { data: prod } = await supabase
      .from('producers')
      .select('id, name, bio, location, contact_phone, contact_email, categories, is_available_today')
      .eq('user_id', user!.id)
      .maybeSingle();
    if (prod) {
      setHasProducer(true);
      setProducerId(prod.id);
      setForm({
        name: prod.name ?? '',
        bio: prod.bio ?? '',
        location: prod.location ?? '',
        contact_phone: prod.contact_phone ?? '',
        contact_email: prod.contact_email ?? '',
        categories: prod.categories ?? [],
        is_available_today: prod.is_available_today ?? false,
      });
    }
    setLoadingState(false);
  }

  async function submitApplication() {
    if (!appMessage.trim()) { showToast('error', 'Írj egy rövid bemutatkozást'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('producer_applications').insert({ user_id: user!.id, message: appMessage.trim() });
    setSubmitting(false);
    if (error) { showToast('error', 'Hiba', error.message); return; }
    showToast('success', 'Kérelem elküldve!', 'Az admin hamarosan elbírálja.');
    checkStatus();
  }

  async function saveProducerProfile() {
    if (!form.name.trim()) { showToast('error', 'Add meg a termelő nevét'); return; }
    setSaving(true);
    if (hasProducer && producerId) {
      const { error } = await supabase.from('producers').update({
        name: form.name.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        categories: form.categories,
        is_available_today: form.is_available_today,
      }).eq('id', producerId);
      setSaving(false);
      if (error) { showToast('error', 'Hiba', error.message); return; }
      showToast('success', 'Profil frissítve');
      navigate(`/producers/${producerId}`);
    } else {
      const { data, error } = await supabase.from('producers').insert({
        user_id: user!.id,
        name: form.name.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        categories: form.categories,
        is_available_today: form.is_available_today,
      }).select('id').maybeSingle();
      setSaving(false);
      if (error) { showToast('error', 'Hiba', error.message); return; }
      showToast('success', 'Termelői profil létrehozva!');
      if (data) navigate(`/producers/${data.id}`);
    }
  }

  function toggleCategory(key: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(key) ? f.categories.filter((c) => c !== key) : [...f.categories, key],
    }));
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto glass rounded-3xl p-10 text-center space-y-4">
        <Leaf className="w-10 h-10 text-emerald-500 mx-auto" />
        <p className="text-zinc-300">Jelentkezéshez be kell jelentkezned.</p>
        <button onClick={() => navigate('/login')} className="px-5 py-2.5 glass-pill-active text-emerald-300 rounded-xl text-sm font-medium">Bejelentkezés</button>
      </div>
    );
  }

  if (loadingState) {
    return <div className="max-w-lg mx-auto glass rounded-3xl h-64 animate-pulse" />;
  }

  const isApproved = profile?.is_producer_approved || application?.status === 'approved';

  // If user already has a producer profile, send them directly to it
  if (hasProducer && producerId) {
    navigate(`/producers/${producerId}`);
    return null;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate('/producers')} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Vissza a termelőkhöz
      </button>

      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-7 h-7 text-emerald-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Termelői profil</h1>
        </div>
        <p className="text-zinc-500 text-sm">Regisztrálj kistermelőként és érd el a helyi vásárlókat</p>
      </div>

      {/* Already has producer profile */}
      {hasProducer && (
        <div className="glass rounded-2xl p-4 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-zinc-200">Aktív termelői profilod van</p>
            <p className="text-xs text-zinc-500">Szerkesztheted az adatokat lentebb, vagy megnyithatod a profiloldalad.</p>
          </div>
          <button onClick={() => navigate(`/producers/${producerId}`)} className="ml-auto text-xs px-3 py-1.5 glass-bubble text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors flex-shrink-0">
            Profil
          </button>
        </div>
      )}

      {/* Application status — only if not yet approved and no producer profile */}
      {!isApproved && !hasProducer && (
        <div className="glass rounded-3xl p-6 space-y-5">
          <div>
            <h2 className="font-bold text-zinc-100 mb-1">Termelői jog igénylése</h2>
            <p className="text-zinc-500 text-sm">Termelői profil létrehozásához adminisztrátori jóváhagyás szükséges. Küldj egy rövid bemutatkozást, és az admin hamarosan értesít.</p>
          </div>

          {application ? (
            <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
              application.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20' :
              application.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
              'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              {application.status === 'pending' && <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />}
              {application.status === 'rejected' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
              {application.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {application.status === 'pending' && 'Kérelem elbírálás alatt'}
                  {application.status === 'rejected' && 'Kérelem elutasítva'}
                  {application.status === 'approved' && 'Kérelem jóváhagyva!'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {application.status === 'pending' && 'Az admin hamarosan elbírálja a kérelmed.'}
                  {application.status === 'rejected' && 'Sajnos a kérelmed nem lett jóváhagyva. Lépj kapcsolatba az adminnal.'}
                  {application.status === 'approved' && 'Már létrehozhatod a termelői profilodat!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={appMessage}
                onChange={(e) => setAppMessage(e.target.value)}
                placeholder="Mutatkozz be röviden: milyen termékeket árulsz, hol gazdálkodsz, mióta termelő vagy..."
                rows={4}
                className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none"
              />
              <button
                onClick={submitApplication}
                disabled={submitting}
                className="w-full py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {submitting ? 'Küldés...' : 'Kérelem elküldése'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Producer profile form — show if approved OR already has profile */}
      {(isApproved || hasProducer) && (
        <div className="glass rounded-3xl p-6 space-y-5">
          <h2 className="font-bold text-zinc-100">{hasProducer ? 'Profil szerkesztése' : 'Termelői profil létrehozása'}</h2>

          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Termelő neve (pl. Kovács Méhészet)"
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
            />
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Rövid bemutatkozás — gazdaságod, termelési módszerek, specialitások..."
              rows={3}
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none"
            />
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Helyszín (pl. Eger, Heves megye)"
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="Telefon (opcionális)"
                className="px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
              />
              <input
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="E-mail (opcionális)"
                className="px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="text-sm text-zinc-400 mb-2">Termék kategóriák</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCategory(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    form.categories.includes(key) ? 'glass-pill-active text-emerald-300' : 'glass-bubble text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Available today toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_available_today: !form.is_available_today })}
              className="text-zinc-400"
            >
              {form.is_available_today
                ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                : <ToggleLeft className="w-6 h-6" />
              }
            </button>
            <div>
              <p className="text-sm text-zinc-300 font-medium">Ma elérhető</p>
              <p className="text-xs text-zinc-600">Jelöld be, ha ma személyesen vagy átvételre elérhető vagy</p>
            </div>
          </label>

          <button
            onClick={saveProducerProfile}
            disabled={saving}
            className="w-full py-3 glass-pill-active text-emerald-300 rounded-xl font-medium text-sm hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Mentés...' : hasProducer ? 'Változtatások mentése' : 'Profil létrehozása'}
          </button>
        </div>
      )}
    </div>
  );
}
