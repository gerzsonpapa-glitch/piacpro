/*
  # Termelői termékek nyilvános megtekintése — policy javítása

  A "Anyone can view producer products" policy csak authenticated role-ra vonatkozik,
  ezért kijelentkezett látogatók a termelői termékeket sem látják.

  Javítás: kiterjesztés anon role-ra is.
*/

DROP POLICY IF EXISTS "Anyone can view producer products" ON producer_products;

CREATE POLICY "Anyone can view producer products"
  ON producer_products
  FOR SELECT
  TO authenticated, anon
  USING (true);
