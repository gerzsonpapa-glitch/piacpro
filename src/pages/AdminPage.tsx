import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { Profile, Listing, Report, Job, JobSeekerAd, Auction, ProducerApplication } from '../lib/types';
import { formatRelativeTime, formatPrice } from '../lib/utils';
import {
  Shield, Users, LayoutGrid, Flag, TrendingUp,
  Ban, CheckCircle, Trash2, Eye, XCircle, Search,
  RefreshCw, BarChart3, ChevronDown, Save, X,
  AlertTriangle, ShieldAlert, Plus, ShieldCheck, ShieldOff, Store,
  Gavel, Briefcase, UserSearch, MapPin, Wifi, Building2, Leaf
} from 'lucide-react';

type Tab = 'stats' | 'users' | 'listings' | 'auctions' | 'jobs' | 'seekers' | 'reports' | 'scam' | 'producers';

const DEFAULT_SCAM_KEYWORDS = [
  'előre utalás', 'előre fizet', 'előre pénz', 'crypto only', 'bitcoin only',
  'csak átutalás', 'kriptovaluta', 'western union', 'moneygram',
  'bit.ly', 'tinyurl', 't.me/+', 'whatsapp.com/invite',
  'nem találkozom', 'postán küldöm', 'ajándék küldök',
  'nigéria', 'örökség', 'nyeremény', '100% biztos',
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
const LEVEL_OPTIONS = [1, 2, 3, 4, 5].map((v) => ({ value: v, label: `Szint ${v} — ${LEVEL_TITLES[v]}` }));

// ── Helpers ────────────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">{children}</h3>
  );
}

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

// ── Level Editor Modal ─────────────────────────────────────────────────────────
function LevelEditor({ user, onSave, onClose }: {
  user: Profile;
  onSave: (userId: string, level: number, title: string) => Promise<void>;
  onClose: () => void;
}) {
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
        <p className="text-sm text-zinc-400">
          <span className="font-medium text-zinc-200">{user.full_name || user.username || 'Névtelen'}</span> szintje
        </p>
        <div className="space-y-2">
          {LEVEL_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setLevel(opt.value)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                level === opt.value ? LEVEL_COLORS[opt.value] + ' border-current/40' : 'glass-pill text-zinc-400 border-transparent hover:text-zinc-200'
              }`}>
              <span className="w-6 h-6 glass-bubble rounded-lg flex items-center justify-center text-xs font-bold">{opt.value}</span>
              {opt.label}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Egyedi cím (opcionális)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={LEVEL_TITLES[level]}
            className="w-full px-3 py-2 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 glass-pill-active text-emerald-300 text-sm font-medium rounded-xl disabled:opacity-60">
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

// ── Scam Tab ──────────────────────────────────────────────────────────────────
function ScamTab() {
  const [keywords, setKeywords] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('scam_keywords') || 'null') || DEFAULT_SCAM_KEYWORDS; }
    catch { return DEFAULT_SCAM_KEYWORDS; }
  });
  const [newKw, setNewKw] = useState('');
  const [suspiciousListings, setSuspiciousListings] = useState<Listing[]>([]);
  const [scanning, setScanning] = useState(false);
  const { navigate } = useRouter();

  function saveKeywords(kws: string[]) { setKeywords(kws); localStorage.setItem('scam_keywords', JSON.stringify(kws)); }
  function addKeyword() { const kw = newKw.trim().toLowerCase(); if (kw && !keywords.includes(kw)) saveKeywords([...keywords, kw]); setNewKw(''); }
  function removeKeyword(kw: string) { saveKeywords(keywords.filter((k) => k !== kw)); }

  async function scanListings() {
    setScanning(true);
    const { data } = await supabase.from('listings').select('*, seller:profiles(id, username, full_name)')
      .neq('status', 'deleted').order('created_at', { ascending: false }).limit(500);
    const matches = (data || []).filter((l: Listing) => {
      const text = `${l.title} ${l.description} ${l.phone} ${l.contact_email}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
    setSuspiciousListings(matches);
    setScanning(false);
  }

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5 border border-red-500/15 flex items-start gap-3">
        <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-100 text-sm mb-1">Scam figyelő rendszer</h3>
          <p className="text-zinc-500 text-xs leading-relaxed">Az alábbi kulcsszavak automatikusan szűrik a gyanús hirdetéseket.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>Tiltott kulcsszavak ({keywords.length})</SectionTitle>
          <button onClick={() => saveKeywords(DEFAULT_SCAM_KEYWORDS)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />Alapértelmezett
          </button>
        </div>
        <div className="flex gap-2">
          <input type="text" value={newKw} onChange={(e) => setNewKw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Új kulcsszó..." className="flex-1 px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
          <button onClick={addKeyword} className="px-4 py-2.5 glass-pill-active text-emerald-300 rounded-xl text-sm font-medium flex items-center gap-1.5">
            <Plus className="w-4 h-4" />Hozzáad
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <div key={kw} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 font-medium">
              <AlertTriangle className="w-3 h-3" />{kw}
              <button onClick={() => removeKeyword(kw)} className="ml-0.5 text-red-400 hover:text-red-200 transition-colors"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={scanListings} disabled={scanning}
        className="w-full py-3.5 glass-pill-active text-emerald-300 font-semibold rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
        <Search className="w-4 h-4" />{scanning ? 'Vizsgálat...' : 'Hirdetések vizsgálata'}
      </button>

      {suspiciousListings.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />{suspiciousListings.length} gyanús hirdetés
          </p>
          {suspiciousListings.map((l) => {
            const text = `${l.title} ${l.description}`.toLowerCase();
            const matched = keywords.filter((kw) => text.includes(kw));
            return (
              <div key={l.id} className="glass rounded-2xl p-4 border border-red-500/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-200 text-sm truncate">{l.title}</p>
                    <p className="text-xs text-zinc-500">{l.seller?.full_name || l.seller?.username || '—'}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {matched.map((kw) => (
                        <span key={kw} className="px-1.5 py-0.5 bg-red-500/15 border border-red-500/20 rounded-md text-[10px] text-red-400 font-medium">"{kw}"</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => navigate(`/listing/${l.id}`)} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={async () => { const { error } = await supabase.from('listings').update({ status: 'deleted' }).eq('id', l.id); if (error) { showToast('error', 'Hiba', 'A törlés sikertelen.'); } else { setSuspiciousListings((prev) => prev.filter((x) => x.id !== l.id)); showToast('success', 'Törölve', 'Hirdetés eltávolítva.'); } }}
                      className="p-1.5 glass-pill rounded-lg text-red-500 hover:text-red-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : !scanning ? (
        <div className="glass rounded-2xl p-10 text-center">
          <CheckCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Indítsd el a vizsgálatot a gyanús tartalmak megtalálásához.</p>
        </div>
      ) : null}
    </div>
  );
}

// ── Auction type with listing join ────────────────────────────────────────────
type AuctionAdmin = Auction & { listing?: { id: string; title: string; seller?: Pick<Profile, 'id' | 'username' | 'full_name'> } };
type JobAdmin = Job & { poster?: Pick<Profile, 'id' | 'username' | 'full_name'> };
type SeekerAdmin = JobSeekerAd & { user?: Pick<Profile, 'id' | 'username' | 'full_name'> };

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, profile } = useAuth();
  const { navigate, search: routerSearch } = useRouter();
  const { showToast } = useNotification();

  const initialTab = (() => {
    const params = new URLSearchParams(routerSearch);
    const t = params.get('tab') as Tab | null;
    const valid: Tab[] = ['stats', 'users', 'listings', 'auctions', 'jobs', 'seekers', 'reports', 'scam', 'producers'];
    return t && valid.includes(t) ? t : 'stats';
  })();
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const params = new URLSearchParams(routerSearch);
    const t = params.get('tab') as Tab | null;
    const valid: Tab[] = ['stats', 'users', 'listings', 'auctions', 'jobs', 'seekers', 'reports', 'scam', 'producers'];
    if (t && valid.includes(t)) setTab(t);
  }, [routerSearch]);

  const [stats, setStats] = useState({ users: 0, listings: 0, auctions: 0, jobs: 0, seekers: 0, reports: 0, shops: 0 });
  const [users, setUsers] = useState<Profile[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [auctions, setAuctions] = useState<AuctionAdmin[]>([]);
  const [jobs, setJobs] = useState<JobAdmin[]>([]);
  const [seekers, setSeekers] = useState<SeekerAdmin[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [producerApps, setProducerApps] = useState<ProducerApplication[]>([]);
  const [producers, setProducers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  const isSuperAdmin = profile?.is_super_admin === true;

  useEffect(() => {
    if (!profile?.is_admin) { navigate('/'); return; }
    loadAll();
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadStats(), loadUsers(), loadListings(), loadAuctions(), loadJobs(), loadSeekers(), loadReports(), loadProducerApps(), loadProducers()]);
    setLoading(false);
  }

  async function loadStats() {
    const [u, l, a, j, sk, r, s] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
      supabase.from('auctions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
      supabase.from('job_seeker_ads').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('shops').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    setStats({ users: u.count ?? 0, listings: l.count ?? 0, auctions: a.count ?? 0, jobs: j.count ?? 0, seekers: sk.count ?? 0, reports: r.count ?? 0, shops: s.count ?? 0 });
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200);
    setUsers(data || []);
  }
  async function loadListings() {
    const { data } = await supabase.from('listings').select('*, seller:profiles(id, username, full_name)')
      .neq('status', 'deleted').order('created_at', { ascending: false }).limit(200);
    setListings(data || []);
  }
  async function loadAuctions() {
    const { data } = await supabase.from('auctions')
      .select('*, listing:listings(id, title, seller:profiles(id, username, full_name))')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false }).limit(200);
    setAuctions((data || []) as AuctionAdmin[]);
  }
  async function loadJobs() {
    const { data } = await supabase.from('jobs')
      .select('*, poster:profiles(id, username, full_name)')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false }).limit(200);
    setJobs((data || []) as JobAdmin[]);
  }
  async function loadSeekers() {
    const { data } = await supabase.from('job_seeker_ads')
      .select('*, user:profiles(id, username, full_name)')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false }).limit(200);
    setSeekers((data || []) as SeekerAdmin[]);
  }
  async function loadReports() {
    const { data: rawReports } = await supabase.from('reports')
      .select('*')
      .order('created_at', { ascending: false }).limit(100);
    if (!rawReports || rawReports.length === 0) { setReports([]); return; }

    const reporterIds = [...new Set(rawReports.map((r) => r.reporter_id).filter(Boolean))];
    const reportedIds = [...new Set(rawReports.map((r) => r.reported_user_id).filter(Boolean))];
    const listingIds = [...new Set(rawReports.map((r) => r.reported_listing_id).filter(Boolean))];
    const allUserIds = [...new Set([...reporterIds, ...reportedIds])];

    const [{ data: profilesData }, { data: listingsData }] = await Promise.all([
      allUserIds.length > 0 ? supabase.from('profiles').select('id, username, full_name').in('id', allUserIds) : Promise.resolve({ data: [] }),
      listingIds.length > 0 ? supabase.from('listings').select('id, title').in('id', listingIds) : Promise.resolve({ data: [] }),
    ]);

    const profileMap = Object.fromEntries((profilesData || []).map((p) => [p.id, p]));
    const listingMap = Object.fromEntries((listingsData || []).map((l) => [l.id, l]));

    setReports(rawReports.map((r) => ({
      ...r,
      reporter: profileMap[r.reporter_id] ?? null,
      reported_user: profileMap[r.reported_user_id] ?? null,
      reported_listing: listingMap[r.reported_listing_id] ?? null,
    })));
  }

  async function loadProducerApps() {
    const { data: apps } = await supabase
      .from('producer_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (!apps || apps.length === 0) { setProducerApps([]); return; }

    const userIds = [...new Set(apps.map((a) => a.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', userIds);

    const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
    setProducerApps(apps.map((a) => ({ ...a, profile: profileMap[a.user_id] ?? null })) as ProducerApplication[]);
  }

  async function loadProducers() {
    const { data } = await supabase
      .from('producers')
      .select('id, name, location, is_verified, created_at, user_id')
      .order('created_at', { ascending: false });
    if (!data || data.length === 0) { setProducers([]); return; }
    const userIds = [...new Set(data.map((p) => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, username, full_name').in('id', userIds);
    const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
    setProducers(data.map((p) => ({ ...p, profile: profileMap[p.user_id] ?? null })));
  }

  async function deleteProducer(producerId: string, _userId: string) {
    setActionLoading(producerId);
    const { error } = await supabase.rpc('admin_delete_producer', { p_producer_id: producerId });
    if (error) { showToast('error', 'Hiba', error.message); setActionLoading(null); return; }
    showToast('success', 'Termelő törölve');
    setActionLoading(null);
    loadProducers();
  }

  async function revokeProducerRights(producerId: string, userId: string) {
    setActionLoading(`revoke-${producerId}`);
    const { error } = await supabase.from('profiles').update({ is_producer_approved: false }).eq('id', userId);
    if (error) { showToast('error', 'Hiba', error.message); setActionLoading(null); return; }
    showToast('success', 'Termelői jog visszavonva');
    setActionLoading(null);
    loadProducers();
  }

  async function approveProducerApp(appId: string, userId: string, approve: boolean) {
    setActionLoading(appId);
    await supabase.from('producer_applications').update({
      status: approve ? 'approved' : 'rejected',
      reviewed_by: profile!.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', appId);
    if (approve) {
      await supabase.from('profiles').update({ is_producer_approved: true }).eq('id', userId);
    }
    showToast('success', approve ? 'Kérelem jóváhagyva' : 'Kérelem elutasítva');
    setActionLoading(null);
    loadProducerApps();
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
  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    if (!isSuperAdmin) return;
    setActionLoading(userId);
    const { error } = await supabase.rpc('set_user_admin', { target_user_id: userId, admin_value: makeAdmin });
    if (!error) await loadUsers();
    setActionLoading(null);
  }
  async function toggleShopOwner(userId: string, grant: boolean) {
    if (!isSuperAdmin) return;
    setActionLoading(userId + '-shop');
    await supabase.from('profiles').update({ is_shop_owner: grant }).eq('id', userId);
    await loadUsers();
    setActionLoading(null);
  }
  async function deleteListing(listingId: string) {
    setActionLoading(listingId);
    const { error } = await supabase.from('listings').update({ status: 'deleted' }).eq('id', listingId);
    if (error) { showToast('error', 'Hiba', 'A törlés sikertelen.'); }
    else { setListings((prev) => prev.filter((l) => l.id !== listingId)); showToast('success', 'Törölve', 'Hirdetés eltávolítva.'); }
    setActionLoading(null);
  }
  async function deleteAuction(auctionId: string, listingId: string) {
    setActionLoading(auctionId);
    const [r1, r2] = await Promise.all([
      supabase.from('auctions').update({ status: 'cancelled' }).eq('id', auctionId),
      supabase.from('listings').update({ status: 'deleted' }).eq('id', listingId),
    ]);
    if (r1.error || r2.error) { showToast('error', 'Hiba', 'A törlés sikertelen.'); }
    else { setAuctions((prev) => prev.filter((a) => a.id !== auctionId)); showToast('success', 'Törölve', 'Licit eltávolítva.'); }
    setActionLoading(null);
  }
  async function deleteJob(jobId: string) {
    setActionLoading(jobId);
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) { showToast('error', 'Hiba', 'A törlés sikertelen.'); }
    else { setJobs((prev) => prev.filter((j) => j.id !== jobId)); showToast('success', 'Törölve', 'Álláshirdetés eltávolítva.'); }
    setActionLoading(null);
  }
  async function deleteSeeker(seekerId: string) {
    setActionLoading(seekerId);
    const { error } = await supabase.from('job_seeker_ads').delete().eq('id', seekerId);
    if (error) { showToast('error', 'Hiba', 'A törlés sikertelen.'); }
    else { setSeekers((prev) => prev.filter((s) => s.id !== seekerId)); showToast('success', 'Törölve', 'Hirdetés eltávolítva.'); }
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
  const filteredAuctions = auctions.filter((a) =>
    !search || a.listing?.title?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredJobs = jobs.filter((j) =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSeekers = seekers.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  );
  const pendingReports = reports.filter((r) => r.status === 'pending');

  const pendingProducerApps = producerApps.filter((a) => a.status === 'pending');

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'stats', label: 'Áttekintés', icon: BarChart3 },
    { id: 'users', label: 'Felhasználók', icon: Users, badge: users.filter((u) => u.is_banned).length || undefined },
    { id: 'listings', label: 'Hirdetések', icon: LayoutGrid },
    { id: 'auctions', label: 'Licitek', icon: Gavel },
    { id: 'jobs', label: 'Állások', icon: Briefcase },
    { id: 'seekers', label: 'Munkakeresők', icon: UserSearch },
    { id: 'reports', label: 'Bejelentések', icon: Flag, badge: pendingReports.length || undefined },
    { id: 'scam', label: 'Scam figyelő', icon: ShieldAlert },
    { id: 'producers', label: 'Termelők', icon: Leaf, badge: pendingProducerApps.length || undefined },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {editingUser && (
        <LevelEditor user={editingUser} onSave={saveUserLevel} onClose={() => setEditingUser(null)} />
      )}

      {/* Header */}
      <div className="glass rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 glass-bubble rounded-xl flex items-center justify-center ${isSuperAdmin ? 'bg-amber-500/10' : ''}`}>
            <Shield className={`w-5 h-5 ${isSuperAdmin ? 'text-amber-400' : 'text-red-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Admin Panel</h1>
              {isSuperAdmin && (
                <span className="text-[10px] font-bold bg-amber-500/15 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-lg">SUPER ADMIN</span>
              )}
            </div>
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
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${tab === t.id ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.badge ? <span className="ml-0.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-bubble rounded-2xl h-24" />)}
        </div>
      ) : (
        <>
          {/* ── STATS TAB ─────────────────────────────────────────────────── */}
          {tab === 'stats' && (
            <div className="space-y-6">

              {/* KPI row */}
              <div>
                <SectionTitle>Platform összesítő</SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard icon={Users} label="Felhasználók" value={stats.users} />
                  <StatCard icon={LayoutGrid} label="Aktív hirdetések" value={stats.listings} />
                  <StatCard icon={Gavel} label="Aktív licitek" value={stats.auctions} color="text-amber-400" />
                  <StatCard icon={Store} label="Aktív boltok" value={stats.shops} color="text-teal-400" />
                  <StatCard icon={Briefcase} label="Aktív állások" value={stats.jobs} color="text-sky-400" />
                  <StatCard icon={UserSearch} label="Munkakeresők" value={stats.seekers} color="text-violet-400" />
                  <StatCard icon={Flag} label="Függő bejelentések" value={stats.reports} color="text-red-400" />
                </div>
              </div>

              {/* User levels */}
              <div className="glass rounded-2xl p-5">
                <SectionTitle>Felhasználói szintek</SectionTitle>
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

              {/* Two column: banned + admins */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Banned users */}
                <div className="glass rounded-2xl p-5">
                  <SectionTitle>Tiltott felhasználók ({users.filter((u) => u.is_banned).length})</SectionTitle>
                  {users.filter((u) => u.is_banned).length === 0 ? (
                    <p className="text-zinc-600 text-sm">Nincs tiltott felhasználó</p>
                  ) : (
                    <div className="space-y-2">
                      {users.filter((u) => u.is_banned).map((u) => (
                        <div key={u.id} className="flex items-center justify-between glass-pill px-3 py-2 rounded-xl">
                          <div>
                            <p className="text-sm text-zinc-300">{u.full_name || u.username || u.id.slice(0, 8)}</p>
                            {u.username && <p className="text-[10px] text-zinc-600">@{u.username}</p>}
                          </div>
                          <button onClick={() => banUser(u.id, false)} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Felold</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admins — super admin only */}
                {isSuperAdmin && (
                  <div className="glass rounded-2xl p-5 border border-amber-500/10">
                    <SectionTitle>Adminisztrátorok</SectionTitle>
                    {users.filter((u) => u.is_admin && !u.is_super_admin).length === 0 ? (
                      <p className="text-zinc-600 text-sm">Nincs más admin</p>
                    ) : (
                      <div className="space-y-2">
                        {users.filter((u) => u.is_admin && !u.is_super_admin).map((u) => (
                          <div key={u.id} className="flex items-center justify-between glass-pill px-3 py-2 rounded-xl">
                            <span className="text-sm text-zinc-300">{u.full_name || u.username || u.id.slice(0, 8)}</span>
                            <button onClick={() => toggleAdmin(u.id, false)} disabled={actionLoading === u.id}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                              <ShieldOff className="w-3 h-3" />Elvesz
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shop owners */}
              <div className="glass rounded-2xl p-5">
                <SectionTitle>Boltnyitási joggal rendelkezők ({users.filter((u) => u.is_shop_owner).length})</SectionTitle>
                {users.filter((u) => u.is_shop_owner).length === 0 ? (
                  <p className="text-zinc-600 text-sm">Még senki</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {users.filter((u) => u.is_shop_owner).map((u) => (
                      <div key={u.id} className="inline-flex items-center gap-2 glass-pill px-3 py-1.5 rounded-xl text-sm">
                        <Store className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-zinc-300">{u.full_name || u.username || u.id.slice(0, 8)}</span>
                        {isSuperAdmin && (
                          <button onClick={() => toggleShopOwner(u.id, false)} disabled={actionLoading === u.id + '-shop'}
                            className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors ml-1">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── USERS TAB ─────────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Keresés neve vagy felhasználóneve alapján..."
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                <span className="text-xs text-zinc-600 flex-shrink-0">{filteredUsers.length} fő</span>
              </div>

              {/* Banned users section */}
              {filteredUsers.some((u) => u.is_banned) && (
                <div className="glass rounded-2xl overflow-hidden border border-red-500/10">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <Ban className="w-4 h-4 text-red-400" />
                    <SectionTitle>Tiltott felhasználók</SectionTitle>
                  </div>
                  <div className="divide-y divide-white/3">
                    {filteredUsers.filter((u) => u.is_banned).map((u) => (
                      <UserRow key={u.id} u={u} currentUserId={user!.id} isSuperAdmin={isSuperAdmin} actionLoading={actionLoading}
                        onBan={banUser} onVerify={setVerified} onAdmin={toggleAdmin} onShopOwner={toggleShopOwner} onLevel={setEditingUser} />
                    ))}
                  </div>
                </div>
              )}

              {/* Normal users */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <SectionTitle>Összes felhasználó</SectionTitle>
                </div>
                <div className="divide-y divide-white/3">
                  {filteredUsers.filter((u) => !u.is_banned).map((u) => (
                    <UserRow key={u.id} u={u} currentUserId={user!.id} isSuperAdmin={isSuperAdmin} actionLoading={actionLoading}
                      onBan={banUser} onVerify={setVerified} onAdmin={toggleAdmin} onShopOwner={toggleShopOwner} onLevel={setEditingUser} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── LISTINGS TAB ──────────────────────────────────────────────── */}
          {tab === 'listings' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hirdetés keresése..."
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                <span className="text-xs text-zinc-600 flex-shrink-0">{filteredListings.length} db</span>
              </div>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-xs">
                        <th className="text-left px-4 py-3">Cím</th>
                        <th className="text-left px-4 py-3">Eladó</th>
                        <th className="text-left px-4 py-3">Ár</th>
                        <th className="text-left px-4 py-3">Állapot</th>
                        <th className="text-right px-4 py-3">Műv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListings.map((l) => (
                        <tr key={l.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-zinc-200 text-xs truncate max-w-[200px]">{l.title}</p>
                            <p className="text-[10px] text-zinc-600">{formatRelativeTime(l.created_at)}</p>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">{l.seller?.full_name || l.seller?.username || '—'}</td>
                          <td className="px-4 py-3 text-emerald-400 font-semibold text-xs">{formatPrice(l.price)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                              l.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              l.status === 'sold' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                              'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                            }`}>{l.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => navigate(`/listing/${l.id}`)} className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteListing(l.id)} disabled={actionLoading === l.id}
                                className="p-1.5 glass-pill rounded-lg text-red-500 hover:text-red-300 transition-colors disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── REPORTS TAB ───────────────────────────────────────────────── */}
          {tab === 'reports' && (
            <div className="space-y-4">
              {/* Pending */}
              {pendingReports.length > 0 && (
                <div>
                  <SectionTitle>Függő bejelentések ({pendingReports.length})</SectionTitle>
                  <div className="space-y-2">
                    {pendingReports.map((report) => (
                      <ReportCard key={report.id} report={report} actionLoading={actionLoading} onResolve={resolveReport} onBan={banUser} />
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved */}
              {reports.filter((r) => r.status !== 'pending').length > 0 && (
                <div>
                  <SectionTitle>Lezárt bejelentések</SectionTitle>
                  <div className="space-y-2">
                    {reports.filter((r) => r.status !== 'pending').map((report) => (
                      <ReportCard key={report.id} report={report} actionLoading={actionLoading} onResolve={resolveReport} onBan={banUser} />
                    ))}
                  </div>
                </div>
              )}

              {reports.length === 0 && (
                <div className="glass rounded-2xl p-12 text-center">
                  <Flag className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">Nincs bejelentés</p>
                </div>
              )}
            </div>
          )}

          {/* ── AUCTIONS TAB ──────────────────────────────────────────────── */}
          {tab === 'auctions' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Licithirdetés keresése..."
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                <span className="text-xs text-zinc-600 flex-shrink-0">{filteredAuctions.length} db</span>
              </div>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-xs">
                        <th className="text-left px-4 py-3">Hirdetés</th>
                        <th className="text-left px-4 py-3">Eladó</th>
                        <th className="text-left px-4 py-3">Jelenlegi ár</th>
                        <th className="text-left px-4 py-3">Licitek</th>
                        <th className="text-left px-4 py-3">Állapot</th>
                        <th className="text-left px-4 py-3">Lejár</th>
                        <th className="text-right px-4 py-3">Műv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuctions.map((a) => (
                        <tr key={a.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-zinc-200 text-xs truncate max-w-[180px]">{a.listing?.title ?? '—'}</p>
                            <p className="text-[10px] text-zinc-600">{formatRelativeTime(a.created_at)}</p>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">
                            {(a.listing as AuctionAdmin['listing'] & { seller?: Pick<Profile,'username'|'full_name'|'id'> })?.seller?.full_name ||
                             (a.listing as AuctionAdmin['listing'] & { seller?: Pick<Profile,'username'|'full_name'|'id'> })?.seller?.username || '—'}
                          </td>
                          <td className="px-4 py-3 text-amber-400 font-semibold text-xs">{formatPrice(a.current_price)}</td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">{a.bid_count}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                              a.status === 'active' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                              a.status === 'sold' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                            }`}>{a.status}</span>
                          </td>
                          <td className="px-4 py-3 text-zinc-500 text-xs">{a.ends_at ? new Date(a.ends_at).toLocaleDateString('hu-HU') : '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {a.listing?.id && (
                                <button onClick={() => navigate(`/listing/${a.listing!.id}`)}
                                  className="p-1.5 glass-pill rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => deleteAuction(a.id, a.listing_id)} disabled={actionLoading === a.id}
                                className="p-1.5 glass-pill rounded-lg text-red-500 hover:text-red-300 transition-colors disabled:opacity-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredAuctions.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-600 text-sm">Nincs megjeleníthető licithirdetés</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── JOBS TAB ──────────────────────────────────────────────────── */}
          {tab === 'jobs' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Állás keresése..."
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                <span className="text-xs text-zinc-600 flex-shrink-0">{filteredJobs.length} db</span>
              </div>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-xs">
                        <th className="text-left px-4 py-3">Pozíció / Cég</th>
                        <th className="text-left px-4 py-3">Hirdető</th>
                        <th className="text-left px-4 py-3">Kategória</th>
                        <th className="text-left px-4 py-3">Helyszín</th>
                        <th className="text-left px-4 py-3">Állapot</th>
                        <th className="text-left px-4 py-3">Feladva</th>
                        <th className="text-right px-4 py-3">Műv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map((j) => (
                        <tr key={j.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-zinc-200 text-xs truncate max-w-[180px]">{j.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Building2 className="w-2.5 h-2.5 text-zinc-600" />
                              <p className="text-[10px] text-zinc-500 truncate max-w-[160px]">{j.company}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">{j.poster?.full_name || j.poster?.username || '—'}</td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">{j.category}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-zinc-500 text-xs">
                              {j.remote ? <Wifi className="w-3 h-3 text-sky-400" /> : <MapPin className="w-3 h-3" />}
                              <span className="truncate max-w-[100px]">{j.remote ? 'Remote' : (j.location || '—')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                              j.status === 'active' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                              j.status === 'closed' ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400' :
                              'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>{j.status}</span>
                          </td>
                          <td className="px-4 py-3 text-zinc-600 text-xs">{formatRelativeTime(j.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => deleteJob(j.id)} disabled={actionLoading === j.id}
                              className="p-1.5 glass-pill rounded-lg text-red-500 hover:text-red-300 transition-colors disabled:opacity-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredJobs.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-600 text-sm">Nincs megjeleníthető álláshirdetés</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SEEKERS TAB ───────────────────────────────────────────────── */}
          {tab === 'seekers' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Munkakereső keresése..."
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                <span className="text-xs text-zinc-600 flex-shrink-0">{filteredSeekers.length} db</span>
              </div>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-xs">
                        <th className="text-left px-4 py-3">Munkakör</th>
                        <th className="text-left px-4 py-3">Felhasználó</th>
                        <th className="text-left px-4 py-3">Kategória</th>
                        <th className="text-left px-4 py-3">Helyszín</th>
                        <th className="text-left px-4 py-3">Tapasztalat</th>
                        <th className="text-left px-4 py-3">Feladva</th>
                        <th className="text-right px-4 py-3">Műv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSeekers.map((s) => (
                        <tr key={s.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-zinc-200 text-xs truncate max-w-[180px]">{s.title}</p>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">{s.user?.full_name || s.user?.username || '—'}</td>
                          <td className="px-4 py-3 text-zinc-400 text-xs truncate max-w-[120px]">{s.category}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-zinc-500 text-xs">
                              {s.remote ? <Wifi className="w-3 h-3 text-sky-400" /> : <MapPin className="w-3 h-3" />}
                              <span className="truncate max-w-[100px]">{s.remote ? 'Remote' : (s.location || '—')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-500 text-xs">{s.experience || '—'}</td>
                          <td className="px-4 py-3 text-zinc-600 text-xs">{formatRelativeTime(s.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => deleteSeeker(s.id)} disabled={actionLoading === s.id}
                              className="p-1.5 glass-pill rounded-lg text-red-500 hover:text-red-300 transition-colors disabled:opacity-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredSeekers.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-600 text-sm">Nincs megjeleníthető álláskereső hirdetés</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SCAM TAB ──────────────────────────────────────────────────── */}
          {tab === 'scam' && <ScamTab />}

          {/* ── PRODUCERS TAB ─────────────────────────────────────────────── */}
          {tab === 'producers' && (
            <div className="space-y-6">
              {/* Kérelmek */}
              <div className="space-y-3">
                <h2 className="font-bold text-zinc-100 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-400" /> Termelői kérelmek
                  {producerApps.filter(a => a.status === 'pending').length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                      {producerApps.filter(a => a.status === 'pending').length} függőben
                    </span>
                  )}
                </h2>
                {producerApps.length === 0 ? (
                  <div className="glass rounded-2xl p-8 text-center text-zinc-500">Nincsenek termelői kérelmek.</div>
                ) : (
                  <div className="space-y-2">
                    {producerApps.map((app) => (
                      <div key={app.id} className="glass rounded-2xl p-4 flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-zinc-200 text-sm">
                              {(app as any).profile?.full_name || (app as any).profile?.username || 'Felhasználó'}
                            </p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              app.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                              app.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {app.status === 'pending' ? 'Függőben' : app.status === 'approved' ? 'Jóváhagyva' : 'Elutasítva'}
                            </span>
                          </div>
                          {app.message && <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{app.message}</p>}
                          <p className="text-xs text-zinc-700 mt-1">{new Date(app.created_at).toLocaleDateString('hu-HU')}</p>
                        </div>
                        {app.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => approveProducerApp(app.id, app.user_id, true)}
                              disabled={actionLoading === app.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-medium hover:scale-105 transition-all disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Jóváhagyás
                            </button>
                            <button
                              onClick={() => approveProducerApp(app.id, app.user_id, false)}
                              disabled={actionLoading === app.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-medium hover:scale-105 transition-all disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Elutasítás
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aktív termelők */}
              <div className="space-y-3">
                <h2 className="font-bold text-zinc-100 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-400" /> Aktív termelők
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 font-semibold">{producers.length} db</span>
                </h2>
                {producers.length === 0 ? (
                  <div className="glass rounded-2xl p-8 text-center text-zinc-500">Nincsenek regisztrált termelők.</div>
                ) : (
                  <div className="glass rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-zinc-500 text-xs">
                          <th className="text-left px-4 py-3">Termelő neve</th>
                          <th className="text-left px-4 py-3">Felhasználó</th>
                          <th className="text-left px-4 py-3">Helyszín</th>
                          <th className="text-left px-4 py-3">Státusz</th>
                          <th className="text-left px-4 py-3">Regisztrált</th>
                          <th className="text-right px-4 py-3">Műv.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {producers.map((p) => (
                          <tr key={p.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-zinc-200 text-xs truncate max-w-[160px]">{p.name}</p>
                            </td>
                            <td className="px-4 py-3 text-zinc-400 text-xs">{p.profile?.full_name || p.profile?.username || '—'}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs truncate max-w-[120px]">{p.location || '—'}</td>
                            <td className="px-4 py-3">
                              {p.is_verified
                                ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">Hitelesített</span>
                                : <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 font-semibold">Normál</span>
                              }
                            </td>
                            <td className="px-4 py-3 text-zinc-600 text-xs">{formatRelativeTime(p.created_at)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => revokeProducerRights(p.id, p.user_id)}
                                  disabled={!!actionLoading}
                                  className="p-1.5 glass-pill rounded-lg text-amber-500 hover:text-amber-300 transition-colors disabled:opacity-50"
                                  title="Jog visszavonása (profil megmarad)"
                                >
                                  <ShieldOff className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteProducer(p.id, p.user_id)}
                                  disabled={!!actionLoading}
                                  className="p-1.5 glass-pill rounded-lg text-red-500 hover:text-red-300 transition-colors disabled:opacity-50"
                                  title="Termelő törlése (profil + jog törlése)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────────
function UserRow({ u, currentUserId, isSuperAdmin, actionLoading, onBan, onVerify, onAdmin, onShopOwner, onLevel }: {
  u: Profile;
  currentUserId: string;
  isSuperAdmin: boolean;
  actionLoading: string | null;
  onBan: (id: string, ban: boolean) => void;
  onVerify: (id: string, v: boolean) => void;
  onAdmin: (id: string, v: boolean) => void;
  onShopOwner: (id: string, v: boolean) => void;
  onLevel: (u: Profile) => void;
}) {
  const isCurrentUser = u.id === currentUserId;
  const canModify = !isCurrentUser && !u.is_super_admin;
  const lvl = u.level ?? 1;

  return (
    <div className="px-4 py-3 flex items-center gap-3 flex-wrap hover:bg-white/2 transition-colors">
      {/* Identity */}
      <div className="flex-1 min-w-[140px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-medium text-zinc-200 text-sm">{u.full_name || u.username || 'Névtelen'}</p>
          {u.is_super_admin && <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">SUPER</span>}
          {u.is_admin && !u.is_super_admin && <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">ADMIN</span>}
          {u.is_shop_owner && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Store className="w-2.5 h-2.5" />BOLT</span>}
          {u.is_banned && <span className="text-[9px] font-bold text-zinc-500 bg-zinc-500/10 px-1.5 py-0.5 rounded">TILTOTT</span>}
          {u.verified && <span className="text-[9px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">VER.</span>}
        </div>
        {u.username && <p className="text-[11px] text-zinc-600">@{u.username}</p>}
        <p className="text-[10px] text-zinc-700">{formatRelativeTime(u.created_at)}</p>
      </div>

      {/* Level badge */}
      <button
        onClick={() => canModify && onLevel(u)}
        disabled={!canModify}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all ${LEVEL_COLORS[lvl]} ${canModify ? 'hover:scale-105 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
      >
        {lvl} · {u.level_title || LEVEL_TITLES[lvl]}
        {canModify && <ChevronDown className="w-3 h-3 opacity-60" />}
      </button>

      {/* Actions */}
      {canModify && (
        <div className="flex items-center gap-1 flex-wrap">
          {isSuperAdmin && (
            u.is_admin
              ? <button onClick={() => onAdmin(u.id, false)} disabled={actionLoading === u.id}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 glass-pill px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                  <ShieldOff className="w-3 h-3" />Admin le
                </button>
              : <button onClick={() => onAdmin(u.id, true)} disabled={actionLoading === u.id}
                  className="text-[10px] text-amber-400 hover:text-amber-300 glass-pill px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />Admin
                </button>
          )}
          {isSuperAdmin && (
            u.is_shop_owner
              ? <button onClick={() => onShopOwner(u.id, false)} disabled={actionLoading === u.id + '-shop'}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 glass-pill px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                  <Store className="w-3 h-3" />Bolt le
                </button>
              : <button onClick={() => onShopOwner(u.id, true)} disabled={actionLoading === u.id + '-shop'}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 glass-pill px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                  <Store className="w-3 h-3" />Bolt jog
                </button>
          )}
          {u.verified
            ? <button onClick={() => onVerify(u.id, false)} disabled={actionLoading === u.id}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 glass-pill px-2 py-1 rounded-lg transition-colors">Verif. le</button>
            : <button onClick={() => onVerify(u.id, true)} disabled={actionLoading === u.id}
                className="text-[10px] text-teal-400 hover:text-teal-300 glass-pill px-2 py-1 rounded-lg transition-colors">Verifikál</button>
          }
          {u.is_banned
            ? <button onClick={() => onBan(u.id, false)} disabled={actionLoading === u.id}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 glass-pill px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3" />Felold
              </button>
            : <button onClick={() => onBan(u.id, true)} disabled={actionLoading === u.id}
                className="text-[10px] text-red-400 hover:text-red-300 glass-pill px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                <Ban className="w-3 h-3" />Tilt
              </button>
          }
        </div>
      )}
    </div>
  );
}

// ── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ report, actionLoading, onResolve, onBan }: {
  report: Report;
  actionLoading: string | null;
  onResolve: (id: string, status: 'resolved' | 'dismissed') => void;
  onBan: (id: string, ban: boolean) => void;
}) {
  return (
    <div className={`glass rounded-2xl p-4 border ${report.status === 'pending' ? 'border-amber-500/10' : 'border-white/5 opacity-60'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
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
            <p className="text-xs text-zinc-400"><span className="text-zinc-500">Érintett:</span> {report.reported_user.full_name || report.reported_user.username}</p>
          )}
          {report.reported_listing && (
            <p className="text-xs text-zinc-400"><span className="text-zinc-500">Hirdetés:</span> {report.reported_listing.title}</p>
          )}
          {report.description && (
            <p className="text-xs text-zinc-600 mt-1 italic">"{report.description}"</p>
          )}
        </div>
        {report.status === 'pending' && (
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button onClick={() => onResolve(report.id, 'resolved')} disabled={actionLoading === report.id}
              className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 glass-pill px-2.5 py-1.5 rounded-lg transition-colors">
              <CheckCircle className="w-3 h-3" />Elfogad
            </button>
            <button onClick={() => onResolve(report.id, 'dismissed')} disabled={actionLoading === report.id}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 glass-pill px-2.5 py-1.5 rounded-lg transition-colors">
              <XCircle className="w-3 h-3" />Elutasít
            </button>
            {report.reported_user_id && (
              <button onClick={() => onBan(report.reported_user_id!, true)} disabled={actionLoading === report.reported_user_id}
                className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 glass-pill px-2.5 py-1.5 rounded-lg transition-colors">
                <Ban className="w-3 h-3" />Tilt
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
