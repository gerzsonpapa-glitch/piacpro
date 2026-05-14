
/*
  # Add logo_url column to jobs table

  1. Changes
     - `jobs.logo_url` (text, nullable) — company logo/image URL stored in Supabase Storage
  
  2. Storage
     - New bucket `job-images` (public, 2 MB max, JPEG/PNG/WebP)
     - Storage RLS: public read, authenticated owner upload/update/delete
*/

-- Add logo column to jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN logo_url text;
  END IF;
END $$;

-- Create job-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-images',
  'job-images',
  true,
  2097152,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public can view job images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-images');

-- Authenticated upload to own folder
CREATE POLICY "Users can upload job images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'job-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated update own files
CREATE POLICY "Users can update own job images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'job-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated delete own files
CREATE POLICY "Users can delete own job images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'job-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
