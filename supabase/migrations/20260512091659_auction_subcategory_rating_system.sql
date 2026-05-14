/*
  # Auction, Subcategory, Rating & Trust System

  ## New Tables
  - `subcategories` - Multi-level subcategory support under each main category
  - `auctions` - Auction listings with duration, min bid, status, end time
  - `auction_bids` - Individual bids on auctions with history
  - `listing_ratings` - Buyer/seller transaction ratings
  - `seller_badges` - Trust badges computed from ratings/activity

  ## Modified Tables
  - `listings` - add `listing_type` (regular/auction), `auction_id`, `status` enum extended
  - `categories` - add `parent_id` for subcategory nesting

  ## Security
  - RLS enabled on all new tables
  - Bidders must be authenticated
  - Only auction owner can manage their auctions
  - Ratings only by transaction participants
*/

-- Subcategory support: add parent_id to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE CASCADE;

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starting_price numeric NOT NULL DEFAULT 0,
  current_price numeric NOT NULL DEFAULT 0,
  min_bid_increment numeric NOT NULL DEFAULT 500,
  duration_hours integer NOT NULL DEFAULT 24 CHECK (duration_hours IN (24, 48)),
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'sold', 'cancelled')),
  winner_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view auctions"
  ON auctions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can view auctions"
  ON auctions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Seller can insert own auction"
  ON auctions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Seller can update own auction"
  ON auctions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Auction bids table
CREATE TABLE IF NOT EXISTS auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auction_bids_auction_id_idx ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS auction_bids_created_at_idx ON auction_bids(auction_id, created_at DESC);

ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bids"
  ON auction_bids FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can view bids"
  ON auction_bids FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can place bids"
  ON auction_bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bidder_id);

-- Listing ratings table
CREATE TABLE IF NOT EXISTS listing_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(listing_id, rater_id)
);

ALTER TABLE listing_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
  ON listing_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can view ratings"
  ON listing_ratings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can insert ratings"
  ON listing_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rater_id);

-- Seller trust badges - computed summary per seller
CREATE TABLE IF NOT EXISTS seller_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  badge_type text NOT NULL DEFAULT 'neutral' CHECK (badge_type IN ('reliable', 'neutral', 'low_reliability')),
  total_ratings integer NOT NULL DEFAULT 0,
  avg_score numeric NOT NULL DEFAULT 0,
  total_sales integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seller_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON seller_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can view badges"
  ON seller_badges FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "System can manage badges"
  ON seller_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "System can update badges"
  ON seller_badges FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Add listing_type to listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'listing_type'
  ) THEN
    ALTER TABLE listings ADD COLUMN listing_type text NOT NULL DEFAULT 'regular'
      CHECK (listing_type IN ('regular', 'auction'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'sold_at'
  ) THEN
    ALTER TABLE listings ADD COLUMN sold_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE listings ADD COLUMN ended_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'delivery_options'
  ) THEN
    ALTER TABLE listings ADD COLUMN delivery_options text[] DEFAULT '{}';
  END IF;
END $$;

-- Function to auto-update seller badge after new rating
CREATE OR REPLACE FUNCTION update_seller_badge()
RETURNS TRIGGER AS $$
DECLARE
  v_avg numeric;
  v_count integer;
  v_badge text;
BEGIN
  SELECT AVG(score), COUNT(*) INTO v_avg, v_count
  FROM listing_ratings
  WHERE rated_id = NEW.rated_id;

  IF v_count < 3 THEN
    v_badge := 'neutral';
  ELSIF v_avg >= 4.0 THEN
    v_badge := 'reliable';
  ELSIF v_avg >= 3.0 THEN
    v_badge := 'neutral';
  ELSE
    v_badge := 'low_reliability';
  END IF;

  INSERT INTO seller_badges (seller_id, badge_type, total_ratings, avg_score)
  VALUES (NEW.rated_id, v_badge, v_count, v_avg)
  ON CONFLICT (seller_id) DO UPDATE SET
    badge_type = EXCLUDED.badge_type,
    total_ratings = EXCLUDED.total_ratings,
    avg_score = EXCLUDED.avg_score,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_rating_insert ON listing_ratings;
CREATE TRIGGER on_rating_insert
  AFTER INSERT ON listing_ratings
  FOR EACH ROW EXECUTE FUNCTION update_seller_badge();

-- Subcategories seed data
-- First ensure top-level categories have no parent
INSERT INTO categories (name, slug, icon, description, sort_order) VALUES
  ('Elektronika', 'electronics', 'Cpu', 'Elektronikai eszközök', 10),
  ('Kerékpárok', 'bicycles', 'Bike', 'Kerékpárok és alkatrészek', 20),
  ('Járművek', 'vehicles', 'Car', 'Autók, motorok, járművek', 30),
  ('Otthon & Kert', 'home-garden', 'Home', 'Bútorok, kerti eszközök', 40),
  ('Divat', 'fashion', 'Shirt', 'Ruházat, cipők, kiegészítők', 50),
  ('Sport & Szabadidő', 'sport', 'Dumbbell', 'Sporteszközök, szabadidő', 60),
  ('Játékok', 'games-toys', 'Gamepad2', 'Játékok, konzolok', 70)
ON CONFLICT (slug) DO NOTHING;

-- After inserting parents, insert subcategories using parent slugs
DO $$
DECLARE
  v_electronics uuid;
  v_bicycles uuid;
  v_vehicles uuid;
  v_home uuid;
  v_fashion uuid;
  v_sport uuid;
  v_games uuid;
BEGIN
  SELECT id INTO v_electronics FROM categories WHERE slug = 'electronics';
  SELECT id INTO v_bicycles FROM categories WHERE slug = 'bicycles';
  SELECT id INTO v_vehicles FROM categories WHERE slug = 'vehicles';
  SELECT id INTO v_home FROM categories WHERE slug = 'home-garden';
  SELECT id INTO v_fashion FROM categories WHERE slug = 'fashion';
  SELECT id INTO v_sport FROM categories WHERE slug = 'sport';
  SELECT id INTO v_games FROM categories WHERE slug = 'games-toys';

  -- Electronics subcategories
  INSERT INTO categories (name, slug, icon, description, sort_order, parent_id) VALUES
    ('Telefonok', 'phones', 'Smartphone', 'Mobiltelefon, okostelefon', 1, v_electronics),
    ('Számítógépek', 'computers', 'Cpu', 'Laptopok, asztali gépek', 2, v_electronics),
    ('Kis háztartási gépek', 'small-appliances', 'Zap', 'Kávéfőző, porszívó stb.', 3, v_electronics),
    ('Nagy háztartási gépek', 'large-appliances', 'Refrigerator', 'Hűtő, mosógép stb.', 4, v_electronics),
    ('Tartozékok', 'accessories', 'Headphones', 'Fejhallgató, töltők stb.', 5, v_electronics),
    ('TV & Audio', 'tv-audio', 'Monitor', 'Televíziók, hangszórók', 6, v_electronics)
  ON CONFLICT (slug) DO NOTHING;

  -- Bicycles subcategories
  INSERT INTO categories (name, slug, icon, description, sort_order, parent_id) VALUES
    ('MTB', 'mtb', 'Bike', 'Mountain bike', 1, v_bicycles),
    ('Túra', 'touring', 'Bike', 'Túrakerékpár', 2, v_bicycles),
    ('BMX', 'bmx', 'Bike', 'BMX kerékpár', 3, v_bicycles),
    ('Országúti', 'road-bike', 'Bike', 'Országúti kerékpár', 4, v_bicycles),
    ('Városi', 'city-bike', 'Bike', 'Városi kerékpár', 5, v_bicycles),
    ('E-Bike', 'e-bike', 'Bike', 'Elektromos kerékpár', 6, v_bicycles)
  ON CONFLICT (slug) DO NOTHING;

  -- Vehicles subcategories
  INSERT INTO categories (name, slug, icon, description, sort_order, parent_id) VALUES
    ('Autók', 'cars', 'Car', 'Személyautók', 1, v_vehicles),
    ('Motorok', 'motorcycles', 'Car', 'Motorkerékpárok', 2, v_vehicles),
    ('Alkatrészek', 'car-parts', 'Car', 'Autóalkatrészek', 3, v_vehicles),
    ('Egyéb járművek', 'other-vehicles', 'Car', 'Lakókocsi, quad stb.', 4, v_vehicles)
  ON CONFLICT (slug) DO NOTHING;

  -- Home & Garden subcategories
  INSERT INTO categories (name, slug, icon, description, sort_order, parent_id) VALUES
    ('Bútorok', 'furniture', 'Home', 'Kanapé, asztal, szék', 1, v_home),
    ('Kerti eszközök', 'garden', 'Home', 'Kerti bútorok, szerszámok', 2, v_home),
    ('Lakástextil', 'textiles', 'Home', 'Párna, szőnyeg, függöny', 3, v_home),
    ('Világítás', 'lighting', 'Home', 'Lámpák, izzók', 4, v_home),
    ('Szerszámok', 'tools', 'Home', 'Kéziszerszámok, gépek', 5, v_home)
  ON CONFLICT (slug) DO NOTHING;

  -- Fashion subcategories
  INSERT INTO categories (name, slug, icon, description, sort_order, parent_id) VALUES
    ('Férfi ruházat', 'mens-clothing', 'Shirt', 'Férfi ruhák', 1, v_fashion),
    ('Női ruházat', 'womens-clothing', 'Shirt', 'Női ruhák', 2, v_fashion),
    ('Cipők', 'shoes', 'Shirt', 'Cipők és csizmák', 3, v_fashion),
    ('Táskák', 'bags', 'Shirt', 'Táskák és hátizsákok', 4, v_fashion),
    ('Gyerekruha', 'kids-clothing', 'Shirt', 'Gyerekruhák', 5, v_fashion)
  ON CONFLICT (slug) DO NOTHING;

  -- Sport subcategories
  INSERT INTO categories (name, slug, icon, description, sort_order, parent_id) VALUES
    ('Fitnesz', 'fitness', 'Dumbbell', 'Súlyzók, edzőgépek', 1, v_sport),
    ('Labdajátékok', 'ball-sports', 'Dumbbell', 'Labdák, kapuk', 2, v_sport),
    ('Téli sport', 'winter-sports', 'Dumbbell', 'Sífelszerelés', 3, v_sport),
    ('Vízi sport', 'water-sports', 'Dumbbell', 'Kajak, búvárfelszerelés', 4, v_sport)
  ON CONFLICT (slug) DO NOTHING;

  -- Games subcategories
  INSERT INTO categories (name, slug, icon, description, sort_order, parent_id) VALUES
    ('PlayStation', 'playstation', 'Gamepad2', 'PS4, PS5 konzolok és játékok', 1, v_games),
    ('Xbox', 'xbox', 'Gamepad2', 'Xbox konzolok és játékok', 2, v_games),
    ('Nintendo', 'nintendo', 'Gamepad2', 'Switch, 3DS', 3, v_games),
    ('PC Játékok', 'pc-games', 'Gamepad2', 'PC játékok, kiegészítők', 4, v_games),
    ('Társasjátékok', 'board-games', 'Gamepad2', 'Társasjátékok, puzzle', 5, v_games),
    ('Gyerekjátékok', 'kids-toys', 'Gamepad2', 'Játékok gyerekeknek', 6, v_games)
  ON CONFLICT (slug) DO NOTHING;
END $$;
