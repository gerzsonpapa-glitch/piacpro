/*
  # Piactér lényegi javítások (licit, állás, termelő)

  - Licit lezárás: winner_id, listing sync, nulla licites lejárat
  - undo_last_bid RPC (ár + időzítő helyreállítás)
  - finalize_auction_if_expired — kliens hívható azonnali lezárás
  - Állások / álláskeresők automatikus lejárata
  - Termelő: jóváhagyás kötelező INSERT-nél, saját törlés RPC
*/

-- ─── Aukció táblák (ha korai migrációk kimaradtak) ───────────────────────────
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

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS sold_at timestamptz;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS timer_started boolean NOT NULL DEFAULT false;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS timer_started_at timestamptz;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS extension_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS bid_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS ended_at timestamptz;

CREATE TABLE IF NOT EXISTS public.auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auction_bids_auction_id_idx ON public.auction_bids(auction_id);
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- ─── Licit: lejárás + nyertes ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_end_expired_auctions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  WITH ended AS (
    UPDATE public.auctions a
    SET
      status = 'ended',
      ended_at = COALESCE(a.ended_at, now()),
      winner_id = (
        SELECT ab.bidder_id
        FROM public.auction_bids ab
        WHERE ab.auction_id = a.id
        ORDER BY ab.amount DESC, ab.created_at ASC
        LIMIT 1
      ),
      updated_at = now()
    WHERE
      a.status = 'active'
      AND a.ends_at IS NOT NULL
      AND a.ends_at <= now()
      AND (
        a.timer_started = true
        OR (NOT a.timer_started AND COALESCE(a.bid_count, 0) = 0)
      )
    RETURNING a.id, a.listing_id, a.winner_id
  )
  UPDATE public.listings l
  SET
    status = CASE WHEN e.winner_id IS NOT NULL THEN 'sold' ELSE 'ended' END,
    sold_at = CASE WHEN e.winner_id IS NOT NULL THEN now() ELSE l.sold_at END,
    updated_at = now()
  FROM ended e
  WHERE l.id = e.listing_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_auction_if_expired(p_auction_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction public.auctions%ROWTYPE;
  v_winner uuid;
BEGIN
  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Az aukció nem található.');
  END IF;

  IF v_auction.status <> 'active' THEN
    RETURN json_build_object('success', true, 'already_ended', true);
  END IF;

  IF v_auction.ends_at IS NULL OR v_auction.ends_at > now() THEN
    RETURN json_build_object('success', false, 'error', 'Az aukció még nem járt le.');
  END IF;

  IF v_auction.timer_started OR COALESCE(v_auction.bid_count, 0) = 0 THEN
    SELECT ab.bidder_id INTO v_winner
    FROM public.auction_bids ab
    WHERE ab.auction_id = p_auction_id
    ORDER BY ab.amount DESC, ab.created_at ASC
    LIMIT 1;

    UPDATE public.auctions
    SET
      status = 'ended',
      ended_at = now(),
      winner_id = v_winner,
      updated_at = now()
    WHERE id = p_auction_id;

    UPDATE public.listings
    SET
      status = CASE WHEN v_winner IS NOT NULL THEN 'sold' ELSE 'ended' END,
      sold_at = CASE WHEN v_winner IS NOT NULL THEN now() ELSE sold_at END,
      updated_at = now()
    WHERE id = v_auction.listing_id;

    RETURN json_build_object('success', true);
  END IF;

  RETURN json_build_object('success', false, 'error', 'Az aukció még vár licitre.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_auction_if_expired(uuid) TO authenticated, anon;

-- ─── Licit: licit visszavonás (60 mp) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.undo_last_bid(p_auction_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_auction public.auctions%ROWTYPE;
  v_top_bid public.auction_bids%ROWTYPE;
  v_new_price numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Bejelentkezés szükséges.');
  END IF;

  SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Az aukció nem található.');
  END IF;

  IF v_auction.status <> 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Az aukció már lezárult.');
  END IF;

  SELECT * INTO v_top_bid
  FROM public.auction_bids
  WHERE auction_id = p_auction_id
  ORDER BY amount DESC, created_at DESC
  LIMIT 1;

  IF NOT FOUND OR v_top_bid.bidder_id <> v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Csak a saját legutóbbi licited vonható vissza.');
  END IF;

  IF v_top_bid.created_at < now() - interval '60 seconds' THEN
    RETURN json_build_object('success', false, 'error', 'A visszavonási idő (60 mp) lejárt.');
  END IF;

  DELETE FROM public.auction_bids WHERE id = v_top_bid.id;

  SELECT ab.amount INTO v_new_price
  FROM public.auction_bids ab
  WHERE ab.auction_id = p_auction_id
  ORDER BY ab.amount DESC, ab.created_at DESC
  LIMIT 1;

  IF v_new_price IS NULL THEN
    UPDATE public.auctions
    SET
      current_price = starting_price,
      timer_started = false,
      timer_started_at = NULL,
      ends_at = created_at + (duration_hours || ' hours')::interval,
      updated_at = now()
    WHERE id = p_auction_id;
  ELSE
    UPDATE public.auctions
    SET current_price = v_new_price, updated_at = now()
    WHERE id = p_auction_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.undo_last_bid(uuid) TO authenticated;

-- ─── Állások: automatikus lejárat ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_expire_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer := 0;
  c integer;
BEGIN
  UPDATE public.jobs
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND expires_at <= now();
  GET DIAGNOSTICS c = ROW_COUNT;
  n := n + c;

  UPDATE public.job_seeker_ads
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND expires_at <= now();
  GET DIAGNOSTICS c = ROW_COUNT;
  n := n + c;

  RETURN n;
END;
$$;

-- Cron: 6 óránként (ha pg_cron elérhető)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('auto-expire-jobs');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'auto-expire-jobs',
      '0 */6 * * *',
      'SELECT public.auto_expire_jobs()'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ─── Termelő: jóváhagyás + saját törlés ─────────────────────────────────────
DROP POLICY IF EXISTS "Owner can insert own producer profile" ON public.producers;

CREATE POLICY "Approved owner can insert producer profile"
  ON public.producers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_producer_approved = true
    )
  );

CREATE OR REPLACE FUNCTION public.delete_own_producer(p_producer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.producers
    WHERE id = p_producer_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.producers WHERE id = p_producer_id;
  UPDATE public.profiles SET is_producer_approved = false WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_producer(uuid) TO authenticated;
