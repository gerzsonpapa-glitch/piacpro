import {
  Home, User, MessageCircle, PlusCircle, Shield, LayoutDashboard,
} from 'lucide-react';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeHeaderQuickNav({ compact = false }: { compact?: boolean }) {
  const { navigate, path } = useRouter();
  const { user, profile, unreadCount } = useAuth();

  if (!user) return null;

  const profilePath = `/profile/${user.id}`;
  const isAdmin = profile?.is_admin || profile?.is_super_admin;

  const items = [
    { icon: Home, label: 'Világ központ', path: '/', match: path === '/' },
    { icon: User, label: 'Profilom', path: profilePath, match: path === profilePath },
    { icon: MessageCircle, label: 'Üzenetek', path: '/messages', badge: unreadCount, match: path === '/messages' },
    { icon: PlusCircle, label: 'Hirdetés feladása', path: '/create', match: path === '/create' },
    { icon: Shield, label: 'Védelem', path: '/vedelem', match: path === '/vedelem' },
    ...(isAdmin
      ? [{ icon: LayoutDashboard, label: 'Admin vezérlő', path: '/admin', match: path === '/admin' }]
      : []),
  ];

  return (
    <nav
      className={`home-header-quick-nav flex items-center gap-1 flex-shrink-0 ${
        compact ? 'overflow-x-auto scrollbar-none max-w-full py-0.5' : 'hidden lg:flex'
      }`}
      aria-label="Gyors navigáció"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            title={item.label}
            className={`home-header-quick-nav__btn flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-colors ${
              item.match
                ? 'bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {!compact && <span>{item.label}</span>}
            {compact && <span className="sr-only">{item.label}</span>}
            {'badge' in item && item.badge ? (
              <span className="min-w-[1rem] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
