-- Public bucket for feed post photos (paths: {auth.uid()}/feed/...).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed-post-images',
  'feed-post-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

CREATE POLICY "feed_post_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feed-post-images');

CREATE POLICY "feed_post_images_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feed-post-images'
    AND name LIKE auth.uid()::text || '/feed/%'
  );

CREATE POLICY "feed_post_images_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'feed-post-images'
    AND name LIKE auth.uid()::text || '/feed/%'
  )
  WITH CHECK (
    bucket_id = 'feed-post-images'
    AND name LIKE auth.uid()::text || '/feed/%'
  );

CREATE POLICY "feed_post_images_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'feed-post-images'
    AND name LIKE auth.uid()::text || '/feed/%'
  );
