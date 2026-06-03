import { useEffect, useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';

export default function ResetPasswordPage() {
  const { navigate } = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        const { error: sessionError } = await supabase.auth.getSession();
        if (!cancelled && sessionError) setError('A visszaállító link lejárt vagy érvénytelen.');
      }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A jelszó legalább 6 karakter legyen.');
      return;
    }
    if (password !== confirm) {
      setError('A két jelszó nem egyezik.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError('Nem sikerült frissíteni a jelszót. Kérj új linket a bejelentkezés oldalon.');
      return;
    }
    setSuccess(true);
    window.setTimeout(() => navigate('/login'), 2500);
  }

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-zinc-500">Betöltés…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Jelszó frissítve</h1>
          <p className="text-sm text-zinc-400">Átirányítás a bejelentkezéshez…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-bubble rounded-3xl p-6 sm:p-8 border border-white/[0.06]">
        <h1 className="text-xl font-black text-white mb-1">Új jelszó beállítása</h1>
        <p className="text-sm text-zinc-400 mb-6">Add meg az új jelszavadat a fiókodhoz.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Új jelszó</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/40"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Jelszó megerősítése</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/40"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-[#07111f] disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #00E676, #00C853)' }}
          >
            {loading ? 'Mentés…' : 'Jelszó mentése'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full mt-4 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
        >
          Vissza a bejelentkezéshez
        </button>
      </div>
    </div>
  );
}
