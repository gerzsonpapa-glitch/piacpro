/*
  # ended_at oszlop hozzáadása az auctions táblához + cleanup javítás

  ## Változások
  - `auctions.ended_at` (timestamptz) – mikor zárult le a licit
  - `auto_end_expired_auctions()` frissítve: beállítja az ended_at-t
  - `cleanup_expired_records()` frissítve: ended_at alapján töröl
*/

-- Add ended_at column to auctions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auctions' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE auctions ADD COLUMN ended_at timestamptz;
  END IF;
END $$;

-- Update auto_end function to set ended_at
CREATE OR REPLACE FUNCTION public.auto_end_expired_auctions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE auctions
  SET
    status = 'ended',
    ended_at = now()
  WHERE
    status = 'active'
    AND timer_started = true
    AND ends_at IS NOT NULL
    AND ends_at <= now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Update cleanup function using ended_at
CREATE OR REPLACE FUNCTION public.cleanup_expired_records()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
  temp_count integer;
BEGIN
  -- Delete listings linked to ended auctions (ended 48+ hours ago)
  DELETE FROM listings
  WHERE id IN (
    SELECT a.listing_id
    FROM auctions a
    WHERE a.status = 'ended'
      AND a.ended_at IS NOT NULL
      AND a.ended_at <= now() - interval '48 hours'
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- Delete ended auctions themselves (48+ hours ago)
  DELETE FROM auctions
  WHERE status = 'ended'
    AND ended_at IS NOT NULL
    AND ended_at <= now() - interval '48 hours';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- Delete sold regular listings (sold 48+ hours ago)
  DELETE FROM listings
  WHERE status = 'sold'
    AND sold_at IS NOT NULL
    AND sold_at <= now() - interval '48 hours'
    AND listing_type = 'regular';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  RETURN deleted_count;
END;
$$;
