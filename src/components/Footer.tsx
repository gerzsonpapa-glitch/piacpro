import { useRouter } from '../lib/router';
import { ShoppingBag, ScrollText, Shield, Mail, Heart, Phone, Users } from 'lucide-react';

export default function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="relative z-10 border-t border-white/5 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
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
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Kapcsolat</p>
            <ul className="space-y-2.5">
              <li className="text-zinc-400 text-sm font-medium">Vörös Gergely Richárd</li>
              <li>
                <a href="tel:+36301725181"
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />+36 30 172 5181
                </a>
              </li>
              <li>
                <a href="mailto:gerzsonpapa@gmail.com"
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />gerzsonpapa@gmail.com
                </a>
              </li>
              <li className="pt-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-2">Facebook csoportok</p>
                <ul className="space-y-1.5">
                  <li>
                    <a href="https://www.facebook.com/groups/391889140975247" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-400 text-sm transition-colors">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Adok-veszek <span className="text-zinc-600">(19 ezer tag)</span></span>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.facebook.com/groups/175432696584567" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-400 text-sm transition-colors">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Állás hirdetések <span className="text-zinc-600">(40 ezer tag)</span></span>
                    </a>
                  </li>
                </ul>
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
