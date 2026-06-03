/** Főoldal skin azonosítók — fejlesztői módban váltathatók, URL: `/` */
export type HomeVariantId =
  | 'city'
  | 'fantasy'
  | 'isometric'
  | 'neon'
  | 'medieval'
  | 'blueprint'
  | 'postcard'
  | 'nightmarket';

export type HomeMenuStyleId = 'rail' | 'floating';

export interface HomeVariantMeta {
  id: HomeVariantId;
  label: string;
  short: string;
  description: string;
  /** Nincs klasszikus footer / teljes képernyős élmény */
  immersive: boolean;
  /** Lista / kihelyezett al-mód (csak fantasy) */
  supportsMenuStyle: boolean;
  /** Épület-alakú hotspot jelenet */
  buildingScene: boolean;
}

export const HOME_VARIANTS: HomeVariantMeta[] = [
  {
    id: 'city',
    label: 'Város térkép',
    short: 'Város',
    description: 'Klasszikus interaktív várostérkép pin-ekkel',
    immersive: false,
    supportsMenuStyle: false,
    buildingScene: false,
  },
  {
    id: 'fantasy',
    label: 'Fantasy / GTA',
    short: 'Fantasy',
    description: 'Játékmenü hangulat, lista vagy kihelyezett blipek',
    immersive: true,
    supportsMenuStyle: true,
    buildingScene: false,
  },
  {
    id: 'isometric',
    label: 'Izometrikus negyed',
    short: 'Izometria',
    description: '3D-szerű városkép — a zóna képe maga az épület homlokzata',
    immersive: true,
    supportsMenuStyle: false,
    buildingScene: true,
  },
  {
    id: 'neon',
    label: 'Neon Cyber',
    short: 'Neon',
    description: 'Cyberpunk éjszakai skyline — neon ablakok = belépés',
    immersive: true,
    supportsMenuStyle: false,
    buildingScene: true,
  },
  {
    id: 'medieval',
    label: 'Medieval piac',
    short: 'Medieval',
    description: 'Középkori főtér — faházak és boltok a térképen',
    immersive: true,
    supportsMenuStyle: false,
    buildingScene: true,
  },
  {
    id: 'blueprint',
    label: 'Blueprint terv',
    short: 'Tervrajz',
    description: 'Mérnöki alaprajz — kék vonalak, épület kontúrok',
    immersive: true,
    supportsMenuStyle: false,
    buildingScene: true,
  },
  {
    id: 'postcard',
    label: 'Vintage képeslap',
    short: 'Képeslap',
    description: 'Nosztalgikus magyar piac — meleg papír, bélyeg hangulat',
    immersive: true,
    supportsMenuStyle: false,
    buildingScene: true,
  },
  {
    id: 'nightmarket',
    label: 'Éjszakai vásár',
    short: 'Vásár',
    description: 'Lámpásos night market — a stand maga a gomb',
    immersive: true,
    supportsMenuStyle: false,
    buildingScene: true,
  },
];

const VALID_IDS = new Set<string>(HOME_VARIANTS.map((v) => v.id));

export function normalizeHomeVariant(raw: unknown): HomeVariantId {
  if (typeof raw === 'string' && VALID_IDS.has(raw)) return raw as HomeVariantId;
  return 'city';
}

export function getHomeVariantMeta(id: HomeVariantId): HomeVariantMeta {
  return HOME_VARIANTS.find((v) => v.id === id) ?? HOME_VARIANTS[0];
}

export function isImmersiveHomeVariant(id: HomeVariantId): boolean {
  return getHomeVariantMeta(id).immersive;
}

export function isBuildingSceneVariant(id: HomeVariantId): boolean {
  return getHomeVariantMeta(id).buildingScene;
}

export function homeVariantSupportsMenuStyle(id: HomeVariantId): boolean {
  return getHomeVariantMeta(id).supportsMenuStyle;
}
