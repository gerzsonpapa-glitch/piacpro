import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { Search, Menu, X, ShoppingBag, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ChatWidget from './ChatWidget';
import Footer from './Footer';
import DeveloperModeBar from './DeveloperModeBar';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import { isSiteDeveloper } from '../lib/developer';
import { getPageSkin } from '../lib/siteCustomization';
import WorldEffects from './WorldEffects';
import InlineDevEditor from './InlineDevEditor';
import PiacEditable from './PiacEditable';
import PiacButton from './ui/PiacButton';
import WorldPageTransition from './world/WorldPageTransition';
import WorldAmbientLayer from './world/WorldAmbientLayer';
import AIWorldGuide from './world/AIWorldGuide';
import LiveActivityStrip from './world/LiveActivityStrip';
import WorldZoneHub from './world/WorldZoneHub';
import SecondaryWorldsSheet from './world/SecondaryWorldsSheet';
import SystemIdentityMenu from './world/SystemIdentityMenu';
import WorldMobileDock from './world/WorldMobileDock';
import { getZoneForPath } from '../lib/worldZones';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const { navigate, path } = useRouter();
  const isHome = path === '/';
  const activeZone = getZoneForPath(path);
  const { config, canEdit } = useSiteCustomization();
  const showDevStudio = canEdit && isSiteDeveloper(user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingApps, setPendingApps] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [secondaryOpen, setSecondaryOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!profile?.is_admin && !profile?.is_super_admin) return;
    fetchPending();
    const ch = supabase.channel('layout-apps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'producer_applications' }, fetchPending)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.is_admin, profile?.is_super_admin]);

  async function fetchPending() {
    const { count } = await supabase.from('producer_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    setPendingApps(count ?? 0);
  }

  const navTransparent = isHome && !scrolled;
  const pageSkin = getPageSkin(config, path);
  const hideChrome = path === '/login' || path === '/register';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/discover?q=${encodeURIComponent(searchQ.trim())}`);
  }

  return (
    <div className="min-h-screen text-zinc-100 relative" style={{ background: config.theme.background }} data-world-zone={activeZone?.id ?? 'hub'}>

      <WorldEffects />
      <WorldAmbientLayer zone={activeZone} />

      {/* Oldal-specifikus háttér */}
      {(pageSkin?.bgImage || pageSkin?.bgColor) && (
        <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
          {pageSkin.bgImage && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url(${pageSkin.bgImage})` }}
            />
          )}
          {pageSkin.bgColor && (
            <div className="absolute inset-0" style={{ backgroundColor: pageSkin.bgColor, opacity: 0.5 }} />
          )}
          {pageSkin.overlay && (
            <div className="absolute inset-0" style={{ background: pageSkin.overlay }} />
          )}
        </div>
      )}

      {/* Ambient glow (ha nincs WorldEffects orb) */}
      {!config.world.floatingOrbs && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-20 left-[10%] w-[800px] h-[500px] rounded-full blur-[180px]" style={{ background: 'rgba(0,208,132,0.032)', transform: 'rotate(-15deg)' }} />
          <div className="absolute top-[30%] right-[5%] w-[600px] h-[400px] rounded-full blur-[160px]" style={{ background: 'rgba(59,130,246,0.025)' }} />
        </div>
      )}

      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 transition-all duration-500"
        style={navTransparent ? {
          background: 'linear-gradient(to bottom, rgba(7,17,31,0.75) 0%, rgba(7,17,31,0.2) 80%, transparent 100%)',
          borderBottom: '1px solid transparent',
        } : {
          background: 'rgba(7,17,31,0.94)',
          borderBottom: '1px solid rgba(0,208,132,0.1)',
          backdropFilter: 'blur(48px) saturate(200%) brightness(1.02)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%) brightness(1.02)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(0,208,132,0.06) inset',
        }}>
        {/* Neon accent line at very top of navbar */}
        {!navTransparent && (
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,208,132,0.5) 30%, rgba(0,208,132,0.9) 50%, rgba(0,208,132,0.5) 70%, transparent 100%)' }} />
        )}
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 w-full">
        <div className="flex items-center gap-2 sm:gap-3 min-h-[52px] h-auto py-1.5 min-w-0 w-full">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0 group max-w-[42%] sm:max-w-none">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 breathe-green overflow-hidden"
              style={{ background: 'rgba(0,208,132,0.12)', border: '1px solid rgba(0,208,132,0.3)' }}>
              {config.media.logoImageUrl ? (
                <img src={config.media.logoImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-[#00d084]" />
              )}
            </div>
            <div className="hidden sm:block leading-none min-w-0">
              <div className="text-base lg:text-[18px] font-black tracking-tight truncate" style={{ color: '#fff' }}>
                Piac<span style={{ color: 'var(--piac-accent,#00d084)', textShadow: '0 0 16px rgba(0,208,132,0.6)' }}>Pro</span>
              </div>
              <PiacEditable editKey="nav.brandSubtitle" as="div" className="text-[8px] lg:text-[9px] font-bold tracking-[0.12em] uppercase truncate block max-w-[140px] lg:max-w-[200px]" style={{ color: 'rgba(0,208,132,0.55)' }}>
                {config.nav.brandSubtitle}
              </PiacEditable>
            </div>
          </button>

          {/* Minimális kereső */}
          <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-md hidden sm:block mx-2 lg:mx-4">
            <div className="relative flex items-center rounded-xl overflow-hidden piac-nav-search-compact transition-all duration-300"
              style={{ background: 'rgba(7,17,31,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder={config.nav.searchPlaceholder}
                data-piac-edit="nav.searchPlaceholder"
                className="w-full bg-transparent pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none min-w-0"
              />
            </div>
          </form>

          {/* Rendszer + világ hub */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
            {!hideChrome && (
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-cyan-300/90 hover:bg-white/[0.05] border border-cyan-500/20"
                aria-label="Világ zónák"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden lg:inline">Világok</span>
              </button>
            )}
            {user ? (
              <SystemIdentityMenu pendingApps={pendingApps} />
            ) : (
              <>
                <PiacButton variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/register')}>
                  Regisztráció
                </PiacButton>
                <PiacButton variant="primary" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/login')}>
                  Bejelentkezés
                </PiacButton>
              </>
            )}

            {!hideChrome && (
              <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all flex-shrink-0 sm:hidden" aria-label="Világ menü">
                {mobileOpen ? <X className="w-5 h-5 text-zinc-300" /> : <Menu className="w-5 h-5 text-zinc-400" />}
              </button>
            )}
          </div>
        </div>
        </div>

        {/* Mobil kereső — nem a főoldalon (város térkép) */}
        {!isHome && (
        <div className="md:hidden px-3 pb-2">
          <form onSubmit={handleSearch} className="relative flex items-center rounded-xl"
            style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Keresés..." className="w-full bg-transparent pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none" />
          </form>
        </div>
        )}

        {/* Világ hub drawer — csak 5 fő zóna + további világok */}
        {mobileOpen && !hideChrome && (
          <div className="border-t max-h-[min(85vh,640px)] overflow-y-auto"
            style={{ background: 'rgba(7,17,31,0.98)', borderTopColor: 'rgba(6,182,212,0.15)', backdropFilter: 'blur(24px)' }}>
            <nav className="p-4 sm:p-6 max-w-lg mx-auto">
              <WorldZoneHub
                onNavigate={() => setMobileOpen(false)}
                onOpenSecondary={() => { setSecondaryOpen(true); setMobileOpen(false); }}
              />
              {!user && (
                <div className="flex gap-2 pt-6 mt-6 border-t border-white/10">
                  <PiacButton variant="primary" size="md" className="flex-1" onClick={() => { navigate('/register'); setMobileOpen(false); }}>
                    Regisztráció
                  </PiacButton>
                  <PiacButton variant="outline" size="md" className="flex-1" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                    Bejelentkezés
                  </PiacButton>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <SecondaryWorldsSheet open={secondaryOpen} onClose={() => setSecondaryOpen(false)} />

      {!isHome && path !== '/login' && path !== '/register' && <LiveActivityStrip />}

      {config.announcement.enabled && config.announcement.text && (
        <div
          className="relative z-40 text-center text-sm font-medium px-4 py-2.5"
          style={{
            background: config.announcement.background,
            color: config.announcement.textColor,
            borderBottom: '1px solid rgba(0,208,132,0.15)',
          }}
        >
          {config.announcement.link ? (
            <a href={config.announcement.link} className="hover:underline">
              <PiacEditable editKey="announcement.text" as="span">{config.announcement.text}</PiacEditable>
            </a>
          ) : (
            <PiacEditable editKey="announcement.text" as="span">{config.announcement.text}</PiacEditable>
          )}
        </div>
      )}

      {config.maintenance.enabled && config.maintenance.message && (
        <div className="relative z-40 bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 text-center text-xs text-amber-200">
          {config.maintenance.message}
        </div>
      )}

      {/* Main */}
      <main className={`relative z-10 py-0 ${isHome ? 'pb-0' : 'pb-36 md:pb-10'} ${showDevStudio && !isHome ? 'md:pb-28 pb-40' : ''} ${!isHome ? 'piac-page-shell world-page-shell' : ''}`}
        data-zone={activeZone?.id}>
        {pageSkin?.title && path !== '/' && (
          <div className="max-w-[1440px] mx-auto px-4 pt-6 pb-2">
            <PiacEditable editKey={`page.${path}.title`} as="h1" className="text-2xl sm:text-3xl font-black text-zinc-50 uppercase tracking-tight">
              {pageSkin.title}
            </PiacEditable>
            {pageSkin.subtitle && (
              <PiacEditable editKey={`page.${path}.subtitle`} as="p" className="text-zinc-500 text-sm mt-2">
                {pageSkin.subtitle}
              </PiacEditable>
            )}
          </div>
        )}
        <div className={!isHome ? 'piac-page-content' : ''}>
          <WorldPageTransition path={path}>
            {children}
          </WorldPageTransition>
        </div>
      </main>

      <Footer />

      {!hideChrome && !isHome && <WorldMobileDock onOpenSecondary={() => setSecondaryOpen(true)} />}

      <ChatWidget />
      <DeveloperModeBar />
      <InlineDevEditor />
      <AIWorldGuide />
    </div>
  );
}
