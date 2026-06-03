import { MessageCircle } from 'lucide-react';

export default function PiacChatBrand({
  size = 'md',
  subtitle,
  className = '',
}: {
  size?: 'sm' | 'md';
  subtitle?: string;
  className?: string;
}) {
  const iconBox = size === 'sm' ? 'w-8 h-8 rounded-xl' : 'w-9 h-9 rounded-xl';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-[1.125rem] h-[1.125rem]';
  const titleClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <span
        className={`${iconBox} flex-shrink-0 flex items-center justify-center piac-chat-brand__icon`}
        aria-hidden
      >
        <MessageCircle className={`${iconSize} text-[#00E676]`} strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className={`${titleClass} font-black text-zinc-50 leading-tight tracking-tight`}>
          PiacPro <span className="text-[#00E676]">Chat</span>
        </p>
        {subtitle && (
          <p className="text-[10px] text-zinc-500 truncate leading-snug mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
