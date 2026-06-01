import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import {
  Search, MessageCircle, User, Menu, X, LogOut, ShoppingBag, Gavel, Shield, Briefcase,
  Gift, MapPin, Users, ChevronDown, TrendingUp, Baby, Percent, Building2, Lock,
  Heart, ArrowRight, Car, Globe, Bell, PlusCircle, Home,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import ChatWidget from './ChatWidget';
import Footer from './Footer';
import { DEFENSE_LINKS } from '../pages/VedelemPage';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingApps, setPendingApps] = useState(0);
  const [defenseOpen, setDefenseOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [pageKey, setPageKey] = useState(path);
  const defenseRef = useRef<HTMLDivElement>(null);
  const isHome = path === '/';

  useEffect(() => {
    setPageKey(path);
  }, [path]);

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
    <div className="min-h-screen text-zinc-100" style={{ background: '#07111f' }}>

      {/* Ambient city glow layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 left-[10%] w-[800px] h-[500px] rounded-full blur-[180px]" style={{ background: 'rgba(0,208,132,0.032)', transform: 'rotate(-15deg)' }} />
        <div className="absolute top-[30%] right-[5%] w-[600px] h-[400px] rounded-full blur-[160px]" style={{ background: 'rgba(59,130,246,0.025)' }} />
        <div className="absolute bottom-0 left-[30%] w-[700px] h-[350px] rounded-full blur-[150px]" style={{ background: 'rgba(0,208,132,0.022)' }} />
        <div className="absolute top-[60%] left-[5%] w-[400px] h-[300px] rounded-full blur-[140px]" style={{ background: 'rgba(168,85,247,0.015)' }} />
      </div>

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
        <div className="max-w-[1440px] mx-auto px-4 h-[68px] flex items-center gap-3">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 breathe-green"
              style={{ background: 'rgba(0,208,132,0.12)', border: '1px solid rgba(0,208,132,0.3)' }}>
              <ShoppingBag className="w-5 h-5 text-[#00d084]" />
            </div>
            <div className="hidden sm:block leading-none">
              <div className="text-[18px] font-black tracking-tight" style={{ color: '#fff' }}>
                Piac<span style={{ color: '#00d084', textShadow: '0 0 16px rgba(0,208,132,0.6)' }}>Pro</span>
              </div>
              <div className="text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: 'rgba(0,208,132,0.55)' }}>Magyar Közösségi Piactér</div>
            </div>
          </button>

          {/* Center search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block mx-4">
            <div className="relative flex items-center rounded-2xl overflow-hidden transition-all duration-300 hover:border-[rgba(0,208,132,0.3)] focus-within:border-[rgba(0,208,132,0.42)] focus-within:shadow-[0_0_0_3px_rgba(0,208,132,0.08),0_0_28px_rgba(0,208,132,0.07)]"
              style={{ background: 'rgba(10,22,38,0.82)', border: '1px solid rgba(0,208,132,0.16)', backdropFilter: 'blur(20px)' }}>
              <div className="w-10 h-10 flex-shrink-0 ml-1 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.2)' }}>
                <span className="text-base" style={{ color: '#00d084' }}>✦</span>
              </div>
              <div className="flex-1 flex flex-col px-3 py-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(0,208,132,0.65)' }}>Mit keresel ma?</span>
                <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Keress hirdetést, munkát, boltot, szolgáltatást..."
                  className="bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none leading-tight" />
              </div>
              <button type="submit" className="flex-shrink-0 m-1.5 w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #00d084, #059669)', boxShadow: '0 0 20px rgba(0,208,132,0.45)' }}>
                <Search className="w-4 h-4 text-zinc-900" />
              </button>
            </div>
          </form>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  isActive(item.path) ? 'glass-pill-active text-[#00d084]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}>
                <item.icon className="w-3.5 h-3.5" />{item.label}
              </button>
            ))}

            {/* Defense dropdown */}
            <div ref={defenseRef} className="relative" onMouseLeave={() => setDefenseOpen(false)}>
              <button onMouseEnter={() => setDefenseOpen(true)} onClick={() => navigate('/vedelem')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  isActive('/vedelem') ? 'glass-pill-active text-[#00d084]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}>
                <Shield className="w-3.5 h-3.5" />Védelem
                <ChevronDown className={`w-3 h-3 transition-transform ${defenseOpen ? 'rotate-180' : ''}`} />
              </button>
              {defenseOpen && <DefenseDropdown onClose={() => setDefenseOpen(false)} />}
            </div>

            {profile?.is_admin && (
              <button onClick={() => navigate('/admin')}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  isActive('/admin') ? 'glass-pill-active text-[#00d084]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}>
                <span className="relative">
                  <Shield className="w-3.5 h-3.5" />
                  {pendingApps > 0 && <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 text-zinc-900 text-[9px] font-black rounded-full flex items-center justify-center">{pendingApps > 9 ? '9+' : pendingApps}</span>}
                </span>
                Admin
              </button>
            )}
          </nav>

          {/* Right side auth */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
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
                <button onClick={() => navigate('/register')}
                  className="hidden sm:flex px-4 py-2 rounded-xl text-sm font-bold text-zinc-900 transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #00d084, #059669)', boxShadow: '0 0 16px rgba(0,208,132,0.3)' }}>
                  Regisztráció
                </button>
                <button onClick={() => navigate('/login')}
                  className="hidden sm:flex px-4 py-2 rounded-xl text-sm font-semibold text-[#00d084] transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)' }}>
                  Bejelentkezés
                </button>
              </>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all" aria-label="Menü">
              {mobileOpen ? <X className="w-5 h-5 text-zinc-300" /> : <Menu className="w-5 h-5 text-zinc-400" />}
            </button>
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

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t max-h-[calc(100vh-80px)] overflow-y-auto"
            style={{ background: 'rgba(7,17,31,0.98)', borderTopColor: 'rgba(0,208,132,0.12)', backdropFilter: 'blur(20px)' }}>
            <nav className="p-4 space-y-1.5">
              {[...NAV_LINKS, { icon: User, label: user ? 'Profil' : 'Bejelentkezés', path: user ? `/profile/${user.id}` : '/login' }].map(item => (
                <button key={item.path} onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(item.path) ? 'glass-pill-active text-[#00d084]' : 'glass-pill text-zinc-400'}`}>
                  <item.icon className="w-5 h-5" />{item.label}
                </button>
              ))}
              <MobileDefenseAccordion onNavigate={p => { navigate(p); setMobileOpen(false); }} isActive={isActive('/vedelem')} />
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
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main key={pageKey} className="relative z-10 py-0 pb-24 md:pb-10 page-enter">{children}</main>

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
    </div>
  );
}
