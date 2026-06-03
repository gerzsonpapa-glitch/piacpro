import type { ReactNode } from 'react';
import { LiveWorldStatsContext, useLiveWorldStatsPolling } from '../hooks/useLiveWorldStats';

export function LiveWorldStatsProvider({ children }: { children: ReactNode }) {
  const value = useLiveWorldStatsPolling(60000);
  return (
    <LiveWorldStatsContext.Provider value={value}>
      {children}
    </LiveWorldStatsContext.Provider>
  );
}
