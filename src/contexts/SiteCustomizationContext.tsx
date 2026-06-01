import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { translateMessage } from '../lib/hu';
import { useAuth } from './AuthContext';
import { isSiteDeveloper } from '../lib/developer';
import {
  applySiteTheme,
  mergeSiteConfig,
  DEFAULT_SITE_CONFIG,
  loadConfigFromLocalStorage,
  saveConfigToLocalStorage,
  formatSiteSaveError,
  type SiteCustomizationConfig,
} from '../lib/siteCustomization';

interface SiteCustomizationContextType {
  config: SiteCustomizationConfig;
  loading: boolean;
  canEdit: boolean;
  devModeActive: boolean;
  setDevModeActive: (v: boolean) => void;
  saveConfig: (next: SiteCustomizationConfig) => Promise<{ error: string | null; usedLocalFallback?: boolean }>;
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

  const applyConfig = useCallback((merged: SiteCustomizationConfig) => {
    setConfig(merged);
    applySiteTheme(merged);
  }, []);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_customization')
      .select('config')
      .eq('id', 'global')
      .maybeSingle();

    if (!error && data?.config) {
      applyConfig(mergeSiteConfig(data.config));
      saveConfigToLocalStorage(mergeSiteConfig(data.config));
    } else {
      const local = loadConfigFromLocalStorage();
      if (local) applyConfig(local);
      else applyConfig(DEFAULT_SITE_CONFIG);
    }
    setLoading(false);
  }, [applyConfig]);

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

  async function saveConfig(
    next: SiteCustomizationConfig,
  ): Promise<{ error: string | null; usedLocalFallback?: boolean }> {
    if (!canEdit || !user) {
      return { error: 'Nincs jogosultságod a weboldal szerkesztéséhez.' };
    }

    const payload = { ...next, version: 2 };

    // 1) RPC (legmegbízhatóbb)
    const { error: rpcError } = await supabase.rpc('save_site_customization', {
      p_config: payload,
    });

    if (!rpcError) {
      applyConfig(payload);
      saveConfigToLocalStorage(payload);
      return { error: null };
    }

    const rpcMsg = rpcError.message || '';

    // 2) Közvetlen update / insert
    if (!rpcMsg.includes('Could not find the function') && !rpcMsg.includes('schema cache')) {
      const { data: row } = await supabase
        .from('site_customization')
        .select('id')
        .eq('id', 'global')
        .maybeSingle();

      let tableError = null;
      if (row) {
        const res = await supabase
          .from('site_customization')
          .update({
            config: payload,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('id', 'global');
        tableError = res.error;
      } else {
        const res = await supabase.from('site_customization').insert({
          id: 'global',
          config: payload,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        });
        tableError = res.error;
      }

      if (!tableError) {
        applyConfig(payload);
        saveConfigToLocalStorage(payload);
        return { error: null };
      }
    }

    // 3) Helyi mentés ha DB nem elérhető
    const isDbMissing =
      rpcMsg.includes('does not exist') ||
      rpcMsg.includes('site_customization') ||
      rpcMsg.includes('Could not find');

    if (isDbMissing || rpcMsg.includes('permission') || rpcMsg.includes('row-level')) {
      applyConfig(payload);
      saveConfigToLocalStorage(payload);
      return {
        error: null,
        usedLocalFallback: isDbMissing,
      };
    }

    return { error: formatSiteSaveError(translateMessage(rpcMsg)) };
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
