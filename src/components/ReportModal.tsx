import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import { Flag, X, AlertCircle, CheckCircle } from 'lucide-react';

interface ReportModalProps {
  listingId?: string;
  userId?: string;
  onClose: () => void;
}

const REASONS = [
  { value: 'spam', label: 'Kéretlen tartalom / spam' },
  { value: 'scam', label: 'Átverés / Csalás' },
  { value: 'inappropriate', label: 'Nem megfelelő tartalom' },
  { value: 'duplicate', label: 'Duplikált hirdetés' },
  { value: 'offensive', label: 'Sértő tartalom' },
  { value: 'other', label: 'Egyéb' },
];

export default function ReportModal({ listingId, userId, onClose }: ReportModalProps) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!reason) { setError('Válassz okot.'); return; }
    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_listing_id: listingId || null,
      reported_user_id: userId || null,
      reason,
      description,
    });

    if (err) {
      setError('Hiba a bejelentés küldésekor. Kérjük próbáld újra.');
    } else {
      setSuccess(true);
      setTimeout(onClose, 2000);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong rounded-3xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/15 border border-red-500/20 rounded-xl flex items-center justify-center">
              <Flag className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="font-bold text-lg">Bejelentés</h2>
          </div>
          <button onClick={onClose} className="p-2 glass-pill rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-semibold text-zinc-200">Bejelentés elküldve</p>
            <p className="text-sm text-zinc-500 mt-1">Moderátoraink hamarosan megvizsgálják.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Ok</label>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${reason === r.value ? 'glass-pill-active' : 'glass-pill hover:bg-white/10'}`}>
                    <input type="radio" name="reason" value={r.value} checked={reason === r.value}
                      onChange={() => setReason(r.value)} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${reason === r.value ? 'border-emerald-400 bg-emerald-400' : 'border-zinc-600'}`}>
                      {reason === r.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={`text-sm ${reason === r.value ? 'text-emerald-300' : 'text-zinc-300'}`}>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Részletek <span className="text-zinc-600">(opcionális)</span>
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} placeholder="Írd le röviden, mi a probléma..."
                className="w-full px-4 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none transition-all text-sm" />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 glass-pill text-zinc-400 rounded-xl hover:text-zinc-200 font-medium text-sm transition-colors">
                Mégse
              </button>
              <button type="submit" disabled={loading || !reason}
                className="flex-1 py-3 bg-red-500/15 border border-red-500/25 text-red-400 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] disabled:opacity-50">
                {loading ? 'Küldés...' : 'Bejelentés küldése'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
