import type { ElementType } from 'react';
import {
  ShoppingBag, Gavel, Briefcase, Users, Store, Heart, Leaf, Award, HandHeart,
  Search, MessageCircle, Shield, Star, Home, Sparkles,
} from 'lucide-react';

export const CITY_ICON_MAP: Record<string, ElementType> = {
  shopping: ShoppingBag,
  gavel: Gavel,
  briefcase: Briefcase,
  users: Users,
  store: Store,
  heart: Heart,
  leaf: Leaf,
  award: Award,
  handheart: HandHeart,
  search: Search,
  message: MessageCircle,
  shield: Shield,
  star: Star,
  home: Home,
  sparkles: Sparkles,
};

export function resolveCityIcon(iconId?: string, fallback: ElementType = Store): ElementType {
  if (iconId && CITY_ICON_MAP[iconId]) return CITY_ICON_MAP[iconId];
  return fallback;
}
