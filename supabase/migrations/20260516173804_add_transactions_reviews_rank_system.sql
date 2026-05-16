/*
  # Tranzakciók, értékelések és rang rendszer

  ## Új táblák

  ### transactions
  - Hirdetéshez kapcsolódó eladási tranzakciók nyilvántartása
  - Státuszok: chat_started, deal_pending, completed, cancelled
  - Kapcsolódik: listing_id, seller_id, buyer_id

  ### listing_reviews
  - Vásárló értékeli az eladót egy lezárt tranzakció után
  - 1-5 csillag, szöveges vélemény, ajánlja-e az eladót
  - Kapcsolódik: transaction_id, listing_id, reviewer_id (buyer), reviewed_id (seller)

  ## Módosítások

  ### profiles
  - total_sales: sikeres eladások száma
  - avg_rating: átlag értékelés
  - rank: rang szöveg (Újonc, Megbízható Eladó, Profi Eladó, Kiemelt Eladó, PiacPro Partner)
  - rank_level: rang szám (1-5)
  - positive_ratio: pozitív értékelések aránya (%)
  - total_reviews: összes értékelés száma

  ### conversations
  - transaction_id: opcionális kapcsolat a tranzakcióhoz

  ## Biztonsági változások
  - RLS minden új táblán
  - Eladó lezárhatja a tranzakciót
  - Vásárló értékelhet, de csak egyszer
*/

-- ── transactions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'chat_started'
    CHECK (status IN ('chat_started', 'deal_pending', 'completed', 'cancelled')),
  sold_to_buyer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seller and buyer can view transaction"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Seller can insert transaction"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Seller can update transaction status"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- ── listing_reviews ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  recommended boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE listing_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON listing_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Buyer can insert review once per transaction"
  ON listing_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND NOT EXISTS (
      SELECT 1 FROM listing_reviews lr
      WHERE lr.reviewer_id = auth.uid()
        AND lr.transaction_id = listing_reviews.transaction_id
    )
  );

-- ── profiles: rang és értékelés mezők ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='total_sales') THEN
    ALTER TABLE profiles ADD COLUMN total_sales integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avg_rating') THEN
    ALTER TABLE profiles ADD COLUMN avg_rating numeric(3,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='total_reviews') THEN
    ALTER TABLE profiles ADD COLUMN total_reviews integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='positive_ratio') THEN
    ALTER TABLE profiles ADD COLUMN positive_ratio integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='rank_level') THEN
    ALTER TABLE profiles ADD COLUMN rank_level integer NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='rank_title') THEN
    ALTER TABLE profiles ADD COLUMN rank_title text NOT NULL DEFAULT 'Újonc';
  END IF;
END $$;

-- ── conversations: transaction_id opcionális hivatkozás ───────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='transaction_id') THEN
    ALTER TABLE conversations ADD COLUMN transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='sold_status') THEN
    ALTER TABLE conversations ADD COLUMN sold_status text DEFAULT NULL
      CHECK (sold_status IS NULL OR sold_status IN ('sold', 'pending'));
  END IF;
END $$;

-- ── Trigger: rang frissítése review után ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_seller_rank()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total integer;
  v_avg numeric;
  v_positive integer;
  v_sales integer;
  v_ratio integer;
  v_rank_level integer;
  v_rank_title text;
BEGIN
  -- Összesítés a reviewed_id eladóra
  SELECT
    COUNT(*),
    COALESCE(AVG(score), 0),
    COUNT(*) FILTER (WHERE score >= 4)
  INTO v_total, v_avg, v_positive
  FROM listing_reviews
  WHERE reviewed_id = NEW.reviewed_id;

  SELECT total_sales INTO v_sales FROM profiles WHERE id = NEW.reviewed_id;
  v_ratio := CASE WHEN v_total > 0 THEN (v_positive * 100 / v_total) ELSE 0 END;

  -- Rang meghatározása
  IF v_sales >= 50 AND v_ratio >= 90 THEN
    v_rank_level := 5; v_rank_title := 'PiacPro Partner';
  ELSIF v_sales >= 50 THEN
    v_rank_level := 4; v_rank_title := 'Kiemelt Eladó';
  ELSIF v_sales >= 25 THEN
    v_rank_level := 3; v_rank_title := 'Profi Eladó';
  ELSIF v_sales >= 5 AND v_total >= 5 THEN
    v_rank_level := 2; v_rank_title := 'Megbízható Eladó';
  ELSE
    v_rank_level := 1; v_rank_title := 'Újonc';
  END IF;

  UPDATE profiles SET
    total_reviews = v_total,
    avg_rating = v_avg,
    positive_ratio = v_ratio,
    rank_level = v_rank_level,
    rank_title = v_rank_title
  WHERE id = NEW.reviewed_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_update_rank ON listing_reviews;
CREATE TRIGGER on_review_update_rank
  AFTER INSERT ON listing_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rank();

-- ── Trigger: total_sales frissítése transaction completion után ───────────────
CREATE OR REPLACE FUNCTION update_seller_sales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    UPDATE profiles SET total_sales = total_sales + 1 WHERE id = NEW.seller_id;
    -- Rang újraszámítás (sales nélkül nincs review trigger, ezért itt is futtatjuk)
    PERFORM update_seller_rank_by_id(NEW.seller_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Segédfüggvény: rang újraszámítás seller_id alapján
CREATE OR REPLACE FUNCTION update_seller_rank_by_id(p_seller_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total integer;
  v_avg numeric;
  v_positive integer;
  v_sales integer;
  v_ratio integer;
  v_rank_level integer;
  v_rank_title text;
BEGIN
  SELECT
    COUNT(*),
    COALESCE(AVG(score), 0),
    COUNT(*) FILTER (WHERE score >= 4)
  INTO v_total, v_avg, v_positive
  FROM listing_reviews
  WHERE reviewed_id = p_seller_id;

  SELECT total_sales INTO v_sales FROM profiles WHERE id = p_seller_id;
  v_ratio := CASE WHEN v_total > 0 THEN (v_positive * 100 / v_total) ELSE 0 END;

  IF v_sales >= 50 AND v_ratio >= 90 THEN
    v_rank_level := 5; v_rank_title := 'PiacPro Partner';
  ELSIF v_sales >= 50 THEN
    v_rank_level := 4; v_rank_title := 'Kiemelt Eladó';
  ELSIF v_sales >= 25 THEN
    v_rank_level := 3; v_rank_title := 'Profi Eladó';
  ELSIF v_sales >= 5 AND v_total >= 5 THEN
    v_rank_level := 2; v_rank_title := 'Megbízható Eladó';
  ELSE
    v_rank_level := 1; v_rank_title := 'Újonc';
  END IF;

  UPDATE profiles SET
    total_reviews = v_total,
    avg_rating = v_avg,
    positive_ratio = v_ratio,
    rank_level = v_rank_level,
    rank_title = v_rank_title
  WHERE id = p_seller_id;
END;
$$;

DROP TRIGGER IF EXISTS on_transaction_complete_update_sales ON transactions;
CREATE TRIGGER on_transaction_complete_update_sales
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_sales();

-- ── RPC: eladó lezárja az eladást ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION close_sale(
  p_listing_id uuid,
  p_buyer_id uuid,
  p_conversation_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id uuid;
  v_transaction_id uuid;
  v_sold_at timestamptz;
BEGIN
  -- Ellenőrizzük hogy a hívó az eladó
  SELECT seller_id INTO v_seller_id FROM listings WHERE id = p_listing_id;
  IF v_seller_id IS NULL OR v_seller_id <> auth.uid() THEN
    RETURN json_build_object('error', 'Csak az eladó zárhatja le az eladást');
  END IF;

  v_sold_at := now();

  -- Hirdetés státusz: sold
  UPDATE listings SET status = 'sold', sold_at = v_sold_at WHERE id = p_listing_id;

  -- Tranzakció létrehozása vagy frissítése
  INSERT INTO transactions (listing_id, seller_id, buyer_id, conversation_id, status, sold_to_buyer_id, completed_at)
  VALUES (p_listing_id, v_seller_id, p_buyer_id, p_conversation_id, 'completed', p_buyer_id, v_sold_at)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_transaction_id;

  IF v_transaction_id IS NULL THEN
    SELECT id INTO v_transaction_id FROM transactions
    WHERE listing_id = p_listing_id AND seller_id = v_seller_id AND buyer_id = p_buyer_id;
    UPDATE transactions SET status = 'completed', completed_at = v_sold_at, sold_to_buyer_id = p_buyer_id
    WHERE id = v_transaction_id;
  END IF;

  -- Conversation: sold_status jelölés
  UPDATE conversations SET sold_status = 'sold', transaction_id = v_transaction_id WHERE id = p_conversation_id;

  RETURN json_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$;
