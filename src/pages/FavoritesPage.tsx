import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Listing } from '../lib/types';
import ListingCard from '../components/ListingCard';
import { Heart } from 'lucide-react';
import { useSEO, SEO_PAGES } from '../lib/seo';
import WorldZonePageHeader from '../components/world/WorldZonePageHeader';

export default function FavoritesPage() {
  useSEO(SEO_PAGES.favorites);
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  async function fetchFavorites() {
    const { data } = await supabase
      .from('favorites')
      .select('listing_id, listings(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    const favListings = data
      ?.map((d: any) => d.listings)
      .filter(Boolean)
      .map((l: any) => ({ ...l, is_favorited: true })) || [];

    setListings(favListings);
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <Heart className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400 text-lg">Jelentkezz be a kedvenceid megtekintéséhez</p>
      </div>
    );
  }

  return (
    <div className="piac-page-content max-w-[1440px] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      <WorldZonePageHeader
        zoneId="marketplace"
        title="Kedvencek"
        subtitle="Mentett hirdetéseid a Marketplace Zónában"
        count={listings.length}
        countLabel="mentett hirdetés"
        showLiveCount={false}
        compact
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg">Még nincs kedvenc hirdetésed</p>
          <p className="text-zinc-600 text-sm mt-1">Böngéssz a hirdetések között és mentsd el a tetszőket</p>
        </div>
      )}
    </div>
  );
}
