/*
  # Adományozás (Donations) rendszer

  ## Összefoglaló
  Hozzáadjuk az adományozási kampányok kezelésére szolgáló táblát.
  Ez az új modul az egységes PiacPro ökoszisztéma részét képezi.

  ## Új táblák
  - `donations` — adományozási kampányok
    - `id` (uuid, pk)
    - `creator_id` (uuid, profiles.id FK)
    - `title` (szöveg)
    - `description` (szöveg)
    - `category` (szöveg: gyerek / allatvédelem / raszorulok / kozossegi / egyeb)
    - `goal_amount` (int, célösszeg Ft-ban)
    - `current_amount` (int, default 0)
    - `images` (text[], képek)
    - `location` (szöveg, helyszín)
    - `is_verified` (bool, admin hitelesítette-e)
    - `status` (active / ended / cancelled)
    - `ends_at` (timestamp, mikor zárul)
    - `created_at`, `updated_at`

  - `donation_contributions` — egyes adományok
    - `id` (uuid, pk)
    - `donation_id` (uuid, donations.id FK)
    - `donor_id` (uuid, profiles.id FK, nullable — névtelen adomány)
    - `amount` (int, összeg Ft-ban)
    - `message` (szöveg, opcionális üzenet)
    - `is_anonymous` (bool)
    - `created_at`

  ## Biztonsági beállítások
  - RLS engedélyezve mindkét táblán
  - Aktív kampányok publikusan olvashatók
  - Saját kampányok kezelhetők
  - Adományok leadhatók bejelentkezett felhasználóknak
*/

-- ── Donations tábla ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  category      text NOT NULL DEFAULT 'egyeb',
  goal_amount   integer NOT NULL DEFAULT 0,
  current_amount integer NOT NULL DEFAULT 0,
  images        text[] NOT NULL DEFAULT '{}',
  location      text NOT NULL DEFAULT '',
  is_verified   boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'active',
  ends_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active donations"
  ON donations FOR SELECT
  TO anon, authenticated
  USING (status = 'active' OR creator_id = auth.uid());

CREATE POLICY "Authenticated users can create donations"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own donations"
  ON donations FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own donations"
  ON donations FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- ── Donation contributions tábla ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donation_contributions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id   uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  donor_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  amount        integer NOT NULL DEFAULT 0,
  message       text NOT NULL DEFAULT '',
  is_anonymous  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE donation_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contributions"
  ON donation_contributions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can contribute"
  ON donation_contributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = donor_id OR is_anonymous = true);

-- ── Trigger: current_amount frissítése hozzájáruláskor ──────────────────────
CREATE OR REPLACE FUNCTION update_donation_amount()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE donations
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM donation_contributions
    WHERE donation_id = NEW.donation_id
  ),
  updated_at = now()
  WHERE id = NEW.donation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_donation_amount ON donation_contributions;
CREATE TRIGGER trg_update_donation_amount
  AFTER INSERT ON donation_contributions
  FOR EACH ROW EXECUTE FUNCTION update_donation_amount();

-- ── Realtime ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'donations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE donations;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'donation_contributions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE donation_contributions;
  END IF;
END $$;
