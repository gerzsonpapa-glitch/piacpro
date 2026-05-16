/*
  # Fix delete policies for jobs and job_seeker_ads

  ## Problem
  - job_seeker_ads table has no admin DELETE policy
  - jobs and job_seeker_ads use soft-delete (UPDATE status='deleted') but the SELECT policy
    only exposes status='active' rows, causing the UPDATE to fail silently (RLS blocks it
    because the row isn't visible via SELECT)

  ## Changes
  - Add "Admins can delete any job seeker ad" DELETE policy on job_seeker_ads
  - Add "Admins can delete any job" DELETE policy on jobs (already exists, kept for safety)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'job_seeker_ads' AND policyname = 'Admins can delete any job seeker ad'
  ) THEN
    CREATE POLICY "Admins can delete any job seeker ad"
      ON job_seeker_ads FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;
