/*
  # Kistermelői piactér rendszer

  ## Új táblák

  ### producers
  A kistermelői profilok táblája. Csak admin által engedélyezett felhasználók hozhatnak létre profilt.
  - id, user_id (FK auth.users)
  - name, slug, bio, cover_url, avatar_url
  - location, lat, lng (GPS koordináták)
  - is_verified (admin hitelesítette)
  - is_local_favorite (admin badge)
  - is_available_today (termelő manuálisan állítja)
  - categories (text[] – termék kategóriák)
  - contact_phone, contact_email
  - avg_rating, review_count, transaction_count
  - approved_at (mikor kapta meg a termelői jogot)
  - created_at

  ### producer_products
  Termelői termékek
  - id, producer_id (FK producers)
  - name, description, images (text[])
  - price, unit (pl. "kg", "db", "üveg")
  - category_tag
  - is_available, is_seasonal, is_fresh_harvest
  - stock_note (pl. "5 kg van raktáron")
  - created_at

  ### producer_applications
  Termelői jogért való jelentkezés – admin kezeli
  - id, user_id, message, status (pending/approved/rejected)
  - reviewed_by, reviewed_at
  - created_at

  ## Biztonság
  - RLS minden táblán
  - Termelő profilt csak az adott user tudja szerkeszteni
  - Terméket csak a saját termelői profil tulajdonosa adhat hozzá
  - producer_applications: user látja sajátját, admin mindet
*/

-- ── producers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  slug text UNIQUE,
  bio text DEFAULT '',
  cover_url text,
  avatar_url text,
  location text DEFAULT '',
  lat double precision,
  lng double precision,
  is_verified boolean DEFAULT false,
  is_local_favorite boolean DEFAULT false,
  is_available_today boolean DEFAULT false,
  categories text[] DEFAULT '{}',
  contact_phone text,
  contact_email text,
  avg_rating double precision DEFAULT 0,
  review_count integer DEFAULT 0,
  transaction_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE producers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view producers"
  ON producers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owner can insert own producer profile"
  ON producers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own producer profile"
  ON producers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update any producer"
  ON producers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin can delete any producer"
  ON producers FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── producer_products ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producer_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  images text[] DEFAULT '{}',
  price numeric,
  unit text DEFAULT 'db',
  category_tag text,
  is_available boolean DEFAULT true,
  is_seasonal boolean DEFAULT false,
  is_fresh_harvest boolean DEFAULT false,
  stock_note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE producer_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view producer products"
  ON producer_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Producer owner can insert products"
  ON producer_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM producers WHERE id = producer_id AND user_id = auth.uid())
  );

CREATE POLICY "Producer owner can update products"
  ON producer_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM producers WHERE id = producer_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM producers WHERE id = producer_id AND user_id = auth.uid())
  );

CREATE POLICY "Producer owner can delete products"
  ON producer_products FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM producers WHERE id = producer_id AND user_id = auth.uid())
  );

CREATE POLICY "Admin can manage all producer products"
  ON producer_products FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── producer_applications ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE producer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application"
  ON producer_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users can insert own application"
  ON producer_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update applications"
  ON producer_applications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ── profiles: is_producer_approved flag ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_producer_approved'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_producer_approved boolean DEFAULT false;
  END IF;
END $$;
