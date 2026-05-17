/*
  # Nyilvános (anon) SELECT policy javítások

  Három táblán a SELECT policy csak `authenticated` role-ra vonatkozott,
  ezért kijelentkezett látogatók nem látták az adatokat.

  1. profiles — eladói/vevői profilok megtekinthetők bejelentkezés nélkül
  2. job_seeker_ads — aktív munkakeresési hirdetések publikusak
  3. listing_reviews — hirdetésekhez írt értékelések publikusak
*/

-- profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- job_seeker_ads
DROP POLICY IF EXISTS "Anyone authenticated can view active job seeker ads" ON job_seeker_ads;
CREATE POLICY "Anyone can view active job seeker ads"
  ON job_seeker_ads
  FOR SELECT
  TO authenticated, anon
  USING (status = 'active');

-- listing_reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON listing_reviews;
CREATE POLICY "Anyone can view reviews"
  ON listing_reviews
  FOR SELECT
  TO authenticated, anon
  USING (true);
