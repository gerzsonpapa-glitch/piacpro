import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import {
  Search, MessageCircle, User, Menu, X, LogOut, ShoppingBag, Gavel, Shield, Briefcase,
  Gift, MapPin, Users, ChevronDown, TrendingUp, Baby, Percent, Building2, Lock,
  Heart, ArrowRight, Car, Globe, Bell, PlusCircle, Home, Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ChatWidget from './ChatWidget';
import Footer from './Footer';
import DeveloperModeBar from './DeveloperModeBar';
import { DEFENSE_LINKS } from '../pages/VedelemPage';
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
import WorldEntryGate, { shouldShowWorldEntry } from './world/WorldEntryGate';
import { getZoneForPath } from '../lib/worldZones';

const DEFENSE_ITEMS = [
  { key: 'nyugdij' as const,                icon: TrendingUp, label: 'Nyugdíj-előtakarékosság',           desc: 'Hosszú távú megtakarítás, adókedvezmény' },
  { key: 'gyermek' as const,                icon: Baby,       label: 'Gyermekjövő',                       desc: 'Gyermek megtakarítás, tanulmány, indulás' },
  { key: 'vagyon' as const,                 icon: TrendingUp, label: 'Vagyon felépítése',                 desc: 'Megtakarítás, hosszú távú vagyonépítés' },
  { key: 'hitel' as const,                  icon: Home,       label: 'Hiteltermékek & állami támogatások', desc: 'CSOK, lakáshitel, hitelkiváltás' },
  { key: 'ado' as const,                    icon: Percent,    label: 'Adókedvezmények & visszatérítések', desc: 'Adóvisszatérítés, pénzügyi optimalizálás' },
  { key: 'kkv' as const,                    icon: Building2,  label: 'KKV megoldások',                    desc: 'Vállalkozásvédelem, cégbiztosítás' },
  { key: 'vagyonvedelem' as const,          icon: Lock,       label: 'Vagyonvédelem',                     desc: 'Lakásbiztosítás, ingatlanvédelem' },
  { key: 'elethelyzet' as const,            icon: Heart,      label: 'Biztonság bármely élethelyzetben',  desc: 'Életbiztosítás, családi védelem' },
  { key: 'gepjarmu_kgfb' as const,          icon: Car,        label: 'Online gépjármű biztosítás',        desc: 'KGFB kötés, gyors online ügyintézés' },
  { key: 'gepjarmu_asszisztencia' as const, icon: Car,        label: 'Online gépjármű asszisztencia',     desc: 'Út közbeni segítség, műszaki asszisztencia' },
  { key: 'utasbiztositas' as const,         icon: Globe,      label: 'Online utasbiztosítás',             desc: 'Utazási védelem, külföldi biztosítás' },
  { key: 'csatlakozas' as const,            icon: Users,      label: 'Csatlakozzon tanácsadóként',        desc: 'Pénzügyi karrier, csatlakozási lehetőség' },
];

function DefenseDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[860px] max-w-[calc(100vw-2rem)] z-50" style={{ paddingTop: '8px' }}>
      <div className="rounded-2xl overflow-hidden" style={{
        background: 'rgba(7,17,31,0.97)',
        border: '1px solid rgba(0,208,132,0.18)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 40px rgba(0,208,132,0.06)',
      }}>
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,208,132,0.8) 50%, transparent)' }} />
        <div className="p-5 grid grid-cols-3 gap-0.5">
          {DEFENSE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.key} href={DEFENSE_LINKS[item.key]} target="_blank" rel="noopener noreferrer" onClick={onClose}
                className="flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200 group hover:bg-[rgba(0,208,132,0.06)]"
                style={{ border: '1px solid transparent' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,208,132,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                  style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.2)' }}>
                  <Icon className="w-4 h-4 text-[#00d084]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 group-hover:text-[#00d084] transition-colors leading-tight">{item.label}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">{item.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#00d084] flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </a>
            );
          })}
        </div>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,208,132,0.08)', background: 'rgba(0,0,0,0.3)' }}>
          <p className="text-[11px] text-zinc-600">Minden út <span className="text-zinc-400 font-semibold">Ákom László Zsolt OVB fiókvezető</span>höz vezet</p>
          <a href={DEFENSE_LINKS.default} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="text-[11px] font-semibold text-[#00d084] flex items-center gap-1.5 hover:gap-2 transition-all">
            Profil <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function MobileDefenseAccordion({ onNavigate, isActive }: { onNavigate: (p: string) => void; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'glass-pill-active text-[#00d084]' : 'glass-pill text-zinc-400'}`}>
        <Shield className="w-4 h-4" />Védelem
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1 ml-4 border-l-2 border-[rgba(0,208,132,0.2)] pl-3 space-y-0.5">
          {DEFENSE_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <a key={item.key} href={DEFENSE_LINKS[item.key]} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all">
                <Icon className="w-4 h-4 text-[#00d084] flex-shrink-0" />{item.label}
              </a>
            );
          })}
          <button onClick={() => onNavigate('/vedelem')}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-[#00d084] font-semibold">
            Összes <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, unreadCount } = useAuth();
  const { navigate, path } = useRouter();
  const isHome = path === '/';
  const activeZone = getZoneForPath(path);
  const { config, canEdit } = useSiteCustomization();
  const showDevStudio = canEdit && isSiteDeveloper(user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingApps, setPendingApps] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [showEntryGate, setShowEntryGate] = useState(() => path === '/' && shouldShowWorldEntry());

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

  const isActive = (p: string) => {
    if (p === '/') return path === '/';
    if (p === '/search') return path === '/search' || path.startsWith('/listing/');
    if (p === '/helyi-vallalkozasok') return path === '/helyi-vallalkozasok' || path.startsWith('/helyi-vallalkozasok/') || path === '/vallalkozasom';
    if (p === '/forum') return path === '/forum' || path.startsWith('/forum/');
    if (p === '/donations') return path === '/donations' || path.startsWith('/donations/');
    return path === p || path.startsWith(p + '/');
  };

  const navTransparent = isHome && !scrolled;
  const pageSkin = getPageSkin(config, path);

  const NAV_LINKS = [
    { icon: ShoppingBag, label: 'Piactér',    path: '/search' },
    { icon: Gavel,       label: 'Licitek',    path: '/auctions' },
    { icon: Briefcase,   label: 'Állások',    path: '/jobs' },
    { icon: MapPin,      label: 'Helyi',      path: '/helyi-vallalkozasok' },
    { icon: Users,       label: 'Fórum',      path: '/forum' },
    { icon: Gift,        label: 'Adomány',    path: '/donations' },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/discover?q=${encodeURIComponent(searchQ.trim())}`);
  }

  return (
    <div className="min-h-screen text-zinc-100 relative" style={{ background: config.theme.background }} data-world-zone={activeZone?.id ?? 'hub'}>

      <WorldEffects />
      <WorldAmbientLayer zone={activeZone} />

      {showEntryGate && isHome && (
        <WorldEntryGate onEnter={() => setShowEntryGate(false)} />
      )}

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
        <div className="flex items-center gap-2 sm:gap-3 min-h-[64px] h-auto py-2 min-w-0 w-full">

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

          {/* Center search — referencia layout */}
          <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-2xl hidden sm:block mx-2 lg:mx-6">
            <div className="relative flex items-center rounded-2xl overflow-hidden piac-nav-search transition-all duration-300">
              <div className="w-10 h-10 flex-shrink-0 ml-1.5 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.22)' }}>
                <Sparkles className="w-4 h-4 text-[#00E676]" />
              </div>
              <div className="flex-1 flex flex-col px-3 py-1.5 min-w-0">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#00E676]/70">Mit keresel ma?</span>
                <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder={config.nav.searchPlaceholder}
                  data-piac-edit="nav.searchPlaceholder"
                  className="bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none leading-tight w-full min-w-0" />
              </div>
              <button type="submit" className="flex-shrink-0 m-1.5 w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #00E676, #00C853)', boxShadow: '0 0 20px rgba(0,230,118,0.4)' }}>
                <Search className="w-4 h-4 text-[#0B0F14]" />
              </button>
            </div>
          </form>

          {/* Right side auth */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
            {user ? (
              <>
                <button onClick={() => navigate('/messages')} className="relative p-2.5 rounded-xl hover:bg-white/[0.05] transition-all">
                  <MessageCircle className="w-5 h-5 text-zinc-400" />
                  {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                <button onClick={() => navigate(`/profile/${user.id}`)} className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all">
                  <User className="w-5 h-5 text-zinc-400" />
                </button>
                <button onClick={() => navigate('/create')}
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #00d084, #059669)', color: '#07111f', boxShadow: '0 0 16px rgba(0,208,132,0.3)' }}>
                  <PlusCircle className="w-4 h-4" />Hirdetés
                </button>
                <button onClick={signOut} className="hidden md:flex p-2.5 rounded-xl hover:bg-white/[0.05] transition-all" aria-label="Kilépés">
                  <LogOut className="w-4.5 h-4.5 text-zinc-500" style={{ width: '1.1rem', height: '1.1rem' }} />
                </button>
              </>
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

            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all flex-shrink-0" aria-label="Menü">
              {mobileOpen ? <X className="w-5 h-5 text-zinc-300" /> : <Menu className="w-5 h-5 text-zinc-400" />}
            </button>
          </div>
        </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative flex items-center rounded-xl"
            style={{ background: 'rgba(13,27,42,0.8)', border: '1px solid rgba(0,208,132,0.15)' }}>
            <Search className="absolute left-3 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Keresés..." className="w-full bg-transparent pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none" />
          </form>
        </div>

        {/* Slide-out menu — mobil + asztali (referencia hamburger) */}
        {mobileOpen && (
          <div className="border-t max-h-[calc(100vh-80px)] overflow-y-auto"
            style={{ background: 'rgba(11,15,20,0.98)', borderTopColor: 'rgba(0,230,118,0.12)', backdropFilter: 'blur(24px)' }}>
            <nav className="p-4 space-y-4">
              <WorldZoneHub compact onNavigate={() => setMobileOpen(false)} />
              <div className="border-t border-white/10 pt-3 space-y-1.5">
              {[{ icon: User, label: user ? 'Profil' : 'Bejelentkezés', path: user ? `/profile/${user.id}` : '/login' }].map(item => (
                <button key={item.path} onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(item.path) ? 'glass-pill-active text-[#00d084]' : 'glass-pill text-zinc-400'}`}>
                  <item.icon className="w-5 h-5" />{item.label}
                </button>
              ))}
              <MobileDefenseAccordion onNavigate={p => { navigate(p); setMobileOpen(false); }} isActive={isActive('/vedelem')} />
              {profile?.is_admin && (
                <button onClick={() => { navigate('/admin'); setMobileOpen(false); }}
                  className={`relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/admin') ? 'glass-pill-active text-[#00E676]' : 'glass-pill text-zinc-400'}`}>
                  <Shield className="w-5 h-5" />
                  Adminisztráció
                  {pendingApps > 0 && (
                    <span className="ml-auto w-5 h-5 bg-amber-500 text-zinc-900 text-[10px] font-black rounded-full flex items-center justify-center">
                      {pendingApps > 9 ? '9+' : pendingApps}
                    </span>
                  )}
                </button>
              )}
              {user && (
                <>
                  <button onClick={() => { navigate('/messages'); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium glass-pill text-zinc-400">
                    <span className="relative"><MessageCircle className="w-5 h-5" />
                      {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </span>Üzenetek
                  </button>
                  <button onClick={() => { navigate('/create'); setMobileOpen(false); }}
                    className="w-full py-3 rounded-xl text-sm font-bold text-zinc-900"
                    style={{ background: 'linear-gradient(135deg, #00d084, #059669)' }}>
                    + Hirdetés feladása
                  </button>
                  <button onClick={() => { signOut(); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium glass-pill text-zinc-400 hover:text-red-400">
                    <LogOut className="w-5 h-5" />Kilépés
                  </button>
                </>
              )}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { navigate('/register'); setMobileOpen(false); }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-zinc-900"
                    style={{ background: 'linear-gradient(135deg, #00d084, #059669)' }}>Regisztráció</button>
                  <button onClick={() => { navigate('/login'); setMobileOpen(false); }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#00d084]"
                    style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)' }}>Belépés</button>
                </div>
              )}
              </div>
            </nav>
          </div>
        )}
      </header>

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
      <main className={`relative z-10 py-0 pb-24 md:pb-10 ${showDevStudio ? 'pb-28' : ''} ${!isHome ? 'piac-page-shell world-page-shell' : ''}`}
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-bottom">
        <div className="flex items-center h-[64px] px-1 pb-safe">
          <div className="flex items-center justify-around w-full px-1">
            {[
              { icon: ShoppingBag, label: 'Piactér',  path: '/search' },
              { icon: Gavel,       label: 'Licitek',  path: '/auctions' },
              { icon: Briefcase,   label: 'Állások',  path: '/jobs' },
              { icon: Users,       label: 'Fórum',    path: '/forum' },
              { icon: Gift,        label: 'Adomány',  path: '/donations' },
              { icon: User,        label: user ? 'Profil' : 'Belépés', path: user ? `/profile/${user.id}` : '/login' },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all flex-shrink-0 min-w-[48px] ${isActive(item.path) ? 'glass-pill-active text-[#00d084]' : 'text-zinc-500'}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            ))}
            {user && (
              <button onClick={() => navigate('/messages')}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all flex-shrink-0 min-w-[48px] relative ${isActive('/messages') ? 'glass-pill-active text-[#00d084]' : 'text-zinc-500'}`}>
                <span className="relative">
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </span>
                <span className="text-[9px] font-medium">Üzenet</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <ChatWidget />
      <DeveloperModeBar />
      <InlineDevEditor />
      <AIWorldGuide />
    </div>
  );
}
