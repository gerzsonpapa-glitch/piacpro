import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { ShoppingBag, Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie');
      return;
    }
    setLoading(true);
    const { error, needsConfirmation } = await signUp(email, password, username, fullName);
    if (error) {
      setError(
        error === 'User already registered'
          ? 'Ez az email cím már regisztrálva van'
          : error
      );
      setLoading(false);
    } else if (needsConfirmation) {
      setConfirming(true);
      setLoading(false);
    } else {
      navigate('/');
    }
  }

  if (confirming) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100 mb-2">Erősítsd meg az email címed</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Elküldtünk egy megerősítő linket a{' '}
                <span className="text-zinc-200 font-medium">{email}</span>{' '}
                címre. Kattints a levélben lévő linkre a regisztráció befejezéséhez.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-xs">Ha nem látod a levelet, nézd meg a spam mappát is.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 glass-pill-active text-emerald-300 font-semibold rounded-xl transition-all hover:scale-[1.01]"
            >
              Bejelentkezés
            </button>
          </div>
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
          <h1 className="text-2xl font-bold">Csatlakozz!</h1>
          <p className="text-zinc-400 mt-1">Hozd létre a fiókod</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 glass rounded-3xl p-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Teljes név</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
                placeholder="Kovács János"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Felhasználónév</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
                placeholder="janos123"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
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
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Jelszó</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
            {loading ? 'Regisztráció...' : 'Regisztráció'}
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm mt-6">
          Már van fiókod?{' '}
          <button onClick={() => navigate('/login')} className="text-emerald-400 hover:text-emerald-300 font-medium">
            Jelentkezz be
          </button>
        </p>
      </div>
    </div>
  );
}
