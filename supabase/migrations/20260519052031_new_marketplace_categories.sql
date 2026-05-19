/*
  # Új piactér kategória rendszer

  ## Összefoglaló
  A régi kategóriákat lecseréljük egy rugalmas, alkotókra, termelőkre és
  szolgáltatókra fókuszált struktúrára.

  ## Változások
  - Töröljük a régi kategóriákat
  - Beillesztjük az új 13 fő kategóriát + alkategóriáikat
  - listings.category_id ON DELETE SET NULL, szóval adatvesztés nem történik
*/

-- Töröljük az összes meglévő kategóriát (gyerekek először, majd szülők)
DELETE FROM categories WHERE parent_id IS NOT NULL;
DELETE FROM categories WHERE parent_id IS NULL;

-- ==========================================
-- 1. FŐ KATEGÓRIÁK
-- ==========================================

INSERT INTO categories (name, slug, icon, description, sort_order, parent_id) VALUES
  ('Alkotások',               'alkotasok',         'Palette',    'Festmények, rajzok, fotóművészet és egyéb alkotások',  1,  NULL),
  ('Kézműves termékek',       'kezmuvesek',        'Scissors',   'Kézzel készített egyedi termékek',                     2,  NULL),
  ('Termelők',                'termelok',          'Sprout',     'Helyi termelők kínálata',                              3,  NULL),
  ('Digitális alkotások',     'digitalis',         'Monitor',    'Logók, web design, UI/UX, template-ek',                4,  NULL),
  ('Média / Zene / Videó',    'media',             'Music',      'Zene, videó, podcast, fotó tartalmak',                 5,  NULL),
  ('Lakás & Dekor',           'lakas-dekor',       'Home',       'Lakberendezés, dekoráció, bútor',                      6,  NULL),
  ('Divat / Ruha / Textil',   'divat',             'Shirt',      'Ruházat, kiegészítők, textilmunkák',                   7,  NULL),
  ('Élelmiszer / Házi termék','elelmiszer',         'Apple',      'Házi készítésű élelmiszerek, befőttek, méz',           8,  NULL),
  ('Szolgáltatások',          'szolgaltatasok',    'Briefcase',  'Szakmai és személyes szolgáltatások',                  9,  NULL),
  ('Oktatás / Tudás',         'oktatas',           'BookOpen',   'Magántanítás, workshopok, mentorálás',                 10, NULL),
  ('Kreatív projektek',       'kreatif',           'Lightbulb',  'Közösségi alkotások, kreatív kezdeményezések',         11, NULL),
  ('Egyedi / Custom munkák',  'egyedi',            'Star',       'Személyre szabott termékek és egyedi rendelések',      12, NULL),
  ('Egyéb / Összes',          'egyeb',             'Package',    'Minden egyéb, nem besorolt kategória',                 13, NULL);

-- ==========================================
-- 2. ALKATEGÓRIÁK
-- ==========================================

-- Alkotások alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Festmények',         'alkotasok-festmenyek',  'Palette',  '', 1),
  ('Rajzok',             'alkotasok-rajzok',      'PenTool',  '', 2),
  ('Digitális művészet', 'alkotasok-digital-art', 'Cpu',      '', 3),
  ('Illusztrációk',      'alkotasok-illusztr',    'Brush',    '', 4),
  ('Fotóművészet',       'alkotasok-foto',        'Camera',   '', 5),
  ('Szobrok / 3D',       'alkotasok-szobor',      'Box',      '', 6)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'alkotasok') c;

-- Kézműves termékek alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Gyertyák',        'kezmuvesek-gyertyak', 'Flame',    '', 1),
  ('Horgolás / Kötés','kezmuvesek-horgolas', 'Scissors', '', 2),
  ('Fa dekor',        'kezmuvesek-fa',       'Trees',    '', 3),
  ('Ékszer',          'kezmuvesek-ekszer',   'Gem',      '', 4),
  ('Kozmetikumok',    'kezmuvesek-kozm',     'Sparkles', '', 5),
  ('Epoxy / Resin',   'kezmuvesek-resin',    'Droplets', '', 6),
  ('Kerámia / Agyag', 'kezmuvesek-keramia',  'Circle',   '', 7)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'kezmuvesek') c;

-- Termelők alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Méz',                'termelok-mez',      'Leaf',    '', 1),
  ('Sajt / Tejtermék',   'termelok-sajt',     'Milk',    '', 2),
  ('Zöldség / Gyümölcs', 'termelok-zoldseg',  'Apple',   '', 3),
  ('Házi termékek',      'termelok-hazi',     'Home',    '', 4),
  ('Pékség',             'termelok-pekseg',   'Wheat',   '', 5),
  ('Növények',           'termelok-novenyek', 'Flower2', '', 6)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'termelok') c;

-- Digitális alkotások alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Logó / Arculat',    'digitalis-logo',     'Layers',   '', 1),
  ('Web design',        'digitalis-web',      'Globe',    '', 2),
  ('UI/UX',             'digitalis-ui',       'Layout',   '', 3),
  ('Grafikai tervezés', 'digitalis-grafika',  'PenTool',  '', 4),
  ('Template-ek',       'digitalis-template', 'FileText', '', 5),
  ('Illusztráció',      'digitalis-illusztr', 'Pen',      '', 6)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'digitalis') c;

-- Média alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Zene',          'media-zene',    'Music',      '', 1),
  ('Videó',         'media-video',   'Video',      '', 2),
  ('Podcast',       'media-podcast', 'Mic',        '', 3),
  ('Fotózás',       'media-fotozas', 'Camera',     '', 4),
  ('Beat / Sample', 'media-beat',    'Headphones', '', 5)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'media') c;

-- Lakás & Dekor alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Bútor',          'lakas-butor',    'Armchair', '', 1),
  ('Faldekor',       'lakas-faldekor', 'Frame',    '', 2),
  ('Textil / Párna', 'lakas-textil',   'Layers',   '', 3),
  ('Megvilágítás',   'lakas-vilagitas','Lamp',      '', 4),
  ('Kerti dekor',    'lakas-kert',     'Trees',    '', 5)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'lakas-dekor') c;

-- Divat alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Felső / Póló',          'divat-felso',   'Shirt',       '', 1),
  ('Ékszer / Kiegészítő',   'divat-ekszer',  'Gem',         '', 2),
  ('Táska',                 'divat-taska',   'ShoppingBag', '', 3),
  ('Cipő',                  'divat-cipo',    'Footprints',  '', 4),
  ('Textil / Szövet',       'divat-szovet',  'Scissors',    '', 5)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'divat') c;

-- Élelmiszer alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Befőttek / Lekvárok', 'elelmiszer-befottek', 'Jar',      '', 1),
  ('Sütemény / Süti',     'elelmiszer-sutemenyek','Cookie',   '', 2),
  ('Fűszernövények',      'elelmiszer-fuszernov', 'Leaf',     '', 3),
  ('Szappan / Kozmetika', 'elelmiszer-szappan',   'Sparkles', '', 4),
  ('Gyógynövények',       'elelmiszer-gyogynov',  'Flower2',  '', 5)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'elelmiszer') c;

-- Szolgáltatások alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Javítás / Szerelés',     'szolg-javitas',  'Wrench',    '', 1),
  ('Takarítás',              'szolg-takaritas','Sparkles',   '', 2),
  ('Marketing',              'szolg-marketing','BarChart2',  '', 3),
  ('IT / Programozás',       'szolg-it',       'Code',      '', 4),
  ('Üzleti szolgáltatások',  'szolg-uzleti',   'Briefcase', '', 5),
  ('Szállítás',              'szolg-szallitas','Truck',      '', 6)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'szolgaltatasok') c;

-- Oktatás alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Magántanítás',  'oktatas-magantanitas', 'GraduationCap',  '', 1),
  ('Mentorálás',    'oktatas-mentoras',     'Users',          '', 2),
  ('Workshopok',    'oktatas-workshop',     'BookOpen',       '', 3),
  ('Konzultáció',   'oktatas-konzultacio',  'MessageCircle',  '', 4),
  ('Online kurzus', 'oktatas-kurzus',       'Monitor',        '', 5)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'oktatas') c;

-- Kreatív projektek alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Közösségi alkotás',  'kreatif-kozossegi', 'Users',      '', 1),
  ('Crowdfunding ötlet', 'kreatif-crowd',     'Lightbulb',  '', 2),
  ('Kollaboráció',       'kreatif-kollab',    'Handshake',  '', 3),
  ('Startup / Ötlet',    'kreatif-startup',   'Rocket',     '', 4)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'kreatif') c;

-- Egyedi / Custom munkák alkategóriák
INSERT INTO categories (name, slug, icon, description, sort_order, parent_id)
SELECT name, slug, icon, description, sort_order, c.id FROM (VALUES
  ('Egyedi rendelés',        'egyedi-rendeles',  'Star',    '', 1),
  ('Személyre szabott',      'egyedi-szemelyre', 'Heart',   '', 2),
  ('Ajándék készítés',       'egyedi-ajandek',   'Gift',    '', 3),
  ('Csinálj nekem ilyet',    'egyedi-csinalj',   'Hammer',  '', 4)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'egyedi') c;
