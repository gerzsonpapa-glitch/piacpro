import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from '../lib/router';
import type { Profile, Listing, SellerBadge, ListingRating } from '../lib/types';
import ListingCard from '../components/ListingCard';
import { formatRelativeTime, HUNGARIAN_COUNTIES, getOnlineStatus, getOnlineLabel, RANK_CONFIG } from '../lib/utils';
import { User, MapPin, Calendar, Save, X, Phone, Mail, Star, Shield, ShieldCheck, Award, MessageCircle, TrendingUp, Package, CheckCircle, AlertTriangle, UserX, Camera, CreditCard as Edit3, FileText, Gavel, Settings, ThumbsUp, Heart } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<number, { title: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  1: { title: 'Kezdő',      color: 'text-zinc-400',    bg: 'bg-zinc-500/10',    border: 'border-zinc-500/20',    icon: User },
  2: { title: 'Aktív',      color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: TrendingUp },
  3: { title: 'Tapasztalt', color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    icon: Package },
  4: { title: 'Megbízható', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
  5: { title: 'VIP',        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: Award },
};

function LevelBadge({ level, title }: { level: number; title?: string | null }) {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG[1];
  const LIcon = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <LIcon className="w-3.5 h-3.5" />
      Szint {level} · {title || cfg.title}
    </div>
  );
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
      ))}
    </div>
  );
}

function BadgeDisplay({ badge }: { badge: SellerBadge }) {
  const configs = {
    reliable:        { label: 'Megbízható eladó',      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', Icon: ShieldCheck },
    neutral:         { label: 'Semleges eladó',         color: 'text-zinc-400',    bg: 'bg-zinc-500/10 border-zinc-500/20',       Icon: User },
    low_reliability: { label: 'Alacsony megbízhatóság', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         Icon: AlertTriangle },
  } as const;
  const cfg = configs[badge.badge_type] ?? configs.neutral;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium ${cfg.bg} ${cfg.color}`}>
      <cfg.Icon className="w-4 h-4" />
      {cfg.label}
      {badge.total_ratings > 0 && (
        <span className="opacity-60 text-xs">({badge.avg_score.toFixed(1)} · {badge.total_ratings} ért.)</span>
      )}
    </div>
  );
}

function AvatarImage({ src, size = 'lg', name }: { src?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl'; name?: string | null }) {
  const [err, setErr] = useState(false);
  const dim = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-20 h-20', xl: 'w-24 h-24' }[size];
  const iconDim = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-10 h-10', xl: 'w-12 h-12' }[size];

  // initials fallback
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : null;

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setErr(true)}
        className={`${dim} object-cover rounded-2xl`}
      />
    );
  }
  if (initials) {
    return (
      <div className={`${dim} glass-bubble rounded-2xl flex items-center justify-center font-bold text-emerald-400 select-none`}
        style={{ fontSize: size === 'lg' || size === 'xl' ? '1.25rem' : '0.7rem' }}>
        {initials}
      </div>
    );
  }
  return (
    <div className={`${dim} glass-bubble rounded-2xl flex items-center justify-center`}>
      <User className={`${iconDim} text-emerald-400`} />
    </div>
  );
}

type ListingTab = 'active' | 'sold' | 'auctions' | 'all' | 'favorites';

// ─── main component ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, profile: authProfile } = useAuth();
  const { showToast } = useNotification();
  const { params, navigate } = useRouter();
  const profileId = params.id;
  const isOwnProfile = user?.id === profileId;
  const viewerIsInsuranceAgent = authProfile?.is_insurance_agent === true || authProfile?.is_admin === true;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [badge, setBadge] = useState<SellerBadge | null>(null);
  const [ratings, setRatings] = useState<ListingRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [listingTab, setListingTab] = useState<ListingTab>('active');
  const [favorites, setFavorites] = useState<Listing[]>([]);

  const [ovbLoading, setOvbLoading] = useState(false);

  async function toggleOvbClient(grant: boolean) {
    if (!user || !profileId) return;
    setOvbLoading(true);
    const { error } = await supabase.from('profiles').update({
      is_ovb_client: grant,
      ovb_client_added_by: grant ? user.id : null,
      ovb_client_added_at: grant ? new Date().toISOString() : null,
    }).eq('id', profileId);
    if (error) {
      showToast('error', 'Hiba', error.message);
    } else {
      setProfile((prev) => prev ? { ...prev, is_ovb_client: grant, ovb_client_added_by: grant ? user.id : null } : prev);
      showToast('success', grant ? 'OVB ügyfél jelvény hozzáadva' : 'OVB ügyfél jelvény eltávolítva');
    }
    setOvbLoading(false);
  }

  // edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileId) {
      setLoading(true);
      setNotFound(false);
      setProfile(null);
      setEditing(false);
      fetchAll();
    }
  }, [profileId]);

  async function fetchAll() {
    const [profileRes, listingsRes, badgeRes, ratingsRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).maybeSingle(),
      supabase.from('listings').select('*, seller:profiles(*)')
        .eq('seller_id', profileId).neq('status', 'deleted').order('created_at', { ascending: false }),
      supabase.from('seller_badges').select('*').eq('seller_id', profileId).maybeSingle(),
      supabase.from('listing_ratings').select('*, rater:profiles(id, username, full_name, avatar_url)')
        .eq('rated_id', profileId).order('created_at', { ascending: false }).limit(20),
      supabase.from('listing_reviews').select('*, reviewer:profiles(id, username, full_name, avatar_url), listing:listings(id, title)')
        .eq('reviewed_id', profileId).order('created_at', { ascending: false }).limit(30),
    ]);

    if (!profileRes.data) {
      setNotFound(true);
    } else {
      setProfile(profileRes.data);
    }
    setListings(listingsRes.data || []);
    setBadge(badgeRes.data);

    // Fetch favorites only for own profile
    if (user?.id === profileId) {
      const { data: favData } = await supabase
        .from('favorites')
        .select('listing_id, listings(*)')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });
      const favListings = favData
        ?.map((d: any) => d.listings)
        .filter(Boolean)
        .map((l: any) => ({ ...l, is_favorited: true })) || [];
      setFavorites(favListings);
    }

    // Merge both rating sources, deduplicate by id, sort by date
    const legacyRatings = (ratingsRes.data || []).map((r: ListingRating) => ({ ...r, _source: 'legacy' as const }));
    const newReviews = (reviewsRes.data || []).map((r: import('../lib/types').ListingReview) => ({
      id: r.id,
      listing_id: r.listing_id || '',
      rater_id: r.reviewer_id,
      rated_id: r.reviewed_id,
      score: r.score,
      comment: r.comment,
      created_at: r.created_at,
      rater: r.reviewer,
      recommended: r.recommended,
      _source: 'new' as const,
    }));
    const merged = [...legacyRatings, ...newReviews].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setRatings(merged as ListingRating[]);
    setLoading(false);
  }

  function startEditing() {
    if (!profile) return;
    setEditName(profile.full_name || '');
    setEditUsername(profile.username || '');
    setEditBio(profile.bio || '');
    setEditLocation(profile.location || '');
    setEditPhone(profile.phone || '');
    setEditEmail(profile.contact_email || '');
    setAvatarPreview(null);
    setUsernameError('');
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setAvatarPreview(null);
    setUsernameError('');
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'A kép mérete maximum 2 MB lehet.');
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      showToast('error', 'Kép feltöltése sikertelen.', error.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    // add cache-bust so the browser refreshes the image
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarPreview(url);

    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
    setProfile((prev) => prev ? { ...prev, avatar_url: urlData.publicUrl } : prev);
    setUploadingAvatar(false);
    showToast('success', 'Profilkép frissítve!');
  }

  async function saveProfile() {
    if (!user) return;
    setUsernameError('');

    // Username uniqueness check (exclude own record)
    if (editUsername.trim()) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', editUsername.trim())
        .neq('id', user.id)
        .maybeSingle();
      if (existing) {
        setUsernameError('Ez a felhasználónév már foglalt.');
        return;
      }
    }

    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editName.trim(),
      username: editUsername.trim() || null,
      bio: editBio.trim(),
      location: editLocation,
      phone: editPhone.trim(),
      contact_email: editEmail.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    if (error) {
      showToast('error', 'Mentés sikertelen.', error.message);
    } else {
      setProfile((prev) => prev ? {
        ...prev,
        full_name: editName.trim(),
        username: editUsername.trim() || null,
        bio: editBio.trim(),
        location: editLocation,
        phone: editPhone.trim(),
        contact_email: editEmail.trim(),
      } : prev);
      showToast('success', 'Profil mentve!');
      setEditing(false);
    }
    setSaving(false);
  }

  // ── loading / not-found states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-64 glass-bubble rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 glass-bubble rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-5">
        <div className="w-20 h-20 glass-bubble rounded-3xl flex items-center justify-center mx-auto">
          <UserX className="w-10 h-10 text-zinc-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-200 mb-2">Felhasználó nem található</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Ez a profil nem létezik, vagy törölték.
          </p>
        </div>
        <button onClick={() => navigate('/')}
          className="px-6 py-3 glass-pill-active text-emerald-300 font-medium rounded-2xl text-sm hover:scale-[1.02] transition-all">
          Vissza a főoldalra
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const activeListings   = listings.filter((l) => l.status === 'active' && l.listing_type !== 'auction');
  const auctionListings  = listings.filter((l) => l.listing_type === 'auction');
  const soldListings     = listings.filter((l) => l.status === 'sold');
  const displayedListings =
    listingTab === 'active'    ? activeListings :
    listingTab === 'sold'      ? soldListings :
    listingTab === 'auctions'  ? auctionListings :
    listingTab === 'favorites' ? favorites :
    listings;

  const level = profile.level ?? 1;
  const onlineStatus = getOnlineStatus(profile.last_seen);
  const displayName = profile.full_name || profile.username || 'Névtelen felhasználó';

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── PROFILE HEADER ─────────────────────────────────────────── */}
      <div className="glass rounded-3xl overflow-hidden">
        {/* Cover gradient */}
        <div className="h-28 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507]/60 to-transparent" />
        </div>

        <div className="px-6 pb-6 -mt-14 relative">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl ring-4 ring-[#050507] overflow-hidden">
                <AvatarImage
                  src={avatarPreview || profile.avatar_url}
                  size="xl"
                  name={displayName}
                />
              </div>

              {/* Online dot */}
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#050507] ${
                onlineStatus === 'online' ? 'bg-emerald-400' :
                onlineStatus === 'recently' ? 'bg-amber-400' : 'bg-zinc-600'
              }`} />

              {/* Verified badge */}
              {profile.verified && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#050507]">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              {/* Avatar upload overlay — own profile only */}
              {isOwnProfile && editing && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploadingAvatar
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Camera className="w-6 h-6 text-white" />
                  }
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pb-1">
              {isOwnProfile ? (
                editing ? (
                  <>
                    <button onClick={saveProfile} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 glass-pill-active text-emerald-300 text-sm font-medium rounded-xl transition-all disabled:opacity-60 hover:scale-[1.02]">
                      <Save className="w-4 h-4" />{saving ? 'Mentés...' : 'Mentés'}
                    </button>
                    <button onClick={cancelEditing}
                      className="flex items-center gap-1.5 px-4 py-2 glass-pill text-zinc-400 text-sm font-medium rounded-xl hover:text-zinc-200 transition-colors">
                      <X className="w-4 h-4" />Mégse
                    </button>
                  </>
                ) : (
                  <button onClick={startEditing}
                    className="flex items-center gap-1.5 px-4 py-2 glass-pill text-zinc-300 text-sm font-medium rounded-xl hover:bg-white/10 transition-colors">
                    <Settings className="w-4 h-4 text-emerald-400" />Profil szerkesztése
                  </button>
                )
              ) : user && (
                <button onClick={() => navigate('/messages')}
                  className="flex items-center gap-1.5 px-4 py-2 glass-pill text-zinc-300 text-sm font-medium rounded-xl hover:bg-white/10 transition-colors">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />Üzenet küldése
                </button>
              )}
              {viewerIsInsuranceAgent && user && (
                profile?.is_ovb_client
                  ? <button onClick={() => toggleOvbClient(false)} disabled={ovbLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:scale-[1.02]"
                      style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
                      <ShieldCheck className="w-4 h-4" />OVB ügyfél
                    </button>
                  : <button onClick={() => toggleOvbClient(true)} disabled={ovbLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:scale-[1.02]"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                      <Shield className="w-4 h-4" />OVB jelvény adása
                    </button>
              )}
            </div>
          </div>

          {/* Name + badges */}
          <div className="mt-4">
            {editing ? (
              /* ── EDIT FORM ─────────────────────────────────────── */
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5">
                    <Camera className="w-3 h-3" />Profilkép módosításához kattints a képre
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Teljes név</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      placeholder="Pl. Kovács János" maxLength={80}
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Felhasználónév</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                      <input type="text" value={editUsername} onChange={(e) => { setEditUsername(e.target.value); setUsernameError(''); }}
                        placeholder="felhasznalonev" maxLength={30}
                        className={`w-full pl-7 pr-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm ${usernameError ? 'ring-1 ring-red-500/50' : ''}`} />
                    </div>
                    {usernameError && <p className="text-xs text-red-400 mt-1">{usernameError}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />Bemutatkozás
                  </label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)}
                    rows={3} maxLength={300} placeholder="Írj pár szót magadról, mit árulsz, hogyan kommunikálsz..."
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none text-sm leading-relaxed" />
                  <p className="text-right text-[10px] text-zinc-600 mt-0.5">{editBio.length}/300</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />Helyszín
                    </label>
                    <select value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 focus:outline-none text-sm">
                      <option value="">Válassz megyét</option>
                      {HUNGARIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />Telefon
                    </label>
                    <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+36 30 000 0000"
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />Kapcsolati email
                    </label>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@pelda.hu"
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm" />
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed">
                  A telefonszám és email csak akkor látható mások számára, ha azt a hirdetéseidben is megadod.
                </p>
              </div>
            ) : (
              /* ── VIEW MODE ─────────────────────────────────────── */
              <>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-zinc-100 leading-tight">{displayName}</h1>
                    {profile.username && profile.full_name && (
                      <p className="text-zinc-500 text-sm mt-0.5">@{profile.username}</p>
                    )}
                  </div>
                </div>

                {/* OVB Insurance Agent banner */}
                {profile.is_insurance_agent && (
                  <div className="mb-3 flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, #0f1e2e 0%, #0a1520 100%)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                      <ShieldCheck className="w-5 h-5" style={{ color: '#60a5fa' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>
                          Hitelesített biztosítási tanácsadó
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' }}>
                          OVB
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                        {profile.insurance_agent_title || 'Pénzügyi tanácsadó'} · {profile.insurance_company || 'OVB'} · Ellenőrzött és hitelesített profil
                      </p>
                    </div>
                  </div>
                )}

                {/* Badges row */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <LevelBadge level={level} title={profile.level_title} />
                  {profile.verified && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />Ellenőrzött
                    </div>
                  )}
                  {profile.is_insurance_agent && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold"
                      style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)', color: '#60a5fa' }}>
                      <ShieldCheck className="w-3.5 h-3.5" />OVB Biztosítói tanácsadó
                    </div>
                  )}
                  {profile.is_ovb_client && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold"
                      style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: '#34d399' }}>
                      <ShieldCheck className="w-3.5 h-3.5" />OVB ügyfél
                    </div>
                  )}
                  {/* Online status */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                    onlineStatus === 'online'   ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    onlineStatus === 'recently' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                  'glass-pill text-zinc-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      onlineStatus === 'online' ? 'bg-emerald-400 animate-pulse' :
                      onlineStatus === 'recently' ? 'bg-amber-400' : 'bg-zinc-600'
                    }`} />
                    {getOnlineLabel(profile.last_seen)}
                  </span>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="mt-3 text-zinc-300 text-sm leading-relaxed max-w-xl">{profile.bio}</p>
                )}

                {/* Meta chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.location && (
                    <span className="flex items-center gap-1 glass-pill px-3 py-1 rounded-lg text-xs text-zinc-400">
                      <MapPin className="w-3 h-3 text-emerald-400" />{profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 glass-pill px-3 py-1 rounded-lg text-xs text-zinc-400">
                    <Calendar className="w-3 h-3 text-emerald-400" />{formatRelativeTime(profile.created_at)} óta tag
                  </span>
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-1 glass-pill px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-emerald-300 transition-colors">
                      <Phone className="w-3 h-3 text-emerald-400" />{profile.phone}
                    </a>
                  )}
                  {profile.contact_email && (
                    <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-1 glass-pill px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-emerald-300 transition-colors">
                      <Mail className="w-3 h-3 text-emerald-400" />{profile.contact_email}
                    </a>
                  )}
                </div>

                {/* Rang badge */}
                {profile && (profile.rank_level ?? 1) >= 1 && (() => {
                  const cfg = RANK_CONFIG[profile.rank_level ?? 1] ?? RANK_CONFIG[1];
                  return (
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        <Award className="w-4 h-4" />
                        {profile.rank_title || cfg.title}
                      </span>
                      {profile.total_sales > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-xs text-zinc-400">
                          <Package className="w-3 h-3" />
                          {profile.total_sales} sikeres eladás
                        </span>
                      )}
                      {(profile.positive_ratio ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-xs text-zinc-400">
                          <ThumbsUp className="w-3 h-3 text-emerald-400" />
                          {profile.positive_ratio}% pozitív
                        </span>
                      )}
                    </div>
                  );
                })()}
                {/* Seller badge (legacy) */}
                {badge && <div className="mt-2"><BadgeDisplay badge={badge} /></div>}
              </>
            )}
          </div>

          {/* Stats */}
          {!editing && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/5">
              <div className="glass-subtle rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{activeListings.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Aktív hirdetés</p>
              </div>
              <div className="glass-subtle rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{soldListings.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Eladott</p>
              </div>
              <div className="glass-subtle rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-amber-400">{auctionListings.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Aukciók</p>
              </div>
              <div className="glass-subtle rounded-2xl p-3 text-center">
                {(profile?.avg_rating ?? 0) > 0 || (badge && badge.total_ratings > 0) ? (
                  <>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-2xl font-bold text-amber-400">
                        {(profile?.avg_rating ?? badge?.avg_score ?? 0).toFixed(1)}
                      </p>
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 mb-0.5" />
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {(profile?.total_reviews ?? badge?.total_ratings ?? 0)} értékelés
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-zinc-600">—</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Nincs értékelés</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LISTINGS ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold">Hirdetések</h2>
          <div className="flex flex-wrap gap-1">
            {([
              { key: 'active',   label: 'Aktív',      count: activeListings.length },
              { key: 'auctions', label: 'Aukciók',    count: auctionListings.length },
              { key: 'sold',     label: 'Eladott',    count: soldListings.length },
              { key: 'all',      label: 'Mind',       count: listings.length },
              ...(isOwnProfile ? [{ key: 'favorites', label: 'Kedvencek', count: favorites.length }] : []),
            ] as { key: ListingTab; label: string; count: number }[]).map(({ key, label, count }) => (
              <button key={key} onClick={() => setListingTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  listingTab === key ? 'glass-pill-active text-emerald-300' : 'glass-pill text-zinc-400 hover:text-zinc-200'
                }`}>
                {key === 'favorites' && <Heart className="w-3 h-3" />}
                {label}
                {count > 0 && <span className="opacity-60 ml-0.5">({count})</span>}
              </button>
            ))}
          </div>
        </div>

        {displayedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-14 glass rounded-3xl">
            <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">
              {listingTab === 'active'    ? 'Nincs aktív hirdetés' :
               listingTab === 'sold'      ? 'Nincs eladott hirdetés' :
               listingTab === 'auctions'  ? 'Nincs aukció' :
               listingTab === 'favorites' ? 'Még nincs kedvenc hirdetés' :
               'Nincs hirdetés'}
            </p>
            {isOwnProfile && listingTab === 'active' && (
              <button onClick={() => navigate('/create')}
                className="mt-4 px-5 py-2 glass-pill-active text-emerald-300 text-sm font-medium rounded-xl transition-all hover:scale-[1.02]">
                + Hirdetés feladása
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RATINGS ────────────────────────────────────────────────── */}
      {ratings.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            Értékelések
            <span className="text-sm font-normal text-zinc-500">({ratings.length})</span>
            {(profile?.avg_rating ?? 0) > 0 && (
              <div className="ml-auto flex items-center gap-1.5">
                <StarRating score={profile?.avg_rating ?? 0} />
                <span className="text-sm font-semibold text-amber-400">{(profile?.avg_rating ?? 0).toFixed(1)}</span>
              </div>
            )}
          </h2>
          <div className="space-y-3">
            {ratings.map((rating) => {
              const recommended = (rating as ListingRating & { recommended?: boolean }).recommended;
              return (
                <div key={rating.id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AvatarImage
                        src={rating.rater?.avatar_url}
                        size="sm"
                        name={rating.rater?.full_name || rating.rater?.username}
                      />
                      <div>
                        <p className="font-medium text-sm text-zinc-200">
                          {rating.rater?.full_name || rating.rater?.username || 'Névtelen'}
                        </p>
                        <div className="flex items-center gap-2">
                          <StarRating score={rating.score} />
                          {recommended === true && (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
                              <ThumbsUp className="w-2.5 h-2.5" />Ajánlott
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-600 flex-shrink-0">{formatRelativeTime(rating.created_at)}</span>
                  </div>
                  {rating.comment && (
                    <p className="text-zinc-400 text-sm mt-2.5 leading-relaxed pl-11">{rating.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
