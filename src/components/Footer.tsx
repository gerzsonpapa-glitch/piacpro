import { useRouter } from '../lib/router';
import { ShoppingBag, ScrollText, Shield, Mail, Heart } from 'lucide-react';

export default function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="relative z-10 border-t border-white/5 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 mb-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 glass-bubble rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Piac<span className="text-emerald-400">Pro</span>
              </span>
            </button>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Magyarország modern közösségi piactere. Add el, vedd meg — egyszerűen, biztonságosan, gyorsan.
            </p>
          </div>

          {/* Platform */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Platform</p>
            <ul className="space-y-2">
              {[
                { label: 'Hirdetések', path: '/search' },
                { label: 'Licitek', path: '/auctions' },
                { label: 'Hirdetés feladása', path: '/create' },
                { label: 'Regisztráció', path: '/register' },
              ].map((item) => (
                <li key={item.path}>
                  <button onClick={() => navigate(item.path)}
                    className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Információ</p>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate('/rules')}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  <ScrollText className="w-3.5 h-3.5" />Felhasználási szabályzat
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/rules')}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  <Shield className="w-3.5 h-3.5" />Adatvédelem
                </button>
              </li>
              <li>
                <a href="mailto:support@piacpro.hu"
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  <Mail className="w-3.5 h-3.5" />Kapcsolat
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-600 text-xs">© 2026 PiacPro. Minden jog fenntartva.</p>
          <p className="text-zinc-700 text-xs flex items-center gap-1">
            Készült <Heart className="w-3 h-3 text-red-500/60" /> Magyarországon
          </p>
        </div>
      </div>
    </footer>
  );
}
