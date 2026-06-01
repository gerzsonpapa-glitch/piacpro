-- RPC mentés (megbízhatóbb mint közvetlen upsert RLS-sel)
CREATE OR REPLACE FUNCTION public.save_site_customization(p_config jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(coalesce(auth.jwt() ->> 'email', '')) <> 'gerzsonpapa@gmail.com' THEN
    RAISE EXCEPTION 'Nincs jogosultság a weboldal szerkesztéséhez.';
  END IF;

  INSERT INTO public.site_customization (id, config, updated_at, updated_by)
  VALUES ('global', coalesce(p_config, '{}'::jsonb), now(), auth.uid())
  ON CONFLICT (id) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_site_customization(jsonb) TO authenticated;

-- Site assets bucket (képek a fejlesztői szerkesztőhöz)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "site_assets_public_read" ON storage.objects;
CREATE POLICY "site_assets_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "site_assets_developer_insert" ON storage.objects;
CREATE POLICY "site_assets_developer_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-assets'
    AND lower(auth.jwt() ->> 'email') = 'gerzsonpapa@gmail.com'
  );

DROP POLICY IF EXISTS "site_assets_developer_update" ON storage.objects;
CREATE POLICY "site_assets_developer_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND lower(auth.jwt() ->> 'email') = 'gerzsonpapa@gmail.com'
  );

DROP POLICY IF EXISTS "site_assets_developer_delete" ON storage.objects;
CREATE POLICY "site_assets_developer_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND lower(auth.jwt() ->> 'email') = 'gerzsonpapa@gmail.com'
  );
