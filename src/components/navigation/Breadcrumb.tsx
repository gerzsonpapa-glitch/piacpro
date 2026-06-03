import { ChevronRight } from 'lucide-react';
import { useRouter } from '../../lib/router';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { navigate } = useRouter();
  if (items.length === 0) return null;

  return (
    <nav aria-label="Morzsamenü" className="flex flex-wrap items-center gap-1 text-xs text-zinc-500 mb-4">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0 text-zinc-600" aria-hidden />}
            {item.path && !isLast ? (
              <button
                type="button"
                onClick={() => navigate(item.path!)}
                className="hover:text-emerald-300 transition-colors truncate max-w-[140px] sm:max-w-[200px]"
              >
                {item.label}
              </button>
            ) : (
              <span className={`truncate max-w-[180px] sm:max-w-[280px] ${isLast ? 'text-zinc-300 font-medium' : ''}`}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
