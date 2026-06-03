import { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from '../../lib/router';
import { useSEO, SEO_PAGES } from '../../lib/seo';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { getWorldBackgroundSources } from '../../lib/siteCustomization';
import HomeIntentBar from '../../components/world/HomeIntentBar';
import FantasyHomeRailMenu from '../../components/home/fantasy/FantasyHomeRailMenu';
import FantasyHomeFloatingMenu, { FantasyHomeFloatPreview } from '../../components/home/fantasy/FantasyHomeFloatingMenu';
import { getFantasyZones, findFantasyZone } from '../../components/home/fantasy/fantasyHomeZones';

/** Fantasy / GTA-szerű főoldal — játékmenü érzet, nem klasszikus web layout. */
export default function HomePageFantasy() {
  useSEO(SEO_PAGES.home);
  const { navigate } = useRouter();
  const { config, devModeActive, canEdit } = useSiteCustomization();
  const menuStyle = config.home?.menuStyle === 'floating' ? 'floating' : 'rail';
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const zones = getFantasyZones();
  const hoveredZone = hoveredZoneId ? findFantasyZone(hoveredZoneId) ?? null : null;
  const bgArt = getWorldBackgroundSources(config).webp;

  return (
    <div className="fantasy-home-page" data-home-skin="fantasy" data-home-menu={menuStyle}>
      <div className="fantasy-home-backdrop" aria-hidden>
        <div
          className="fantasy-home-backdrop__art"
          style={{ backgroundImage: `url(${bgArt})` }}
        />
        <div className="fantasy-home-backdrop__sky" />
        <div className="fantasy-home-backdrop__horizon" />
        <div className="fantasy-home-backdrop__grid" />
        <div className="fantasy-home-backdrop__vignette" />
        <div className="fantasy-home-backdrop__scan" />
      </div>

      <div className="fantasy-home-shell min-h-[100dvh] relative z-10 flex flex-col">
        <header className="fantasy-home-hero px-4 sm:px-8 pt-6 sm:pt-10 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4 max-w-[1200px] mx-auto w-full">
            <div className="fantasy-home-brand">
              <p className="fantasy-home-brand__eyebrow">
                <Sparkles className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                {config.hero.badgeTop || 'PiacPro'}
              </p>
              <h1 className="fantasy-home-brand__title">
                PIAC<span>PRO</span>
              </h1>
              <p className="fantasy-home-brand__tagline">
                {config.hero.subtitle || 'Eladás · vásárlás · munka · segítség — egy biztonságos magyar piactér.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/hogyan-mukodik')}
              className="fantasy-home-guide-link"
            >
              Hogyan működik?
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="fantasy-home-intent-wrap px-4 sm:px-8 max-w-[1200px] mx-auto w-full">
          <HomeIntentBar />
        </div>

        <div className="fantasy-home-stage flex-1 px-4 sm:px-8 pb-8 pt-4 max-w-[1200px] mx-auto w-full min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={menuStyle}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {menuStyle === 'rail' ? (
                <div className="fantasy-home-stage__rail-layout">
                  <FantasyHomeRailMenu
                    zones={zones}
                    onNavigate={navigate}
                    activeId={hoveredZoneId}
                  />
                  <aside className="fantasy-home-stage__aside" aria-hidden>
                    <div className="fantasy-home-art-panel">
                      <p className="fantasy-home-art-panel__label">Élő piactér</p>
                      <p className="fantasy-home-art-panel__stat">Magyar közösség</p>
                      <div className="fantasy-home-art-panel__orb" />
                      <p className="fantasy-home-art-panel__hint">
                        Válassz zónát a bal oldali listából — minden ugyanoda visz, mint a város térképen.
                      </p>
                    </div>
                  </aside>
                </div>
              ) : (
                <div className="fantasy-home-stage__float-layout">
                  <FantasyHomeFloatPreview zone={hoveredZone} />
                  <div className="fantasy-home-float-map">
                    <FantasyHomeFloatingMenu
                      onNavigate={navigate}
                      hoveredId={hoveredZoneId}
                      onHover={setHoveredZoneId}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {canEdit && devModeActive && (
          <footer className="fantasy-home-footer px-4 pb-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Fejlesztői mód · Város ↔ Fantasy · Lista ↔ Kihelyezett
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
