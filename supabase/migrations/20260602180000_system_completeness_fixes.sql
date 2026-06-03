-- PiacPro rendszer-teljesség: álláskereső moderáció, producer értékelés szinkron, RLS

-- ── 1. Álláskereső hirdetések moderációja ───────────────────────────────────
ALTER TABLE job_seeker_ads
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'active';

ALTER TABLE job_seeker_ads
  DROP CONSTRAINT IF EXISTS job_seeker_ads_moderation_status_check;

ALTER TABLE job_seeker_ads
  ADD CONSTRAINT job_seeker_ads_moderation_status_check
  CHECK (moderation_status IN ('pending', 'active', 'rejected', 'hidden'));

CREATE INDEX IF NOT EXISTS idx_job_seeker_ads_moderation_status
  ON job_seeker_ads(moderation_status);

CREATE OR REPLACE FUNCTION admin_moderate_seeker_ad(
  seeker_ad_id uuid,
  new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE job_seeker_ads
  SET moderation_status = new_status,
      status = CASE WHEN new_status = 'active' THEN 'active' ELSE status END,
      updated_at = now()
  WHERE id = seeker_ad_id;
END;
$$;

-- ── 2. Producer értékelés szinkron (profil értékelés → termelő aggregátum) ───
CREATE OR REPLACE FUNCTION sync_producer_rating_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_avg numeric;
BEGIN
  SELECT COUNT(*), COALESCE(AVG(score), 0)
  INTO v_total, v_avg
  FROM listing_reviews
  WHERE reviewed_id = NEW.reviewed_id;

  UPDATE producers
  SET
    review_count = v_total,
    avg_rating = v_avg,
    updated_at = now()
  WHERE user_id = NEW.reviewed_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_listing_review_sync_producer ON listing_reviews;
CREATE TRIGGER on_listing_review_sync_producer
  AFTER INSERT OR UPDATE ON listing_reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_producer_rating_from_profile();
CREATE OR REPLACE FUNCTION sync_producer_rating_from_profile_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_avg numeric;
BEGIN
  SELECT COUNT(*), COALESCE(AVG(score), 0)
  INTO v_total, v_avg
  FROM listing_reviews
  WHERE reviewed_id = OLD.reviewed_id;

  UPDATE producers
  SET review_count = v_total, avg_rating = v_avg, updated_at = now()
  WHERE user_id = OLD.reviewed_id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_listing_review_sync_producer_del ON listing_reviews;
CREATE TRIGGER on_listing_review_sync_producer_del
  AFTER DELETE ON listing_reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_producer_rating_from_profile_delete();

-- ── 3. Nyilvános SELECT: csak jóváhagyott álláskereső hirdetések ────────────
DROP POLICY IF EXISTS "Anyone can view active job seeker ads" ON job_seeker_ads;
CREATE POLICY "Anyone can view active job seeker ads"
  ON job_seeker_ads FOR SELECT
  TO authenticated, anon
  USING (
    status = 'active'
    AND moderation_status = 'active'
    AND expires_at > now()
  );
