-- Public bucket for listing photos; uploads restricted to paths under auth.uid()/...
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

CREATE POLICY "listing_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "listing_images_insert_authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "listing_images_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND name LIKE auth.uid()::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "listing_images_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND name LIKE auth.uid()::text || '/%'
  );
