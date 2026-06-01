import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X, Crown, MessageCircle, Gavel, Leaf, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { translateMessage } from '../lib/hu';
import { formatPrice } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'outbid' | 'winner' | 'message' | 'auction_end' | 'producer_app';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  href?: string;
}

interface NotificationContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number, href?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration ?? 5000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [toast.id, toast.duration, onRemove]);

  const dismiss = () => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); };

  const configs: Record<ToastType, { bg: string; border: string; icon: React.ElementType; iconCls: string }> = {
    success: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: CheckCircle, iconCls: 'text-emerald-400' },
    error: { bg: 'bg-red-500/15', border: 'border-red-500/30', icon: AlertCircle, iconCls: 'text-red-400' },
    info: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', icon: Info, iconCls: 'text-blue-400' },
    outbid: { bg: 'bg-red-500/15', border: 'border-red-500/30', icon: AlertCircle, iconCls: 'text-red-400' },
    winner: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: Crown, iconCls: 'text-amber-400' },
    message: { bg: 'bg-emerald-500/12', border: 'border-emerald-500/25', icon: MessageCircle, iconCls: 'text-emerald-400' },
    auction_end: { bg: 'bg-zinc-700/60', border: 'border-zinc-500/30', icon: Gavel, iconCls: 'text-zinc-300' },
    producer_app: { bg: 'bg-emerald-500/12', border: 'border-emerald-500/25', icon: Leaf, iconCls: 'text-emerald-400' },
  };

  const cfg = configs[toast.type];
  const Icon = cfg.icon;

  const handleClick = () => {
    if (toast.href) {
      window.history.pushState({}, '', toast.href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    dismiss();
  };

  return (
    <div
      onClick={toast.href ? handleClick : undefined}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 max-w-sm w-full ${cfg.bg} ${cfg.border} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${toast.href ? 'cursor-pointer hover:brightness-110' : ''}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.iconCls}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100 leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
        {toast.href && (
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-0.5 font-medium">
            Megnyitás <ChevronRight className="w-3 h-3" />
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        className="flex-shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number, href?: string) => {
    const id = `toast-${++counterRef.current}`;
    const huMessage = message ? translateMessage(message) : undefined;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message: huMessage, duration, href }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Global watchers — auction wins + admin producer application alerts
  useEffect(() => {
    let userId: string | null = null;
    let isAdmin = false;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_super_admin')
        .eq('id', user.id)
        .maybeSingle();
      isAdmin = !!(profile?.is_admin || profile?.is_super_admin);

      const channel = supabase
        .channel('global-notifications')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
        }, (payload) => {
          if (!userId) return;
          const updated = payload.new as { status: string; winner_id: string | null; current_price: number };
          if (updated.status !== 'ended' && updated.status !== 'sold') return;
          if (updated.winner_id === userId) {
            showToast('winner', 'Gratulalunk! Nyerted az aukciót!', `Nyero ajanlat: ${formatPrice(updated.current_price)}`, 12000);
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'producer_applications',
        }, () => {
          if (!isAdmin) return;
          showToast('producer_app', 'Új termelői igénylés', 'Kattints a kérelem elbírálásához.', 12000, '/admin?tab=producers');
        })
        .subscribe();

      return channel;
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;
    init().then((ch) => { if (ch) channel = ch; });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      userId = session?.user?.id ?? null;
      if (!userId) isAdmin = false;
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [showToast]);

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
