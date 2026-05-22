import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import type { LocalBusiness, BusinessType } from '../lib/types';
import { BUSINESS_TYPE_LABELS } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';
import {
  Search, MapPin, Star, CheckCircle, Zap, Sprout, Scissors,
  Store, Briefcase, Home, UserCheck, PlusCircle, ArrowRight,
  SlidersHorizontal, X, Heart, Filter
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<BusinessType, React.ComponentType<{ className?: string }>> = {
  producer: Sprout,
  craftsman: Scissors,
  shop: Store,
  service: Briefcase,
  family: Home,
  specialist: UserCheck,
};

const TYPE_COLORS: Record<BusinessType, string> = {
  producer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  craftsman: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  shop: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  service: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  family: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  specialist: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
};

const ALL_TYPES: BusinessType[] = ['producer', 'craftsman', 'shop', 'service', 'family', 'specialist'];

// ── Business card ─────────────────────────────────────────────────────────────

function BusinessCard({ business, onClick }: { business: LocalBusiness; onClick: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const TypeIcon = TYPE_ICONS[business.business_type] ?? Store;
  const typeColor = TYPE_COLORS[business.business_type] ?? TYPE_COLORS.shop;

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass rounded-3xl overflow-hidden group hover:scale-[1.01] hover:border-white/10 border border-transparent transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative h-36 bg-zinc-800/60 overflow-hidden">
        {business.cover_url && !imgErr ? (
          <img
            src={business.cover_url}
            alt={business.name}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-10 h-10 text-zinc-700" />
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {business.is_verified && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3" />Ellenőrzött
            </span>
          )}
          {business.is_local_favorite && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-amber-400 border border-amber-500/30">
              <Heart className="w-3 h-3" />Kedvenc
            </span>
          )}
        </div>
        {business.is_available_today && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-emerald-400 border border-emerald-500/30">
            <Zap className="w-3 h-3" />Ma elérhető
          </span>
        )}
        {/* Logo */}
        <div className="absolute -bottom-5 left-4">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-12 h-12 rounded-2xl border-2 border-zinc-900 object-cover shadow-lg"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center shadow-lg">
              <TypeIcon className="w-5 h-5 text-zinc-400" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 pb-4 px-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100 leading-snug group-hover:text-emerald-300 transition-colors line-clamp-1">
              {business.name}
            </h3>
            {business.tagline && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{business.tagline}</p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold flex-shrink-0 ${typeColor}`}>
            <TypeIcon className="w-3 h-3" />
            {BUSINESS_TYPE_LABELS[business.business_type]}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-600">
          {business.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{business.location}</span>
            </span>
          )}
          {business.avg_rating > 0 && (
            <span className="flex items-center gap-1 flex-shrink-0 text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
              {business.avg_rating.toFixed(1)}
              <span className="text-zinc-600">({business.review_count})</span>
            </span>
          )}
        </div>

        {business.categories.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {business.categories.slice(0, 3).map((cat) => (
              <span key={cat} className="text-[10px] px-2 py-0.5 rounded-lg glass-pill text-zinc-500">
                {cat}
              </span>
            ))}
            {business.categories.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg glass-pill text-zinc-600">
                +{business.categories.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LocalBusinessesPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [businesses, setBusinesses] = useState<LocalBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BusinessType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [myBusiness, setMyBusiness] = useState<LocalBusiness | null>(null);

  useEffect(() => { fetchBusinesses(); }, []);
  useEffect(() => {
    if (user) fetchMyBusiness();
  }, [user]);

  async function fetchBusinesses() {
    setLoading(true);
    const { data } = await supabase
      .from('local_businesses')
      .select('*, owner:profiles(id, username, full_name, avatar_url)')
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .order('avg_rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    setBusinesses((data || []) as LocalBusiness[]);
    setLoading(false);
  }

  async function fetchMyBusiness() {
    if (!user) return;
    const { data } = await supabase
      .from('local_businesses')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();
    setMyBusiness(data as LocalBusiness | null);
  }

  const filtered = businesses.filter((b) => {
    if (typeFilter !== 'all' && b.business_type !== typeFilter) return false;
    if (availableOnly && !b.is_available_today) return false;
    if (verifiedOnly && !b.is_verified) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [b.name, b.tagline, b.description, b.location, ...b.categories].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const hasFilters = typeFilter !== 'all' || availableOnly || verifiedOnly || search;

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <div className="glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-2">
                Helyi vállalkozások
              </h1>
              <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
                Kistermelők, kézművesek, kisboltok és szakemberek egy helyen. Ismerd meg és támogasd a helyi közösséget.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {ALL_TYPES.map((t) => {
                  const Icon = TYPE_ICONS[t];
                  const count = businesses.filter((b) => b.business_type === t).length;
                  if (count === 0) return null;
                  return (
                    <span key={t} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium ${TYPE_COLORS[t]}`}>
                      <Icon className="w-3.5 h-3.5" />{BUSINESS_TYPE_LABELS[t]} <span className="opacity-60">({count})</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {myBusiness ? (
                <button
                  onClick={() => navigate('/vallalkozasom')}
                  className="glass-pill-active text-emerald-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Store className="w-4 h-4" />Vállalkozásom
                </button>
              ) : (
                <button
                  onClick={() => navigate('/vallalkozas-regisztracio')}
                  className="glass-pill-active text-emerald-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4" />Regisztrálj
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keresés: név, leírás, kategória, helyszín..."
              className="w-full pl-10 pr-4 py-3 glass-input rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 transition-all ${showFilters || availableOnly || verifiedOnly ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Szűrők</span>
          </button>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${typeFilter === 'all' ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
          >
            Összes
          </button>
          {ALL_TYPES.map((t) => {
            const Icon = TYPE_ICONS[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${typeFilter === t ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
              >
                <Icon className="w-3.5 h-3.5" />{BUSINESS_TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-200">Szűrők</p>
              <button onClick={() => { setAvailableOnly(false); setVerifiedOnly(false); }} className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1">
                <X className="w-3 h-3" />Törlés
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div onClick={() => setAvailableOnly(!availableOnly)}
                  className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${availableOnly ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${availableOnly ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-zinc-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />Ma elérhető
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${verifiedOnly ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${verifiedOnly ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-zinc-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />Csak ellenőrzöttek
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          <span className="text-zinc-200 font-semibold">{filtered.length}</span> vállalkozás
        </p>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setTypeFilter('all'); setAvailableOnly(false); setVerifiedOnly(false); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />Szűrők törlése
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-3xl h-60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl space-y-4">
          <div className="w-16 h-16 glass-bubble rounded-2xl flex items-center justify-center mx-auto">
            <Filter className="w-7 h-7 text-zinc-600" />
          </div>
          <div>
            <p className="text-zinc-400 font-medium">Nem található vállalkozás</p>
            <p className="text-zinc-600 text-sm mt-1">Próbálj más szűrőkkel keresni</p>
          </div>
          {user && (
            <button
              onClick={() => navigate('/vallalkozas-regisztracio')}
              className="glass-pill-active text-emerald-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />Regisztrálj elsőként
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              onClick={() => navigate(`/helyi-vallalkozasok/${b.slug || b.id}`)}
            />
          ))}
        </div>
      )}

      {/* ── CTA if not registered ── */}
      {!loading && !myBusiness && user && filtered.length > 0 && (
        <div className="glass rounded-3xl p-6 text-center space-y-3 border border-emerald-500/10">
          <p className="text-zinc-300 font-medium">Te is helyi vállalkozó vagy?</p>
          <p className="text-zinc-500 text-sm">Regisztrálj és jelenj meg a helyi közösség előtt!</p>
          <button
            onClick={() => navigate('/vallalkozas-regisztracio')}
            className="glass-pill-active text-emerald-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />Vállalkozás regisztrálása
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
