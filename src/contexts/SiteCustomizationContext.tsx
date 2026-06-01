import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { isSiteDeveloper } from '../lib/developer';
import {
  applySiteTheme,
  mergeSiteConfig,
  DEFAULT_SITE_CONFIG,
  type SiteCustomizationConfig,
} from '../lib/siteCustomization';

interface SiteCustomizationContextType {
  config: SiteCustomizationConfig;
  loading: boolean;
  canEdit: boolean;
  devModeActive: boolean;
  setDevModeActive: (v: boolean) => void;
  saveConfig: (next: SiteCustomizationConfig) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
}

const DEV_MODE_KEY = 'piacpro_developer_mode';

const SiteCustomizationContext = createContext<SiteCustomizationContextType | undefined>(undefined);

export function SiteCustomizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const canEdit = isSiteDeveloper(user);
  const [config, setConfig] = useState<SiteCustomizationConfig>(DEFAULT_SITE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [devModeActive, setDevModeActiveState] = useState(() => {
    try {
      return localStorage.getItem(DEV_MODE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const setDevModeActive = useCallback(
    (v: boolean) => {
      if (!canEdit) return;
      setDevModeActiveState(v);
      try {
        localStorage.setItem(DEV_MODE_KEY, v ? '1' : '0');
      } catch {
        /* ignore */
      }
    },
    [canEdit],
  );

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_customization')
      .select('config')
      .eq('id', 'global')
      .maybeSingle();

    if (!error && data?.config) {
      const merged = mergeSiteConfig(data.config);
      setConfig(merged);
      applySiteTheme(merged);
    } else {
      applySiteTheme(DEFAULT_SITE_CONFIG);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('site-customization')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'site_customization' },
        () => {
          refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    if (!canEdit && devModeActive) setDevModeActiveState(false);
  }, [canEdit, devModeActive]);

  async function saveConfig(next: SiteCustomizationConfig): Promise<{ error: string | null }> {
    if (!canEdit || !user) return { error: 'Nincs jogosultságod a weboldal szerkesztéséhez.' };

    const { error } = await supabase
      .from('site_customization')
      .upsert(
        {
          id: 'global',
          config: next,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: 'id' },
      );

    if (error) return { error: error.message };
    setConfig(next);
    applySiteTheme(next);
    return { error: null };
  }

  return (
    <SiteCustomizationContext.Provider
      value={{
        config,
        loading,
        canEdit,
        devModeActive: canEdit && devModeActive,
        setDevModeActive,
        saveConfig,
        refresh,
      }}
    >
      {children}
    </SiteCustomizationContext.Provider>
  );
}

export function useSiteCustomization() {
  const ctx = useContext(SiteCustomizationContext);
  if (!ctx) throw new Error('useSiteCustomization must be used within SiteCustomizationProvider');
  return ctx;
}
