import { PRIMARY_WORLD_ZONES, SECONDARY_WORLD_ZONES, type WorldZone } from '../../../lib/worldZones';

export interface FantasyFloatingSpot {
  zoneId: string;
  top: string;
  left: string;
  scale?: number;
}

/** Kihelyezett menü — GTA térkép-blip szerű pozíciók (%, responsive). */
export const FANTASY_FLOATING_SPOTS: FantasyFloatingSpot[] = [
  { zoneId: 'marketplace', top: '58%', left: '22%', scale: 1.05 },
  { zoneId: 'auction', top: '42%', left: '68%', scale: 1.08 },
  { zoneId: 'jobs', top: '72%', left: '48%' },
  { zoneId: 'community', top: '28%', left: '38%' },
  { zoneId: 'business', top: '65%', left: '78%' },
  { zoneId: 'donations', top: '18%', left: '72%', scale: 0.95 },
  { zoneId: 'producers', top: '82%', left: '18%', scale: 0.95 },
];

export function getFantasyZones(): WorldZone[] {
  return [...PRIMARY_WORLD_ZONES, ...SECONDARY_WORLD_ZONES];
}

export function findFantasyZone(id: string): WorldZone | undefined {
  return getFantasyZones().find((z) => z.id === id);
}
