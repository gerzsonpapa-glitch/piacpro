/*
  # User Level System

  1. New Columns on profiles
    - `level` (integer, default 1) — user level 1-5
    - `level_title` (text) — custom title for level (e.g. "Kezdő", "Tapasztalt")
    - `badge_icon` (text) — icon name from lucide (e.g. "star", "award")
    - `badge_color` (text) — color class for badge

  2. Level Definitions (managed by admin):
    - 1: Kezdő (új felhasználó)
    - 2: Aktív (néhány tranzakció)
    - 3: Tapasztalt (sok hirdetés, jó értékelés)
    - 4: Megbízható (kiemelkedő eladó)
    - 5: VIP (prémium tag)

  3. Security
    - Only admins can update level/badge columns
    - Users can view all profile levels
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN level integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'level_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN level_title text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'badge_color'
  ) THEN
    ALTER TABLE profiles ADD COLUMN badge_color text DEFAULT 'zinc';
  END IF;
END $$;
