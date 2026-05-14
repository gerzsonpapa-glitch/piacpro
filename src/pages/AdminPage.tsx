import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../lib/router';
import type { Profile, Listing, Report } from '../lib/types';
import { formatRelativeTime, formatPrice } from '../lib/utils';
import {
  Shield, Users, LayoutGrid, Flag, TrendingUp,
  Ban, CheckCircle, Trash2, Eye, XCircle, Search,
  RefreshCw, BarChart3, Award, ChevronDown, Save, X,
  AlertTriangle, ShieldAlert, Plus
} from 'lucide-react';

type Tab = 'stats' | 'users' | 'listings' | 'reports' | 'scam';

const DEFAULT_SCAM_KEYWORDS = [
  'előre utalás', 'előre fizet', 'előre pénz', 'crypto only', 'bitcoin only',
  'csak átutalás', 'kriptovaluta', 'western union', 'moneygram',
  'bit.ly', 'tinyurl', 't.me/+', 'whatsapp.com/invite',
  'nem találkozom', 'postán küldöm', 'ajándék küldök',
  'nigéria', 'örökség', 'nyeremény', '100% biztos',
];

function ScamTab() {
  const [keywords, setKeywords] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('scam_keywords') || 'null') || DEFAULT_SCAM_KEYWORDS; }
    catch { return DEFAULT_SCAM_KEYWORDS; }
  });
  const [newKw, setNewKw] = useState('');
  const [suspiciousListings, setSuspiciousListings] = useState<Listing[]>([]);
  const [scanning, setScanning] = useState(false);
  const { navigate } = useRouter();

  function saveKeywords(kws: string[]) {
    setKeywords(kws);
    localStorage.setItem('scam_keywords', JSON.stringify(kws));
  }

  function addKeyword() {
    const kw = newKw.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      saveKeywords([...keywords, kw]);
    }
    setNewKw('');
  }

  function removeKeyword(kw: string) {
    saveKeywords(keywords.filter((k) => k !== kw));
  }

  async function scanListings() {
    setScanning(true);
    const { data } = await supabase
      .from('listings')
      .select('*, seller:profiles(id, username, full_name)')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(500);

    const matches = (data || []).filter((l: Listing) => {
      const text = `${l.title} ${l.description} ${l.phone} ${l.contact_email}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });

    setSuspiciousListings(matches);
    setScanning(false);
  }

  return (
    <div className="space-y-5">
      {/* Warning header */}
      <div className="glass rounded-2xl p-5 border border-red-500/15">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm mb-1">Scam figyelő rendszer</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Az alábbi kulcsszavak automatikusan szűrik a gyanús hirdetéseket. Kattints a "Vizsgálat" gombra a hirdetések átvizsgálásához.
            </p>
          </div>
        </div>
      </div>

      {/* Keyword management */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Tiltott kulcsszavak ({keywords.length})
          </h3>
          <button onClick={() => saveKeywords(DEFAULT_SCAM_KEYWORDS)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />Alapértelmezett
          </button>
        </div>

        <div className="flex gap-2">
          <input type="text" value={newKw} onChange={(e) => setNewKw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Új kulcsszó hozzáadása..."
            className="flex-1 px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          <button onClick={addKeyword}
            className="px-4 py-2.5 glass-pill-active text-emerald-300 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all hover:scale-[1.02]">
            <Plus className="w-4 h-4" />Hozzáad
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <div key={kw}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {kw}
              <button onClick={() => removeKeyword(kw)} className="ml-0.5 text-red-400 hover:text-red-200 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Scan button */}
      <button onClick={scanListings} disabled={scanning}
        className="w-full py-3.5 glass-pill-active text-emerald-300 font-semibold rounded-2xl transition-all hover:scale-[1.01] disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
        <Search className="w-4 h-4" />
        {scanning ? 'Vizsgálat folyamatban...' : 'Hirdetések vizsgálata most'}
      </button>

      {/* Results */}
      {suspiciousListings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />{suspiciousListings.length} gyanús hirdetés találva
          </p>
          {suspiciousListings.map((l) => {
            const text = `${l.title} ${l.description}`.toLowerCase();
            const matched = keywords.filter((kw) => text.includes(kw));
            return (
              <div key={l.id} className="glass rounded-2xl p-4 border border-red-500/10 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-200 text-sm truncate">{l.title}</p>
                    <p className="text-xs text-zinc-500">{l.seller?.full_name || l.seller?.username || '—'}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {matched.map((kw) => (
                        <span key={kw} className="px-1.5 py-0.5 bg-red-500/15 border border-red-500/20 rounded-md text-[10px] text-red-400 font-medium">
                          "{kw}"
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => navigate(`/listing/${l.id}`)}
                      className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={async () => {
                      await supabase.from('listings').update({ status: 'deleted' }).eq('id', l.id);
                      setSuspiciousListings((prev) => prev.filter((x) => x.id !== l.id));
                    }} className="p-1.5 glass-pill rounded-lg text-red-500 hover:text-red-300 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suspiciousListings.length === 0 && !scanning && (
        <div className="glass rounded-2xl p-10 text-center">
          <CheckCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Indítsd el a vizsgálatot a gyanús tartalmak megtalálásához.</p>
        </div>
      )}
    </div>
  );
}

const LEVEL_OPTIONS = [
  { value: 1, label: 'Szint 1 — Kezdő', color: 'text-zinc-400' },
  { value: 2, label: 'Szint 2 — Aktív', color: 'text-blue-400' },
  { value: 3, label: 'Szint 3 — Tapasztalt', color: 'text-teal-400' },
  { value: 4, label: 'Szint 4 — Megbízható', color: 'text-emerald-400' },
  { value: 5, label: 'Szint 5 — VIP', color: 'text-amber-400' },
];

const LEVEL_COLORS: Record<number, string> = {
  1: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  2: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  3: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  4: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  5: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const LEVEL_TITLES: Record<number, string> = {
  1: 'Kezdő', 2: 'Aktív', 3: 'Tapasztalt', 4: 'Megbízható', 5: 'VIP',
};

function StatCard({ icon: Icon, label, value, color = 'text-emerald-400' }: {
  icon: React.ElementType; label: string; value: number | string; color?: string;
}) {
  return (
    <div className="glass-bubble rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 glass rounded-xl flex items-center justify-center">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

interface LevelEditorProps {
  user: Profile;
  onSave: (userId: string, level: number, title: string) => Promise<void>;
  onClose: () => void;
}

function LevelEditor({ user, onSave, onClose }: LevelEditorProps) {
  const [level, setLevel] = useState(user.level ?? 1);
  const [title, setTitle] = useState(user.level_title || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(user.id, level, title);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-100">Szint szerkesztése</h3>
          <button onClick={onClose} className="p-1.5 glass-pill rounded-xl text-zinc-500 hover:text-zinc-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <p className="text-sm text-zinc-400 mb-3">
            <span className="font-medium text-zinc-200">{user.full_name || user.username || 'Névtelen'}</span> szintje
          </p>
          <div className="space-y-2">
            {LEVEL_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setLevel(opt.value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  level === opt.value
                    ? LEVEL_COLORS[opt.value] + ' border-current/40'
                    : 'glass-pill text-zinc-400 border-transparent hover:text-zinc-200'
                }`}>
                <span className="w-6 h-6 glass-bubble rounded-lg flex items-center justify-center text-xs font-bold">{opt.value}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Egyedi cím (opcionális)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={LEVEL_TITLES[level]}
            className="w-full px-3 py-2 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 glass-pill-active text-emerald-300 text-sm font-medium rounded-xl transition-all disabled:opacity-60">
            <Save className="w-4 h-4" />{saving ? 'Mentés...' : 'Mentés'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 glass-pill text-zinc-400 text-sm rounded-xl hover:text-zinc-200 transition-colors">
            Mégse
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('stats');

  const [stats, setStats] = useState({ users: 0, listings: 0, auctions: 0, reports: 0 });
  const [users, setUsers] = useState<Profile[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (!profile?.is_admin) { navigate('/'); return; }
    loadAll();
  }, [profile]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadStats(), loadUsers(), loadListings(), loadReports()]);
    setLoading(false);
  }

  async function loadStats() {
    const [u, l, a, r] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
      supabase.from('auctions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setStats({ users: u.count || 0, listings: l.count || 0, auctions: a.count || 0, reports: r.count || 0 });
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200);
    setUsers(data || []);
  }

  async function loadListings() {
    const { data } = await supabase
      .from('listings').select('*, seller:profiles(id, username, full_name)')
      .neq('status', 'deleted').order('created_at', { ascending: false }).limit(200);
    setListings(data || []);
  }

  async function loadReports() {
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:profiles(id, username, full_name), reported_user:profiles!reports_reported_user_id_fkey(id, username, full_name), reported_listing:listings(id, title)')
      .order('created_at', { ascending: false }).limit(100);
    setReports(data || []);
  }

  async function banUser(userId: string, ban: boolean) {
    setActionLoading(userId);
    await supabase.from('profiles').update({ is_banned: ban }).eq('id', userId);
    await loadUsers();
    setActionLoading(null);
  }

  async function setVerified(userId: string, verified: boolean) {
    setActionLoading(userId);
    await supabase.from('profiles').update({ verified }).eq('id', userId);
    await loadUsers();
    setActionLoading(null);
  }

  async function saveUserLevel(userId: string, level: number, levelTitle: string) {
    await supabase.from('profiles').update({ level, level_title: levelTitle || null }).eq('id', userId);
    await loadUsers();
  }

  async function deleteListing(listingId: string) {
    setActionLoading(listingId);
    await supabase.from('listings').update({ status: 'deleted' }).eq('id', listingId);
    await loadListings();
    setActionLoading(null);
  }

  async function resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
    setActionLoading(reportId);
    await supabase.from('reports').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user!.id }).eq('id', reportId);
    await loadReports();
    setActionLoading(null);
  }

  if (!profile?.is_admin) return null;

  const filteredUsers = users.filter((u) =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredListings = listings.filter((l) =>
    !search || l.title.toLowerCase().includes(search.toLowerCase())
  );
  const pendingReports = reports.filter((r) => r.status === 'pending');

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'stats', label: 'Statisztika', icon: BarChart3 },
    { id: 'users', label: 'Felhasználók', icon: Users, badge: users.filter((u) => u.is_banned).length || undefined },
    { id: 'listings', label: 'Hirdetések', icon: LayoutGrid },
    { id: 'reports', label: 'Bejelentések', icon: Flag, badge: pendingReports.length || undefined },
    { id: 'scam', label: 'Scam figyelő', icon: ShieldAlert },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {editingUser && (
        <LevelEditor
          user={editingUser}
          onSave={saveUserLevel}
          onClose={() => setEditingUser(null)}
        />
      )}

      {/* Header */}
      <div className="glass rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 glass-bubble rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
            <p className="text-zinc-500 text-xs">Moderáció és platformkezelés</p>
          </div>
        </div>
        <button onClick={loadAll} className="glass-pill px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />Frissítés
        </button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${tab === t.id ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.badge ? (
              <span className="ml-0.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-bubble rounded-2xl h-24" />)}
        </div>
      ) : (
        <>
          {/* Stats Tab */}
          {tab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Összes felhasználó" value={stats.users} />
                <StatCard icon={LayoutGrid} label="Aktív hirdetések" value={stats.listings} />
                <StatCard icon={TrendingUp} label="Aktív licitek" value={stats.auctions} color="text-amber-400" />
                <StatCard icon={Flag} label="Függő bejelentések" value={stats.reports} color="text-red-400" />
              </div>

              {/* Level distribution */}
              <div className="glass rounded-2xl p-5">
                <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />Felhasználói szintek
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const count = users.filter((u) => (u.level ?? 1) === lvl).length;
                    const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                    return (
                      <div key={lvl} className={`rounded-xl p-3 text-center border ${LEVEL_COLORS[lvl]}`}>
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">Szint {lvl}</p>
                        <p className="text-[10px] opacity-50">{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <h3 className="font-semibold mb-3 text-sm">Tiltott felhasználók</h3>
                {users.filter((u) => u.is_banned).length === 0 ? (
                  <p className="text-zinc-600 text-sm">Nincs tiltott felhasználó</p>
                ) : (
                  <div className="space-y-2">
                    {users.filter((u) => u.is_banned).map((u) => (
                      <div key={u.id} className="flex items-center justify-between glass-pill px-4 py-2 rounded-xl">
                        <span className="text-sm text-zinc-300">{u.full_name || u.username || u.id.slice(0, 8)}</span>
                        <button onClick={() => banUser(u.id, false)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                          Felold
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <Search className="w-4 h-4 text-zinc-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Keresés..."
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                <span className="text-xs text-zinc-600">{filteredUsers.length} fő</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 text-xs">
                      <th className="text-left px-4 py-2.5">Felhasználó</th>
                      <th className="text-left px-4 py-2.5">Szint</th>
                      <th className="text-left px-4 py-2.5">Állapot</th>
                      <th className="text-left px-4 py-2.5">Csatlakozott</th>
                      <th className="text-right px-4 py-2.5">Műveletek</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const lvl = u.level ?? 1;
                      return (
                        <tr key={u.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-2.5">
                            <div>
                              <p className="font-medium text-zinc-200 text-xs">{u.full_name || u.username || 'Névtelen'}</p>
                              {u.username && <p className="text-[11px] text-zinc-600">@{u.username}</p>}
                              {u.is_admin && <span className="text-[10px] text-amber-400">Admin</span>}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => setEditingUser(u)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all hover:scale-105 ${LEVEL_COLORS[lvl]}`}>
                              {lvl} · {u.level_title || LEVEL_TITLES[lvl]}
                              <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>
                          </td>
                          <td className="px-4 py-2.5">
                            {u.is_banned ? (
                              <span className="text-[10px] bg-red-500/15 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-lg">Tiltott</span>
                            ) : u.verified ? (
                              <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg">Verifikált</span>
                            ) : (
                              <span className="text-[10px] glass-pill text-zinc-500 px-2 py-0.5 rounded-lg">Normál</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-zinc-600 text-[11px]">{formatRelativeTime(u.created_at)}</td>
                          <td className="px-4 py-2.5 text-right">
                            {!u.is_admin && (
                              <div className="flex items-center justify-end gap-1">
                                {u.verified ? (
                                  <button onClick={() => setVerified(u.id, false)} disabled={actionLoading === u.id}
                                    className="text-[10px] text-zinc-400 hover:text-zinc-200 glass-pill px-2 py-1 rounded-lg transition-colors">
                                    Verif. le
                                  </button>
                                ) : (
                                  <button onClick={() => setVerified(u.id, true)} disabled={actionLoading === u.id}
                                    className="text-[10px] text-emerald-400 hover:text-emerald-300 glass-pill px-2 py-1 rounded-lg transition-colors">
                                    Verifikál
                                  </button>
                                )}
                                {u.is_banned ? (
                                  <button onClick={() => banUser(u.id, false)} disabled={actionLoading === u.id}
                                    className="flex items-center gap-0.5 text-[10px] text-emerald-400 hover:text-emerald-300 glass-pill px-2 py-1 rounded-lg transition-colors">
                                    <CheckCircle className="w-3 h-3" />Felold
                                  </button>
                                ) : (
                                  <button onClick={() => banUser(u.id, true)} disabled={actionLoading === u.id}
                                    className="flex items-center gap-0.5 text-[10px] text-red-400 hover:text-red-300 glass-pill px-2 py-1 rounded-lg transition-colors">
                                    <Ban className="w-3 h-3" />Tilt
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {tab === 'listings' && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <Search className="w-4 h-4 text-zinc-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hirdetés keresése..."
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                <span className="text-xs text-zinc-600">{filteredListings.length} db</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 text-xs">
                      <th className="text-left px-4 py-2.5">Cím</th>
                      <th className="text-left px-4 py-2.5">Eladó</th>
                      <th className="text-left px-4 py-2.5">Ár</th>
                      <th className="text-left px-4 py-2.5">Állapot</th>
                      <th className="text-right px-4 py-2.5">Műv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map((l) => (
                      <tr key={l.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-zinc-200 text-xs truncate max-w-[180px]">{l.title}</p>
                          <p className="text-[10px] text-zinc-600">{formatRelativeTime(l.created_at)}</p>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-400 text-xs">
                          {l.seller?.full_name || l.seller?.username || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-emerald-400 font-semibold text-xs">{formatPrice(l.price)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                            l.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            l.status === 'sold' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                          }`}>{l.status}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => navigate(`/listing/${l.id}`)}
                              className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteListing(l.id)} disabled={actionLoading === l.id}
                              className="p-1.5 glass-pill rounded-lg text-red-500 hover:text-red-300 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scam Tab */}
          {tab === 'scam' && <ScamTab />}

          {/* Reports Tab */}
          {tab === 'reports' && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Flag className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">Nincs bejelentés</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="glass rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                            report.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                            report.status === 'resolved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
                          }`}>{report.status}</span>
                          <span className="text-[10px] glass-pill px-2 py-0.5 rounded-lg text-zinc-400">{report.reason}</span>
                          <span className="text-[10px] text-zinc-600">{formatRelativeTime(report.created_at)}</span>
                        </div>
                        <p className="text-xs text-zinc-300">
                          <span className="text-zinc-500">Bejelentő:</span> {report.reporter?.full_name || report.reporter?.username || '—'}
                        </p>
                        {report.reported_user && (
                          <p className="text-xs text-zinc-400">
                            <span className="text-zinc-500">Érintett:</span> {report.reported_user.full_name || report.reported_user.username}
                          </p>
                        )}
                        {report.reported_listing && (
                          <p className="text-xs text-zinc-400">
                            <span className="text-zinc-500">Hirdetés:</span> {report.reported_listing.title}
                          </p>
                        )}
                        {report.description && (
                          <p className="text-xs text-zinc-600 mt-1 italic">"{report.description}"</p>
                        )}
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex gap-1.5 flex-shrink-0 flex-col">
                          <button onClick={() => resolveReport(report.id, 'resolved')} disabled={actionLoading === report.id}
                            className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 glass-pill px-2.5 py-1.5 rounded-lg transition-colors">
                            <CheckCircle className="w-3 h-3" />Elfogad
                          </button>
                          <button onClick={() => resolveReport(report.id, 'dismissed')} disabled={actionLoading === report.id}
                            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 glass-pill px-2.5 py-1.5 rounded-lg transition-colors">
                            <XCircle className="w-3 h-3" />Elutasít
                          </button>
                          {report.reported_user_id && (
                            <button onClick={() => banUser(report.reported_user_id!, true)} disabled={actionLoading === report.reported_user_id}
                              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 glass-pill px-2.5 py-1.5 rounded-lg transition-colors">
                              <Ban className="w-3 h-3" />Tilt
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
