-- Site-wide customization (developer-only writes)
CREATE TABLE IF NOT EXISTS site_customization (
  id text PRIMARY KEY DEFAULT 'global',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO site_customization (id, config)
VALUES ('global', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_customization ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_customization_public_read" ON site_customization;
CREATE POLICY "site_customization_public_read"
  ON site_customization FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "site_customization_developer_update" ON site_customization;
CREATE POLICY "site_customization_developer_update"
  ON site_customization FOR UPDATE
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'gerzsonpapa@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'gerzsonpapa@gmail.com');

DROP POLICY IF EXISTS "site_customization_developer_insert" ON site_customization;
CREATE POLICY "site_customization_developer_insert"
  ON site_customization FOR INSERT
  TO authenticated
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'gerzsonpapa@gmail.com');

GRANT SELECT ON site_customization TO anon, authenticated;
GRANT INSERT, UPDATE ON site_customization TO authenticated;
