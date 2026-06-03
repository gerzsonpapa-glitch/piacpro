import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';
import { useCityMapBounds } from '../../contexts/CityMapBoundsContext';
import { imagePercentToStagePercent } from '../../lib/cityMapImageBounds';
import PiacEditable from '../PiacEditable';

/** Hegybe vésve — kép közepén, image %-ban (hub hegycsúcs ~12% / 50%). */
const ENGRAVE_IMAGE_TOP = 11.5;
const ENGRAVE_IMAGE_LEFT = 50;

export default function HomeMountainEngraving({ ready = true }: { ready?: boolean }) {
  const { config } = useSiteCustomization();
  const bounds = useCityMapBounds();

  const pos = useMemo(() => {
    if (!bounds) {
      return { top: '14%', left: '50%' };
    }
    const { top, left } = imagePercentToStagePercent(
      ENGRAVE_IMAGE_TOP,
      ENGRAVE_IMAGE_LEFT,
      bounds,
    );
    return {
      top: `${Math.max(4, Math.min(28, top)).toFixed(2)}%`,
      left: `${Math.max(20, Math.min(80, left)).toFixed(2)}%`,
    };
  }, [bounds]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={ready ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="home-mountain-engraving absolute z-[12] pointer-events-none"
      style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
    >
      <PiacEditable
        editKey="hero.title"
        as="p"
        className="home-mountain-engraving__title pointer-events-auto"
      >
        {config.hero.title}
      </PiacEditable>
      <PiacEditable
        editKey="hero.subtitle"
        as="p"
        className="home-mountain-engraving__subtitle pointer-events-auto hidden sm:block"
      >
        {config.hero.subtitle}
      </PiacEditable>
    </motion.div>
  );
}
