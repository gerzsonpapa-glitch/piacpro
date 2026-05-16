/*
  # Termelői készlet és rendelés-elfogadás rendszer

  ## Változások

  ### producer_products módosítás
  - `stock_quantity` (numeric, nullable): numerikus készlet (pl. 40 kg)
  - `stock_unit` most már a `unit` mezőből következik, nem kell külön

  ### producer_order_confirmations tábla
  - A termelő egy chatbeli rendelést megerősíthet
  - Megerősítéskor a rendszer levonja a készletből a megrendelt mennyiséget

  ### Columns
  - `id` uuid PK
  - `conversation_id` uuid → conversations
  - `producer_id` uuid → producers
  - `confirmed_by` uuid → profiles (a termelő user_id-je)
  - `items` jsonb: [{ product_id, product_name, quantity, unit }]
  - `note` text: opcionális termelői megjegyzés
  - `confirmed_at` timestamptz

  ### RPC
  - `confirm_producer_order(p_conversation_id, p_producer_id, p_items jsonb, p_note text)`
    - Létrehozza a megerősítést
    - Levonja minden termék stock_quantity-ából a megrendelt mennyiséget
    - Ha stock_quantity 0 alá menne, is_available = false lesz

  ## Biztonság
  - RLS engedélyezett
  - Csak a termelő saját maga fogadhatja el a rendelést
*/

-- 1. stock_quantity hozzáadása producer_products-hoz
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'producer_products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE producer_products ADD COLUMN stock_quantity numeric DEFAULT NULL;
  END IF;
END $$;

-- 2. producer_order_confirmations tábla
CREATE TABLE IF NOT EXISTS producer_order_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  confirmed_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]',
  note text DEFAULT '',
  confirmed_at timestamptz DEFAULT now()
);

ALTER TABLE producer_order_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producer can insert own confirmations"
  ON producer_order_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (confirmed_by = auth.uid());

CREATE POLICY "Conversation participants can view confirmations"
  ON producer_order_confirmations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- 3. RPC: confirm_producer_order
CREATE OR REPLACE FUNCTION confirm_producer_order(
  p_conversation_id uuid,
  p_producer_id uuid,
  p_items jsonb,
  p_note text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_producer_user_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric;
  v_new_stock numeric;
  v_conf_id uuid;
BEGIN
  -- Ellenőrzés: csak a termelő saját maga fogadhatja el
  SELECT user_id INTO v_producer_user_id FROM producers WHERE id = p_producer_id;
  IF v_producer_user_id IS NULL OR v_producer_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Nincs jogosultságod ehhez a művelethez.');
  END IF;

  -- Készlet levonása minden tételnél
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::numeric;

    UPDATE producer_products
    SET
      stock_quantity = CASE
        WHEN stock_quantity IS NOT NULL THEN GREATEST(0, stock_quantity - v_qty)
        ELSE NULL
      END,
      is_available = CASE
        WHEN stock_quantity IS NOT NULL AND (stock_quantity - v_qty) <= 0 THEN false
        ELSE is_available
      END
    WHERE id = v_product_id AND producer_id = p_producer_id;
  END LOOP;

  -- Megerősítés mentése
  INSERT INTO producer_order_confirmations (conversation_id, producer_id, confirmed_by, items, note)
  VALUES (p_conversation_id, p_producer_id, auth.uid(), p_items, p_note)
  RETURNING id INTO v_conf_id;

  RETURN jsonb_build_object('success', true, 'confirmation_id', v_conf_id);
END;
$$;
