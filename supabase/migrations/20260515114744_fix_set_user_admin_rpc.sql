/*
  # set_user_admin RPC javítás

  A SECURITY DEFINER RPC postgres superuser jogon fut, ezért az RLS nem blokkolja.
  A függvény manuálisan ellenőrzi hogy a hívó super admin-e.

  Frissítések:
  - is_super_admin() függvény újraépítése (biztonságos)
  - set_user_admin újraépítése explicit super admin ellenőrzéssel
*/

-- Super admin helper
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Admin rang adás/elvétel — csak super admin hívhatja
CREATE OR REPLACE FUNCTION set_user_admin(target_user_id uuid, admin_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_super boolean;
  target_is_super boolean;
BEGIN
  -- Hívó super admin-e?
  SELECT is_super_admin INTO caller_is_super FROM profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_is_super, false) THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: csak super admin adhat admin jogot';
  END IF;

  -- Saját magát nem módosíthatja
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Saját admin jogodat nem változtathatod';
  END IF;

  -- Super admin jogát nem lehet ezzel módosítani
  SELECT is_super_admin INTO target_is_super FROM profiles WHERE id = target_user_id;
  IF COALESCE(target_is_super, false) THEN
    RAISE EXCEPTION 'Super admin jogát nem lehet módosítani';
  END IF;

  UPDATE profiles SET is_admin = admin_value WHERE id = target_user_id;
END;
$$;
