import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { Donation } from '../lib/types';
import {
  Heart, Plus, Search, X, CheckCircle2, Baby, PawPrint,
  Users, Lightbulb, Package, MapPin, Clock, Target, ArrowRight,
  Activity, Zap, GraduationCap, Trophy, Church, Leaf,
  HandHeart, Wrench, MessageCircle, ExternalLink
} from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';

const CATEGORIES: { value: string; label: string; icon: React.ElementType }[] = [
  { value: '', label: 'Összes', icon: Heart },
  { value: 'gyerek', label: 'Gyerekek', icon: Baby },
  { value: 'allatvédelem', label: 'Állatvédelem', icon: PawPrint },
  { value: 'raszorulok', label: 'Rászorulók', icon: Users },
  { value: 'kozossegi', label: 'Közösségi', icon: Lightbulb },
  { value: 'egeszseg', label: 'Egészségügy', icon: Activity },
  { value: 'katasztrofa', label: 'Katasztrófa-segély', icon: Zap },
  { value: 'oktatás', label: 'Oktatás', icon: GraduationCap },
  { value: 'sport', label: 'Sport', icon: Trophy },
  { value: 'vallasi', label: 'Vallási', icon: Church },
  { value: 'kornyezet', label: 'Környezetvédelem', icon: Leaf },
  { value: 'egyeb', label: 'Egyéb', icon: Package },
];

function ProgressBar({ current, goal }: { current: number; goal: number }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function DonationCard({ donation }: { donation: Donation }) {
  const { navigate } = useRouter();
  const pct = donation.goal_amount > 0
    ? Math.min(Math.round((donation.current_amount / donation.goal_amount) * 100), 100)
    : 0;
  const image = donation.images?.[0];
  const catIcon = CATEGORIES.find((c) => c.value === donation.category);
  const CatIcon = catIcon?.icon ?? Heart;

  return (
    <button
      onClick={() => navigate(`/donations/${donation.id}`)}
      className="group glass-bubble rounded-3xl overflow-hidden text-left transition-all duration-300 hover:scale-[1.02] hover:bg-white/5 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        {image ? (
          <img src={image} alt={donation.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
        {donation.is_verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-500/90 px-2 py-1 rounded-lg text-white text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" />Hitelesített
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1 glass px-2 py-1 rounded-lg text-[10px] text-zinc-300">
          <CatIcon className="w-3 h-3" />{catIcon?.label ?? 'Egyéb'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-semibold text-zinc-100 leading-snug line-clamp-2 group-hover:text-rose-300 transition-colors">
            {donation.title}
          </h3>
          <p className="text-zinc-500 text-xs mt-1 line-clamp-2 leading-relaxed">{donation.description}</p>
        </div>

        <div className="mt-auto space-y-2">
          <ProgressBar current={donation.current_amount} goal={donation.goal_amount} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-400 font-bold text-sm">
                {donation.current_amount.toLocaleString('hu-HU')} Ft
              </p>
              {donation.goal_amount > 0 && (
                <p className="text-zinc-600 text-[10px]">
                  célból {donation.goal_amount.toLocaleString('hu-HU')} Ft — {pct}%
                </p>
              )}
            </div>
            <div className="text-right">
              {donation.location && (
                <p className="text-zinc-600 text-[10px] flex items-center gap-0.5 justify-end">
                  <MapPin className="w-2.5 h-2.5" />{donation.location}
                </p>
              )}
              <p className="text-zinc-700 text-[10px] flex items-center gap-0.5 justify-end mt-0.5">
                <Clock className="w-2.5 h-2.5" />{formatRelativeTime(donation.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function DonationsPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [totalRaised, setTotalRaised] = useState(0);
  const [recentOffers, setRecentOffers] = useState<any[]>([]);
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => { fetchDonations(); }, [query, category]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRecentOffers(); }, []);

  async function handleContactOffer(targetUserId: string) {
    if (!user) { navigate('/login'); return; }
    if (!targetUserId) { showToast('error', 'A felajánló nem azonosítható'); return; }
    if (targetUserId === user.id) { showToast('error', 'Saját felajánlásodra nem tudsz üzenni'); return; }
    // keresés mindkét irányban
    const { data: existing } = await supabase
      .from('conversations').select('id')
      .or(`and(buyer_id.eq.${user.id},seller_id.eq.${targetUserId}),and(buyer_id.eq.${targetUserId},seller_id.eq.${user.id})`)
      .is('listing_id', null)
      .maybeSingle();
    let convId = existing?.id ?? null;
    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations').insert({ buyer_id: user.id, seller_id: targetUserId, listing_id: null })
        .select('id').single();
      convId = newConv?.id ?? null;
    }
    if (convId) navigate(`/messages?conv=${convId}`);
    else showToast('error', 'Nem sikerült megnyitni a beszélgetést');
  }

  async function fetchRecentOffers() {
    const [{ data }, { count }] = await Promise.all([
      supabase.from('support_offers')
        .select('*, user:profiles(username, full_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase.from('support_offers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);
    setRecentOffers(data || []);
    setOffersCount(count ?? 0);
  }

  async function fetchDonations() {
    setLoading(true);
    let q = supabase
      .from('donations')
      .select('*, creator:profiles(*)')
      .eq('status', 'active')
      .eq('moderation_status', 'active')
      .order('is_verified', { ascending: false })
      .order('current_amount', { ascending: false });

    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (category) q = q.eq('category', category);

    const { data } = await q.limit(40);
    const list = (data || []) as Donation[];
    setDonations(list);
    setTotalRaised(list.reduce((acc, d) => acc + (d.current_amount || 0), 0));
    setLoading(false);
  }

  return (
    <div className="space-y-8">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass p-8 md:p-12">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-rose-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-pink-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-500/15 border border-rose-500/20 rounded-2xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <p className="text-rose-400 text-xs font-semibold uppercase tracking-widest">Adományozás</p>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">Segíts, ahol tudsz</h1>
              </div>
            </div>
            <p className="text-zinc-400 text-sm md:text-base max-w-lg leading-relaxed">
              Helyi adománygyűjtési kampányok — gyerekeknek, állatoknak, rászorulóknak és közösségi projekteknek.
            </p>
            {totalRaised > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-zinc-400 text-sm">
                  Összesen összegyűlt: <strong className="text-rose-300">{totalRaised.toLocaleString('hu-HU')} Ft</strong>
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 self-start md:self-center">
            <button
              onClick={() => navigate('/offers/create')}
              className="flex items-center gap-2.5 bg-teal-500/15 border border-teal-500/30 hover:bg-teal-500/25 text-teal-300 px-5 py-3 rounded-2xl font-semibold transition-all hover:scale-[1.02] whitespace-nowrap"
            >
              <HandHeart className="w-5 h-5" />
              Felajánlok valamit
            </button>
            {user && (
              <button
                onClick={() => navigate('/donations/create')}
                className="flex items-center gap-2.5 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 px-5 py-3 rounded-2xl font-semibold transition-all hover:scale-[1.02] whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Kampány indítása
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Search + Category filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés a kampányok között..."
            className="w-full pl-12 pr-10 py-3 glass-input rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setCategory(value === category ? '' : value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                category === value
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'glass-pill border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aktív kampány', value: donations.length, icon: Target, color: 'text-rose-400' },
          { label: 'Összegyűlt', value: `${totalRaised.toLocaleString('hu-HU')} Ft`, icon: Heart, color: 'text-pink-400' },
          { label: 'Hitelesített', value: donations.filter((d) => d.is_verified).length, icon: CheckCircle2, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-bubble rounded-2xl p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
            <p className={`font-bold text-lg ${color}`}>{value}</p>
            <p className="text-zinc-600 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Felajánlások szekció */}
      <section className="glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500/15 border border-teal-500/20 rounded-xl flex items-center justify-center">
              <HandHeart className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-200">Ingyenes felajánlások</h2>
              <p className="text-xs text-zinc-500">
                {offersCount > 0 ? `${offersCount} aktív felajánlás` : 'Tárgyak és szolgáltatások ingyen'} — nincs pénz, csak segítség
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/offers/create')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-xs font-semibold hover:bg-teal-500/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />Felajánlok
          </button>
        </div>

        {recentOffers.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <HandHeart className="w-10 h-10 text-zinc-700 mx-auto" />
            <p className="text-zinc-500 text-sm">Még nincs felajánlás — légy az első!</p>
            <button
              onClick={() => navigate('/offers/create')}
              className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-sm font-semibold hover:bg-teal-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />Felajánlok valamit ingyen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentOffers.map((o: any) => {
              const isItem = o.type === 'item';
              const isOwn = user?.id === o.user_id;
              return (
                <div key={o.id} onClick={() => navigate(`/offers/${o.id}`)} className="glass-bubble rounded-2xl p-3.5 flex items-start gap-3 group cursor-pointer hover:bg-white/3 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isItem ? 'bg-teal-500/10' : 'bg-blue-500/10'}`}>
                    {o.images?.[0]
                      ? <img src={o.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                      : isItem
                        ? <Package className="w-4 h-4 text-teal-400" />
                        : <Wrench className="w-4 h-4 text-blue-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200 line-clamp-1">{o.title}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1">{o.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-600">
                      <span className={`px-1.5 py-0.5 rounded-md ${isItem ? 'bg-teal-500/10 text-teal-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {isItem ? 'Tárgy' : 'Szolgáltatás'}
                      </span>
                      {o.location && <span>{o.location}</span>}
                      <span>{(o.user?.full_name || o.user?.username) ?? 'Ismeretlen'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {o.donation_id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/donations/${o.donation_id}`); }}
                        title="Kampány megtekintése"
                        className="p-1.5 rounded-lg glass-bubble hover:bg-white/10 text-zinc-500 hover:text-zinc-200 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isOwn && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleContactOffer(o.user_id); }}
                        title="Üzenet a felajánlónak"
                        className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 hover:text-teal-400 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-bubble rounded-3xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-1.5 bg-white/5 rounded" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center">
          <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-medium">Nincsenek kampányok</p>
          <p className="text-zinc-600 text-sm mt-1 mb-6">Légy az első, aki elindít egy adománygyűjtést!</p>
          {user && (
            <button
              onClick={() => navigate('/donations/create')}
              className="flex items-center gap-2 mx-auto bg-rose-500/15 border border-rose-500/30 text-rose-300 px-6 py-3 rounded-xl font-medium hover:bg-rose-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Kampány indítása
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-zinc-500 text-sm">{donations.length} kampány</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {donations.map((d) => <DonationCard key={d.id} donation={d} />)}
          </div>
        </>
      )}

      {/* CTA for non-users */}
      {!user && (
        <section className="glass rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-rose-500/5 rounded-full blur-[60px]" />
          <div className="relative">
            <Heart className="w-10 h-10 text-rose-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Indíts kampányt!</h2>
            <p className="text-zinc-400 mt-2 max-w-md mx-auto text-sm leading-relaxed">
              Regisztrálj, és percek alatt elindíthatod a saját adománygyűjtési kampányodat.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold rounded-xl hover:scale-[1.02] transition-all"
              >
                Regisztráció
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 glass-pill text-zinc-400 font-medium rounded-xl hover:text-zinc-200 transition-colors"
              >
                Bejelentkezés
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
