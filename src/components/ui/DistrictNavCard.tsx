import type { ElementType } from 'react';
import { motion } from 'framer-motion';
import PiacEditable from '../PiacEditable';

export default function DistrictNavCard({
  id,
  label,
  sublabel,
  count,
  color,
  bg,
  border,
  glow,
  icon: Icon,
  onClick,
  ready,
  index,
  pos,
}: {
  id: string;
  label: string;
  sublabel: string;
  count: number;
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: ElementType;
  onClick: () => void;
  ready: boolean;
  index: number;
  pos: { top: string; left: string };
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={ready ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.88, y: 8 }}
      transition={{ delay: ready ? index * 0.06 : 0, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.06, y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="absolute z-20 text-left group"
      style={{ top: pos.top, left: pos.left }}
    >
      <div
        className="rounded-2xl px-3 py-2.5 flex items-center gap-2.5 min-w-[168px] max-w-[210px] transition-shadow duration-300 group-hover:shadow-2xl"
        style={{
          background: 'rgba(11,15,20,0.82)',
          border: `1px solid ${border}`,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 24px ${glow}`,
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 0 16px ${glow}` }}
        >
          <Icon style={{ color, width: '1.1rem', height: '1.1rem' }} />
        </div>
        <div className="min-w-0 flex-1">
          <PiacEditable
            editKey={`quarter.${id}.label`}
            as="div"
            className="text-[11px] font-black tracking-wider uppercase leading-tight truncate piac-neon-text"
            style={{ color, ['--neon-color' as string]: color }}
          >
            {label}
          </PiacEditable>
          <div className="text-[10px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">{sublabel}</div>
          {count > 0 && (
            <div className="text-[10px] font-bold mt-0.5" style={{ color }}>
              {count.toLocaleString('hu-HU')} db
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
