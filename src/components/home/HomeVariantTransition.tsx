import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { HomeVariantId } from '../../lib/homeVariants';

/** Profi crossfade a Város ↔ Fantasy váltáskor (fejlesztői preview). */
export default function HomeVariantTransition({
  variant,
  children,
}: {
  variant: HomeVariantId;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={variant}
        initial={{ opacity: 0, scale: 0.985, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.015, filter: 'blur(8px)' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="home-variant-transition"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
