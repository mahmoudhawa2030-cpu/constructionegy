-- Enable Supabase Realtime publication for feed_post_comments
-- so clients can subscribe to INSERT events.
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_post_comments;
