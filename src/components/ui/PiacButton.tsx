import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';

const variants: Record<Variant, string> = {
  primary:
    'text-[#0B0F14] font-bold shadow-[0_0_24px_rgba(0,230,118,0.35)] bg-gradient-to-br from-[#00E676] to-[#00C853] hover:shadow-[0_0_32px_rgba(0,230,118,0.5)] hover:scale-[1.03] active:scale-[0.97]',
  secondary:
    'text-zinc-100 bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 hover:scale-[1.03] active:scale-[0.97]',
  ghost: 'text-zinc-300 hover:text-white hover:bg-white/[0.06] hover:scale-[1.03] active:scale-[0.97]',
  outline:
    'text-zinc-200 border border-white/25 bg-transparent hover:border-[#00E676]/50 hover:text-[#00E676] hover:scale-[1.03] active:scale-[0.97]',
};

export default function PiacButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-2xl gap-2',
    lg: 'px-6 py-3 text-base rounded-2xl gap-2',
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-semibold transition-all ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
