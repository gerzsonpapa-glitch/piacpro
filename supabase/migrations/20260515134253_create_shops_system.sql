/*
  # Shops System

  ## Summary
  Introduces a "Boltok" (Shops) section where verified shop owners can manage a storefront
  with products and promotions that are isolated from the main marketplace feed.

  ## New Tables

  ### shops
  Represents a storefront. Each shop belongs to one owner (profile).
  - id, owner_id, name, slug (unique URL), description, logo_url, banner_url
  - category: broad shop type (electronics, fashion, food, sport, other, etc.)
  - location, contact_email, contact_phone, website
  - is_active: whether the shop is publicly visible
  - is_verified: set by admins
  - created_at, updated_at

  ### shop_products
  Products listed within a shop. Completely separate from the main listings table.
  - id, shop_id, name, description, price, compare_at_price (original/crossed-out price)
  - category_tag: free-text category within the shop (e.g. "Nyári kollekcio")
  - images (text[]), stock (nullable)
  - is_active, is_featured
  - created_at, updated_at

  ### shop_promotions
  Time-limited promotions / deals announced by the shop owner. Only visible inside the shop.
  - id, shop_id, title, description, discount_percent, valid_until
  - is_active
  - created_at

  ## Security
  - RLS enabled on all 3 tables
  - Public can read active shops and their products/promotions
  - Only the shop owner (or admin) can insert/update/delete their own shop data
  - is_shop_owner column added to profiles so Layout can show "Boltom" nav item

  ## Profile Changes
  - Added `is_shop_owner` boolean DEFAULT false to profiles
*/

-- ── shops ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text NOT NULL DEFAULT '',
  logo_url        text,
  banner_url      text,
  category        text NOT NULL DEFAULT 'other',
  location        text NOT NULL DEFAULT '',
  contact_email   text NOT NULL DEFAULT '',
  contact_phone   text NOT NULL DEFAULT '',
  website         text NOT NULL DEFAULT '',
  is_active       boolean NOT NULL DEFAULT true,
  is_verified     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shops"
  ON shops FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owner can view own shop even inactive"
  ON shops FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can insert own shop"
  ON shops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update own shop"
  ON shops FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can delete own shop"
  ON shops FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ── shop_products ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id           uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name              text NOT NULL,
  description       text NOT NULL DEFAULT '',
  price             numeric(12,2) NOT NULL DEFAULT 0,
  compare_at_price  numeric(12,2),
  category_tag      text NOT NULL DEFAULT '',
  images            text[] NOT NULL DEFAULT '{}',
  stock             integer,
  is_active         boolean NOT NULL DEFAULT true,
  is_featured       boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products of active shops"
  ON shop_products FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.is_active = true)
  );

CREATE POLICY "Owner can view all products of own shop"
  ON shop_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  );

CREATE POLICY "Owner can insert products into own shop"
  ON shop_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  );

CREATE POLICY "Owner can update products in own shop"
  ON shop_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  );

CREATE POLICY "Owner can delete products from own shop"
  ON shop_products FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  );

-- ── shop_promotions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_promotions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id          uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text NOT NULL DEFAULT '',
  discount_percent integer,
  valid_until      timestamptz,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shop_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions of active shops"
  ON shop_promotions FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.is_active = true)
  );

CREATE POLICY "Owner can view all promotions of own shop"
  ON shop_promotions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  );

CREATE POLICY "Owner can insert promotions into own shop"
  ON shop_promotions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  );

CREATE POLICY "Owner can update promotions in own shop"
  ON shop_promotions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  );

CREATE POLICY "Owner can delete promotions from own shop"
  ON shop_promotions FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_id AND shops.owner_id = auth.uid())
  );

-- ── indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category);
CREATE INDEX IF NOT EXISTS idx_shop_products_shop ON shop_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_tag ON shop_products(category_tag);
CREATE INDEX IF NOT EXISTS idx_shop_promotions_shop ON shop_promotions(shop_id);

-- ── profiles: is_shop_owner ────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_shop_owner'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_shop_owner boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ── admin policies ─────────────────────────────────────────────────────────────
CREATE POLICY "Admins can update any shop"
  ON shops FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "Admins can delete any shop"
  ON shops FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- updated_at trigger for shops
CREATE OR REPLACE FUNCTION update_shop_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER shop_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_shop_updated_at();

CREATE OR REPLACE TRIGGER shop_product_updated_at
  BEFORE UPDATE ON shop_products
  FOR EACH ROW EXECUTE FUNCTION update_shop_updated_at();
