/*
  # Admin felhasználók automatikus AI hozzáférése

  ## Változások
  1. Trigger: Ha egy profil is_admin = true lesz, automatikusan ai_access = true
  2. Backfill: Meglévő adminok megkapják az ai_access = true értéket
  3. RLS policy: Admin maga is tudja az ai_access-t adni/venni más felhasználóknak
*/

-- 1. Trigger function: ha valaki admin lesz, kap AI hozzáférést
CREATE OR REPLACE FUNCTION auto_grant_ai_access_to_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ha az is_admin true lett, grant ai_access
  IF NEW.is_admin = true AND (OLD.is_admin IS DISTINCT FROM true) THEN
    NEW.ai_access := true;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Trigger létrehozása (ha még nem létezik, töröljük és újra)
DROP TRIGGER IF EXISTS trg_admin_ai_access ON profiles;

CREATE TRIGGER trg_admin_ai_access
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_grant_ai_access_to_admin();

-- 3. Backfill: meglévő adminok kapják meg az AI hozzáférést
UPDATE profiles
SET ai_access = true
WHERE is_admin = true AND ai_access IS DISTINCT FROM true;
