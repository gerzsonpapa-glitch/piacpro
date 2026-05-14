import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import {
  Home, Search, PlusCircle, Heart, MessageCircle, User, Menu, X, LogOut, ShoppingBag, Gavel, Shield, Briefcase
} from 'lucide-react';
import { useState } from 'react';
import ChatWidget from './ChatWidget';
import Footer from './Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, unreadCount } = useAuth();
  const { navigate, path } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = user
    ? [
        { icon: Home, label: 'Kezdőlap', path: '/' },
        { icon: ShoppingBag, label: 'Piactér', path: '/search' },
        { icon: Gavel, label: 'Licitek', path: '/auctions' },
        { icon: Briefcase, label: 'Állások', path: '/jobs' },
        { icon: PlusCircle, label: 'Hirdetés', path: '/create' },
        { icon: Heart, label: 'Kedvencek', path: '/favorites' },
        { icon: User, label: 'Profil', path: `/profile/${user.id}` },
      ]
    : [
        { icon: Home, label: 'Kezdőlap', path: '/' },
        { icon: ShoppingBag, label: 'Piactér', path: '/search' },
        { icon: Gavel, label: 'Licitek', path: '/auctions' },
        { icon: Briefcase, label: 'Állások', path: '/jobs' },
        { icon: User, label: 'Bejelentkezés', path: '/login' },
      ];

  const isActive = (p: string) => {
    if (p === '/') return path === '/';
    if (p === '/search') return path === '/search' || path.startsWith('/listing/');
    return path === p || path.startsWith(p + '/');
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-teal-500/[0.02] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 glass-bubble rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">
              Piac<span className="text-emerald-400">Pro</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.path) ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 glass-pill'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}

            {/* Admin link */}
            {user && profile?.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive('/admin') ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 glass-pill'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}

            {/* Messages button with badge */}
            {user && (
              <button
                onClick={() => navigate('/messages')}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive('/messages') || isActive('/chat') ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 glass-pill'
                }`}
              >
                <span className="relative">
                  <MessageCircle className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                Üzenetek
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={signOut}
                className="hidden md:flex items-center gap-2 glass-pill px-4 py-2 rounded-2xl text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Kilépés
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 glass-bubble rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-white/5">
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
              {user && (
                <>
                  {profile?.is_admin && (
                    <button
                      onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        isActive('/admin') ? 'glass-pill-active text-emerald-300' : 'text-zinc-400 hover:text-zinc-200 glass-pill'
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                      Admin
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 pb-28 md:pb-6">
        {children}
      </main>

      <Footer />

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-bottom">
        <div className="flex items-center justify-around h-20 px-1 pb-2 pt-1">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all duration-200 ${
                isActive(item.path) ? 'glass-pill-active text-emerald-300' : 'text-zinc-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          ))}
          {user && (
            <button
              onClick={() => navigate('/messages')}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all duration-200 relative ${
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
              <span className="text-[9px] font-medium">Üzenetek</span>
            </button>
          )}
        </div>
      </nav>

      {/* Global Chat Widget (popup) */}
      <ChatWidget />
    </div>
  );
}
