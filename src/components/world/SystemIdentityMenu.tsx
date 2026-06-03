import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MessageCircle, Shield, LogOut, PlusCircle, ChevronDown, Home, HelpCircle,
} from 'lucide-react';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';

export default function SystemIdentityMenu({
  pendingApps = 0,
}: {
  pendingApps?: number;
}) {
  const { user, profile, signOut, unreadCount } = useAuth();
  const { navigate, path } = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!user) return null;

  const profilePath = `/profile/${user.id}`;
  const isAdmin = profile?.is_admin || profile?.is_super_admin;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="world-identity-trigger flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-2xl transition-all hover:bg-white/[0.06]"
        aria-label="Rendszer menü"
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10">
          <User className="w-4 h-4 text-cyan-300" />
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform hidden sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="world-system-menu absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-[60] shadow-2xl"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs font-bold text-zinc-200 truncate">{profile?.full_name || profile?.username || 'Profil'}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
            </div>
            <div className="p-1.5">
              {[
                { icon: Home, label: 'Világ központ', action: () => navigate('/') },
                { icon: User, label: 'Profilom', action: () => navigate(profilePath) },
                { icon: MessageCircle, label: 'Üzenetek', action: () => navigate('/messages'), badge: unreadCount },
                { icon: PlusCircle, label: 'Hirdetés feladása', action: () => navigate('/create') },
                { icon: HelpCircle, label: 'Hogyan működik?', action: () => navigate('/hogyan-mukodik') },
                { icon: Shield, label: 'Védelem', action: () => navigate('/vedelem') },
                ...(isAdmin ? [{ icon: Shield, label: 'Admin vezérlő', action: () => navigate('/admin'), badge: pendingApps }] : []),
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => { item.action(); setOpen(false); }}
                  className={`world-system-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left ${
                    path === profilePath && item.label === 'Profilom' ? 'text-[#00E676] bg-[#00E676]/10' : 'text-zinc-300'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { signOut(); setOpen(false); }}
                className="world-system-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400/90 hover:text-red-300 mt-1"
              >
                <LogOut className="w-4 h-4" />
                Kilépés
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
