import { supabase } from './supabase';

const BUCKETS = ['site-assets', 'listing-images'] as const;

export async function uploadSiteAsset(file: File): Promise<{ url: string | null; error: string | null }> {
  if (!file.type.startsWith('image/')) {
    return { url: null, error: 'Csak képfájl tölthető fel.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: 'Maximum 10 MB a kép mérete.' };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `editor/${Date.now()}-${safeName}`;

  for (const bucket of BUCKETS) {
    const folder = bucket === 'listing-images' ? `site/${path}` : path;
    const { error } = await supabase.storage.from(bucket).upload(folder, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(folder);
      return { url: data.publicUrl, error: null };
    }
  }

  return {
    url: null,
    error: 'Kép feltöltése sikertelen. Ellenőrizd a site-assets bucket migrációt, vagy használj közvetlen URL-t.',
  };
}
