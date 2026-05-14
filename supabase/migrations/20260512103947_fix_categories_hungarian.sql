/*
  # Fix categories — full Hungarian rename and restructure

  1. Changes
    - Rename all English-named parent categories to Hungarian
    - Remove duplicate/broken parent categories (Bikes, Cars, Home, Fashion, Gaming, PC Hardware)
    - Merge their subcategories into the correct existing Hungarian parent
    - Ensure all parent categories have proper sort_order
    - Add missing subcategories for completeness

  2. Strategy
    - Keep the properly-named Hungarian parents (Kerékpárok, Járművek, Otthon & Kert, Fashion→Divat, Játékok)
    - Rename Electronics→Elektronika, Gaming→merge into Játékok, PC Hardware→merge into Elektronika
    - Rename Bikes→already have Kerékpárok, Cars→already have Járművek, Home→already have Otthon & Kert
    - Move orphaned subcategories to the right parents
    - Delete the duplicate English-named parent rows
*/

-- Step 1: Rename "Electronics" parent to "Elektronika"
UPDATE categories SET name = 'Elektronika', sort_order = 1 WHERE slug = 'electronics' AND parent_id IS NULL;

-- Step 2: Rename "Fashion" parent to "Divat & Ruházat"
UPDATE categories SET name = 'Divat & Ruházat', sort_order = 6 WHERE slug = 'fashion' AND parent_id IS NULL;

-- Step 3: Rename "Home" parent to "Otthon & Kert" if it exists as a duplicate
-- (already have slug=home-garden, so merge: move any children of slug=home to home-garden, then delete)
UPDATE categories
  SET parent_id = '2b8e2ddc-9397-4e6f-8832-fa40529973f6'
  WHERE parent_id = '3edc30a3-f22a-4ab8-9644-9a411fe38915';
DELETE FROM categories WHERE slug = 'home' AND parent_id IS NULL;

-- Step 4: Move "Gaming" subcategories into "Játékok" (ee82ad18), then delete Gaming parent
UPDATE categories
  SET parent_id = 'ee82ad18-5807-432e-87ba-4ab3c3a14e96'
  WHERE parent_id = 'c129698f-43dd-4bbc-951f-0a439391f1ab';
DELETE FROM categories WHERE slug = 'gaming' AND parent_id IS NULL;

-- Step 5: Move "PC Hardware" subcategories into "Elektronika" (dcce8af7), then delete PC Hardware parent
UPDATE categories
  SET parent_id = 'dcce8af7-add2-4ef4-8854-2e093cdfe787'
  WHERE parent_id = '49e5a7a5-f969-46b2-9329-88943bcc540d';
DELETE FROM categories WHERE slug = 'pc-hardware' AND parent_id IS NULL;

-- Step 6: Move "Bikes" subcategories into "Kerékpárok" (97a378c8), then delete Bikes parent
UPDATE categories
  SET parent_id = '97a378c8-6111-4486-b489-13b9bd2e9dd1'
  WHERE parent_id = '8f2f824d-916a-451f-a7e6-cfd6adde0c0c';
DELETE FROM categories WHERE slug = 'bikes' AND parent_id IS NULL;

-- Step 7: Move "Cars" subcategories into "Járművek" (fe4aa4b9), then delete Cars parent
UPDATE categories
  SET parent_id = 'fe4aa4b9-fb16-4493-9213-ee82cb8e016c'
  WHERE parent_id = '23c5bf07-6207-474b-96ac-056b6e747674';
DELETE FROM categories WHERE slug = 'cars' AND parent_id IS NULL;

-- Step 8: Fix sort_order for all parent categories
UPDATE categories SET sort_order = 1  WHERE slug = 'electronics'  AND parent_id IS NULL;
UPDATE categories SET sort_order = 2  WHERE slug = 'vehicles'     AND parent_id IS NULL;
UPDATE categories SET sort_order = 3  WHERE slug = 'home-garden'  AND parent_id IS NULL;
UPDATE categories SET sort_order = 4  WHERE slug = 'fashion'      AND parent_id IS NULL;
UPDATE categories SET sort_order = 5  WHERE slug = 'bicycles'     AND parent_id IS NULL;
UPDATE categories SET sort_order = 6  WHERE slug = 'sport'        AND parent_id IS NULL;
UPDATE categories SET sort_order = 7  WHERE slug = 'games-toys'   AND parent_id IS NULL;

-- Step 9: Add missing parent categories
INSERT INTO categories (name, slug, icon, parent_id, sort_order) VALUES
  ('Ingatlan', 'real-estate', 'Home', NULL, 8),
  ('Állatok', 'pets', 'PawPrint', NULL, 9),
  ('Gyerek & Baba', 'kids', 'Baby', NULL, 10),
  ('Könyvek & Zene', 'books-music', 'BookOpen', NULL, 11),
  ('Egyéb', 'other', 'Package', NULL, 12)
ON CONFLICT (slug) DO NOTHING;

-- Step 10: Add missing subcategories for Járművek
INSERT INTO categories (name, slug, icon, parent_id, sort_order) VALUES
  ('Autók', 'cars-sub', 'Car', 'fe4aa4b9-fb16-4493-9213-ee82cb8e016c', 1),
  ('Furgonok & Kisteherautók', 'vans', 'Truck', 'fe4aa4b9-fb16-4493-9213-ee82cb8e016c', 5),
  ('Lakóautók & Lakókocsik', 'campers', 'Caravan', 'fe4aa4b9-fb16-4493-9213-ee82cb8e016c', 6)
ON CONFLICT (slug) DO NOTHING;

-- Step 11: Add missing subcategories for Elektronika
INSERT INTO categories (name, slug, icon, parent_id, sort_order) VALUES
  ('Táblagépek', 'tablets', 'Tablet', 'dcce8af7-add2-4ef4-8854-2e093cdfe787', 7),
  ('Fényképezők', 'cameras', 'Camera', 'dcce8af7-add2-4ef4-8854-2e093cdfe787', 8),
  ('Hangszerek', 'instruments', 'Music', 'dcce8af7-add2-4ef4-8854-2e093cdfe787', 9)
ON CONFLICT (slug) DO NOTHING;

-- Step 12: Add missing subcategories for Divat & Ruházat
INSERT INTO categories (name, slug, icon, parent_id, sort_order) VALUES
  ('Ékszerek & Órák', 'jewelry', 'Watch', 'f0a96133-4913-4f16-91b0-34aad4b0272f', 6),
  ('Sportruházat', 'sportswear', 'Shirt', 'f0a96133-4913-4f16-91b0-34aad4b0272f', 7)
ON CONFLICT (slug) DO NOTHING;

-- Step 13: Add subcategories for new parents
INSERT INTO categories (name, slug, icon, parent_id, sort_order) VALUES
  ('Eladó lakások', 'apartments-sale', 'Building', (SELECT id FROM categories WHERE slug='real-estate'), 1),
  ('Kiadó lakások', 'apartments-rent', 'Key', (SELECT id FROM categories WHERE slug='real-estate'), 2),
  ('Házak', 'houses', 'Home', (SELECT id FROM categories WHERE slug='real-estate'), 3),
  ('Telkek', 'land', 'Map', (SELECT id FROM categories WHERE slug='real-estate'), 4),
  ('Kutyák', 'dogs', 'PawPrint', (SELECT id FROM categories WHERE slug='pets'), 1),
  ('Macskák', 'cats', 'PawPrint', (SELECT id FROM categories WHERE slug='pets'), 2),
  ('Egyéb állatok', 'other-pets', 'PawPrint', (SELECT id FROM categories WHERE slug='pets'), 3),
  ('Állateledelek & Felszerelés', 'pet-supplies', 'ShoppingBag', (SELECT id FROM categories WHERE slug='pets'), 4),
  ('Babakocsi & Ülés', 'strollers', 'Baby', (SELECT id FROM categories WHERE slug='kids'), 1),
  ('Gyerekbútor', 'kids-furniture', 'Armchair', (SELECT id FROM categories WHERE slug='kids'), 2),
  ('Babafelszerelés', 'baby-gear', 'Star', (SELECT id FROM categories WHERE slug='kids'), 3),
  ('Könyvek', 'books', 'BookOpen', (SELECT id FROM categories WHERE slug='books-music'), 1),
  ('Filmek & Sorozatok', 'movies', 'Film', (SELECT id FROM categories WHERE slug='books-music'), 2),
  ('Zene & Hanglemezek', 'music-records', 'Music', (SELECT id FROM categories WHERE slug='books-music'), 3)
ON CONFLICT (slug) DO NOTHING;

-- Step 14: Rename "TV & Audio" subcategory to Hungarian
UPDATE categories SET name = 'TV & Audió' WHERE slug = 'tv-audio';

-- Step 15: Rename "PC Games" to Hungarian (already Hungarian but confirm)
UPDATE categories SET name = 'PC Játékok' WHERE slug = 'pc-games';
