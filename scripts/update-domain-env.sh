#!/bin/bash
set -e

ANON_KEY=$(grep '^ANON=' /tmp/jwt_keys.txt | cut -d= -f2-)
SVC_KEY=$(grep '^SVC=' /tmp/jwt_keys.txt | cut -d= -f2-)

cat > /opt/bina/.env << EOF
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SVC_KEY}
NEXT_PUBLIC_APP_URL=https://souqelmemar.com
NEXT_PUBLIC_STORAGE_BASE_URL=http://localhost:8000/storage/v1/object/public
EOF

cd /opt/bina
docker compose up -d --force-recreate
echo "Done — app restarted with domain env"
