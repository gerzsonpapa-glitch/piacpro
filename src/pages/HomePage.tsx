import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import HomeVariantTransition from '../components/home/HomeVariantTransition';
import {
  normalizeHomeVariant,
  isBuildingSceneVariant,
  type HomeVariantId,
} from '../lib/homeVariants';
import HomePageCity from './home/HomePageCity';
import HomePageFantasy from './home/HomePageFantasy';
import HomePageImmersive from './home/HomePageImmersive';

function renderHomeVariant(variant: HomeVariantId) {
  if (variant === 'city') return <HomePageCity />;
  if (variant === 'fantasy') return <HomePageFantasy />;
  if (isBuildingSceneVariant(variant)) return <HomePageImmersive variant={variant} />;
  return <HomePageCity />;
}

/** `/` — fejlesztői konfig alapján 8 különböző kezdőlap skin. */
export default function HomePage() {
  const { config } = useSiteCustomization();
  const variant = normalizeHomeVariant(config.home?.variant);

  return (
    <HomeVariantTransition variant={variant}>
      {renderHomeVariant(variant)}
    </HomeVariantTransition>
  );
}
