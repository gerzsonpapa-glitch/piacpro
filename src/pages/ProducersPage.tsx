import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import type { Producer } from '../lib/types';
import { MapPin, Star, CheckCircle2, Leaf, Search, Map, Grid2x2 as Grid, Sprout, Apple, Sun, Egg, Beef, MilkOff, FlaskConical, UtensilsCrossed, MessageCircle, User, Clock, Award, Navigation, LocateFixed, AlertCircle, ChevronRight } from 'lucide-react';
import { useSEO, SEO_PAGES } from '../lib/seo';

type GeoState = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
      ))}
      <span className="text-xs text-zinc-500 ml-0.5">({count})</span>
    </div>
  );
}

function ProducerCard({ producer, onChat }: { producer: Producer; onChat: () => void }) {
  const { navigate } = useRouter();
  const sampleProducts = (producer.products ?? []).slice(0, 3).map((p) => p.name);

  return (
    <div className="glass rounded-2xl overflow-hidden group hover:ring-1 hover:ring-emerald-500/30 transition-all duration-300 flex flex-col">
      {/* Cover */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-emerald-900/40 to-zinc-900">
        {producer.cover_url ? (
          <img src={producer.cover_url} alt={producer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-12 h-12 text-emerald-700/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {producer.is_verified && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/90 text-white font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Hitelesített
            </span>
          )}
          {producer.is_local_favorite && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/90 text-white font-semibold flex items-center gap-1">
              <Award className="w-2.5 h-2.5" /> Helyi kedvenc
            </span>
          )}
        </div>
        {producer.is_available_today && (
          <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-green-500/90 text-white font-semibold flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Ma elérhető
          </span>
        )}
        {/* Avatar */}
        <div className="absolute -bottom-5 left-4">
          <div className="w-10 h-10 rounded-full border-2 border-zinc-900 overflow-hidden bg-zinc-800">
            {producer.avatar_url
              ? <img src={producer.avatar_url} alt={producer.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-zinc-500" /></div>
            }
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 pt-7 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-semibold text-zinc-100 text-sm leading-snug">{producer.name}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-zinc-500 text-xs">
            <MapPin className="w-3 h-3" /> {producer.location || 'Ismeretlen helyszín'}
          </div>
        </div>
        {producer.avg_rating > 0 && <StarRow rating={producer.avg_rating} count={producer.review_count} />}
        {sampleProducts.length > 0 && (
          <p className="text-xs text-zinc-500 leading-snug">{sampleProducts.join(', ')}{(producer.products?.length ?? 0) > 3 ? ' ...' : ''}</p>
        )}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={() => navigate(`/producers/${producer.id}`)}
            className="flex-1 py-2 rounded-xl glass-bubble text-zinc-300 text-xs font-medium hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" /> Profil
          </button>
          <button
            onClick={onChat}
            className="flex-1 py-2 rounded-xl glass-pill-active text-emerald-300 text-xs font-medium transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProducersPage() {
  useSEO(SEO_PAGES.producers);
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);

  function requestLocation() {
    if (!navigator.geolocation) { setGeoState('unsupported'); return; }
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('granted');
      },
      () => setGeoState('denied'),
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    fetchProducers();
  }, []);

  async function fetchProducers() {
    setLoading(true);
    const { data } = await supabase
      .from('producers')
      .select('*, products:producer_products(id, name, category_tag, is_available, price, unit, is_fresh_harvest)')
      .order('is_verified', { ascending: false })
      .order('avg_rating', { ascending: false });
    setProducers(data ?? []);
    setLoading(false);
  }

  async function startChat(producer: Producer) {
    if (!user) { navigate('/login'); return; }
    if (user.id === producer.user_id) return;
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', producer.user_id)
      .is('listing_id', null)
      .is('shop_product_id', null)
      .maybeSingle();
    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: producer.user_id, listing_id: null })
        .select('id').maybeSingle();
      if (newConv) navigate(`/chat/${newConv.id}`);
    }
  }

  const filtered = producers.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory && !(p.categories ?? []).includes(activeCategory)) return false;
    if (filterAvailable && !p.is_available_today) return false;
    if (filterVerified && !p.is_verified) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-zinc-900 to-zinc-900 border border-emerald-900/30 p-8">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 60%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold text-zinc-100">Kistermelők</h1>
            </div>
            <p className="text-zinc-400 text-sm max-w-md">Helyi termelők méz, tojás, zöldség, gyümölcs és egyéb friss termékekkel — közvetlenül a forrásból.</p>
          </div>
          <button
            onClick={() => navigate('/producers/apply')}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl glass-pill-active text-emerald-300 text-sm font-medium hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Sprout className="w-4 h-4" />
            Termelői profil igénylése
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveCategory(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === null ? 'glass-pill-active text-emerald-300' : 'glass-bubble text-zinc-400 hover:text-zinc-200'}`}
        >
          Összes
        </button>
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(activeCategory === key ? null : key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === key ? 'glass-pill-active text-emerald-300' : 'glass-bubble text-zinc-400 hover:text-zinc-200'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Search + toolbar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés termelő, helyszín..."
            className="w-full pl-9 pr-4 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
          />
        </div>
        <button
          onClick={() => setFilterAvailable(!filterAvailable)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterAvailable ? 'glass-pill-active text-emerald-300' : 'glass-bubble text-zinc-400 hover:text-zinc-200'}`}
        >
          <Clock className="w-3.5 h-3.5" /> Ma elérhető
        </button>
        <button
          onClick={() => setFilterVerified(!filterVerified)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterVerified ? 'glass-pill-active text-emerald-300' : 'glass-bubble text-zinc-400 hover:text-zinc-200'}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Hitelesített
        </button>
        <div className="flex rounded-xl overflow-hidden glass-bubble">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2.5 transition-colors ${viewMode === 'grid' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-2.5 transition-colors ${viewMode === 'map' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map view */}
      {viewMode === 'map' && (
        <div className="glass rounded-3xl overflow-hidden border border-white/5">
          {/* Idle / denied / unsupported states */}
          {(geoState === 'idle' || geoState === 'denied' || geoState === 'unsupported') && (
            <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Navigation className="w-9 h-9 text-emerald-400" />
                </div>
                {geoState === 'idle' && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                  </span>
                )}
              </div>

              {geoState === 'idle' && (
                <>
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold text-zinc-200">Keress termelőket a közeledben</p>
                    <p className="text-sm text-zinc-500 max-w-sm">Kapcsold be a helymeghatározást, és megmutatjuk a hozzád legközelebb lévő kistermelőket távolsággal együtt.</p>
                  </div>
                  <button
                    onClick={requestLocation}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm shadow-lg shadow-emerald-900/40 transition-all hover:scale-[1.03]"
                  >
                    <LocateFixed className="w-4 h-4" />
                    Helymeghatározás bekapcsolása
                  </button>
                  <p className="text-xs text-zinc-600">Az adatot nem tároljuk, csak a böngésződben használjuk fel.</p>
                </>
              )}

              {geoState === 'denied' && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2 text-amber-400">
                      <AlertCircle className="w-5 h-5" />
                      <p className="font-semibold">Helymeghatározás megtagadva</p>
                    </div>
                    <p className="text-sm text-zinc-500 max-w-sm">Engedélyezd a helymeghatározást a böngésző beállításaiban, majd próbáld újra.</p>
                  </div>
                  <button
                    onClick={requestLocation}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-bubble text-zinc-300 hover:text-emerald-400 text-sm font-medium transition-all"
                  >
                    <LocateFixed className="w-4 h-4" /> Újra megpróbálom
                  </button>
                </>
              )}

              {geoState === 'unsupported' && (
                <div className="space-y-1.5">
                  <p className="font-semibold text-zinc-300">Helymeghatározás nem támogatott</p>
                  <p className="text-sm text-zinc-500">A böngésződ nem támogatja a GPS funkciót.</p>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {geoState === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
              <p className="text-sm text-zinc-400">Helymeghatározás folyamatban...</p>
            </div>
          )}

          {/* Granted — show nearby producers */}
          {geoState === 'granted' && userCoords && (() => {
            const withDist = filtered
              .filter((p) => p.lat && p.lng && p.user_id !== user?.id)
              .map((p) => ({ ...p, distKm: haversineKm(userCoords.lat, userCoords.lng, p.lat!, p.lng!) }))
              .sort((a, b) => a.distKm - b.distKm);
            const nearby = withDist.filter((p) => p.distKm <= radiusKm);
            const hasCoords = filtered.filter((p) => p.lat && p.lng).length;

            return (
              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <LocateFixed className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-zinc-200">Termelők a közeledben</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{nearby.length} db</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">Sugár:</span>
                    {[10, 25, 50, 100].map((km) => (
                      <button
                        key={km}
                        onClick={() => setRadiusKm(km)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${radiusKm === km ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'glass-bubble text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {km} km
                      </button>
                    ))}
                    <button
                      onClick={() => { setGeoState('idle'); setUserCoords(null); }}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors ml-1"
                    >
                      Kikapcsol
                    </button>
                  </div>
                </div>

                {hasCoords === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <MapPin className="w-8 h-8 text-zinc-700 mx-auto" />
                    <p className="text-sm text-zinc-500">Még egyetlen termelőnek sincs rögzített koordinátája.</p>
                  </div>
                ) : nearby.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <MapPin className="w-8 h-8 text-zinc-700 mx-auto" />
                    <p className="text-sm text-zinc-500">Nincs termelő {radiusKm} km-es körzetben.</p>
                    <button onClick={() => setRadiusKm(100)} className="text-xs text-emerald-400 hover:underline">Bővítsd 100 km-re</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nearby.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/producers/${p.id}`)}
                        className="w-full flex items-center gap-4 p-3.5 rounded-2xl glass-bubble hover:ring-1 hover:ring-emerald-500/30 transition-all text-left group"
                      >
                        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                          {p.avatar_url
                            ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Leaf className="w-5 h-5 text-zinc-600" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-zinc-200 text-sm group-hover:text-emerald-300 transition-colors truncate">{p.name}</p>
                            {p.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-zinc-500 truncate">{p.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-sm font-bold text-emerald-400">{p.distKm < 1 ? `${Math.round(p.distKm * 1000)} m` : `${p.distKm.toFixed(1)} km`}</span>
                          {p.is_available_today && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/15 text-green-400 border border-green-500/20">Ma elérhető</span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center space-y-3">
              <Leaf className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-zinc-400 font-medium">Nem találtunk termelőt</p>
              <p className="text-zinc-600 text-sm">Próbálj más szűrőkkel keresni</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <ProducerCard key={p.id} producer={p} onChat={() => startChat(p)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
