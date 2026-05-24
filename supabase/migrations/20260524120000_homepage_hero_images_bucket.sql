-- Storage bucket for web homepage hero slider images.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homepage-hero-images',
  'homepage-hero-images',
  true,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

CREATE POLICY "homepage_hero_images_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homepage-hero-images');

CREATE POLICY "homepage_hero_images_storage_insert_admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'homepage-hero-images'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "homepage_hero_images_storage_update_admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'homepage-hero-images'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    bucket_id = 'homepage-hero-images'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "homepage_hero_images_storage_delete_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'homepage-hero-images'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
