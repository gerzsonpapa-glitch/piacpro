import type { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';

export default function GlassPanel({
  children,
  className = '',
  style,
  float = false,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  float?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: float ? 12 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`piac-glass-panel ${float ? 'piac-float-card' : ''} ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}
