/*
  # Felajánlás Rendszer (Support Offers)

  ## Összefoglaló
  Új táblát vezet be ingyenes tárgyi és szolgáltatás felajánlásokhoz.
  A felajánlás opcionálisan kapcsolható egy donation kampányhoz,
  de önállóan is létezhet. NEM pénz — ez közösségi segítség layer.

  ## Új tábla: support_offers

  ### Mezők
  - `id` — egyedi azonosító
  - `donation_id` — opcionális FK a donations táblára (ha kampányhoz kötött)
  - `user_id` — FK auth.users (felajánló felhasználó)
  - `type` — 'item' | 'service'
  - `title` — rövid cím
  - `description` — részletes leírás
  - `category` — kibővített kategória rendszer
  - `item_type` — tárgy típusa (ha type='item')
  - `service_type` — szolgáltatás típusa (ha type='service')
  - `quantity` — mennyiség (opcionális, pl. 3 doboz ruha)
  - `location` — szöveges helyszín
  - `lat`, `lng` — GPS koordináták (opcionális)
  - `images` — képek tömbje
  - `status` — 'active' | 'pending' | 'claimed' | 'fulfilled'
  - `claimed_by` — FK profiles, aki igényelte
  - `claimed_at` — mikor igényelték
  - `created_at`, `updated_at`

  ## Biztonsági változások
  - RLS engedélyezve
  - Mindenki láthatja az 'active' felajánlásokat (public)
  - Csak a felajánló módosíthatja/törölheti a sajátját
  - Bejelentkezett user igényelheti (claim)
  - Admin mindent kezelhet
*/

CREATE TABLE IF NOT EXISTS support_offers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id   uuid REFERENCES donations(id) ON DELETE SET NULL,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          text NOT NULL DEFAULT 'item' CHECK (type IN ('item', 'service')),
  title         text NOT NULL DEFAULT '',
  description   text NOT NULL DEFAULT '',
  category      text NOT NULL DEFAULT 'other',
  item_type     text,
  service_type  text,
  quantity      integer,
  location      text NOT NULL DEFAULT '',
  lat           double precision,
  lng           double precision,
  images        text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'claimed', 'fulfilled')),
  claimed_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  claimed_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index-ek
CREATE INDEX IF NOT EXISTS idx_support_offers_donation_id ON support_offers(donation_id);
CREATE INDEX IF NOT EXISTS idx_support_offers_user_id ON support_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_support_offers_status ON support_offers(status);
CREATE INDEX IF NOT EXISTS idx_support_offers_type ON support_offers(type);
CREATE INDEX IF NOT EXISTS idx_support_offers_category ON support_offers(category);
CREATE INDEX IF NOT EXISTS idx_support_offers_created_at ON support_offers(created_at DESC);

-- RLS
ALTER TABLE support_offers ENABLE ROW LEVEL SECURITY;

-- Mindenki láthatja az aktív felajánlásokat
CREATE POLICY "Anyone can view active offers"
  ON support_offers FOR SELECT
  TO anon, authenticated
  USING (status IN ('active', 'claimed', 'fulfilled'));

-- Bejelentkezett user létrehozhat felajánlást (ingyenes, nincs trust gate)
CREATE POLICY "Authenticated users can create offers"
  ON support_offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Csak a saját felajánlását szerkesztheti
CREATE POLICY "Users can update own offers"
  ON support_offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ));

-- Csak a saját felajánlását törölheti (vagy admin)
CREATE POLICY "Users can delete own offers"
  ON support_offers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ));

-- RPC: Felajánlás igénylése (claim)
CREATE OR REPLACE FUNCTION claim_support_offer(offer_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Csak aktív felajánlást lehet igényelni
  IF NOT EXISTS (SELECT 1 FROM support_offers WHERE id = offer_id AND status = 'active') THEN
    RAISE EXCEPTION 'Ez a felajánlás már nem elérhető';
  END IF;

  -- Saját felajánlást nem lehet igényelni
  IF EXISTS (SELECT 1 FROM support_offers WHERE id = offer_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Saját felajánlást nem igényelhetsz';
  END IF;

  UPDATE support_offers
  SET status = 'claimed',
      claimed_by = auth.uid(),
      claimed_at = now(),
      updated_at = now()
  WHERE id = offer_id;
END;
$$;

-- RPC: Felajánlás teljesítettnek jelölése (offer owner)
CREATE OR REPLACE FUNCTION fulfill_support_offer(offer_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM support_offers WHERE id = offer_id AND (user_id = auth.uid() OR claimed_by = auth.uid())
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ) THEN
    RAISE EXCEPTION 'Nincs jogosultságod';
  END IF;

  UPDATE support_offers
  SET status = 'fulfilled', updated_at = now()
  WHERE id = offer_id;
END;
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_support_offers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_offers_updated_at
  BEFORE UPDATE ON support_offers
  FOR EACH ROW EXECUTE FUNCTION update_support_offers_updated_at();
