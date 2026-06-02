import { motion } from 'framer-motion';
import PiacEditable from '../PiacEditable';
import { useSiteCustomization } from '../../contexts/SiteCustomizationContext';

/** Központi Főtér — díszkút, burkolat, zöld növényzet (prémium CSS). */
export default function CityMainSquare({ ready = true }: { ready?: boolean }) {
  const { config } = useSiteCustomization();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={ready ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="city-main-square hidden sm:block pointer-events-none absolute z-[5] left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      <div className="city-main-square__plaza">
        <div className="city-main-square__pavement" />
        <div className="city-main-square__greenery city-main-square__greenery--tl" />
        <div className="city-main-square__greenery city-main-square__greenery--tr" />
        <div className="city-main-square__greenery city-main-square__greenery--bl" />
        <div className="city-main-square__greenery city-main-square__greenery--br" />

        <div className="city-main-square__fountain">
          <div className="city-main-square__fountain-bowl" />
          <div className="city-main-square__fountain-stream" />
          <div className="city-main-square__fountain-glow" />
        </div>

        <div className="city-main-square__label">
          <PiacEditable
            editKey="hero.badgeTop"
            as="span"
            className="block text-[9px] sm:text-[10px] font-black tracking-[0.28em] uppercase text-white/75 pointer-events-auto"
          >
            {config.hero.badgeTop || 'PiacPro'}
          </PiacEditable>
          <PiacEditable
            editKey="hero.badgeBottom"
            as="span"
            className="block text-sm sm:text-base font-black tracking-[0.12em] uppercase text-white mt-0.5 pointer-events-auto"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.45)' }}
          >
            {config.hero.badgeBottom || 'Főtér'}
          </PiacEditable>
        </div>
      </div>
    </motion.div>
  );
}
