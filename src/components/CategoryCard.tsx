import {
  Smartphone, Gamepad2, Cpu, Bike, Car, Home, Shirt
} from 'lucide-react';
import { useRouter } from '../lib/router';
import type { Category } from '../lib/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Smartphone, Gamepad2, Cpu, Bike, Car, Home, Shirt,
};

export default function CategoryCard({ category }: { category: Category }) {
  const { navigate } = useRouter();
  const Icon = iconMap[category.icon] || Smartphone;

  return (
    <button
      onClick={() => navigate(`/search?category=${category.slug}`)}
      className="group flex flex-col items-center gap-3 p-5 glass-bubble rounded-3xl transition-all duration-300 hover:scale-[1.03]"
    >
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
        <Icon className="w-6 h-6 text-emerald-400" />
      </div>
      <span className="text-sm font-medium text-zinc-300 group-hover:text-emerald-300 transition-colors">
        {category.name}
      </span>
    </button>
  );
}
