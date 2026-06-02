import { motion } from 'framer-motion';
import type { CityBuilding } from '../../lib/cityMapBuildings';

export default function CityBuildingHotspot({
  building,
  count,
  ready,
  index,
  onClick,
}: {
  building: CityBuilding;
  count?: number;
  ready: boolean;
  index: number;
  onClick: () => void;
}) {
  const Icon = building.icon;
  const w = building.width ?? '12%';
  const h = building.height ?? '14%';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ delay: ready ? index * 0.05 : 0, duration: 0.4 }}
      className="city-building-hotspot group absolute z-20"
      style={{
        top: building.top,
        left: building.left,
        width: w,
        height: h,
        transform: 'translate(-50%, -50%)',
      }}
      aria-label={`${building.label} — ${building.sublabel}`}
    >
      {/* Hover glow — épület kiemelés */}
      <span
        className="city-building-glow absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `0 0 40px 8px ${building.glow}, inset 0 0 24px ${building.glow}`,
          border: `2px solid ${building.color}`,
        }}
      />

      {/* Finom pulzáló gyűrű */}
      <span
        className="city-building-ring absolute inset-[8%] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={{ border: `1px solid ${building.color}55` }}
      />

      {/* Minimális címke — csak hover/focus */}
      <span
        className="city-building-label absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap"
      >
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold backdrop-blur-md"
          style={{
            background: 'rgba(7,17,31,0.88)',
            border: `1px solid ${building.color}44`,
            color: building.color,
            boxShadow: `0 4px 20px ${building.glow}`,
          }}
        >
          <Icon className="w-3 h-3" />
          {building.label}
          {count !== undefined && count > 0 && (
            <span className="text-zinc-400 font-medium">· {count.toLocaleString('hu-HU')}</span>
          )}
        </span>
      </span>
    </motion.button>
  );
}
