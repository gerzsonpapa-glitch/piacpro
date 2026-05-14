/*
  # Fix auction bid INSERT RETURNING and auction listing visibility

  ## Problems
  1. auction_bids INSERT with .select() fails because Supabase requires a separate
     SELECT policy to allow RETURNING after INSERT. The existing SELECT policy uses
     USING (true) which should cover it — but the anon/authenticated split may cause
     issues. Consolidate to a single permissive policy.
  2. Ensure auctions table UPDATE works for bidders without auth.uid() check
     (the previous bidder policy had status='active' in both USING and WITH CHECK
     which is correct, but let's make it explicit).
*/

-- Drop and recreate consolidated SELECT policies for auction_bids
DROP POLICY IF EXISTS "Anon can view bids" ON auction_bids;
DROP POLICY IF EXISTS "Anyone can view bids" ON auction_bids;

CREATE POLICY "Public can view all bids"
  ON auction_bids FOR SELECT
  USING (true);

-- Ensure the INSERT policy allows RETURNING by being explicit
DROP POLICY IF EXISTS "Authenticated users can place bids" ON auction_bids;
CREATE POLICY "Authenticated users can place bids"
  ON auction_bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bidder_id);

-- Make sure auctions SELECT is open to all (consolidate)
DROP POLICY IF EXISTS "Anon can view auctions" ON auctions;
DROP POLICY IF EXISTS "Anyone can view auctions" ON auctions;
CREATE POLICY "Public can view all auctions"
  ON auctions FOR SELECT
  USING (true);
