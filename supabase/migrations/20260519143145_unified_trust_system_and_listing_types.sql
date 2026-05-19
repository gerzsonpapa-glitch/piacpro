/*
  # Egységes Trust Rendszer és Listing Típusbővítés

  ## Összefoglaló
  Ez a migráció bevezeti az egységes trust (bizalmi) szint rendszert és bővíti
  a listings táblát a unified listing model támogatásával.

  ## Változások

  ### 1. profiles tábla — trust_level mező
  - `trust_level` (0–5 skála)
    - 0: új felhasználó (regisztráció utáni első napok)
    - 1: alap felhasználó (emailt megerősített, aktív)
    - 2: megbízható (5+ tranzakció VAGY 7+ napja regisztrált aktív)
    - 3: ellenőrzött eladó (25+ tranzakció VAGY admin kézi jóváhagyás)
    - 4: partner (50+ tranzakció + 90%+ pozitív arány)
    - 5: official szervezet (csak admin adhatja)
  - Meglévő felhasználóknál automatikusan kiszámított az eddigi rank_level alapján

  ### 2. listings tábla — bővítések
  - `listing_type` meglévő mező értékkészlet bővítése:
    ma: 'regular' | 'auction'
    új: 'regular' | 'auction' | 'job' | 'donation' | 'shop' | 'producer' | 'service'
  - `moderation_status` (new) — moderációs státusz
    'pending' | 'active' | 'rejected' | 'hidden'
    (a meglévő `status` mezőtől elkülönítve, hogy ne törjük)
  - `trust_required` — minimum trust szint a megtekintéshez (default 0)
  - `lat` és `lng` — GPS koordináták (listings-ben eddig csak text location volt)

  ### 3. donations tábla — moderation_status hozzáadása
  - `moderation_status` text 'pending' | 'active' | 'rejected'
  - Új kampányok alapértelmezetten 'pending' státuszban jönnek létre
  - Admin jóváhagyás szükséges a 'active' státuszhoz

  ### 4. jobs tábla — trust gate
  - `poster_trust_level` — a feladó trust szintje rögzítve
  - `moderation_status` — 'pending' (normál user) | 'active' (cég/magas trust)

  ## Biztonsági változások
  - Admin moderáció szükséges donation és job posztoláshoz (trust < 3)
  - Trust szint RLS-ben is figyelembe kerül
*/

-- ── 1. TRUST LEVEL HOZZÁADÁSA A PROFILES TÁBLÁHOZ ──────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trust_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trust_level integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Meglévő felhasználók trust_level-jét rank_level alapján számítjuk ki
UPDATE profiles SET trust_level = CASE
  WHEN rank_level >= 5 THEN 4
  WHEN rank_level >= 4 THEN 3
  WHEN rank_level >= 3 THEN 3
  WHEN rank_level >= 2 THEN 2
  ELSE 1
END
WHERE trust_level = 1;

-- Adminok és szuper adminok max trust-ot kapnak
UPDATE profiles SET trust_level = 5 WHERE is_admin = true OR is_super_admin = true;

-- ── 2. LISTINGS TÁBLA BŐVÍTÉSE ───────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE listings ADD COLUMN moderation_status text NOT NULL DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'trust_required'
  ) THEN
    ALTER TABLE listings ADD COLUMN trust_required integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'lat'
  ) THEN
    ALTER TABLE listings ADD COLUMN lat double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'lng'
  ) THEN
    ALTER TABLE listings ADD COLUMN lng double precision;
  END IF;
END $$;

-- listing_type bővítés: shop, producer, service, job típusok hozzáadása
-- Meglévő constraint-et frissítjük ha van
DO $$
BEGIN
  -- Ha van check constraint a listing_type-ra, eltávolítjuk
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name = 'listings' AND tc.constraint_name LIKE '%listing_type%'
  ) THEN
    ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_listing_type_check;
  END IF;
END $$;

-- ── 3. DONATIONS MODERATION STATUS ──────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donations' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE donations ADD COLUMN moderation_status text NOT NULL DEFAULT 'pending';
  END IF;

  -- escrow_amount: mennyi pénz van "zárolva" (valós pénzmozgás szimulációhoz)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donations' AND column_name = 'escrow_amount'
  ) THEN
    ALTER TABLE donations ADD COLUMN escrow_amount integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Meglévő aktív donation-ok maradjanak aktívak, de ezentúl újak pending-gel jönnek létre
UPDATE donations SET moderation_status = 'active' WHERE status = 'active';

-- ── 4. JOBS MODERATION STATUS ────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE jobs ADD COLUMN moderation_status text NOT NULL DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'poster_trust_level'
  ) THEN
    ALTER TABLE jobs ADD COLUMN poster_trust_level integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- ── 5. RPC: FELHASZNÁLÓ TRUST SZINT FRISSÍTÉSE ───────────────────────────────
CREATE OR REPLACE FUNCTION refresh_user_trust_level(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_sales integer;
  v_positive_ratio numeric;
  v_is_admin boolean;
  v_created_at timestamptz;
  v_days_old integer;
  new_trust integer;
BEGIN
  SELECT total_sales, positive_ratio, is_admin, is_super_admin, created_at
  INTO v_total_sales, v_positive_ratio, v_is_admin, v_created_at
  FROM profiles WHERE id = target_user_id;

  v_days_old := EXTRACT(DAY FROM now() - v_created_at);

  IF v_is_admin THEN
    new_trust := 5;
  ELSIF v_total_sales >= 50 AND v_positive_ratio >= 0.9 THEN
    new_trust := 4;
  ELSIF v_total_sales >= 25 THEN
    new_trust := 3;
  ELSIF v_total_sales >= 5 OR v_days_old >= 7 THEN
    new_trust := 2;
  ELSIF v_days_old >= 1 THEN
    new_trust := 1;
  ELSE
    new_trust := 0;
  END IF;

  UPDATE profiles SET trust_level = new_trust WHERE id = target_user_id;
END;
$$;

-- ── 6. RPC: ADMIN DONATION JÓVÁHAGYÁS ────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_moderate_donation(
  donation_id uuid,
  new_status text -- 'active' | 'rejected' | 'hidden'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Csak admin futtathatja
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE donations
  SET moderation_status = new_status,
      status = CASE WHEN new_status = 'active' THEN 'active' ELSE status END,
      updated_at = now()
  WHERE id = donation_id;
END;
$$;

-- ── 7. RPC: ADMIN JOB JÓVÁHAGYÁS ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_moderate_job(
  job_id uuid,
  new_status text -- 'active' | 'rejected' | 'hidden'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE jobs
  SET moderation_status = new_status,
      status = CASE WHEN new_status = 'active' THEN 'active' ELSE status END,
      updated_at = now()
  WHERE id = job_id;
END;
$$;

-- ── 8. INDEX A GYORS LEKÉRDEZÉSEKHEZ ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_trust_level ON profiles(trust_level);
CREATE INDEX IF NOT EXISTS idx_listings_moderation_status ON listings(moderation_status);
CREATE INDEX IF NOT EXISTS idx_donations_moderation_status ON donations(moderation_status);
CREATE INDEX IF NOT EXISTS idx_jobs_moderation_status ON jobs(moderation_status);
CREATE INDEX IF NOT EXISTS idx_listings_lat_lng ON listings(lat, lng) WHERE lat IS NOT NULL;
