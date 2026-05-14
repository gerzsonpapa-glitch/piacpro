/*
  # Fix trigger functions to use SECURITY DEFINER

  ## Problem
  When a bidder (non-seller) inserts a row into auction_bids, two triggers fire:
  1. maybe_extend_auction → UPDATE auctions SET ends_at = ...
  2. update_auction_bid_count → UPDATE auctions SET bid_count = ...

  Both triggers run as the calling user (the bidder). The RLS policy on auctions
  only allows UPDATE for the seller (auth.uid() = seller_id), so the trigger UPDATE
  is blocked, which causes the entire INSERT to fail with an RLS violation.

  ## Fix
  Recreate both trigger functions with SECURITY DEFINER so they run as the
  function owner (postgres/superuser) and bypass RLS. Also remove the duplicate
  trigger (trg_update_bid_count vs trg_auction_bid_count).
*/

-- Recreate maybe_extend_auction with SECURITY DEFINER
CREATE OR REPLACE FUNCTION maybe_extend_auction()
RETURNS TRIGGER AS $$
DECLARE
  v_auction auctions%ROWTYPE;
  v_remaining interval;
BEGIN
  SELECT * INTO v_auction FROM auctions WHERE id = NEW.auction_id;

  IF v_auction.status <> 'active' OR NOT v_auction.timer_started THEN
    RETURN NEW;
  END IF;

  v_remaining := v_auction.ends_at - now();

  IF v_remaining < interval '5 minutes' AND v_remaining > interval '0' AND v_auction.extension_count < 3 THEN
    UPDATE auctions
    SET
      ends_at = ends_at + interval '3 minutes',
      extension_count = extension_count + 1,
      updated_at = now()
    WHERE id = NEW.auction_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate update_auction_bid_count with SECURITY DEFINER
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

-- Remove duplicate trigger, keep only one per event
DROP TRIGGER IF EXISTS trg_update_bid_count ON auction_bids;
DROP TRIGGER IF EXISTS trg_auction_bid_count ON auction_bids;

CREATE TRIGGER trg_auction_bid_count
  AFTER INSERT OR DELETE ON auction_bids
  FOR EACH ROW EXECUTE FUNCTION update_auction_bid_count();
