#!/bin/bash
echo "=== Public tables ==="
docker exec supabase-db psql -U postgres -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"

echo "=== Row counts ==="
docker exec supabase-db psql -U postgres -d postgres -c "
SELECT
  'profiles' as t, COUNT(*) FROM profiles
UNION ALL SELECT 'feed_posts', COUNT(*) FROM feed_posts
UNION ALL SELECT 'listings', COUNT(*) FROM listings
UNION ALL SELECT 'chats', COUNT(*) FROM chats
UNION ALL SELECT 'auth.users', COUNT(*) FROM auth.users;
"
