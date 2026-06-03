import { useCallback, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CityBuilding } from '../lib/cityMapBuildings';

export interface PinPreviewItem {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  image?: string;
  path: string;
}

const cache = new Map<string, PinPreviewItem[]>();

async function fetchPreviewForBuilding(building: CityBuilding): Promise<PinPreviewItem[]> {
  const key = building.countKey ?? building.id;
  if (cache.has(key)) return cache.get(key)!;

  let items: PinPreviewItem[] = [];

  try {
    if (building.countKey === 'listing') {
      const { data } = await supabase
        .from('listings')
        .select('id, title, price, currency, images')
        .eq('status', 'active')
        .eq('listing_type', 'regular')
        .order('created_at', { ascending: false })
        .limit(3);
      items = (data ?? []).map((l) => ({
        id: l.id,
        title: l.title,
        price: l.price,
        currency: l.currency,
        image: l.images?.[0],
        path: `/listing/${l.id}`,
      }));
    } else if (building.countKey === 'auction') {
      const { data } = await supabase
        .from('listings')
        .select('id, title, price, currency, images')
        .eq('status', 'active')
        .eq('listing_type', 'auction')
        .order('created_at', { ascending: false })
        .limit(3);
      items = (data ?? []).map((l) => ({
        id: l.id,
        title: l.title,
        price: l.price,
        currency: l.currency,
        image: l.images?.[0],
        path: `/auction/${l.id}`,
      }));
    } else if (building.countKey === 'job') {
      const { data } = await supabase
        .from('jobs')
        .select('id, title, salary_min, salary_max, currency')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);
      items = (data ?? []).map((j) => ({
        id: j.id,
        title: j.title,
        price: j.salary_min ?? j.salary_max ?? undefined,
        currency: j.currency ?? 'Ft',
        path: `/jobs/${j.id}`,
      }));
    } else if (building.countKey === 'donations') {
      const { data } = await supabase
        .from('donations')
        .select('id, title, images')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);
      items = (data ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        image: d.images?.[0],
        path: `/donations/${d.id}`,
      }));
    } else if (building.countKey === 'producers') {
      const { data } = await supabase
        .from('producers')
        .select('id, business_name, logo_url')
        .order('created_at', { ascending: false })
        .limit(3);
      items = (data ?? []).map((p) => ({
        id: p.id,
        title: p.business_name,
        image: p.logo_url ?? undefined,
        path: `/producers/${p.id}`,
      }));
    } else if (building.countKey === 'shops') {
      const { data } = await supabase
        .from('shops')
        .select('id, name, logo_url, slug')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      items = (data ?? []).map((s) => ({
        id: s.id,
        title: s.name,
        image: s.logo_url ?? undefined,
        path: `/shops/${s.slug || s.id}`,
      }));
    }
  } catch {
    items = [];
  }

  cache.set(key, items);
  return items;
}

export function usePinPreview() {
  const [items, setItems] = useState<PinPreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const activeId = useRef<string | null>(null);

  const showPreview = useCallback(async (building: CityBuilding) => {
    activeId.current = building.id;
    setVisible(true);
    setLoading(true);
    const result = await fetchPreviewForBuilding(building);
    if (activeId.current === building.id) {
      setItems(result);
      setLoading(false);
    }
  }, []);

  const hidePreview = useCallback(() => {
    activeId.current = null;
    setVisible(false);
    setItems([]);
    setLoading(false);
  }, []);

  return { items, loading, visible, showPreview, hidePreview };
}
