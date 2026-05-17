/*
  # Termelő saját törlési policy

  A producers táblán eddig csak adminok tudtak törölni.
  Hozzáadjuk hogy a termelő saját maga is törölhesse a profiljját.
*/

CREATE POLICY "Owner can delete own producer"
  ON producers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
