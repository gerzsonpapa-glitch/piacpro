import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

type View = 'login' | 'forgot' | 'forgot-sent';

export default function LoginPage() {
  const { signIn } = useAuth();
  const { navigate } = useRouter();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/');
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError('Hiba történt. Ellenőrizd az email címet.');
    } else {
      setView('forgot-sent');
    }
  }

  if (view === 'forgot-sent') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="glass rounded-3xl p-8 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">E-mail elküldve!</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Ha ez az email cím regisztrálva van, küldtünk egy jelszó-visszaállítási linket a következő címre:
            </p>
            <p className="text-emerald-400 font-medium text-sm">{resetEmail}</p>
            <p className="text-zinc-500 text-xs">Ellenőrizd a spam mappát is.</p>
            <button
              onClick={() => { setView('login'); setResetEmail(''); }}
              className="w-full py-3 glass-pill-active text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.01] mt-2"
            >
              Vissza a bejelentkezéshez
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 glass-bubble rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">Elfelejtett jelszó</h1>
            <p className="text-zinc-400 mt-1 text-sm">Add meg az email címed, küldünk egy visszaállítási linket</p>
          </div>

          <form onSubmit={handleForgotSubmit} className="space-y-4 glass rounded-3xl p-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">E-mail cím</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
                  placeholder="te@email.hu"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 glass-pill-active text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? 'Küldés...' : 'Jelszó-visszaállítás küldése'}
            </button>
          </form>

          <p className="text-center text-zinc-400 text-sm mt-6">
            <button
              onClick={() => { setView('login'); setError(''); }}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />Vissza a bejelentkezéshez
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 glass-bubble rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold">Üdv újra!</h1>
          <p className="text-zinc-400 mt-1">Jelentkezz be a fiókodba</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 glass rounded-3xl p-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
                placeholder="te@email.hu"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-zinc-300">Jelszó</label>
              <button
                type="button"
                onClick={() => { setView('forgot'); setError(''); setResetEmail(email); }}
                className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
              >
                Elfelejtett jelszó?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-11 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 glass-pill-active text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50"
          >
            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm mt-6">
          Nincs fiókod?{' '}
          <button onClick={() => navigate('/register')} className="text-emerald-400 hover:text-emerald-300 font-medium">
            Regisztrálj itt
          </button>
        </p>
      </div>
    </div>
  );
}
