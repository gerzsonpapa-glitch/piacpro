import { createClient } from 'npm:@supabase/supabase-js@2';

const BASE_URL = 'https://piacpro.hu';

const STATIC_PAGES = [
  { path: '/',                    priority: '1.0', changefreq: 'daily' },
  { path: '/search',              priority: '0.9', changefreq: 'hourly' },
  { path: '/auctions',            priority: '0.9', changefreq: 'hourly' },
  { path: '/jobs',                priority: '0.8', changefreq: 'daily' },
  { path: '/shops',               priority: '0.8', changefreq: 'daily' },
  { path: '/producers',           priority: '0.8', changefreq: 'daily' },
  { path: '/donations',           priority: '0.7', changefreq: 'daily' },
  { path: '/helyi-vallalkozasok', priority: '0.7', changefreq: 'daily' },
  { path: '/forum',               priority: '0.7', changefreq: 'hourly' },
  { path: '/discover',            priority: '0.6', changefreq: 'daily' },
  { path: '/rules',               priority: '0.4', changefreq: 'monthly' },
  { path: '/vedelem',             priority: '0.5', changefreq: 'monthly' },
];

function url(path: string, lastmod?: string, priority = '0.6', changefreq = 'weekly'): string {
  return `  <url>
    <loc>${BASE_URL}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const [listings, auctions, shops, producers, donations, businesses] = await Promise.all([
      supabase
        .from('listings')
        .select('id, updated_at')
        .eq('status', 'active')
        .is('deleted_at', null)
        .not('listing_type', 'eq', 'auction')
        .order('updated_at', { ascending: false })
        .limit(5000),
      supabase
        .from('listings')
        .select('id, updated_at')
        .eq('listing_type', 'auction')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(2000),
      supabase
        .from('shops')
        .select('slug, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(2000),
      supabase
        .from('producers')
        .select('id, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(2000),
      supabase
        .from('donations')
        .select('id, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase
        .from('local_businesses')
        .select('id, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(2000),
    ]);

    const now = new Date().toISOString().split('T')[0];

    const urls: string[] = [
      ...STATIC_PAGES.map(p => url(p.path, now, p.priority, p.changefreq)),
    ];

    for (const row of listings.data ?? []) {
      const lm = row.updated_at ? row.updated_at.split('T')[0] : now;
      urls.push(url(`/listing/${row.id}`, lm, '0.7', 'daily'));
    }
    for (const row of auctions.data ?? []) {
      const lm = row.updated_at ? row.updated_at.split('T')[0] : now;
      urls.push(url(`/auction/${row.id}`, lm, '0.8', 'hourly'));
    }
    for (const row of shops.data ?? []) {
      const lm = row.updated_at ? row.updated_at.split('T')[0] : now;
      urls.push(url(`/shops/${row.slug}`, lm, '0.7', 'daily'));
    }
    for (const row of producers.data ?? []) {
      const lm = row.updated_at ? row.updated_at.split('T')[0] : now;
      urls.push(url(`/producers/${row.id}`, lm, '0.7', 'weekly'));
    }
    for (const row of donations.data ?? []) {
      const lm = row.updated_at ? row.updated_at.split('T')[0] : now;
      urls.push(url(`/donations/${row.id}`, lm, '0.6', 'daily'));
    }
    for (const row of businesses.data ?? []) {
      const lm = row.updated_at ? row.updated_at.split('T')[0] : now;
      urls.push(url(`/helyi-vallalkozasok/${row.id}`, lm, '0.7', 'weekly'));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
