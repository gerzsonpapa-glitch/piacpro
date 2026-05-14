import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Listing, Category } from '../lib/types';
import ListingCard from '../components/ListingCard';
import { HUNGARIAN_COUNTIES, normalizeListingAuction } from '../lib/utils';
import { useRouter } from '../lib/router';
import { Search, SlidersHorizontal, X, MapPin, ChevronDown, ChevronRight } from 'lucide-react';

function CategoryTree({
  categories,
  selectedSlug,
  onSelect,
}: {
  categories: Category[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const parents = categories.filter((c) => !c.parent_id);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 items-start">
      <button
        onClick={() => { onSelect(''); setExpanded(null); }}
        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${!selectedSlug ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
      >
        Összes
      </button>
      {parents.map((parent) => {
        const children = categories.filter((c) => c.parent_id === parent.id);
        const isExpanded = expanded === parent.id;
        const isParentActive = selectedSlug === parent.slug;
        const isChildActive = children.some((c) => c.slug === selectedSlug);
        const anyActive = isParentActive || isChildActive;

        return (
          <div key={parent.id} className="flex-shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onSelect(isParentActive ? '' : parent.slug)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${anyActive ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
              >
                {parent.name}
              </button>
              {children.length > 0 && (
                <button
                  onClick={() => setExpanded(isExpanded ? null : parent.id)}
                  className="p-2 glass-pill rounded-xl text-zinc-500 hover:text-zinc-300 transition-all"
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
            </div>
            {isExpanded && children.length > 0 && (
              <div className="flex gap-1.5 mt-1 ml-1 flex-wrap max-w-[200px]">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onSelect(child.slug === selectedSlug ? parent.slug : child.slug)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${selectedSlug === child.slug ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SearchPage() {
  const { search } = useRouter();
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

  useEffect(() => { fetchListings(); }, [query, categorySlug, locationFilter, minPrice, maxPrice, sortBy, statusFilter, categories]);

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

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés..."
            className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${showFilters || hasActiveFilters ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden sm:inline">Szűrők</span>
        </button>
      </div>

      {/* Location row */}
      <div className="flex gap-2 overflow-x-auto pb-1 items-center">
        <MapPin className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        <button onClick={() => setLocationFilter('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${!locationFilter ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
          Országos
        </button>
        {HUNGARIAN_COUNTIES.map((county) => (
          <button key={county} onClick={() => setLocationFilter(locationFilter === county ? '' : county)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${locationFilter === county ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
            {county}
          </button>
        ))}
      </div>

      {/* Category tree */}
      <CategoryTree categories={categories} selectedSlug={categorySlug} onSelect={setCategorySlug} />

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Szűrők</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                <X className="w-3 h-3" />Szűrők törlése
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Állapot</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm transition-all">
                <option value="active">Aktív</option>
                <option value="sold">Elkelt</option>
                <option value="ended">Lezárult</option>
                <option value="">Összes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Helyszín</label>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm transition-all">
                <option value="">Országos</option>
                {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Min. ár (Ft)</label>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Max. ár (Ft)</label>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="∞"
                className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Rendezés</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm transition-all">
                <option value="newest">Legújabb</option>
                <option value="price-asc">Ár: növekvő</option>
                <option value="price-desc">Ár: csökkenő</option>
                <option value="popular">Népszerű</option>
              </select>
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
          </div>
        )}
      </div>
    </div>
  );
}
