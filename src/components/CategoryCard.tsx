import { Palette, Scissors, Sprout, Monitor, Music, Home, Shirt, Apple, Briefcase, BookOpen, Lightbulb, Star, Package, PenTool, Cpu, Camera, Box, Flame, Trees, Gem, Sparkles, Droplets, Circle, Leaf, Milk, Wheat, Flower2, Layers, Globe, LayoutGrid as Layout, FileText, Pen, Video, Mic, Headphones, Armchair, Frame, Lamp, ShoppingBag, Footprints, Car as Jar, Cookie, Wrench, BarChart2, Code, Truck, GraduationCap, Users, MessageCircle, Handshake, Rocket, Heart, Gift, Hammer, Brush } from 'lucide-react';
import { useRouter } from '../lib/router';
import type { Category } from '../lib/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette, Scissors, Sprout, Monitor, Music, Home, Shirt,
  Apple, Briefcase, BookOpen, Lightbulb, Star, Package,
  PenTool, Cpu, Camera, Box, Flame, Trees, Gem, Sparkles,
  Droplets, Circle, Leaf, Milk, Wheat, Flower2, Layers, Globe,
  Layout, FileText, Pen, Video, Mic, Headphones, Armchair,
  Frame, Lamp, ShoppingBag, Footprints, Jar, Cookie, Wrench,
  BarChart2, Code, Truck, GraduationCap, Users, MessageCircle,
  Handshake, Rocket, Heart, Gift, Hammer, Brush,
};

export default function CategoryCard({ category }: { category: Category }) {
  const { navigate } = useRouter();
  const Icon = iconMap[category.icon] || Package;

  return (
    <button
      onClick={() => navigate(`/search?category=${category.slug}`)}
      className="group flex flex-col items-center gap-3 p-5 piac-glass-panel rounded-3xl transition-all duration-300 hover:scale-[1.03] hover:border-[#00E676]/30"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#00E676]/10 flex items-center justify-center group-hover:bg-[#00E676]/20 transition-colors border border-[#00E676]/15">
        <Icon className="w-6 h-6 text-[#00E676]" />
      </div>
      <span className="text-sm font-medium text-zinc-300 group-hover:text-[#00E676] transition-colors text-center leading-tight">
        {category.name}
      </span>
    </button>
  );
}
