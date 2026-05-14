/*
  # Auction Timer: First Bid Starts the Clock

  1. Changes
    - Add `timer_started` boolean to auctions (default false)
    - Add `timer_started_at` timestamptz — when first bid was placed
    - `ends_at` will be recalculated on first bid placement from the frontend

  2. Notes
    - Before first bid, ends_at is NULL or far future
    - On first bid, timer_started becomes true, ends_at is set to now + duration_hours
    - After that, countdown shows real remaining time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auctions' AND column_name = 'timer_started'
  ) THEN
    ALTER TABLE auctions ADD COLUMN timer_started boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auctions' AND column_name = 'timer_started_at'
  ) THEN
    ALTER TABLE auctions ADD COLUMN timer_started_at timestamptz;
  END IF;
END $$;
