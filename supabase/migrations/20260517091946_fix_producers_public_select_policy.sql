/*
  # Termelők nyilvános megtekintése — policy javítása

  A "Anyone can view producers" policy jelenleg csak authenticated role-ra vonatkozik,
  ezért kijelentkezett látogatók nem látják a termelőket.

  Javítás: a SELECT policy kiterjesztése anon role-ra is, hogy bejelentkezés nélkül is
  láthatók legyenek a termelői profilok (termékek, elérhetőség nélkül — azt más policy védi).
*/

DROP POLICY IF EXISTS "Anyone can view producers" ON producers;

CREATE POLICY "Anyone can view producers"
  ON producers
  FOR SELECT
  TO authenticated, anon
  USING (true);
