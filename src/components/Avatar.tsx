import { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'full' | '2xl' | 'xl';
  className?: string;
}

const dims = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-24 h-24',
};
const iconDims = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-12 h-12',
};
const textSizes = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
};
const roundedMap = { full: 'rounded-full', '2xl': 'rounded-2xl', xl: 'rounded-xl' };

export default function Avatar({ src, name, size = 'md', rounded = '2xl', className = '' }: AvatarProps) {
  const [err, setErr] = useState(false);
  const dim = dims[size];
  const iconDim = iconDims[size];
  const textSize = textSizes[size];
  const roundedCls = roundedMap[rounded];

  const initials = name
    ? name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : null;

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setErr(true)}
        className={`${dim} object-cover ${roundedCls} flex-shrink-0 ${className}`}
      />
    );
  }

  if (initials) {
    return (
      <div className={`${dim} ${roundedCls} glass-bubble flex items-center justify-center font-bold text-emerald-400 select-none flex-shrink-0 ${textSize} ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${dim} ${roundedCls} glass-bubble flex items-center justify-center flex-shrink-0 ${className}`}>
      <User className={`${iconDim} text-emerald-400`} />
    </div>
  );
}
