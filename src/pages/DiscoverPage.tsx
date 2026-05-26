import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { formatRelativeTime, formatPrice } from '../lib/utils';
import type { ListingType } from '../lib/types';
import {
  Search, X, MapPin, ShoppingBag, Gavel, Briefcase,
  Leaf, Gift, Store, Wrench, Filter, ChevronDown,
  Heart, Clock, Star, CheckCircle2, Target, Tag
} from 'lucide-react';
import { useSEO, SEO_PAGES } from '../lib/seo';

// ── Unified result type ───────────────────────────────────────────────────────
interface UnifiedResult {
  id: string;
  type: ListingType | 'donation' | 'job' | 'shop' | 'producer';
  title: string;
  description: string;
  price?: number | null;
  image?: string | null;
  location?: string;
  created_at: string;
  badge?: string;
  verified?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; path: (id: string) => string }> = {
  regular:  { label: 'Piactér',    icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10', path: (id) => `/listing/${id}` },
  auction:  { label: 'Licit',      icon: Gavel,       color: 'text-amber-400',   bg: 'bg-amber-500/10',   path: (id) => `/auction/${id}` },
  job:      { label: 'Állás',      icon: Briefcase,   color: 'text-blue-400',    bg: 'bg-blue-500/10',    path: (id) => `/jobs` },
  donation: { label: 'Adomány',    icon: Heart,       color: 'text-rose-400',    bg: 'bg-rose-500/10',    path: (id) => `/donations/${id}` },
  shop:     { label: 'Bolt',       icon: Store,       color: 'text-teal-400',    bg: 'bg-teal-500/10',    path: (id) => `/shops/${id}` },
  producer: { label: 'Termelő',    icon: Leaf,        color: 'text-lime-400',    bg: 'bg-lime-500/10',    path: (id) => `/producers/${id}` },
  service:  { label: 'Szolgáltatás', icon: Wrench,    color: 'text-zinc-400',    bg: 'bg-zinc-500/10',    path: (id) => `/listing/${id}` },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.regular;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" />{cfg.label}
    </span>
  );
}

function ResultCard({ result }: { result: UnifiedResult }) {
  const { navigate } = useRouter();
  const cfg = TYPE_CONFIG[result.type] ?? TYPE_CONFIG.regular;

  return (
    <button
      onClick={() => navigate(cfg.path(result.id))}
      className="group glass-bubble rounded-2xl p-4 text-left flex items-start gap-4 hover:bg-white/5 transition-all duration-200 hover:scale-[1.01]"
    >
      {/* Image / icon */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-900 flex items-center justify-center">
        {result.image ? (
          <img src={result.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <cfg.icon className={`w-7 h-7 ${cfg.color} opacity-40`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={result.type} />
          {result.verified && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-2.5 h-2.5" />Hitelesített
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-zinc-100 line-clamp-1 group-hover:text-emerald-300 transition-colors">
          {result.title}
        </p>
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{result.description}</p>
        <div className="flex items-center gap-3 text-xs text-zinc-600">
          {result.price != null && result.price > 0 && (
            <span className="text-emerald-400 font-semibold">{formatPrice(result.price)}</span>
          )}
          {result.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{result.location}</span>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(result.created_at)}</span>
        </div>
      </div>
    </button>
  );
}

function TypeFilterPill({ type, active, onClick }: { type: string; active: boolean; onClick: () => void }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
        active ? `${cfg.bg} border-current/30 ${cfg.color}` : 'glass-pill border-transparent text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />{cfg.label}
    </button>
  );
}

export default function DiscoverPage() {
  useSEO(SEO_PAGES.discover);
  const { search: qs } = useRouter();
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState('');
  const [results, setResults] = useState<UnifiedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const params = new URLSearchParams(qs);
    const q = params.get('q') || '';
    setQuery(q);
    if (q) { doSearch(q, new Set(), ''); setSearched(true); }
  }, [qs]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleType(t: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setSearched(true);
    await doSearch(query, activeTypes, locationFilter);
  }

  async function doSearch(q: string, types: Set<string>, loc: string) {
    setLoading(true);
    const all: UnifiedResult[] = [];

    const wantAll = types.size === 0;
    const want = (t: string) => wantAll || types.has(t);

    // Parallel queries
    const promises: Promise<void>[] = [];

    // 1. Listings (regular + auction + service)
    if (want('regular') || want('auction') || want('service')) {
      promises.push(
        supabase.from('listings')
          .select('id, title, description, price, images, location, created_at, listing_type, status')
          .neq('status', 'deleted')
          .eq('status', 'active')
          .or(q ? `title.ilike.%${q}%,description.ilike.%${q}%` : 'id.neq.00000000-0000-0000-0000-000000000000')
          .limit(20)
          .then(({ data }) => {
            for (const r of data || []) {
              if (!want(r.listing_type)) continue;
              if (loc && !r.location?.toLowerCase().includes(loc.toLowerCase())) continue;
              all.push({
                id: r.id, type: r.listing_type as ListingType,
                title: r.title, description: r.description,
                price: r.price, image: r.images?.[0] ?? null,
                location: r.location, created_at: r.created_at,
              });
            }
          })
      );
    }

    // 2. Jobs
    if (want('job')) {
      promises.push(
        supabase.from('jobs')
          .select('id, title, company, description, location, salary_min, created_at')
          .eq('status', 'active')
          .or(q ? `title.ilike.%${q}%,description.ilike.%${q}%,company.ilike.%${q}%` : 'id.neq.00000000-0000-0000-0000-000000000000')
          .limit(15)
          .then(({ data }) => {
            for (const r of data || []) {
              if (loc && !r.location?.toLowerCase().includes(loc.toLowerCase())) continue;
              all.push({
                id: r.id, type: 'job' as ListingType,
                title: r.title, description: `${r.company} — ${r.description?.slice(0, 100) ?? ''}`,
                price: r.salary_min, image: null,
                location: r.location, created_at: r.created_at,
              });
            }
          })
      );
    }

    // 3. Donations
    if (want('donation')) {
      promises.push(
        supabase.from('donations')
          .select('id, title, description, goal_amount, images, location, created_at, is_verified')
          .eq('status', 'active')
          .eq('moderation_status', 'active')
          .or(q ? `title.ilike.%${q}%,description.ilike.%${q}%` : 'id.neq.00000000-0000-0000-0000-000000000000')
          .limit(10)
          .then(({ data }) => {
            for (const r of data || []) {
              if (loc && !r.location?.toLowerCase().includes(loc.toLowerCase())) continue;
              all.push({
                id: r.id, type: 'donation' as ListingType,
                title: r.title, description: r.description,
                price: r.goal_amount ? r.goal_amount : null,
                image: r.images?.[0] ?? null,
                location: r.location, created_at: r.created_at,
                verified: r.is_verified,
              });
            }
          })
      );
    }

    // 4. Shops
    if (want('shop')) {
      promises.push(
        supabase.from('shops')
          .select('id, name, description, logo_url, location, created_at, is_verified, slug')
          .eq('is_active', true)
          .or(q ? `name.ilike.%${q}%,description.ilike.%${q}%` : 'id.neq.00000000-0000-0000-0000-000000000000')
          .limit(10)
          .then(({ data }) => {
            for (const r of data || []) {
              if (loc && !r.location?.toLowerCase().includes(loc.toLowerCase())) continue;
              all.push({
                id: r.slug ?? r.id, type: 'shop' as ListingType,
                title: r.name, description: r.description,
                price: null, image: r.logo_url,
                location: r.location, created_at: r.created_at,
                verified: r.is_verified,
              });
            }
          })
      );
    }

    // 5. Producers
    if (want('producer')) {
      promises.push(
        supabase.from('producers')
          .select('id, name, bio, avatar_url, location, created_at, is_verified')
          .or(q ? `name.ilike.%${q}%,bio.ilike.%${q}%` : 'id.neq.00000000-0000-0000-0000-000000000000')
          .limit(10)
          .then(({ data }) => {
            for (const r of data || []) {
              if (loc && !r.location?.toLowerCase().includes(loc.toLowerCase())) continue;
              all.push({
                id: r.id, type: 'producer' as ListingType,
                title: r.name, description: r.bio,
                price: null, image: r.avatar_url,
                location: r.location, created_at: r.created_at,
                verified: r.is_verified,
              });
            }
          })
      );
    }

    await Promise.all(promises);

    // Sort by created_at desc
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setResults(all);

    // Count by type
    const c: Record<string, number> = {};
    for (const r of all) c[r.type] = (c[r.type] ?? 0) + 1;
    setCounts(c);

    setLoading(false);
  }

  const filtered = activeTypes.size === 0 ? results : results.filter((r) => activeTypes.has(r.type));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Hero search */}
      <section className="relative overflow-hidden rounded-3xl glass p-8">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/[0.05] rounded-full blur-[100px] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
              <Search className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Globális kereső</p>
              <h1 className="text-xl font-bold">Keresés mindenben</h1>
            </div>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Termék, állás, termelő, bolt, adomány..."
                  className="w-full pl-11 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold rounded-xl hover:bg-emerald-500/30 transition-all whitespace-nowrap"
              >
                Keresés
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Helyszín szűrés (pl. Budapest, Pest megye...)"
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {ALL_TYPES.map((t) => (
          <TypeFilterPill
            key={t}
            type={t}
            active={activeTypes.has(t)}
            onClick={() => { toggleType(t); }}
          />
        ))}
        {activeTypes.size > 0 && (
          <button
            onClick={() => setActiveTypes(new Set())}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 glass-pill transition-colors"
          >
            <X className="w-3 h-3" />Szűrők törlése
          </button>
        )}
      </div>

      {/* Results */}
      {!searched && (
        <div className="glass rounded-3xl p-12 text-center space-y-4">
          <Search className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-zinc-400 font-medium">Keresés mindenre egyszerre</p>
          <p className="text-zinc-600 text-sm">Írj be valamit a keresőmezőbe — termékek, állások, termelők, boltok, adományok, mind itt találhatók.</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {ALL_TYPES.map((t) => {
              const cfg = TYPE_CONFIG[t];
              return (
                <span key={t} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                  <cfg.icon className="w-3 h-3" />{cfg.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {searched && loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-bubble rounded-2xl p-4 flex gap-4 animate-pulse">
              <div className="w-16 h-16 bg-white/5 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-1/4" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {searched && !loading && (
        <>
          {/* Result summary */}
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">
              <strong className="text-zinc-300">{filtered.length}</strong> találat
              {Object.entries(counts).length > 0 && (
                <span className="ml-2 text-zinc-600">
                  ({Object.entries(counts).map(([t, n]) => `${TYPE_CONFIG[t]?.label ?? t}: ${n}`).join(', ')})
                </span>
              )}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center">
              <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">Nincs találat</p>
              <p className="text-zinc-600 text-sm mt-1">Próbálj más kulcsszót vagy töröld a típus szűrőket.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => <ResultCard key={`${r.type}-${r.id}`} result={r} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
