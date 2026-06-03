import type { HomeVariantId } from './homeVariants';

export interface BuildingHotspotLayout {
  zoneId: string;
  top: string;
  left: string;
  width: string;
  height: string;
  /** CSS clip-path — az épület sziluettje */
  clipPath: string;
  zIndex?: number;
  objectPosition?: string;
}

export interface BuildingSceneLayout {
  sceneBg: { jpg: string; webp: string };
  objectPosition?: string;
  hotspots: BuildingHotspotLayout[];
}

const HUB = { jpg: '/zones/hub.jpg', webp: '/zones/hub.webp' };
const MARKET = { jpg: '/zones/marketplace.jpg', webp: '/zones/marketplace.webp' };

/** Épület-alakú hotspot pozíciók skinenként — mindegyik más elrendezés + forma */
export const HOME_BUILDING_LAYOUTS: Record<
  Exclude<HomeVariantId, 'city' | 'fantasy'>,
  BuildingSceneLayout
> = {
  isometric: {
    sceneBg: HUB,
    objectPosition: 'center 42%',
    hotspots: [
      { zoneId: 'marketplace', top: '38%', left: '8%', width: '22%', height: '42%', clipPath: 'polygon(8% 100%, 92% 100%, 100% 28%, 0% 22%)', zIndex: 3 },
      { zoneId: 'auction', top: '22%', left: '62%', width: '18%', height: '38%', clipPath: 'polygon(0% 100%, 100% 100%, 88% 18%, 12% 12%)', zIndex: 4 },
      { zoneId: 'jobs', top: '52%', left: '38%', width: '20%', height: '36%', clipPath: 'polygon(5% 100%, 95% 100%, 100% 30%, 0% 25%)', zIndex: 2 },
      { zoneId: 'community', top: '18%', left: '28%', width: '16%', height: '32%', clipPath: 'polygon(10% 100%, 90% 100%, 100% 20%, 0% 15%)', zIndex: 5 },
      { zoneId: 'business', top: '48%', left: '72%', width: '20%', height: '40%', clipPath: 'polygon(0% 100%, 100% 100%, 92% 22%, 8% 18%)', zIndex: 3 },
      { zoneId: 'donations', top: '8%', left: '78%', width: '14%', height: '28%', clipPath: 'polygon(12% 100%, 88% 100%, 100% 25%, 0% 20%)', zIndex: 6 },
      { zoneId: 'producers', top: '62%', left: '4%', width: '18%', height: '30%', clipPath: 'polygon(0% 100%, 100% 100%, 90% 20%, 10% 15%)', zIndex: 2 },
    ],
  },
  neon: {
    sceneBg: MARKET,
    objectPosition: 'center 60%',
    hotspots: [
      { zoneId: 'marketplace', top: '30%', left: '6%', width: '14%', height: '55%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)', objectPosition: 'center 40%' },
      { zoneId: 'auction', top: '18%', left: '24%', width: '12%', height: '62%', clipPath: 'polygon(5% 100%, 95% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'jobs', top: '35%', left: '42%', width: '13%', height: '50%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'community', top: '12%', left: '58%', width: '11%', height: '58%', clipPath: 'polygon(8% 100%, 92% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'business', top: '28%', left: '72%', width: '15%', height: '52%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'donations', top: '8%', left: '86%', width: '10%', height: '45%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'producers', top: '55%', left: '88%', width: '10%', height: '38%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
    ],
  },
  medieval: {
    sceneBg: { jpg: '/zones/donations.jpg', webp: '/zones/donations.webp' },
    objectPosition: 'center 50%',
    hotspots: [
      { zoneId: 'marketplace', top: '42%', left: '12%', width: '26%', height: '38%', clipPath: 'polygon(0% 100%, 100% 100%, 92% 8%, 50% 0%, 8% 8%)' },
      { zoneId: 'auction', top: '28%', left: '48%', width: '22%', height: '36%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 12%, 50% 0%, 0% 12%)' },
      { zoneId: 'jobs', top: '58%', left: '38%', width: '24%', height: '32%', clipPath: 'polygon(5% 100%, 95% 100%, 100% 15%, 0% 15%)' },
      { zoneId: 'community', top: '20%', left: '18%', width: '20%', height: '34%', clipPath: 'polygon(0% 100%, 100% 100%, 90% 10%, 10% 10%)' },
      { zoneId: 'business', top: '45%', left: '68%', width: '24%', height: '40%', clipPath: 'polygon(0% 100%, 100% 100%, 95% 5%, 5% 5%)' },
      { zoneId: 'donations', top: '12%', left: '62%', width: '18%', height: '30%', clipPath: 'polygon(10% 100%, 90% 100%, 100% 15%, 0% 15%)' },
      { zoneId: 'producers', top: '68%', left: '8%', width: '22%', height: '28%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 20%, 0% 20%)' },
    ],
  },
  blueprint: {
    sceneBg: { jpg: '/zones/jobs.jpg', webp: '/zones/jobs.webp' },
    objectPosition: 'center 45%',
    hotspots: [
      { zoneId: 'marketplace', top: '35%', left: '10%', width: '24%', height: '40%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'auction', top: '22%', left: '38%', width: '20%', height: '35%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'jobs', top: '55%', left: '32%', width: '22%', height: '38%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'community', top: '18%', left: '62%', width: '18%', height: '32%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'business', top: '48%', left: '58%', width: '26%', height: '42%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'donations', top: '8%', left: '82%', width: '14%', height: '28%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
      { zoneId: 'producers', top: '62%', left: '6%', width: '20%', height: '32%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' },
    ],
  },
  postcard: {
    sceneBg: { jpg: '/zones/producers.jpg', webp: '/zones/producers.webp' },
    objectPosition: 'center 55%',
    hotspots: [
      { zoneId: 'marketplace', top: '45%', left: '14%', width: '20%', height: '32%', clipPath: 'polygon(5% 100%, 95% 100%, 100% 20%, 0% 15%)' },
      { zoneId: 'auction', top: '32%', left: '36%', width: '18%', height: '30%', clipPath: 'polygon(8% 100%, 92% 100%, 100% 18%, 0% 12%)' },
      { zoneId: 'jobs', top: '58%', left: '28%', width: '19%', height: '28%', clipPath: 'polygon(0% 100%, 100% 100%, 95% 15%, 5% 10%)' },
      { zoneId: 'community', top: '24%', left: '56%', width: '16%', height: '28%', clipPath: 'polygon(10% 100%, 90% 100%, 100% 15%, 0% 10%)' },
      { zoneId: 'business', top: '50%', left: '62%', width: '22%', height: '34%', clipPath: 'polygon(5% 100%, 95% 100%, 100% 12%, 0% 8%)' },
      { zoneId: 'donations', top: '14%', left: '72%', width: '15%', height: '26%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 18%, 0% 12%)' },
      { zoneId: 'producers', top: '68%', left: '48%', width: '18%', height: '26%', clipPath: 'polygon(5% 100%, 95% 100%, 100% 20%, 0% 15%)' },
    ],
  },
  nightmarket: {
    sceneBg: { jpg: '/zones/business.jpg', webp: '/zones/business.webp' },
    objectPosition: 'center 50%',
    hotspots: [
      { zoneId: 'marketplace', top: '48%', left: '6%', width: '28%', height: '28%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 35%, 50% 0%, 0% 35%)' },
      { zoneId: 'auction', top: '38%', left: '34%', width: '26%', height: '26%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 38%, 50% 0%, 0% 38%)' },
      { zoneId: 'jobs', top: '58%', left: '52%', width: '24%', height: '24%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 40%, 50% 0%, 0% 40%)' },
      { zoneId: 'community', top: '28%', left: '18%', width: '22%', height: '24%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 35%, 50% 0%, 0% 35%)' },
      { zoneId: 'business', top: '42%', left: '72%', width: '24%', height: '30%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 32%, 50% 0%, 0% 32%)' },
      { zoneId: 'donations', top: '18%', left: '58%', width: '20%', height: '22%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 38%, 50% 0%, 0% 38%)' },
      { zoneId: 'producers', top: '62%', left: '78%', width: '18%', height: '26%', clipPath: 'polygon(0% 100%, 100% 100%, 100% 35%, 50% 0%, 0% 35%)' },
    ],
  },
};

export const ZONE_FACADE_IMAGES: Record<string, string> = {
  marketplace: '/zones/marketplace.webp',
  auction: '/zones/auction.webp',
  jobs: '/zones/jobs.webp',
  community: '/zones/community.webp',
  business: '/zones/business.webp',
  donations: '/zones/donations.webp',
  producers: '/zones/producers.webp',
};
