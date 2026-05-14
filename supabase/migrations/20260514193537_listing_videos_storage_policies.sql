/*
  # Storage policies a listing-videos bucket-hez

  1. Policies
    - Bárki olvashatja (publikus bucket)
    - Bejelentkezett felhasználók feltölthetnek a saját mappájukba
    - Bejelentkezett felhasználók törölhetik a saját fájljaikat
*/

CREATE POLICY "Public can view listing videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'listing-videos');

CREATE POLICY "Authenticated users can upload listing videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own listing videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
