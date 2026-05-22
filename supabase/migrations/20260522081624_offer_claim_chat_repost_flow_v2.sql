/*
  # Offer claim-chat-repost flow v2

  Drop and recreate claim_support_offer with new return type (uuid = conv_id),
  add repost_support_offer RPC, add conversation_id column.
*/

-- 1. Add conversation_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_offers' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE support_offers ADD COLUMN conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Drop old claim function and recreate with conversation creation + uuid return
DROP FUNCTION IF EXISTS claim_support_offer(uuid);

CREATE FUNCTION claim_support_offer(offer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer support_offers%ROWTYPE;
  v_conv_id uuid;
BEGIN
  SELECT * INTO v_offer FROM support_offers WHERE id = offer_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.status != 'active' THEN
    RAISE EXCEPTION 'Ez a felajánlás már nem elérhető';
  END IF;

  IF v_offer.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Saját felajánlásod nem igényelheted';
  END IF;

  -- Find or create conversation between claimer and owner
  SELECT id INTO v_conv_id
  FROM conversations
  WHERE (
    (buyer_id = auth.uid() AND seller_id = v_offer.user_id)
    OR (buyer_id = v_offer.user_id AND seller_id = auth.uid())
  )
  AND listing_id IS NULL
  LIMIT 1;

  IF v_conv_id IS NULL THEN
    INSERT INTO conversations (buyer_id, seller_id, listing_id)
    VALUES (auth.uid(), v_offer.user_id, NULL)
    RETURNING id INTO v_conv_id;
  END IF;

  UPDATE support_offers
  SET
    status = 'claimed',
    claimed_by = auth.uid(),
    claimed_at = now(),
    conversation_id = v_conv_id,
    updated_at = now()
  WHERE id = offer_id;

  RETURN v_conv_id;
END;
$$;

-- 3. repost_support_offer — owner resets offer back to active
CREATE OR REPLACE FUNCTION repost_support_offer(offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer support_offers%ROWTYPE;
BEGIN
  SELECT * INTO v_offer FROM support_offers WHERE id = offer_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.user_id != auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    ) THEN
      RAISE EXCEPTION 'Csak a felajánló tudja visszaposztolni';
    END IF;
  END IF;

  UPDATE support_offers
  SET
    status = 'active',
    claimed_by = NULL,
    claimed_at = NULL,
    conversation_id = NULL,
    updated_at = now()
  WHERE id = offer_id;
END;
$$;

-- 4. Owner update policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_offers' AND policyname = 'Owners can update own offers'
  ) THEN
    CREATE POLICY "Owners can update own offers"
      ON support_offers FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
