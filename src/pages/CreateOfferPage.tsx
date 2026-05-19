import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { useNotification } from '../contexts/NotificationContext';
import type { OfferCategory, OfferType, Donation } from '../lib/types';
import { HUNGARIAN_COUNTIES } from '../lib/utils';
import {
  HandHeart, Upload, X, ArrowLeft, Package, Wrench,
  Baby, PawPrint, Users, Lightbulb, Activity, Zap,
  GraduationCap, Trophy, Church, Leaf, Shirt, UtensilsCrossed,
  Armchair, Gamepad2, Car, CalendarDays, Scissors,
  Link2, CheckCircle2
} from 'lucide-react';

// ── Kategóriák ────────────────────────────────────────────────────────────────
const CATEGORIES: { value: OfferCategory; label: string; icon: React.ElementType; group: string }[] = [
  // Célcsoport
  { value: 'gyerek',        label: 'Gyerekek',           icon: Baby,            group: 'Célcsoport' },
  { value: 'allatvédelem',  label: 'Állatvédelem',        icon: PawPrint,        group: 'Célcsoport' },
  { value: 'raszorulok',    label: 'Rászorulók',          icon: Users,           group: 'Célcsoport' },
  { value: 'kozossegi',     label: 'Közösségi',           icon: Lightbulb,       group: 'Célcsoport' },
  { value: 'egeszseg',      label: 'Egészségügy',         icon: Activity,        group: 'Célcsoport' },
  { value: 'katasztrofa',   label: 'Katasztrófa-segély',  icon: Zap,             group: 'Célcsoport' },
  { value: 'oktatás',       label: 'Oktatás',             icon: GraduationCap,   group: 'Célcsoport' },
  { value: 'sport',         label: 'Sport',               icon: Trophy,          group: 'Célcsoport' },
  { value: 'vallasi',       label: 'Vallási',             icon: Church,          group: 'Célcsoport' },
  { value: 'kornyezet',     label: 'Környezetvédelem',    icon: Leaf,            group: 'Célcsoport' },
  // Tárgy típus
  { value: 'ruha',          label: 'Ruha, cipő',          icon: Shirt,           group: 'Tárgy típus' },
  { value: 'elelmiszer',    label: 'Élelmiszer',           icon: UtensilsCrossed, group: 'Tárgy típus' },
  { value: 'butor',         label: 'Bútor, lakberendezés', icon: Armchair,       group: 'Tárgy típus' },
  { value: 'jatekok',       label: 'Játékok, könyvek',    icon: Gamepad2,        group: 'Tárgy típus' },
  { value: 'felszereles',   label: 'Felszerelés, eszköz', icon: Wrench,          group: 'Tárgy típus' },
  // Szolgáltatás típus
  { value: 'fuvar',         label: 'Fuvar, szállítás',    icon: Car,             group: 'Szolgáltatás' },
  { value: 'rendezvenysegites', label: 'Rendezvény-segítés', icon: CalendarDays, group: 'Szolgáltatás' },
  { value: 'szaksegitseg',  label: 'Szakmai segítség',    icon: Scissors,        group: 'Szolgáltatás' },
  { value: 'egyeb',         label: 'Egyéb',               icon: Package,         group: 'Egyéb' },
];

const ITEM_TYPES = [
  'Játék', 'Ruha (gyerek)', 'Ruha (felnőtt)', 'Cipő', 'Élelmiszer', 'Bútor',
  'Elektronika', 'Könyv', 'Sportszer', 'Tanszer', 'Higiéniai termék',
  'Pelenkák, baba felszerelés', 'Ágynemű', 'Edény, konyhai eszköz', 'Egyéb',
];

const SERVICE_TYPES = [
  'Arcfestés', 'Ugrálóvár biztosítás', 'Fuvar / szállítás', 'Fodrász',
  'Szerelés / karbantartás', 'Rendezvény fotózás', 'Zenész / előadó',
  'Főzés / sütés', 'Takarítás', 'Kertészet', 'IT segítség', 'Jogi tanácsadás',
  'Orvosi / egészségügyi', 'Oktatás / korrepetálás', 'Szállítás / költöztetés', 'Egyéb',
];

export default function CreateOfferPage() {
  const { user } = useAuth();
  const { navigate, search: qs } = useRouter();
  const { showToast } = useNotification();

  // Pre-fill donation link from query param
  const params = new URLSearchParams(qs);
  const prefilledDonationId = params.get('donation') || '';

  const [offerType, setOfferType] = useState<OfferType>('item');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<OfferCategory>('egyeb');
  const [itemType, setItemType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Donation link
  const [linkToDonation, setLinkToDonation] = useState(!!prefilledDonationId);
  const [donationSearch, setDonationSearch] = useState('');
  const [donationResults, setDonationResults] = useState<Donation[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [searchingDonations, setSearchingDonations] = useState(false);

  // Load prefilled donation
  useEffect(() => {
    if (prefilledDonationId) {
      supabase.from('donations').select('*').eq('id', prefilledDonationId).maybeSingle()
        .then(({ data }) => { if (data) setSelectedDonation(data as Donation); });
    }
  }, [prefilledDonationId]);

  useEffect(() => {
    if (!linkToDonation) { setSelectedDonation(null); return; }
    if (prefilledDonationId && !donationSearch) return;
    if (!donationSearch.trim()) { setDonationResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingDonations(true);
      const { data } = await supabase.from('donations')
        .select('id, title, images, location')
        .eq('status', 'active')
        .eq('moderation_status', 'active')
        .ilike('title', `%${donationSearch}%`)
        .limit(5);
      setDonationResults((data || []) as Donation[]);
      setSearchingDonations(false);
    }, 400);
    return () => clearTimeout(t);
  }, [donationSearch, linkToDonation, prefilledDonationId]);

  if (!user) { navigate('/login'); return null; }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length || images.length >= 3) return;
    setUploading(true);
    for (const file of files.slice(0, 3 - images.length)) {
      const ext = file.name.split('.').pop();
      const path = `offers/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('listing-images').upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(path);
        setImages((prev) => [...prev, `${publicUrl}?t=${Date.now()}`]);
      }
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Cím és leírás kötelező', 'error'); return;
    }
    setLoading(true);

    const { error } = await supabase.from('support_offers').insert({
      user_id: user.id,
      donation_id: linkToDonation && selectedDonation ? selectedDonation.id : null,
      type: offerType,
      title: title.trim(),
      description: description.trim(),
      category,
      item_type: offerType === 'item' ? (itemType || null) : null,
      service_type: offerType === 'service' ? (serviceType || null) : null,
      quantity: quantity ? parseInt(quantity) : null,
      location,
      images,
      status: 'active',
    });

    setLoading(false);
    if (error) {
      showToast('Hiba történt, próbáld újra', 'error');
    } else {
      showToast('Felajánlásod sikeresen közzétéve!', 'success');
      if (linkToDonation && selectedDonation) {
        navigate(`/donations/${selectedDonation.id}`);
      } else {
        navigate('/donations');
      }
    }
  }

  const catGroups = CATEGORIES.reduce<Record<string, typeof CATEGORIES>>((acc, c) => {
    (acc[c.group] ??= []).push(c); return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/donations')}
          className="p-2 glass-pill rounded-xl text-zinc-500 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 bg-teal-500/15 border border-teal-500/20 rounded-2xl flex items-center justify-center">
          <HandHeart className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Felajánlok valamit</h1>
          <p className="text-zinc-500 text-sm">Ingyenes — nincs szükség admin jóváhagyásra</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Típus választó */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Mit ajánlasz fel?</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setOfferType('item')}
              className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all ${
                offerType === 'item'
                  ? 'border-teal-500/50 bg-teal-500/10 text-teal-300'
                  : 'border-white/5 glass-pill text-zinc-400 hover:text-zinc-200'
              }`}>
              <Package className="w-7 h-7" />
              <div className="text-center">
                <p className="font-semibold text-sm">Tárgy</p>
                <p className="text-xs opacity-60 mt-0.5">Játék, ruha, bútor, élelmiszer...</p>
              </div>
            </button>
            <button type="button" onClick={() => setOfferType('service')}
              className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all ${
                offerType === 'service'
                  ? 'border-teal-500/50 bg-teal-500/10 text-teal-300'
                  : 'border-white/5 glass-pill text-zinc-400 hover:text-zinc-200'
              }`}>
              <Wrench className="w-7 h-7" />
              <div className="text-center">
                <p className="font-semibold text-sm">Szolgáltatás</p>
                <p className="text-xs opacity-60 mt-0.5">Fuvar, arcfestés, szerelés...</p>
              </div>
            </button>
          </div>
        </div>

        {/* Alap adatok */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Alap adatok</p>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Cím <span className="text-rose-400">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder={offerType === 'item' ? 'pl. 3 doboz gyerekruha (2–4 év)' : 'pl. Ingyenes fuvar Budapesten belül'}
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none" />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Leírás <span className="text-rose-400">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
              placeholder="Részletes leírás — méret, állapot, mikor elérhető, feltételek..."
              className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none" />
          </div>

          {/* Tárgy / szolgáltatás típus */}
          {offerType === 'item' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Tárgy típusa</label>
                <select value={itemType} onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm">
                  <option value="">Válassz...</option>
                  {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Mennyiség (opcionális)</label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  placeholder="pl. 3"
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Szolgáltatás típusa</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm">
                <option value="">Válassz...</option>
                {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Kategória */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Kategória</p>
          {Object.entries(catGroups).map(([group, cats]) => (
            <div key={group}>
              <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest mb-2">{group}</p>
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.value;
                  return (
                    <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                        active
                          ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                          : 'glass-pill border-transparent text-zinc-400 hover:text-zinc-200'
                      }`}>
                      <Icon className="w-3.5 h-3.5" />{c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Helyszín */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Helyszín</p>
          <select value={location} onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm">
            <option value="">Válassz helyszínt...</option>
            {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Képek */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Képek (max 3, opcionális)
          </p>
          <div className="flex gap-3 flex-wrap">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-zinc-300 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500/40 transition-colors">
                <Upload className="w-5 h-5 text-zinc-600 mb-1" />
                <span className="text-[10px] text-zinc-600">Feltöltés</span>
                <input type="file" accept="image/*" multiple className="hidden"
                  disabled={uploading} onChange={handleImageUpload} />
              </label>
            )}
          </div>
          {uploading && <p className="text-xs text-zinc-500 animate-pulse">Feltöltés...</p>}
        </div>

        {/* Kampányhoz kötés */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-300">Kapcsold egy kampányhoz</p>
            </div>
            <button type="button" onClick={() => setLinkToDonation((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${linkToDonation ? 'bg-teal-500' : 'bg-zinc-700'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${linkToDonation ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-zinc-600">Opcionális — ha egy konkrét adománygyűjtő kampánynak szeretnél segíteni</p>

          {linkToDonation && (
            <div className="space-y-2">
              {selectedDonation ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  {selectedDonation.images?.[0] && (
                    <img src={selectedDonation.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-teal-300 line-clamp-1">{selectedDonation.title}</p>
                    <p className="text-xs text-zinc-500">{selectedDonation.location}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <button type="button" onClick={() => setSelectedDonation(null)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <input type="text" value={donationSearch} onChange={(e) => setDonationSearch(e.target.value)}
                    placeholder="Kampány neve..."
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                  {searchingDonations && <p className="text-xs text-zinc-500 animate-pulse">Keresés...</p>}
                  {donationResults.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {donationResults.map((d) => (
                        <button key={d.id} type="button" onClick={() => { setSelectedDonation(d); setDonationSearch(''); setDonationResults([]); }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl glass-pill text-left hover:bg-white/5 transition-colors">
                          {d.images?.[0] && <img src={d.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-200 line-clamp-1">{d.title}</p>
                            <p className="text-xs text-zinc-500">{d.location}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Ingyenes info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
          <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-teal-300 text-sm font-semibold">Azonnali közzétetel</p>
            <p className="text-teal-400/70 text-xs mt-0.5">
              A felajánlások ingyenesek és nem igényelnek admin jóváhagyást — azonnal megjelenik a platformon.
            </p>
          </div>
        </div>

        <button type="submit" disabled={loading || uploading}
          className="w-full py-3.5 bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold rounded-2xl hover:bg-teal-500/30 transition-all hover:scale-[1.01] disabled:opacity-50 text-sm">
          {loading ? 'Közzétesz...' : 'Felajánlás közzététele'}
        </button>
      </form>
    </div>
  );
}
