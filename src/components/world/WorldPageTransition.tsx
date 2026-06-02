import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

export default function WorldPageTransition({ path, children }: { path: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={path}
        initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="world-page-transition"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
