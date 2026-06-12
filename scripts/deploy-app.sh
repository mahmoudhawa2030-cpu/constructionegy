#!/bin/bash
set -e

ANON_KEY=$(grep '^ANON=' /tmp/jwt_keys.txt | cut -d= -f2-)
SVC_KEY=$(grep '^SVC=' /tmp/jwt_keys.txt | cut -d= -f2-)
SERVER_IP="178.105.219.175"

echo "=== Creating app .env ==="
cat > /opt/bina/.env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=http://${SERVER_IP}:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SVC_KEY}
NEXT_PUBLIC_APP_URL=http://${SERVER_IP}
EOF

echo "=== Building and starting app with Docker ==="
cd /opt/bina
docker compose build --no-cache 2>&1 | tail -10
docker compose up -d

echo "=== App status ==="
docker compose ps
