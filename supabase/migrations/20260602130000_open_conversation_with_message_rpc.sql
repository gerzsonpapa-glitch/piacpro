/*
  # Megbízható beszélgetés + első üzenet (bolt/termelő rendelés)

  A kliens INSERT + SELECT gyakran elhasal RLS / .single() miatt.
  Egy SECURITY DEFINER RPC kezeli a létrehozást és az első üzenetet.
*/

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS context_key text;

CREATE INDEX IF NOT EXISTS conversations_context_key_idx
  ON conversations (buyer_id, seller_id, context_key)
  WHERE context_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.open_conversation_with_message(
  p_seller_id uuid,
  p_message text,
  p_listing_id uuid DEFAULT NULL,
  p_shop_product_id uuid DEFAULT NULL,
  p_context_key text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid := auth.uid();
  v_conv_id uuid;
  v_trimmed text := trim(p_message);
BEGIN
  IF v_buyer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Bejelentkezés szükséges.');
  END IF;

  IF v_buyer_id = p_seller_id THEN
    RETURN json_build_object('success', false, 'error', 'Nem küldhetsz üzenetet magadnak.');
  END IF;

  IF v_trimmed IS NULL OR length(v_trimmed) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Üres üzenet.');
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_buyer_id AND is_banned IS TRUE) THEN
    RETURN json_build_object('success', false, 'error', 'Fiókod le van tiltva.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_seller_id) THEN
    RETURN json_build_object('success', false, 'error', 'Az eladó profilja nem található.');
  END IF;

  IF p_listing_id IS NOT NULL THEN
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE listing_id = p_listing_id AND buyer_id = v_buyer_id
    LIMIT 1;
  ELSIF p_shop_product_id IS NOT NULL THEN
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE buyer_id = v_buyer_id
      AND seller_id = p_seller_id
      AND shop_product_id = p_shop_product_id
    LIMIT 1;
  ELSIF p_context_key IS NOT NULL AND length(trim(p_context_key)) > 0 THEN
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE buyer_id = v_buyer_id
      AND seller_id = p_seller_id
      AND context_key = p_context_key
    LIMIT 1;
  END IF;

  IF v_conv_id IS NULL THEN
    INSERT INTO conversations (
      buyer_id,
      seller_id,
      listing_id,
      shop_product_id,
      context_key,
      last_message_at
    )
    VALUES (
      v_buyer_id,
      p_seller_id,
      p_listing_id,
      p_shop_product_id,
      NULLIF(trim(p_context_key), ''),
      now()
    )
    RETURNING id INTO v_conv_id;
  END IF;

  INSERT INTO messages (conversation_id, sender_id, content, is_read)
  VALUES (v_conv_id, v_buyer_id, v_trimmed, false);

  UPDATE conversations
  SET last_message_at = now()
  WHERE id = v_conv_id;

  RETURN json_build_object('success', true, 'conversation_id', v_conv_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.open_conversation_with_message(uuid, text, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_conversation_with_message(uuid, text, uuid, uuid, text) TO authenticated;
