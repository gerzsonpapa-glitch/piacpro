/*
  # AI hozzáférés és egyéb jogosultságok hozzáadása a profilokhoz

  1. Változások
    - `profiles` tábla: `ai_access` boolean mező hozzáadása (alapértelmezett: false)
      - Ha true, a felhasználó az AI Asszisztenst a 3 hónapos korlátozás nélkül is használhatja
    - `profiles` tábla: `is_producer_approved` mező már létezik — nem érintjük
  
  2. Megjegyzés
    - Az AI hozzáférést az admin panel SuperAdmin felületéről lehet adni/elvonni
    - Ez felülírja a 3 hónapos regisztrációs feltételt
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ai_access'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ai_access boolean DEFAULT false;
  END IF;
END $$;
