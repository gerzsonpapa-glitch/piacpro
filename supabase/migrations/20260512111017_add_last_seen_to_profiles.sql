/*
  # Add last_seen column to profiles

  1. Changes
    - `last_seen` (timestamptz) — updated whenever user is active, used for online status indicator
    
  2. Online status logic (client-side):
    - Active (online): last_seen within last 3 minutes
    - Recently active: last_seen within last 30 minutes  
    - Offline: older than 30 minutes or null
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_seen timestamptz DEFAULT now();
  END IF;
END $$;
