/*
  # Producer images storage bucket + admin delete RPC

  1. Storage
     - Creates `producer-images` public bucket for producer cover, avatar, and product images
     - INSERT: authenticated users only (owner check in app)
     - SELECT: public
     - DELETE: owner or admin

  2. Admin delete RPC
     - `admin_delete_producer(p_producer_id uuid)` — SECURITY DEFINER so it bypasses RLS
     - Deletes the producer row and resets is_producer_approved on the profile
     - Only callable by admins (checked inside the function)
*/

-- ── Storage bucket ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('producer-images', 'producer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload producer images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'producer-images');

-- Public read
CREATE POLICY "Anyone can view producer images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'producer-images');

-- Owner or admin can delete
CREATE POLICY "Owner or admin can delete producer images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'producer-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
      )
    )
  );

-- ── Admin delete RPC ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_delete_producer(p_producer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only admins may call this
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get owner
  SELECT user_id INTO v_user_id FROM producers WHERE id = p_producer_id;

  -- Delete producer (cascades to producer_products via FK)
  DELETE FROM producers WHERE id = p_producer_id;

  -- Revoke approval on profile
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET is_producer_approved = false WHERE id = v_user_id;
  END IF;
END;
$$;
