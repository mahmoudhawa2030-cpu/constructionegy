#!/bin/bash
set -e

echo "=== Dump auth user DATA only from Supabase cloud ==="
PGPASSWORD='+4P%Kv9Q!Wir' pg_dump \
  -h db.hkioztmqasprdixcyhwx.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  --data-only \
  --table=auth.users \
  --table=auth.identities \
  -f /tmp/auth_data.sql

echo "Auth data dump: $(wc -l < /tmp/auth_data.sql) lines"

echo "=== Copy into container ==="
docker cp /tmp/auth_data.sql supabase-db:/tmp/auth_data.sql

echo "=== Import auth data into self-hosted (supabase_admin) ==="
docker exec supabase-db psql -U supabase_admin -d postgres -f /tmp/auth_data.sql 2>&1 | grep -v "^$\|^--\|^SET" | tail -20

echo "=== Verify users imported ==="
docker exec supabase-db psql -U postgres -d postgres -c "SELECT COUNT(*) as user_count FROM auth.users;"
