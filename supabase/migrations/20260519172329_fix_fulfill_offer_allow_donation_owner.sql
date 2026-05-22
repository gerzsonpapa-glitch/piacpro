/*
  # fulfill_support_offer — kampánytulajdonos is teljesítettnek jelölheti

  A korábbi verzióban csak a felajánló (user_id) vagy az igénylő (claimed_by)
  tudta teljesítettnek jelölni a felajánlást. Most a kampány tulajdonosa is
  megteheti ezt a saját kampányához kapcsolt felajánlásoknál.
*/

CREATE OR REPLACE FUNCTION fulfill_support_offer(offer_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_offer support_offers%ROWTYPE;
BEGIN
  SELECT * INTO v_offer FROM support_offers WHERE id = offer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Felajánlás nem található';
  END IF;

  -- Jogosultság: saját felajánlás, igénylő, kampánytulajdonos, vagy admin
  IF v_offer.user_id = auth.uid() THEN NULL;
  ELSIF v_offer.claimed_by = auth.uid() THEN NULL;
  ELSIF v_offer.donation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM donations WHERE id = v_offer.donation_id AND creator_id = auth.uid()
  ) THEN NULL;
  ELSIF EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ) THEN NULL;
  ELSE
    RAISE EXCEPTION 'Nincs jogosultságod';
  END IF;

  UPDATE support_offers
  SET status = 'fulfilled', updated_at = now()
  WHERE id = offer_id;
END;
$$;
