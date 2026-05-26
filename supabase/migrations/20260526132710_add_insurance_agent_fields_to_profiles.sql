/*
  # Add insurance agent fields to profiles

  ## Changes
  - Adds `is_insurance_agent` boolean to mark OVB/insurance agent accounts
  - Adds `insurance_company` text for the company name (e.g. "OVB")
  - Adds `insurance_agent_title` text for the agent's title (e.g. "Fiókvezető")

  ## Security
  - No RLS changes needed; admins can update these fields via existing policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_insurance_agent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_insurance_agent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'insurance_company'
  ) THEN
    ALTER TABLE profiles ADD COLUMN insurance_company text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'insurance_agent_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN insurance_agent_title text DEFAULT '';
  END IF;
END $$;
