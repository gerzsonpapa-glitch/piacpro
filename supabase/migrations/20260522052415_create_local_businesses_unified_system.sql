/*
  # Helyi Vállalkozások – Egységesített rendszer

  ## Összefoglalás
  A korábbi "Kistermelők" (producers) és "Boltok" (shops) rendszerek összevonása egy
  közös "Helyi vállalkozások" (local_businesses) rendszerbe. Az új rendszer digitális
  üzletprofilokat biztosít kistermelőknek, kézműveseknek, kisboltoknak, szolgáltatóknak,
  családi vállalkozásoknak és helyi szakembereknek.

  ## Új táblák

  ### local_businesses
  Az összes helyi vállalkozás profiljait tárolja, egységesen.
  - id, owner_id – tulajdonos
  - name, slug, tagline – alap azonosítók
  - description – hosszú bemutatkozás
  - business_type – vállalkozás típusa (producer/craftsman/shop/service/family/specialist)
  - logo_url, cover_url – profilképek
  - location, lat, lng – helyszín (opcionális GPS)
  - categories (text[]) – tetszőleges kategóriák tömbje
  - contact_phone, contact_email, website – elérhetőségek
  - is_active, is_verified, is_local_favorite, is_available_today – státuszok
  - avg_rating, review_count – értékelési aggregátumok
  - created_at, updated_at

  ### local_business_items
  Termékek és szolgáltatások – egységesített lista.
  - id, business_id
  - name, description
  - images (text[])
  - price, unit – ár + mértékegység (db, kg, óra, stb.)
  - compare_at_price – eredeti ár kedvezmény esetén
  - category_tag – termék/szolgáltatás kategória
  - is_available, is_featured – láthatóság
  - is_seasonal, is_fresh – szezonális/friss jelzők
  - stock_quantity, stock_note – készlet
  - created_at

  ### local_business_applications
  Regisztrációs kérelmek moderáláshoz.
  - id, user_id, business_type, message, status, reviewed_by, reviewed_at, created_at

  ## Biztonsági beállítások
  - RLS engedélyezve minden táblán
  - Nyilvánosan láthatók az aktív vállalkozások és termékeik
  - Szerkesztés csak saját vállalkozáson
  - Admin minden táblán korlátlan olvasási/írási jogot kap

  ## Megjegyzések
  - A meglévő producers és shops táblák érintetlen maradnak az adatmigráció idejére
  - Az új rendszer önállóan üzemel, nem függ a régitől
*/

-- ── Local businesses table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS local_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  slug text UNIQUE,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  business_type text NOT NULL DEFAULT 'shop',
  logo_url text,
  cover_url text,
  location text NOT NULL DEFAULT '',
  lat double precision,
  lng double precision,
  categories text[] NOT NULL DEFAULT '{}',
  contact_phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  is_local_favorite boolean NOT NULL DEFAULT false,
  is_available_today boolean NOT NULL DEFAULT false,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE local_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active businesses"
  ON local_businesses FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can insert own business"
  ON local_businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own business"
  ON local_businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own business"
  ON local_businesses FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all businesses"
  ON local_businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE INDEX IF NOT EXISTS local_businesses_owner_idx ON local_businesses(owner_id);
CREATE INDEX IF NOT EXISTS local_businesses_slug_idx ON local_businesses(slug);
CREATE INDEX IF NOT EXISTS local_businesses_type_idx ON local_businesses(business_type);
CREATE INDEX IF NOT EXISTS local_businesses_active_idx ON local_businesses(is_active);

-- ── Local business items (products & services) ────────────────────────────────

CREATE TABLE IF NOT EXISTS local_business_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES local_businesses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}',
  price numeric(12,2),
  compare_at_price numeric(12,2),
  unit text NOT NULL DEFAULT 'db',
  category_tag text NOT NULL DEFAULT '',
  is_available boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_seasonal boolean NOT NULL DEFAULT false,
  is_fresh boolean NOT NULL DEFAULT false,
  stock_quantity integer,
  stock_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE local_business_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view items of active businesses"
  ON local_business_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM local_businesses
      WHERE local_businesses.id = local_business_items.business_id
      AND local_businesses.is_active = true
    )
  );

CREATE POLICY "Owners can insert items to own business"
  ON local_business_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM local_businesses
      WHERE local_businesses.id = local_business_items.business_id
      AND local_businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update items of own business"
  ON local_business_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM local_businesses
      WHERE local_businesses.id = local_business_items.business_id
      AND local_businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM local_businesses
      WHERE local_businesses.id = local_business_items.business_id
      AND local_businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete items of own business"
  ON local_business_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM local_businesses
      WHERE local_businesses.id = local_business_items.business_id
      AND local_businesses.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS local_business_items_business_idx ON local_business_items(business_id);
CREATE INDEX IF NOT EXISTS local_business_items_available_idx ON local_business_items(is_available);

-- ── Application table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS local_business_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_type text NOT NULL DEFAULT 'shop',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE local_business_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON local_business_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application"
  ON local_business_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON local_business_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE POLICY "Admins can update applications"
  ON local_business_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE INDEX IF NOT EXISTS local_business_applications_user_idx ON local_business_applications(user_id);
CREATE INDEX IF NOT EXISTS local_business_applications_status_idx ON local_business_applications(status);

-- ── Auto-update trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_local_business_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'local_businesses_updated_at'
  ) THEN
    CREATE TRIGGER local_businesses_updated_at
      BEFORE UPDATE ON local_businesses
      FOR EACH ROW EXECUTE FUNCTION update_local_business_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'local_business_items_updated_at'
  ) THEN
    CREATE TRIGGER local_business_items_updated_at
      BEFORE UPDATE ON local_business_items
      FOR EACH ROW EXECUTE FUNCTION update_local_business_updated_at();
  END IF;
END $$;

-- ── Storage bucket for business images ───────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('business-images', 'business-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Business images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-images');

CREATE POLICY "Authenticated users can upload business images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'business-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own business images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'business-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own business images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'business-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── Add is_business_owner flag to profiles ────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_business_owner'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_business_owner boolean NOT NULL DEFAULT false;
  END IF;
END $$;
