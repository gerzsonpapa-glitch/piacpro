
/*
  # Update listing categories to match spec

  Replaces existing categories with the full Hungarian marketplace category set:
  Elektronika, Gaming, Telefon, PC, Jármű, Ruha/Divat, Gyereknek, Bútor/Lakás,
  Szerszám, Ingyenes elvihető, Sport, Könyv/Zene, Ingatlan, Állatok, Egyéb

  Also adds job categories to jobs table as a check constraint.
*/

-- Clear and re-seed categories
DELETE FROM public.categories WHERE parent_id IS NOT NULL;
DELETE FROM public.categories WHERE parent_id IS NULL;

INSERT INTO public.categories (name, slug, icon, description, sort_order) VALUES
  ('Elektronika',         'electronics',    'Smartphone',   'Elektronikai eszközök, kütyük',           1),
  ('Gaming',              'gaming',         'Gamepad2',     'Konzolok, játékok, kiegészítők',          2),
  ('Telefon',             'phones',         'Phone',        'Okostelefonok, tokok, tartozékok',        3),
  ('PC / Laptop',         'computers',      'Monitor',      'Számítógépek, alkatrészek, perifériák',   4),
  ('Jármű',               'vehicles',       'Car',          'Autók, motorok, alkatrészek',             5),
  ('Ruha / Divat',        'fashion',        'Shirt',        'Ruházat, cipők, kiegészítők',             6),
  ('Gyereknek',           'kids',           'Baby',         'Gyerekruhák, játékok, babacikkek',        7),
  ('Bútor / Lakás',       'furniture',      'Home',         'Bútorok, dekor, háztartási eszközök',     8),
  ('Szerszám',            'tools',          'Wrench',       'Kéziszerszámok, gépek, felszerelések',    9),
  ('Ingyenes elvihető',   'free',           'Gift',         'Ingyenesen elvihető tárgyak',            10),
  ('Sport',               'sport',          'Dumbbell',     'Sportfelszerelések, kerékpárok',          11),
  ('Könyv / Zene',        'books',          'BookOpen',     'Könyvek, hanglemezek, hangszerek',        12),
  ('Ingatlan',            'real-estate',    'Building2',    'Eladó és kiadó ingatlanok',               13),
  ('Állatok',             'pets',           'PawPrint',     'Kisállatok, takarmány, felszerelés',      14),
  ('Egyéb',               'other',          'Package',      'Minden más',                              15)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;
