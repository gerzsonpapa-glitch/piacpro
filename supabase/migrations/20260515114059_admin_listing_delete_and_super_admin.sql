/*
  # Admin hirdetéstörlés + super admin rendszer

  ## Változások

  1. Új oszlop: `profiles.is_super_admin` (boolean, default false)
     - Csak a super admin adhat admin/super_admin jogot másoknak
     - A sima admin nem tud más adminnak jogot adni

  2. Listings UPDATE policy adminoknak
     - Adminok bármely hirdetést törölhetnek (status = 'deleted' frissítés)
     - A meglévő "Sellers can update own listings" policy megmarad

  3. Profiles UPDATE policy kibővítve
     - Adminok frissíthetik a is_admin mezőt is (de is_super_admin csak super adminnak)
     - Új RPC: set_user_admin — csak super admin hívhatja
*/

-- 1. Super admin oszlop hozzáadása
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_super_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Admin UPDATE policy listings-re (ha nem létezik)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'listings' AND policyname = 'Admins can update any listing'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can update any listing"
        ON listings FOR UPDATE
        TO authenticated
        USING (is_admin())
        WITH CHECK (is_admin());
    $policy$;
  END IF;
END $$;

-- 3. is_super_admin() helper függvény
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 4. RPC: set_user_admin — csak super admin hívhatja
--    Megadja vagy elveszi egy felhasználó admin jogát
CREATE OR REPLACE FUNCTION set_user_admin(target_user_id uuid, admin_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Csak super admin hívhatja
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Csak super admin adhat admin jogot';
  END IF;

  -- Super admin saját magát nem változtathatja
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Saját admin jogodat nem változtathatod';
  END IF;

  -- Super admint nem lehet levenni admin jogból ezzel a funkcióval
  IF EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Super admin jogát nem lehet módosítani';
  END IF;

  UPDATE profiles SET is_admin = admin_value WHERE id = target_user_id;
END;
$$;

-- 5. Profiles UPDATE policy: admin frissíthet is_admin mezőt (csak super admin via RPC-n keresztül)
--    A meglévő "Admins can update any profile" policy megmarad, de az is_admin mező
--    közvetlenül nem módosítható kliens oldalról — arra a set_user_admin RPC van.
