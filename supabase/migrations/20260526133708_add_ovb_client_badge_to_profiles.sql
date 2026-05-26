/*
  # Add OVB client badge to profiles

  ## Changes
  - Adds `is_ovb_client` boolean column to profiles
  - Adds `ovb_client_added_by` uuid column (who granted the badge)
  - Adds `ovb_client_added_at` timestamptz column

  ## Security
  - Only the designated insurance agent (is_insurance_agent = true) can grant/revoke this badge via RLS policy
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_ovb_client'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_ovb_client boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ovb_client_added_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ovb_client_added_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ovb_client_added_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ovb_client_added_at timestamptz;
  END IF;
END $$;
