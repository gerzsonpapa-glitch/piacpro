/*
  # place_bid RPC function

  ## Purpose
  Moves bid placement logic entirely to the database as a secure RPC.
  This replaces the 3-step frontend flow (insert bid → update price → update timer)
  with a single atomic transaction that:
  1. Validates the bid (amount, status, not own auction)
  2. Inserts into auction_bids
  3. Updates current_price on auctions
  4. Starts the timer on first bid
  All done with SECURITY DEFINER to bypass RLS safely, with explicit checks.

  ## Result
  Returns JSON: { success: true } or { success: false, error: "message" }
*/

CREATE OR REPLACE FUNCTION place_bid(
  p_auction_id uuid,
  p_amount numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auction auctions%ROWTYPE;
  v_user_id uuid := auth.uid();
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Bejelentkezés szükséges.');
  END IF;

  -- Lock the auction row to prevent race conditions
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Az aukció nem található.');
  END IF;

  -- Validate
  IF v_auction.status <> 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Az aukció már lezárult.');
  END IF;

  IF v_auction.timer_started AND v_auction.ends_at <= now() THEN
    RETURN json_build_object('success', false, 'error', 'Az aukció lejárt.');
  END IF;

  IF v_auction.seller_id = v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Saját licitedre nem ajánlhatsz.');
  END IF;

  IF p_amount < v_auction.current_price + v_auction.min_bid_increment THEN
    RETURN json_build_object('success', false, 'error', 
      'Minimum ajánlat: ' || (v_auction.current_price + v_auction.min_bid_increment)::text || ' Ft');
  END IF;

  -- Insert bid
  INSERT INTO auction_bids (auction_id, bidder_id, amount)
  VALUES (p_auction_id, v_user_id, p_amount);

  -- Update current price
  UPDATE auctions
  SET current_price = p_amount,
      updated_at = now()
  WHERE id = p_auction_id;

  -- Start timer on first bid
  IF NOT v_auction.timer_started THEN
    UPDATE auctions
    SET timer_started = true,
        timer_started_at = now(),
        ends_at = now() + (v_auction.duration_hours || ' hours')::interval
    WHERE id = p_auction_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
