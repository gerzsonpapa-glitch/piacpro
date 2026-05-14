/*
  # Add contact info columns

  1. Changes
    - Add `phone` column to `profiles` (text, default empty)
    - Add `contact_email` column to `profiles` (text, default empty)
    - Add `phone` column to `listings` (text, default empty)
    - Add `contact_email` column to `listings` (text, default empty)

  2. Notes
    - These allow sellers to provide contact information
    - Listings inherit contact info or can override with their own
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN contact_email text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'phone'
  ) THEN
    ALTER TABLE listings ADD COLUMN phone text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE listings ADD COLUMN contact_email text DEFAULT '';
  END IF;
END $$;
