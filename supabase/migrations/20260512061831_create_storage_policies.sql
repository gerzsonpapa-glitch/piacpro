/*
  # Storage bucket and policies for listing images

  1. Storage
    - Create 'listing-images' bucket (public)
    - Allow authenticated users to upload images
    - Allow anyone to view images
    - Allow users to delete their own images
*/

-- Allow authenticated users to upload to listing-images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view listing images
CREATE POLICY "Anyone can view listing images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'listing-images');

CREATE POLICY "Anyone can view listing images anon"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'listing-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
