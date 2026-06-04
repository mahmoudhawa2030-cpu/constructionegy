-- Drip-feed scheduler: auto-publish scheduled posts whose publish_at is due.
-- Requires the pg_cron extension (available on Supabase). Safe to re-run.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.publish_due_seo_posts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.seo_posts
  SET status = 'published'
  WHERE status = 'draft'
    AND publish_at IS NOT NULL
    AND publish_at <= now();
$$;

-- Schedule hourly. Unschedule any prior job with the same name first.
DO $$
BEGIN
  PERFORM cron.unschedule('publish_due_seo_posts')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'publish_due_seo_posts'
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'publish_due_seo_posts',
  '0 * * * *',
  $$SELECT public.publish_due_seo_posts();$$
);
