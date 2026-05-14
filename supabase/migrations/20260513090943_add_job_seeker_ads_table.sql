/*
  # Job Seeker Ads Table

  1. New Tables
    - `job_seeker_ads` - Álláskeresők saját hirdetéseinek táblája
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK → profiles)
      - `title` (text) - Keresett pozíció megnevezése
      - `description` (text) - Bemutatkozás, tapasztalat
      - `category` (text) - Munkakör kategória
      - `type` (text) - Foglalkoztatás típusa (teljes, reszmunka, stb.)
      - `location` (text) - Helyszín preferencia
      - `remote` (boolean) - Remote munkát is elfogad
      - `expected_salary_min` (int) - Elvárt minimális fizetés
      - `expected_salary_max` (int) - Elvárt maximális fizetés
      - `salary_currency` (text)
      - `contact_email` (text)
      - `contact_phone` (text)
      - `experience` (text) - Tapasztalat szintje
      - `status` (text) - active / deleted
      - `expires_at` (timestamptz) - Lejárati idő (30 nap)
      - `created_at`, `updated_at`

  2. Security
    - RLS enabled
    - Authenticated users can read all active ads
    - Users can only insert/update/delete their own ads

  3. Notes
    - Teljesen elkülönített a `jobs` táblától
    - Munkáltatók az üzenet rendszeren keresztül jelezhetnek az álláskeresőknek
*/

CREATE TABLE IF NOT EXISTS job_seeker_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Egyéb',
  type text NOT NULL DEFAULT 'teljes',
  location text NOT NULL DEFAULT '',
  remote boolean NOT NULL DEFAULT false,
  expected_salary_min integer DEFAULT NULL,
  expected_salary_max integer DEFAULT NULL,
  salary_currency text NOT NULL DEFAULT 'HUF',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_seeker_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active job seeker ads"
  ON job_seeker_ads FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can insert own job seeker ads"
  ON job_seeker_ads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job seeker ads"
  ON job_seeker_ads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job seeker ads"
  ON job_seeker_ads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS job_seeker_ads_user_id_idx ON job_seeker_ads(user_id);
CREATE INDEX IF NOT EXISTS job_seeker_ads_status_idx ON job_seeker_ads(status);
CREATE INDEX IF NOT EXISTS job_seeker_ads_category_idx ON job_seeker_ads(category);
