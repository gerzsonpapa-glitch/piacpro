/*
  # Alkuképes jelölő és frissítés funkció

  1. Módosítások
    - `listings` tábla: új `negotiable` boolean oszlop (default false) — alkuképes hirdetés jelölő
    - `listings` tábla: új `bumped_at` timestamptz oszlop — utoljára frissítve (bump) ideje,
      keresés rendezésénél használható, napi egyszer engedélyezett

  2. Index
    - `bumped_at` indexelése a hatékony rendezéshez
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'negotiable'
  ) THEN
    ALTER TABLE listings ADD COLUMN negotiable boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'bumped_at'
  ) THEN
    ALTER TABLE listings ADD COLUMN bumped_at timestamptz DEFAULT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_listings_bumped_at ON listings (bumped_at DESC NULLS LAST);
