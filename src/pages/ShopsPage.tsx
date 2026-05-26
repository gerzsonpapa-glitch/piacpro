import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import type { Shop } from '../lib/types';
import { Store, Search, MapPin, ShieldCheck, Package, Tag, Plus } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';
import { useSEO, SEO_PAGES } from '../lib/seo';

const CAT_LABELS: Record<string, string> = {
  electronics: 'Elektronika', fashion: 'Ruha / Divat', food: 'Élelmiszer',
  sport: 'Sport', furniture: 'Bútor / Lakás', books: 'Könyv / Zene',
  vehicles: 'Jármű', kids: 'Gyerek', pets: 'Állatok',
  beauty: 'Szépség / Egészség', services: 'Szolgáltatás', other: 'Egyéb',
};

const CATS = [
  { value: '', label: 'Összes' },
  ...Object.entries(CAT_LABELS).map(([value, label]) => ({ value, label })),
];

function ShopCard({ shop }: { shop: Shop }) {
  const { navigate } = useRouter();

  return (
    <button
      onClick={() => navigate(`/shops/${shop.slug}`)}
      className="group text-left w-full glass-bubble rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] border border-transparent hover:border-emerald-500/20"
    >
      {/* Image / Banner — same ratio as ListingCard */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
        {shop.banner_url ? (
          <img
            src={shop.banner_url}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <Store className="w-12 h-12 text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Logo badge bottom-left */}
        <div className="absolute bottom-3 left-3 w-11 h-11 rounded-xl border-2 border-zinc-700 bg-zinc-800 overflow-hidden flex items-center justify-center shadow-lg">
          {shop.logo_url
            ? <img src={shop.logo_url} alt="" className="w-full h-full object-cover" />
            : <Store className="w-5 h-5 text-emerald-400" />
          }
        </div>

        {/* Verified badge top-right */}
        {shop.is_verified && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 glass-strong px-2 py-1 rounded-lg text-[10px] font-semibold text-emerald-300">
            <ShieldCheck className="w-3 h-3" />Hitelesített
          </span>
        )}

        {/* Category top-left */}
        <span className="absolute top-2.5 left-2.5 glass-strong px-2 py-1 rounded-lg text-[10px] font-medium text-zinc-400 flex items-center gap-1">
          <Tag className="w-2.5 h-2.5" />{CAT_LABELS[shop.category] ?? shop.category}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 truncate group-hover:text-emerald-300 transition-colors">
          {shop.name}
        </h3>
        {shop.description && (
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">{shop.description}</p>
        )}
        <div className="flex items-center justify-between mt-2 text-zinc-500 text-xs">
          <span className="flex items-center gap-1 truncate">
            {shop.location
              ? <><MapPin className="w-3 h-3 flex-shrink-0" />{shop.location}</>
              : <><Package className="w-3 h-3 flex-shrink-0" />{shop.product_count ?? 0} termék</>
            }
          </span>
          <span className="flex-shrink-0">{formatRelativeTime(shop.created_at)}</span>
        </div>
      </div>
    </button>
  );
}

export default function ShopsPage() {
  useSEO(SEO_PAGES.shops);
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => { fetchShops(); }, []);

  async function fetchShops() {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) { setLoading(false); return; }

    // Get product counts
    const ids = data.map((s) => s.id);
    const { data: counts } = await supabase
      .from('shop_products')
      .select('shop_id')
      .in('shop_id', ids)
      .eq('is_active', true);

    const countMap: Record<string, number> = {};
    (counts ?? []).forEach((r) => { countMap[r.shop_id] = (countMap[r.shop_id] ?? 0) + 1; });

    setShops(data.map((s) => ({ ...s, product_count: countMap[s.id] ?? 0 })));
    setLoading(false);
  }

  const filtered = shops.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q);
    const matchCat = !category || s.category === category;
    return matchSearch && matchCat;
  });

  const canOpenShop = user && (profile?.is_shop_owner || profile?.is_admin);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Boltok</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{shops.length} bolt a piactéren</p>
        </div>
        {canOpenShop && (
          <button
            onClick={() => navigate('/my-shop')}
            className="flex items-center gap-2 glass-pill-active text-emerald-300 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.03]"
          >
            <Store className="w-4 h-4" />Saját boltom
          </button>
        )}
        {user && !canOpenShop && (
          <button
            onClick={() => navigate('/my-shop')}
            disabled
            className="flex items-center gap-2 glass-pill text-zinc-600 px-5 py-2.5 rounded-2xl font-semibold text-sm cursor-not-allowed opacity-50"
          >
            <Plus className="w-4 h-4" />Bolt nyitása
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Bolt keresése..."
          className="w-full pl-11 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(category === value ? '' : value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${category === value ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-bubble rounded-3xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-3xl">
          <Store className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">{search || category ? 'Nincs találat' : 'Még nincsenek boltok'}</p>
          {(search || category) && (
            <button onClick={() => { setSearch(''); setCategory(''); }} className="mt-3 text-sm text-emerald-400 hover:text-emerald-300">
              Szűrők törlése
            </button>
          )}
        </div>
      )}
    </div>
  );
}
