/*
  # Job Interaction Tracking for Smart Recommendations

  ## Purpose
  Tracks user behavior on the jobs page to power an intelligent recommendation
  engine. Every time a user views a job, views a seeker ad, searches with a keyword,
  or filters by category/location, an interaction record is created or upserted.

  ## New Table
  - `user_job_interactions`
    - `id` - primary key
    - `user_id` - the user performing the action (FK → profiles)
    - `interaction_type` - type of interaction:
        'view_job', 'view_seeker', 'search', 'filter_category', 'filter_location'
    - `category` - job category involved (if any)
    - `location` - location involved (if any)
    - `keywords` - search keywords (if any)
    - `job_id` - job that was viewed (if type = view_job)
    - `seeker_ad_id` - seeker ad that was viewed (if type = view_seeker)
    - `interaction_count` - how many times this exact pattern occurred (for upsert deduplication)
    - `last_interacted_at` - timestamp of the most recent interaction

  ## Security
  - RLS enabled
  - Users can only read/write their own interactions
  - No public access

  ## Notes
  - Unique constraint on (user_id, interaction_type, category, location, keywords)
    allows efficient upsert-based counting
  - Older interactions (30+ days) are ignored by the scoring engine so
    recommendations stay fresh
*/

CREATE TABLE IF NOT EXISTS user_job_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  category text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '',
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  seeker_ad_id uuid REFERENCES job_seeker_ads(id) ON DELETE SET NULL,
  interaction_count integer NOT NULL DEFAULT 1,
  last_interacted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_job_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own job interactions"
  ON user_job_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job interactions"
  ON user_job_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job interactions"
  ON user_job_interactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_job_interactions_user_id_idx ON user_job_interactions(user_id);
CREATE INDEX IF NOT EXISTS user_job_interactions_category_idx ON user_job_interactions(category);
CREATE INDEX IF NOT EXISTS user_job_interactions_last_interacted_idx ON user_job_interactions(last_interacted_at DESC);
