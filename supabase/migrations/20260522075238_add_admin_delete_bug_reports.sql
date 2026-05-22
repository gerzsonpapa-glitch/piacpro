
/*
  # Add admin delete policy for bug_reports

  Allows admins and super admins to delete bug report entries from the admin panel.
*/

CREATE POLICY "Admins can delete bug reports"
  ON bug_reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_admin = true OR profiles.is_super_admin = true)
    )
  );
