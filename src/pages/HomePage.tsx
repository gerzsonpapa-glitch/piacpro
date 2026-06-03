import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Listing } from '../lib/types';
import { useSEO, SEO_PAGES } from '../lib/seo';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import CityMapView from '../components/world/CityMapView';
import CityMobileDistrictRail from '../components/world/CityMobileDistrictRail';
import HomeHeroBackdrop from '../components/world/HomeHeroBackdrop';
import HomeInfoScroll, { HomeScrollHint } from '../components/world/HomeInfoScroll';

export default function HomePage() {
  useSEO(SEO_PAGES.home);
  const { devModeActive } = useSiteCustomization();
  const [ready, setReady] = useState(false);
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tReady = setTimeout(() => setReady(true), 80);
    const tFetch = window.setTimeout(() => {
      fetchListings().finally(() => setLoading(false));
    }, 120);
    return () => {
      clearTimeout(tReady);
      clearTimeout(tFetch);
    };
  }, []);

  async function fetchListings() {
    const { data, count } = await supabase
      .from('listings')
      .select('*, seller:profiles(*)', { count: 'exact' })
      .eq('status', 'active')
      .eq('listing_type', 'regular')
      .order('created_at', { ascending: false })
      .limit(6);
    setLatestListings(data || []);
    setListingCount(count || 0);
  }

  return (
    <div className="world-home-page">
      <div className="world-home-hero-viewport relative min-h-[100dvh] overflow-x-hidden">
        <HomeHeroBackdrop />
        <div className="relative z-10 min-h-[100dvh]">
          <CityMapView ready={ready} devModeActive={devModeActive} />
          <HomeScrollHint />
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
          <CityMobileDistrictRail />
        </div>
      </div>

      <HomeInfoScroll listings={latestListings} listingCount={listingCount} loading={loading} />
    </div>
  );
}
