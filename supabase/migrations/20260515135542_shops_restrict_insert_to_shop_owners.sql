/*
  # Restrict shop creation to users with is_shop_owner permission

  Only users whose profiles.is_shop_owner = true can create a new shop.
  The existing "Owner can insert own shop" policy is replaced with a stricter one
  that also checks is_shop_owner on the profiles table.
*/

DROP POLICY IF EXISTS "Owner can insert own shop" ON shops;

CREATE POLICY "Shop owners can create a shop"
  ON shops FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_shop_owner = true
    )
  );
