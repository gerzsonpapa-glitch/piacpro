import type { ReactNode } from 'react';

export function DevStylePickerGrid<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  columns = 2,
  renderBadge,
}: {
  label: string;
  hint?: string;
  options: { id: T; label: string; desc?: string; tier?: 'core' | 'premium' }[];
  value: T;
  onChange: (id: T) => void;
  columns?: 2 | 3 | 4 | 5;
  renderBadge?: (opt: { id: T; label: string; desc?: string; tier?: 'core' | 'premium' }) => ReactNode;
}) {
  const colClass =
    columns === 5 ? 'grid-cols-2 sm:grid-cols-5'
    : columns === 4 ? 'grid-cols-2 sm:grid-cols-4'
    : columns === 3 ? 'grid-cols-2 sm:grid-cols-3'
    : 'grid-cols-2';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{label}</label>
        {hint && <span className="text-[9px] text-zinc-600">{hint}</span>}
      </div>
      <div className={`mt-2 grid ${colClass} gap-1.5`}>
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`relative px-2.5 py-2 rounded-xl text-left text-xs border transition-all ${
                active
                  ? 'border-[#00E676]/50 bg-[#00E676]/10 text-[#00E676] shadow-[0_0_16px_rgba(0,230,118,0.12)]'
                  : 'border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/[0.02]'
              }`}
            >
              {opt.tier === 'premium' && (
                <span className="absolute top-1 right-1 text-[8px] font-black uppercase tracking-wider text-amber-400/90">
                  Pro
                </span>
              )}
              {renderBadge ? renderBadge(opt) : (
                <>
                  <span className="font-bold block pr-6">{opt.label}</span>
                  {opt.desc && <span className="text-[10px] opacity-70 leading-snug block mt-0.5">{opt.desc}</span>}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DevSizePickerGrid<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string; px?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{label}</label>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {options.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            title={s.px ? `${s.px}px` : s.label}
            className={`flex flex-col items-center justify-center min-h-[44px] px-1 py-1.5 rounded-xl text-[9px] font-bold border transition-all ${
              value === s.id
                ? 'border-[#00E676]/50 bg-[#00E676]/10 text-[#00E676]'
                : 'border-white/10 text-zinc-500 hover:border-white/20'
            }`}
          >
            <span>{s.label}</span>
            {s.px != null && <span className="text-[8px] font-normal opacity-60">{s.px}px</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DevSection({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <summary className="cursor-pointer list-none px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.03]">
        <div>
          <p className="text-[11px] font-bold text-zinc-200">{title}</p>
          {subtitle && <p className="text-[10px] text-zinc-600 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-[10px] text-zinc-600 group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/5">{children}</div>
    </details>
  );
}
