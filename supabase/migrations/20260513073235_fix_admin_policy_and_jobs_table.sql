
/*
  # Fix admin RLS policy (infinite recursion) and create jobs table

  1. Problem
     - "Admins can update any profile" policy queries the `profiles` table itself,
       causing infinite recursion when evaluated. Fixed by using a SECURITY DEFINER
       helper function that bypasses RLS.

  2. New Tables
     - `jobs` — job listings posted by users
       - `id` (uuid, primary key)
       - `poster_id` (uuid, FK → profiles)
       - `title` (text)
       - `company` (text)
       - `description` (text)
       - `category` (text) — e.g. IT, Kereskedelem, etc.
       - `type` (text) — teljes állás / részmunka / szabadúszó / szakmai gyakorlat
       - `location` (text)
       - `salary_min` / `salary_max` (integer, nullable)
       - `salary_currency` (text, default HUF)
       - `contact_email` (text)
       - `contact_phone` (text)
       - `remote` (boolean)
       - `status` (text) — active / closed / deleted
       - `expires_at` (timestamptz)
       - `created_at` / `updated_at` (timestamptz)

  3. Security
     - RLS enabled on jobs
     - Public can SELECT active jobs
     - Authenticated (non-banned) users can INSERT own jobs
     - Users can UPDATE/DELETE their own jobs
     - Admins can UPDATE/DELETE any job
*/

-- ── 1. Fix admin policy on profiles ─────────────────────────────────────────

-- Helper: returns true if the calling user is an admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Drop old recursive policy and replace with function-based one
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 2. Create jobs table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           text NOT NULL DEFAULT '',
  company         text NOT NULL DEFAULT '',
  description     text NOT NULL DEFAULT '',
  category        text NOT NULL DEFAULT 'Egyéb',
  type            text NOT NULL DEFAULT 'teljes',
  location        text NOT NULL DEFAULT '',
  salary_min      integer,
  salary_max      integer,
  salary_currency text NOT NULL DEFAULT 'HUF',
  contact_email   text NOT NULL DEFAULT '',
  contact_phone   text NOT NULL DEFAULT '',
  remote          boolean NOT NULL DEFAULT false,
  status          text NOT NULL DEFAULT 'active',
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Public read of active jobs
CREATE POLICY "Anyone can view active jobs"
  ON public.jobs
  FOR SELECT
  USING (status = 'active');

-- Authenticated non-banned users can post jobs
CREATE POLICY "Authenticated users can post jobs"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    poster_id = auth.uid()
    AND NOT (SELECT is_banned FROM public.profiles WHERE id = auth.uid())
  );

-- Users can update their own jobs
CREATE POLICY "Users can update own jobs"
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (poster_id = auth.uid())
  WITH CHECK (poster_id = auth.uid());

-- Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
  ON public.jobs
  FOR DELETE
  TO authenticated
  USING (poster_id = auth.uid());

-- Admins can update any job
CREATE POLICY "Admins can update any job"
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete any job
CREATE POLICY "Admins can delete any job"
  ON public.jobs
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Index for common queries
CREATE INDEX IF NOT EXISTS jobs_poster_id_idx ON public.jobs(poster_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs(status);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_category_idx ON public.jobs(category);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_updated_at ON public.jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_jobs_updated_at();
