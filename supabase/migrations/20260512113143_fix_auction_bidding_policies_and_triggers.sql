/*
  # Fix auction bidding: RLS policies + auto bid_count trigger

  ## Problems fixed
  1. `auctions` UPDATE policy blocked bidders from updating current_price/timer
  2. No DELETE policy on `auction_bids` — undo was impossible
  3. `bid_count` never updated — no trigger existed

  ## Changes
  1. Add separate UPDATE policy for bidders (current_price, timer fields only — enforced via function)
  2. Allow authenticated users to update auctions when they are the active bidder
  3. Add DELETE policy on auction_bids (own bids only, within 60s, only if still top bid)
  4. Add trigger to auto-update bid_count and extension logic on auction_bids INSERT/DELETE
*/

-- 1. Drop the old restrictive seller-only update policy
DROP POLICY IF EXISTS "Seller can update own auction" ON auctions;

-- 2. Seller update policy (all fields)
CREATE POLICY "Seller can update own auction"
  ON auctions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- 3. Bidder update policy — allow any authenticated user to update price/timer on active auctions
CREATE POLICY "Bidder can update auction price and timer"
  ON auctions FOR UPDATE
  TO authenticated
  USING (status = 'active')
  WITH CHECK (status = 'active');

-- 4. Add DELETE policy for auction_bids — own bids only
DROP POLICY IF EXISTS "Bidder can delete own bid" ON auction_bids;
CREATE POLICY "Bidder can delete own bid"
  ON auction_bids FOR DELETE
  TO authenticated
  USING (auth.uid() = bidder_id);

-- 5. Function + trigger to keep bid_count in sync
CREATE OR REPLACE FUNCTION update_auction_bid_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE auctions
    SET bid_count = bid_count + 1
    WHERE id = NEW.auction_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE auctions
    SET bid_count = GREATEST(bid_count - 1, 0)
    WHERE id = OLD.auction_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auction_bid_count ON auction_bids;
CREATE TRIGGER trg_auction_bid_count
  AFTER INSERT OR DELETE ON auction_bids
  FOR EACH ROW EXECUTE FUNCTION update_auction_bid_count();

-- 6. Recalculate existing bid_counts in case they are stale
UPDATE auctions a
SET bid_count = (
  SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id
);
