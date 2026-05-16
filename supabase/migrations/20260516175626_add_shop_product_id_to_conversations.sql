/*
  # shop_product_id hozzáadása a conversations táblához

  A bolt termékeknél a chat indításakor nincs listing_id (csak shop_product_id),
  ezért az üzenetablakban nem jelent meg a termék. Ez a migráció hozzáad egy
  shop_product_id opcionális foreign key-t a conversations táblához.

  ## Módosítások
  - conversations.shop_product_id (uuid, nullable, FK → shop_products.id)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'shop_product_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN shop_product_id uuid REFERENCES shop_products(id) ON DELETE SET NULL;
  END IF;
END $$;
