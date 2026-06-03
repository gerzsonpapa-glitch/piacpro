import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

/** Egyszerű helyi kulcsszó-javaslatok — PiacAI nélkül, csak szavak. */
const KEYWORD_POOL = [
  'iphone', 'laptop', 'bicikli', 'bútor', 'ruha', 'cipő', 'játék', 'könyv',
  'autó', 'gumi', 'kerti', 'szerszám', 'állás', 'albérlet', 'adomány',
  'termelő', 'bio', 'bolt', 'szolgáltatás', 'festék', 'telefon', 'tablet',
  'monitor', 'ps5', 'xbox', 'nintendo', 'babakocsi', 'jogsi', 'kutya', 'macska',
];

function normalize(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

export default function SearchKeywordHelper({
  query,
  onPick,
  className = '',
  max = 4,
}: {
  query: string;
  onPick: (keyword: string) => void;
  className?: string;
  max?: number;
}) {
  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (q.length < 2) return [];
    return KEYWORD_POOL.filter((w) => normalize(w).startsWith(q) && normalize(w) !== q).slice(0, max);
  }, [query, max]);

  if (suggestions.length === 0) return null;

  return (
    <div className={`piac-search-keywords flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400/80">
        <Sparkles className="w-3 h-3" />
        Próbáld:
      </span>
      {suggestions.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onPick(word)}
          className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-zinc-300 border border-amber-500/25 bg-amber-500/8 hover:bg-amber-500/15 hover:border-amber-400/40 transition-colors"
        >
          {word}
        </button>
      ))}
    </div>
  );
}
