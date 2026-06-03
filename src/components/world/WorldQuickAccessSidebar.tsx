import {
  PlusCircle, Search, MessageCircle, Bell, Heart, User,
} from 'lucide-react';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';

const ITEMS = [
  { id: 'create', icon: PlusCircle, label: 'Hirdetés feladása', path: '/create', color: '#00E676' },
  { id: 'search', icon: Search, label: 'Keresés', path: '/discover', color: '#06B6D4' },
  { id: 'messages', icon: MessageCircle, label: 'Üzenetek', path: '/messages', color: '#22D3EE' },
  { id: 'notifications', icon: Bell, label: 'Értesítések', path: '/messages', color: '#A78BFA' },
  { id: 'favorites', icon: Heart, label: 'Kedvencek', path: '/favorites', color: '#F472B6' },
  { id: 'profile', icon: User, label: 'Profil', path: '/profile', color: '#FBBF24' },
];

export default function WorldQuickAccessSidebar() {
  const { navigate } = useRouter();
  const { user } = useAuth();

  return (
    <aside className="world-quick-sidebar piac-glass-panel p-4 flex flex-col gap-0.5 h-fit">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-3 px-1">
        Gyors elérés
      </p>
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const target = item.id === 'profile' && user ? `/profile/${user.id}` : item.path;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(target)}
            className="world-quick-item flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/[0.04] group"
          >
            <span
              className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105"
              style={{
                background: `${item.color}14`,
                border: `1px solid ${item.color}33`,
                boxShadow: `0 0 12px ${item.color}18`,
              }}
            >
              <Icon className="w-4 h-4" style={{ color: item.color }} />
            </span>
            <span className="text-[12px] font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">
              {item.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
