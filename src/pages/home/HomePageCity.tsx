import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Listing } from '../../lib/types';
import { useSEO, SEO_PAGES } from '../../lib/seo';
import { useRouter } from '../../lib/router';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  getHomeWowConfig,
  isHomeWowFeatureEnabled,
  markFirstPinClick,
  shouldShowCinematicEntry,
} from '../../lib/homeWow';
import CityMapView from '../../components/world/CityMapView';
import CityMobileDistrictRail from '../../components/world/CityMobileDistrictRail';
import HomeHeroBackdrop from '../../components/world/HomeHeroBackdrop';
import HomeHeroAmbientLayer from '../../components/world/HomeHeroAmbientLayer';
import HomeInfoScroll, { HomeScrollHint } from '../../components/world/HomeInfoScroll';
import HomeLivePulseBar from '../../components/world/HomeLivePulseBar';
import HomeMiniTour from '../../components/world/HomeMiniTour';
import WorldEntryGate from '../../components/world/WorldEntryGate';

/** Klasszikus várostérképes főoldal — wow élmény + eredeti pin elrendezés mobilon. */
export default function HomePageCity() {
  useSEO(SEO_PAGES.home);
  const { navigate } = useRouter();
  const { devModeActive, config } = useSiteCustomization();
  const { showToast } = useNotification();
  const wow = getHomeWowConfig(config);

  /** Belépés után true — session + kattintás együtt. */
  const [worldEntered, setWorldEntered] = useState(false);
  const [mapRevealing, setMapRevealing] = useState(false);
  const [ready, setReady] = useState(false);
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const cinematicActive = wow.enabled && wow.cinematicEntry;
  const pendingCinematicEntry =
    cinematicActive && shouldShowCinematicEntry(config) && !worldEntered;
  const showGate = pendingCinematicEntry;
  const pinIgnited = !pendingCinematicEntry;

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

  function handleWorldEnter() {
    setWorldEntered(true);
    setMapRevealing(true);
    window.setTimeout(() => {
      setMapRevealing(false);
    }, 950);
  }

  function handlePinNavigate(path: string) {
    if (isHomeWowFeatureEnabled(config, 'firstClickReward') && markFirstPinClick()) {
      showToast('success', 'Üdv a Piacon!', 'Itt kezdődik — minden zóna egy funkció a digitális városban.');
    }
    navigate(path);
  }

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

  const pinsReady = ready && pinIgnited;

  return (
    <div className="world-home-page" data-home-skin="city" data-home-wow={wow.enabled ? '1' : '0'}>
      {showGate && (
        <WorldEntryGate onEnter={handleWorldEnter} />
      )}

      <div
        className={`world-home-hero-viewport relative min-h-[100dvh] overflow-x-hidden${mapRevealing ? ' world-home-hero-viewport--revealing' : ''}${pinIgnited && wow.enabled ? ' world-home-hero-viewport--ignited' : ''}`}
      >
        <HomeHeroBackdrop />
        <HomeHeroAmbientLayer />
        <div className="relative z-10 min-h-[100dvh]">
          <CityMapView
            ready={pinsReady}
            devModeActive={devModeActive}
            pinIgnition={pinIgnited && wow.enabled && wow.cinematicEntry}
            livePulse={wow.enabled && wow.livePulse}
            pinHoverPreview={wow.enabled && wow.pinHoverPreview}
            onPinNavigate={handlePinNavigate}
          />
          <HomeScrollHint />
        </div>
        {wow.enabled && wow.livePulse && <HomeLivePulseBar />}
        <HomeMiniTour />
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
          <CityMobileDistrictRail />
        </div>
      </div>

      <HomeInfoScroll listings={latestListings} listingCount={listingCount} loading={loading} />
    </div>
  );
}
