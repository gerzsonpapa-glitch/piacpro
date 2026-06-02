import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface LiveWorldStats {
  listings: number;
  auctions: number;
  jobs: number;
  donations: number;
  shops: number;
  producers: number;
  listingsToday: number;
  jobsToday: number;
  loading: boolean;
}

export interface LiveActivityItem {
  id: string;
  type: 'listing' | 'auction' | 'job' | 'donation';
  title: string;
  at: string;
}

const EMPTY: LiveWorldStats = {
  listings: 0,
  auctions: 0,
  jobs: 0,
  donations: 0,
  shops: 0,
  producers: 0,
  listingsToday: 0,
  jobsToday: 0,
  loading: true,
};

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useLiveWorldStats(pollMs = 60000) {
  const [stats, setStats] = useState<LiveWorldStats>(EMPTY);
  const [activity, setActivity] = useState<LiveActivityItem[]>([]);

  const refresh = useCallback(async () => {
    const today = startOfTodayIso();
    try {
      const [
        listingsRes,
        auctionsRes,
        jobsRes,
        donationsRes,
        shopsRes,
        producersRes,
        listingsTodayRes,
        jobsTodayRes,
        recentListings,
        recentJobs,
      ] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('listing_type', 'regular'),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('listing_type', 'auction'),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('donations').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('shops').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('producers').select('id', { count: 'exact', head: true }),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('created_at', today),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('created_at', today),
        supabase.from('listings').select('id, title, created_at, listing_type').eq('status', 'active').order('created_at', { ascending: false }).limit(4),
        supabase.from('jobs').select('id, title, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(2),
      ]);

      setStats({
        listings: listingsRes.count ?? 0,
        auctions: auctionsRes.count ?? 0,
        jobs: jobsRes.count ?? 0,
        donations: donationsRes.count ?? 0,
        shops: shopsRes.count ?? 0,
        producers: producersRes.count ?? 0,
        listingsToday: listingsTodayRes.count ?? 0,
        jobsToday: jobsTodayRes.count ?? 0,
        loading: false,
      });

      const feed: LiveActivityItem[] = [];
      for (const l of recentListings.data ?? []) {
        feed.push({
          id: `l-${l.id}`,
          type: l.listing_type === 'auction' ? 'auction' : 'listing',
          title: l.title,
          at: l.created_at,
        });
      }
      for (const j of recentJobs.data ?? []) {
        feed.push({ id: `j-${j.id}`, type: 'job', title: j.title, at: j.created_at });
      }
      feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setActivity(feed.slice(0, 6));
    } catch {
      setStats((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    const ch = supabase
      .channel('world-live-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, refresh)
      .subscribe();
    return () => {
      clearInterval(id);
      supabase.removeChannel(ch);
    };
  }, [refresh, pollMs]);

  return { stats, activity, refresh };
}
