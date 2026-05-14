/*
  # Add bid_count column to auctions table

  1. Changes
    - Add `bid_count` integer column to auctions (default 0)
    - Backfill existing rows from auction_bids
    - Add trigger to keep bid_count in sync on bid insert/delete
*/

ALTER TABLE auctions ADD COLUMN IF NOT EXISTS bid_count integer NOT NULL DEFAULT 0;

-- Backfill existing counts
UPDATE auctions a
SET bid_count = (
  SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.id
);

-- Trigger function to increment/decrement bid_count
CREATE OR REPLACE FUNCTION update_auction_bid_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE auctions SET bid_count = bid_count + 1 WHERE id = NEW.auction_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE auctions SET bid_count = GREATEST(bid_count - 1, 0) WHERE id = OLD.auction_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_bid_count ON auction_bids;
CREATE TRIGGER trg_update_bid_count
AFTER INSERT OR DELETE ON auction_bids
FOR EACH ROW EXECUTE FUNCTION update_auction_bid_count();
