import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import {
  Home, Search, MessageCircle, User, Menu, X, LogOut, ShoppingBag, Gavel, Shield, Briefcase,
  Gift, MapPin, Users, ChevronDown, TrendingUp, Baby, Percent, Building2, Lock, Heart, ArrowRight, Car, Globe,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import ChatWidget from './ChatWidget';
import Footer from './Footer';
import { DEFENSE_LINKS } from '../pages/VedelemPage';

const DEFENSE_ITEMS = [
  { key: 'nyugdij' as const,              icon: TrendingUp, label: 'Nyugdíj-előtakarékosság',           desc: 'Hosszú távú megtakarítás, adókedvezmény' },
  { key: 'gyermek' as const,              icon: Baby,       label: 'Gyermekjövő',                       desc: 'Gyermek megtakarítás, tanulmány, indulás' },
  { key: 'vagyon' as const,               icon: TrendingUp, label: 'Vagyon felépítése',                 desc: 'Megtakarítás, hosszú távú vagyonépítés' },
  { key: 'hitel' as const,               icon: Home,       label: 'Hiteltermékek & állami támogatások', desc: 'CSOK, lakáshitel, hitelkiváltás' },
  { key: 'ado' as const,                 icon: Percent,    label: 'Adókedvezmények & visszatérítések', desc: 'Adóvisszatérítés, pénzügyi optimalizálás' },
  { key: 'kkv' as const,                 icon: Building2,  label: 'KKV megoldások',                    desc: 'Vállalkozásvédelem, cégbiztosítás' },
  { key: 'vagyonvedelem' as const,       icon: Lock,       label: 'Vagyonvédelem',                     desc: 'Lakásbiztosítás, ingatlanvédelem' },
  { key: 'elethelyzet' as const,         icon: Heart,      label: 'Biztonság bármely élethelyzetben',  desc: 'Életbiztosítás, családi védelem' },
  { key: 'gepjarmu_kgfb' as const,       icon: Car,        label: 'Online gépjármű biztosítás',        desc: 'KGFB kötés, gyors online ügyintézés' },
  { key: 'gepjarmu_asszisztencia' as const, icon: Car,     label: 'Online gépjármű asszisztencia',     desc: 'Út közbeni segítség, műszaki asszisztencia' },
  { key: 'utasbiztositas' as const,      icon: Globe,      label: 'Online utasbiztosítás',             desc: 'Utazási védelem, külföldi biztosítás' },
  { key: 'csatlakozas' as const,         icon: Users,      label: 'Csatlakozzon tanácsadóként',        desc: 'Pénzügyi karrier, csatlakozási lehetőség' },
];

function DefenseDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 w-[880px] max-w-[calc(100vw-2rem)] z-50"
      style={{ paddingTop: '8px' }}
    >
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0d1520 0%, #0a1018 100%)',
          border: '1px solid rgba(255,255,255,0.11)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}>

        {/* Top accent line */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.6) 30%, rgba(16,185,129,0.8) 50%, rgba(52,211,153,0.6) 70%, transparent 100%)' }} />

        <div className="p-5 grid grid-cols-3 gap-0.5">
          {DEFENSE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.key}
                href={DEFENSE_LINKS[item.key]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200 group"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(52,211,153,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(52,211,153,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                style={{ border: '1px solid transparent' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:scale-110"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.18)' }}>
                  <Icon className="w-4 h-4" style={{ color: '#34d399' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-tight transition-colors group-hover:text-emerald-300" style={{ color: '#e2e8f0' }}>{item.label}</p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#4b6280' }}>{item.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" style={{ color: '#34d399' }} />
              </a>
            );
          })}
        </div>

        <div className="px-5 py-3.5 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.055)', background: 'rgba(0,0,0,0.25)' }}>
          <p className="text-[11px]" style={{ color: '#3d5068' }}>
            Minden út <span style={{ color: '#94a3b8', fontWeight: 600 }}>Ákom László Zsolt OVB fiókvezető</span>höz vezet
          </p>
          <a href={DEFENSE_LINKS.default} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="text-[11px] font-semibold flex items-center gap-1.5 transition-all hover:gap-2 duration-200"
            style={{ color: '#34d399' }}>
            Profil megtekintése <ArrowRight className="w-3 h-3" />
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
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
          isActive ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 glass-pill'
        }`}
      >
        <Shield className="w-5 h-5" />
        Védelem
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-emerald-500/20 pl-3">
          {DEFENSE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.key}
                href={DEFENSE_LINKS[item.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all"
              >
                <Icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {item.label}
              </a>
            );
          })}
          <button
            onClick={() => onNavigate('/vedelem')}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            Összes kategória <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, unreadCount } = useAuth();
  const { navigate, path } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingProducerApps, setPendingProducerApps] = useState(0);
  const [defenseOpen, setDefenseOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const defenseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!profile?.is_admin && !profile?.is_super_admin) return;
    fetchPendingApps();

    const channel = supabase
      .channel('layout-producer-apps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'producer_applications' }, () => {
        fetchPendingApps();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.is_admin, profile?.is_super_admin]);

  async function fetchPendingApps() {
    const { count } = await supabase
      .from('producer_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingProducerApps(count ?? 0);
  }

  const navItems = user
    ? [
        { icon: Home, label: 'Kezdőlap', path: '/' },
        { icon: ShoppingBag, label: 'Piactér', path: '/search' },
        { icon: Gavel, label: 'Licitek', path: '/auctions' },
        { icon: MapPin, label: 'Helyi', path: '/helyi-vallalkozasok' },
        { icon: Briefcase, label: 'Állások', path: '/jobs' },
        { icon: Users, label: 'Fórum', path: '/forum' },
        { icon: Gift, label: 'Adományozás', path: '/donations' },
        { icon: User, label: 'Profil', path: `/profile/${user.id}` },
      ]
    : [
        { icon: Home, label: 'Kezdőlap', path: '/' },
        { icon: ShoppingBag, label: 'Piactér', path: '/search' },
        { icon: Gavel, label: 'Licitek', path: '/auctions' },
        { icon: MapPin, label: 'Helyi', path: '/helyi-vallalkozasok' },
        { icon: Briefcase, label: 'Állások', path: '/jobs' },
        { icon: Users, label: 'Fórum', path: '/forum' },
        { icon: Gift, label: 'Adományozás', path: '/donations' },
        { icon: User, label: 'Bejelentkezés', path: '/login' },
      ];

  const isActive = (p: string) => {
    if (p === '/') return path === '/';
    if (p === '/search') return path === '/search' || path.startsWith('/listing/');
    if (p === '/shops') return path === '/shops' || path.startsWith('/shops/') || path === '/my-shop';
    if (p === '/producers') return path === '/producers' || path.startsWith('/producers/');
    if (p === '/helyi-vallalkozasok') return path === '/helyi-vallalkozasok' || path.startsWith('/helyi-vallalkozasok/') || path === '/vallalkozasom' || path === '/vallalkozas-regisztracio';
    if (p === '/forum') return path === '/forum' || path.startsWith('/forum/');
    if (p === '/donations') return path === '/donations' || path.startsWith('/donations/');
    return path === p || path.startsWith(p + '/');
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.025] rounded-full blur-[130px]" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-teal-500/[0.018] rounded-full blur-[110px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/[0.015] rounded-full blur-[110px]" />
      </div>

      {/* Top Navigation */}
      <header
        className="sticky top-0 z-50 glass-nav transition-all duration-300"
        style={scrolled ? { borderBottomColor: 'rgba(255,255,255,0.08)' } : {}}
      >
        <div className="max-w-7xl mx-auto px-4 h-[60px] flex items-center justify-between gap-2">
          {/* Logo */}
          <button onClick={() => navigate('/')} aria-label="PiacPro főoldal" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity duration-200 flex-shrink-0">
            <div className="w-8 h-8 glass-bubble rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block select-none">
              Piac<span className="text-emerald-400">Pro</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'glass-pill-active text-emerald-300'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}

            {/* Védelem dropdown */}
            <div ref={defenseRef} className="relative" onMouseLeave={() => setDefenseOpen(false)}>
              <button
                onMouseEnter={() => setDefenseOpen(true)}
                onClick={() => navigate('/vedelem')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive('/vedelem')
                    ? 'glass-pill-active text-emerald-300'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Védelem
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${defenseOpen ? 'rotate-180' : ''}`} />
              </button>
              {defenseOpen && <DefenseDropdown onClose={() => setDefenseOpen(false)} />}
            </div>

            {/* Admin link */}
            {user && profile?.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive('/admin') ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                }`}
              >
                <span className="relative">
                  <Shield className="w-3.5 h-3.5" />
                  {pendingProducerApps > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {pendingProducerApps > 9 ? '9+' : pendingProducerApps}
                    </span>
                  )}
                </span>
                Admin
              </button>
            )}

            {/* Messages */}
            {user && (
              <button
                onClick={() => navigate('/messages')}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive('/messages') || isActive('/chat') ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                }`}
              >
                <span className="relative">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                Üzenetek
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <button
                onClick={signOut}
                aria-label="Kijelentkezés"
                className="hidden md:flex items-center gap-1.5 glass-pill px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-[13px] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Kilépés
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 glass-bubble rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-white/[0.05] max-h-[calc(100vh-60px)] overflow-y-auto">
            <nav className="p-4 space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive(item.path) ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 glass-pill'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}

              <MobileDefenseAccordion onNavigate={(p) => { navigate(p); setMobileMenuOpen(false); }} isActive={isActive('/vedelem')} />

              {user && (
                <>
                  {profile?.is_admin && (
                    <button
                      onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        isActive('/admin') ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 glass-pill'
                      }`}
                    >
                      <span className="relative">
                        <Shield className="w-5 h-5" />
                        {pendingProducerApps > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {pendingProducerApps > 9 ? '9+' : pendingProducerApps}
                          </span>
                        )}
                      </span>
                      Admin
                      {pendingProducerApps > 0 && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                          {pendingProducerApps} termelői kérelem
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => { navigate('/messages'); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      isActive('/messages') ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 glass-pill'
                    }`}
                  >
                    <span className="relative">
                      <MessageCircle className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </span>
                    Üzenetek
                  </button>
                  <button
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-zinc-400 hover:text-red-400 glass-pill transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    Kilépés
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-6 md:py-8 pb-24 md:pb-10">
        {children}
      </main>

      <Footer />

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-bottom">
        <div className="flex items-center h-[64px] px-1 pb-safe overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-around w-full min-w-max px-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all duration-200 flex-shrink-0 min-w-[52px] ${
                  isActive(item.path) ? 'glass-pill-active text-emerald-300' : 'text-zinc-500'
                }`}
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[9px] font-medium leading-tight">{item.label}</span>
              </button>
            ))}
            {user && (
              <button
                onClick={() => navigate('/messages')}
                aria-label={unreadCount > 0 ? `Üzenetek — ${unreadCount} olvasatlan` : 'Üzenetek'}
                aria-current={isActive('/messages') ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all duration-200 flex-shrink-0 min-w-[52px] relative ${
                  isActive('/messages') || isActive('/chat') ? 'glass-pill-active text-emerald-300' : 'text-zinc-500'
                }`}
              >
                <span className="relative">
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-medium leading-tight">Üzenetek</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <ChatWidget />
    </div>
  );
}
