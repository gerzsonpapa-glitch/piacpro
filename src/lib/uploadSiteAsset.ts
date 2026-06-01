import { supabase } from './supabase';

const MAX_BASE64_BYTES = 1_800_000;

function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas nem elérhető'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Tömörítés sikertelen'))),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Kép betöltése sikertelen'));
    };
    img.src = url;
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Olvasás sikertelen'));
    reader.readAsDataURL(blob);
  });
}

async function uploadToBucket(
  bucket: string,
  path: string,
  file: File | Blob,
): Promise<{ url: string | null; error: string | null }> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });
  if (error) return { url: null, error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/** Kép feltöltés: Supabase storage → ha nem megy, tömörített base64 (mindig működik). */
export async function uploadSiteAsset(file: File): Promise<{ url: string | null; error: string | null }> {
  if (!file.type.startsWith('image/')) {
    return { url: null, error: 'Csak képfájl tölthető fel.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: 'Maximum 10 MB a kép mérete.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'kep.jpg';
  const fileName = `${Date.now()}-${safeName}`;

  if (user) {
    const uid = user.id;
    const attempts: { bucket: string; path: string }[] = [
      { bucket: 'site-assets', path: `editor/${fileName}` },
      { bucket: 'listing-images', path: `${uid}/${fileName}` },
      { bucket: 'listing-images', path: `${uid}/site/${fileName}` },
      { bucket: 'avatars', path: `${uid}/${fileName}` },
      { bucket: 'avatars', path: `${uid}/site/${fileName}` },
    ];

    for (const { bucket, path } of attempts) {
      const res = await uploadToBucket(bucket, path, file);
      if (res.url) return res;
    }
  }

  try {
    const compressed = await compressImage(file);
    if (compressed.size <= MAX_BASE64_BYTES) {
      const dataUrl = await blobToDataUrl(compressed);
      return { url: dataUrl, error: null };
    }
    const moreCompressed = await compressImage(file, 1000, 0.7);
    if (moreCompressed.size <= MAX_BASE64_BYTES) {
      const dataUrl = await blobToDataUrl(moreCompressed);
      return { url: dataUrl, error: null };
    }
    return {
      url: null,
      error: 'A kép túl nagy tömörítés után is. Használj kisebb képet vagy külső URL-t (pl. imgur, közvetlen link).',
    };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : 'Feltöltés sikertelen' };
  }
}
