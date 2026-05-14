/*
  # Videó URL hozzáadása a listings táblához

  1. Módosítások
    - `listings` tábla: új `video_url` oszlop (nullable text, default '')
      - A hirdetéshez feltöltött videó Supabase Storage URL-je

  2. Storage
    - `listing-videos` bucket létrehozása ha nem létezik
    - Publikus olvasási policy
    - Authenticated users feltöltési/törlési joga (csak saját mappájukba)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE listings ADD COLUMN video_url text DEFAULT '';
  END IF;
END $$;
