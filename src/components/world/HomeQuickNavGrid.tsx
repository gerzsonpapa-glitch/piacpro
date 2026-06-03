import { Compass, MessageCircle, Heart, User, PenLine } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';
import { PRIMARY_WORLD_ZONES, SECONDARY_WORLD_ZONES } from '../../lib/worldZones';

const EXTRA_LINKS = [
  { label: 'Keresés mindenhol', path: '/discover', icon: Compass, color: '#06B6D4', desc: 'Hirdetés, állás, bolt, termelő' },
  { label: 'Hirdetés AI', path: '/create?mode=ai', icon: PenLine, color: '#00C896', desc: 'PiacAI hirdetés (90 nap)' },
  { label: 'Üzenetek', path: '/messages', icon: MessageCircle, color: '#22D3EE', desc: 'Chat és kapcsolat' },
  { label: 'Kedvencek', path: '/favorites', icon: Heart, color: '#F472B6', desc: 'Mentett hirdetések' },
];

export default function HomeQuickNavGrid({ compact = false }: { compact?: boolean }) {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const zones = [...PRIMARY_WORLD_ZONES, ...SECONDARY_WORLD_ZONES];
  const extras = [
    ...EXTRA_LINKS,
    ...(user
      ? [{ label: 'Profilom', path: `/profile/${user.id}`, icon: User, color: '#FBBF24', desc: 'Fiók és hirdetéseim' }]
      : []),
  ];

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#00E676]/90 mb-1">
          Gyors elérés
        </p>
        <p className="text-sm text-zinc-400">Egy kattintás — bármelyik világ modul</p>
      </div>

      <div className={`grid gap-2.5 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
        {zones.map((z) => {
          const Icon = z.icon;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => navigate(z.path)}
              className="home-quick-nav-card group flex items-start gap-2.5 p-3 rounded-2xl text-left transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(7,17,31,0.45)',
                border: `1px solid ${z.border}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ background: z.bg, border: `1px solid ${z.border}` }}
              >
                <Icon className="w-4 h-4" style={{ color: z.color }} />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-black text-zinc-100 group-hover:text-white truncate">
                  {z.emoji} {z.title}
                </span>
                <span className="block text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{z.subtitle}</span>
              </span>
            </button>
          );
        })}
        {extras.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="home-quick-nav-card group flex items-start gap-2.5 p-3 rounded-2xl text-left transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(7,17,31,0.45)',
                border: `1px solid ${item.color}33`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
                style={{ background: `${item.color}18`, border: `1px solid ${item.color}44` }}
              >
                <Icon className="w-4 h-4" style={{ color: item.color }} />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-black text-zinc-100 truncate">{item.label}</span>
                <span className="block text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{item.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
