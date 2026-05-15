/*
  # Allow admins to create shops

  Replaces the shop INSERT policy so that both is_shop_owner users
  AND admins (is_admin = true) can create a shop.
*/

DROP POLICY IF EXISTS "Shop owners can create a shop" ON shops;

CREATE POLICY "Shop owners and admins can create a shop"
  ON shops FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_shop_owner = true OR profiles.is_admin = true)
    )
  );
