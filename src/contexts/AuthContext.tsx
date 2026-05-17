import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', currentUser.id);
    setUnreadCount(count || 0);
  }, []);

  const updateLastSeen = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', currentUser.id);
  }, []);

  // Realtime subscription for new messages → instantly update unread badge
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    refreshUnread();
    updateLastSeen();

    const channel = supabase
      .channel(`unread-messages-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=neq.${user.id}`,
      }, () => {
        refreshUnread();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, () => {
        refreshUnread();
      })
      .subscribe();

    // Fallback poll every 30s for last_seen + count sync
    const iv = setInterval(() => {
      refreshUnread();
      updateLastSeen();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(iv);
    };
  }, [user, refreshUnread, updateLastSeen]);

  // Update last_seen on user activity
  useEffect(() => {
    if (!user) return;
    const handleActivity = () => updateLastSeen();
    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [user, updateLastSeen]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  }

  async function signUp(email: string, password: string, username: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName },
        emailRedirectTo: 'https://www.piacpro.hu',
      },
    });
    const needsConfirmation = !error && !data.session;
    return { error: error?.message ?? null, needsConfirmation };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setUnreadCount(0);
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, unreadCount, refreshUnread, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
