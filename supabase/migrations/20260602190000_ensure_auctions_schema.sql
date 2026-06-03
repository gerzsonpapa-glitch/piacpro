/*
  # Aukció séma biztosítása (hiányzó korai migrációk pótlása)

  ELŐFELTÉTEL: a public.listings táblának már léteznie kell!
  Ha „relation public.listings does not exist” hibát kapsz, NE ezt futtasd —
  előbb a teljes migrációs lánc elejét (20260512061139_create_marketplace_schema.sql …).

  Futtasd ezt UTÁN, hogy a korai aukció-migrációk lefutottak, VAGY ha csak
  az auctions tábla hiányzik egy egyébként működő DB-ből.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'listings'
  ) THEN
    RAISE EXCEPTION
      'HIBA: public.listings nem létezik. Először futtasd: supabase/migrations/20260512061139_create_marketplace_schema.sql majd az összes későbbi migrációt fájlnév sorrendben (Supabase CLI: supabase db push).';
  END IF;
END $$;

-- ─── listings: aukcióhoz szükséges oszlopok ────────────────────────────────
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS sold_at timestamptz;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'regular';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS auction_id uuid;

-- ─── auctions tábla ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  starting_price numeric NOT NULL DEFAULT 0,
  current_price numeric NOT NULL DEFAULT 0,
  min_bid_increment numeric NOT NULL DEFAULT 500,
  duration_hours integer NOT NULL DEFAULT 24,
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  status text NOT NULL DEFAULT 'active',
  winner_id uuid REFERENCES public.profiles(id),
  timer_started boolean NOT NULL DEFAULT false,
  timer_started_at timestamptz,
  extension_count integer NOT NULL DEFAULT 0,
  bid_count integer NOT NULL DEFAULT 0,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS timer_started boolean NOT NULL DEFAULT false;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS timer_started_at timestamptz;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS extension_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS bid_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS ended_at timestamptz;

CREATE INDEX IF NOT EXISTS auctions_listing_id_idx ON public.auctions(listing_id);
CREATE INDEX IF NOT EXISTS auctions_status_ends_at_idx ON public.auctions(status, ends_at);
CREATE INDEX IF NOT EXISTS auctions_seller_id_idx ON public.auctions(seller_id);

-- ─── auction_bids tábla ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auction_bids_auction_id_idx ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS auction_bids_created_at_idx ON public.auction_bids(auction_id, created_at DESC);

-- ─── RLS (idempotens) ───────────────────────────────────────────────────────
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view auctions" ON public.auctions;
DROP POLICY IF EXISTS "Anon can view auctions" ON public.auctions;
DROP POLICY IF EXISTS "Public can view all auctions" ON public.auctions;
CREATE POLICY "Public can view all auctions"
  ON public.auctions FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Seller can insert own auction" ON public.auctions;
CREATE POLICY "Seller can insert own auction"
  ON public.auctions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Seller can update own auction" ON public.auctions;
DROP POLICY IF EXISTS "Bidder can update active auction price" ON public.auctions;
CREATE POLICY "Seller can update own auction"
  ON public.auctions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Bidder can update active auction price"
  ON public.auctions FOR UPDATE
  TO authenticated
  USING (status = 'active')
  WITH CHECK (status = 'active');

DROP POLICY IF EXISTS "Anyone can view bids" ON public.auction_bids;
CREATE POLICY "Anyone can view bids"
  ON public.auction_bids FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated can place bids" ON public.auction_bids;
CREATE POLICY "Authenticated can place bids"
  ON public.auction_bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bidder_id);
