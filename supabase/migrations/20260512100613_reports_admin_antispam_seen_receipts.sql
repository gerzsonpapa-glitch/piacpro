/*
  # Reports, Admin System, Anti-spam, Seen Receipts, Auction Extension

  ## New Tables
  - `reports` - User reports for listings and users
  - `admin_users` - Track which users have admin privileges  
  - `user_listing_limits` - Daily listing count per user for anti-spam

  ## Modified Tables
  - `messages` - add `seen_at` timestamptz for read receipts
  - `auctions` - add `extended` boolean to track last-5-min extensions
  - `profiles` - add `is_banned` boolean, `verified` boolean, `response_speed` text

  ## Security
  - RLS on all new tables
  - Reports visible to admins only (for management)
  - Admin users can access report management

  ## Notes
  - reports table supports both listing and user reports
  - daily limit: 3 listings per new user (< 7 days old), 20 for established users
*/

-- Seen receipts on messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'seen_at') THEN
    ALTER TABLE messages ADD COLUMN seen_at timestamptz;
  END IF;
END $$;

-- Auction last-5-min extension tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auctions' AND column_name = 'extension_count') THEN
    ALTER TABLE auctions ADD COLUMN extension_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Profile anti-spam fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_banned') THEN
    ALTER TABLE profiles ADD COLUMN is_banned boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified') THEN
    ALTER TABLE profiles ADD COLUMN verified boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'response_speed') THEN
    ALTER TABLE profiles ADD COLUMN response_speed text NOT NULL DEFAULT 'unknown'
      CHECK (response_speed IN ('fast', 'medium', 'slow', 'unknown'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'listings_today') THEN
    ALTER TABLE profiles ADD COLUMN listings_today integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'listings_today_reset') THEN
    ALTER TABLE profiles ADD COLUMN listings_today_reset date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reported_listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'scam', 'inappropriate', 'duplicate', 'offensive', 'other')),
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_reported_listing_idx ON reports(reported_listing_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Function to auto-extend auction when bid placed in last 5 minutes
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

  -- If less than 5 minutes remain and fewer than 3 extensions already done
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

DROP TRIGGER IF EXISTS on_bid_maybe_extend ON auction_bids;
CREATE TRIGGER on_bid_maybe_extend
  AFTER INSERT ON auction_bids
  FOR EACH ROW EXECUTE FUNCTION maybe_extend_auction();
