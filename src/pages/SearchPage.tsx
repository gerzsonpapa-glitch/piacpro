import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Listing, Category } from '../lib/types';
import ListingCard from '../components/ListingCard';
import { HUNGARIAN_COUNTIES, normalizeListingAuction } from '../lib/utils';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, SlidersHorizontal, X, MapPin, ChevronDown, ShoppingBag, Plus,
  Tag, Package
} from 'lucide-react';

// ── Compact dropdown ──────────────────────────────────────────────────────────
function CompactSelect({
  label,
  value,
  icon: Icon,
  children,
  onClear,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const active = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
          active
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            : 'glass-pill text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="max-w-[120px] truncate">{value || label}</span>
        {active && onClear ? (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
            className="ml-0.5 text-emerald-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 glass-strong rounded-2xl overflow-hidden z-30 shadow-xl min-w-[180px] max-h-64 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Category picker ───────────────────────────────────────────────────────────
function CategoryPicker({
  categories,
  selectedSlug,
  onSelect,
}: {
  categories: Category[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const parents = categories.filter((c) => !c.parent_id);
  const selected = categories.find((c) => c.slug === selectedSlug);
  const label = selected ? selected.name : 'Kategória';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
          selectedSlug
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            : 'glass-pill text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Tag className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="max-w-[130px] truncate">{label}</span>
        {selectedSlug ? (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onSelect(''); setOpen(false); }}
            className="ml-0.5 text-emerald-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 glass-strong rounded-2xl overflow-hidden z-30 shadow-xl w-56 max-h-80 overflow-y-auto">
          <button
            onClick={() => { onSelect(''); setOpen(false); setExpandedParent(null); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!selectedSlug ? 'text-emerald-300 bg-emerald-500/10' : 'text-zinc-300 hover:bg-white/5'}`}
          >
            Összes kategória
          </button>
          <div className="h-px bg-white/5 mx-3" />
          {parents.map((parent) => {
            const children = categories.filter((c) => c.parent_id === parent.id);
            const isExpanded = expandedParent === parent.id;
            const isActive = selectedSlug === parent.slug || children.some((c) => c.slug === selectedSlug);

            return (
              <div key={parent.id}>
                <div className="flex items-center">
                  <button
                    onClick={() => { onSelect(parent.slug); setOpen(false); }}
                    className={`flex-1 text-left px-4 py-2.5 text-sm transition-colors ${isActive ? 'text-emerald-300 bg-emerald-500/8' : 'text-zinc-300 hover:bg-white/5'}`}
                  >
                    {parent.name}
                  </button>
                  {children.length > 0 && (
                    <button
                      onClick={() => setExpandedParent(isExpanded ? null : parent.id)}
                      className="pr-3 py-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {isExpanded && children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => { onSelect(child.slug); setOpen(false); }}
                    className={`w-full text-left pl-8 pr-4 py-2 text-xs transition-colors ${selectedSlug === child.slug ? 'text-emerald-300 bg-emerald-500/10' : 'text-zinc-400 hover:bg-white/5'}`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const { search } = useRouter();
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('active');
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    setQuery(params.get('q') || '');
    setCategorySlug(params.get('category') || '');
    setLocationFilter(params.get('location') || '');
    setSortBy(params.get('sort') || 'newest');
  }, [search]);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order')
      .then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => { fetchListings(); }, [query, categorySlug, locationFilter, minPrice, maxPrice, sortBy, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchListings() {
    setLoading(true);
    let dbQuery = supabase
      .from('listings')
      .select('*, seller:profiles(*), auction:auctions(*)')
      .eq('listing_type', 'regular')
      .neq('status', 'deleted');

    if (statusFilter) dbQuery = dbQuery.eq('status', statusFilter);
    if (query) dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (categorySlug) {
      let cats = categories;
      if (cats.length === 0) {
        const { data } = await supabase.from('categories').select('*').order('sort_order');
        cats = data || [];
      }
      const cat = cats.find((c) => c.slug === categorySlug);
      if (cat) {
        const childIds = cats.filter((c) => c.parent_id === cat.id).map((c) => c.id);
        const ids = [cat.id, ...childIds];
        dbQuery = dbQuery.in('category_id', ids);
      }
    }

    if (locationFilter) dbQuery = dbQuery.ilike('location', `%${locationFilter}%`);
    if (minPrice) dbQuery = dbQuery.gte('price', parseFloat(minPrice));
    if (maxPrice) dbQuery = dbQuery.lte('price', parseFloat(maxPrice));

    switch (sortBy) {
      case 'price-asc': dbQuery = dbQuery.order('price', { ascending: true }); break;
      case 'price-desc': dbQuery = dbQuery.order('price', { ascending: false }); break;
      case 'popular': dbQuery = dbQuery.order('views', { ascending: false }); break;
      default: dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    const { data } = await dbQuery.limit(60);
    setListings((data || []).map(normalizeListingAuction));
    setLoading(false);
  }

  function clearFilters() {
    setQuery(''); setCategorySlug(''); setLocationFilter('');
    setMinPrice(''); setMaxPrice(''); setSortBy('newest'); setStatusFilter('active');
  }

  const hasActiveFilters = query || categorySlug || locationFilter || minPrice || maxPrice || statusFilter !== 'active';

  const selectedCountyLabel = locationFilter || '';

  return (
    <div className="space-y-5">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass p-7 md:p-9">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/6 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-teal-500/5 rounded-full blur-[70px] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Piactér</p>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">Hirdetések</h1>
              </div>
            </div>
            <p className="text-zinc-400 text-sm md:text-base max-w-lg">
              Böngészd az eladó termékeket — keress kategória, helyszín és ár szerint.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span><strong className="text-zinc-200">{listings.length}</strong> hirdetés</span>
              </div>
            </div>
          </div>
          {user && (
            <button
              onClick={() => navigate('/create')}
              className="flex items-center gap-2.5 glass-pill-active text-emerald-300 px-6 py-3 rounded-2xl font-semibold transition-all hover:scale-[1.03] whitespace-nowrap self-start md:self-center"
            >
              <Plus className="w-5 h-5" />
              Hirdetés feladása
            </button>
          )}
        </div>
      </section>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés a hirdetések között..."
            className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${showFilters || hasActiveFilters ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden sm:inline">Szűrők</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* Compact filter chips row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Category picker */}
        <CategoryPicker
          categories={categories}
          selectedSlug={categorySlug}
          onSelect={setCategorySlug}
        />

        {/* County picker */}
        <CompactSelect
          label="Helyszín"
          value={selectedCountyLabel}
          icon={MapPin}
          onClear={() => setLocationFilter('')}
        >
          <button
            onClick={() => setLocationFilter('')}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!locationFilter ? 'text-emerald-300 bg-emerald-500/10' : 'text-zinc-300 hover:bg-white/5'}`}
          >
            Országos
          </button>
          <div className="h-px bg-white/5 mx-3" />
          {HUNGARIAN_COUNTIES.map((county) => (
            <button
              key={county}
              onClick={() => setLocationFilter(locationFilter === county ? '' : county)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${locationFilter === county ? 'text-emerald-300 bg-emerald-500/10' : 'text-zinc-300 hover:bg-white/5'}`}
            >
              {county}
            </button>
          ))}
        </CompactSelect>

        {/* Sort */}
        <CompactSelect
          label="Rendezés"
          value={sortBy === 'newest' ? '' : { 'price-asc': 'Ár: növekvő', 'price-desc': 'Ár: csökkenő', popular: 'Népszerű' }[sortBy] || ''}
          icon={SlidersHorizontal}
        >
          {[
            { value: 'newest', label: 'Legújabb' },
            { value: 'price-asc', label: 'Ár: növekvő' },
            { value: 'price-desc', label: 'Ár: csökkenő' },
            { value: 'popular', label: 'Népszerű' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSortBy(value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === value ? 'text-emerald-300 bg-emerald-500/10' : 'text-zinc-300 hover:bg-white/5'}`}
            >
              {label}
            </button>
          ))}
        </CompactSelect>

        {/* Status */}
        <CompactSelect
          label="Állapot"
          value={statusFilter === 'active' ? '' : { sold: 'Elkelt', ended: 'Lezárult', '': 'Összes' }[statusFilter] || ''}
          icon={Package}
        >
          {[
            { value: 'active', label: 'Aktív' },
            { value: 'sold', label: 'Elkelt' },
            { value: 'ended', label: 'Lezárult' },
            { value: '', label: 'Összes' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${statusFilter === value ? 'text-emerald-300 bg-emerald-500/10' : 'text-zinc-300 hover:bg-white/5'}`}
            >
              {label}
            </button>
          ))}
        </CompactSelect>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-400 glass-pill transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Törlés
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-zinc-200">Ár szűrő</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                <X className="w-3 h-3" />Törlés
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Min. ár (Ft)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Max. ár (Ft)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="∞"
                className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        <p className="text-sm text-zinc-500 mb-4">
          {loading ? 'Keresés...' : `${listings.length} hirdetés`}
        </p>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-bubble rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-6 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass rounded-3xl">
            <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-lg">Nincs találat</p>
            <p className="text-zinc-600 text-sm mt-1">Próbálj más keresőszót vagy szűrőt</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-sm text-emerald-400 hover:text-emerald-300">
                Szűrők törlése
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
