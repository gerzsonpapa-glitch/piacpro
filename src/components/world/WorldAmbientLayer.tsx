import type { ReactNode } from 'react';
import type { WorldZone } from '../../lib/worldZones';

export default function WorldAmbientLayer({ zone }: { zone: WorldZone | null }) {
  if (!zone) return null;
  return (
    <div
      className="world-ambient-layer fixed inset-0 pointer-events-none z-0"
      aria-hidden
      data-zone={zone.id}
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${zone.glow.replace('0.45', '0.08')} 0%, transparent 55%)`,
      }}
    />
  );
}

export function WorldZoneBadge({ zone, children }: { zone: WorldZone; children?: ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
      style={{ color: zone.color, background: zone.bg, border: `1px solid ${zone.border}`, boxShadow: `0 0 16px ${zone.glow}` }}
    >
      <span>{zone.emoji}</span>
      {children ?? zone.title}
    </div>
  );
}
