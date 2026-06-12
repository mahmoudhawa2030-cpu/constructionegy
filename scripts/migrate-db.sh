#!/bin/bash
set -e

echo "=== Step 1: Install postgresql-client ==="
apt-get install -y postgresql-client 2>/dev/null | tail -3

echo "=== Step 2: Dump public schema from Supabase cloud ==="
PGPASSWORD='+4P%Kv9Q!Wir' pg_dump \
  -h db.hkioztmqasprdixcyhwx.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  --schema=public \
  --no-owner \
  --no-acl \
  -f /tmp/public_schema.sql

echo "Public schema dump: $(wc -l < /tmp/public_schema.sql) lines"

echo "=== Step 3: Dump auth.users from Supabase cloud ==="
PGPASSWORD='+4P%Kv9Q!Wir' pg_dump \
  -h db.hkioztmqasprdixcyhwx.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  --schema=auth \
  --table=auth.users \
  --table=auth.identities \
  --table=auth.sessions \
  --no-owner \
  --no-acl \
  -f /tmp/auth_users.sql

echo "Auth users dump: $(wc -l < /tmp/auth_users.sql) lines"

echo "=== Step 4: Get self-hosted Supabase DB password ==="
PGPASS=$(cat /tmp/pgpass.txt)

echo "=== Step 5: Import public schema to self-hosted ==="
PGPASSWORD="$PGPASS" psql \
  -h localhost \
  -U postgres \
  -d postgres \
  -p 5432 \
  -f /tmp/public_schema.sql \
  2>&1 | grep -v "^SET\|^--\|^$" | tail -20

echo "=== Step 6: Import auth users to self-hosted ==="
PGPASSWORD="$PGPASS" psql \
  -h localhost \
  -U postgres \
  -d postgres \
  -p 5432 \
  -f /tmp/auth_users.sql \
  2>&1 | grep -v "^SET\|^--\|^$" | tail -20

echo "=== Migration complete ==="
