/*
  # Clean up duplicate and residual insecure policies

  ## Issues found in policy audit:
  1. listings has TWO INSERT policies — old "Authenticated users can create listings" 
     (without banned check) AND new "Authenticated users can insert listings" (with banned check).
     Remove the old one.
  2. seller_badges still has "System can manage badges" (INSERT) and "System can update badges"
     (UPDATE) that let any authenticated user insert/update their own badge row directly,
     bypassing the trigger. Remove them — only the SECURITY DEFINER trigger should write badges.
*/

-- Remove old duplicate listings INSERT policy (lacks banned check)
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;

-- Remove seller_badges write policies — trigger only
DROP POLICY IF EXISTS "System can manage badges" ON public.seller_badges;
DROP POLICY IF EXISTS "System can update badges" ON public.seller_badges;
