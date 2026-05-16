/*
  # Admin delete policies for auctions and job_seeker_ads

  ## Problem
  - Admins cannot update auctions (only seller can via existing policy)
  - Admins cannot update job_seeker_ads (no admin UPDATE policy exists)
  
  ## Changes
  - Add "Admins can update any auction" UPDATE policy on auctions table
  - Add "Admins can update any job seeker ad" UPDATE policy on job_seeker_ads table
*/

CREATE POLICY "Admins can update any auction"
  ON auctions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update any job seeker ad"
  ON job_seeker_ads FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
