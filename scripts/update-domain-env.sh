#!/bin/bash
set -e

ANON_KEY=$(grep '^ANON=' /tmp/jwt_keys.txt | cut -d= -f2-)
SVC_KEY=$(grep '^SVC=' /tmp/jwt_keys.txt | cut -d= -f2-)

XAI_API_KEY_KEEP=$(grep -E '^XAI_API_KEY=' /opt/bina/.env 2>/dev/null | cut -d= -f2- || true)
XAI_MODEL_ARTICLE_KEEP=$(grep -E '^XAI_MODEL_ARTICLE=' /opt/bina/.env 2>/dev/null | cut -d= -f2- || true)
XAI_MODEL_FAST_KEEP=$(grep -E '^XAI_MODEL_FAST=' /opt/bina/.env 2>/dev/null | cut -d= -f2- || true)
XAI_MODEL_KEEP=$(grep -E '^XAI_MODEL=' /opt/bina/.env 2>/dev/null | cut -d= -f2- || true)
cat > /opt/bina/.env << EOF
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SVC_KEY}
NEXT_PUBLIC_APP_URL=https://souqelmemar.com
NEXT_PUBLIC_STORAGE_BASE_URL=http://localhost:8000/storage/v1/object/public
EOF
if [ -n "${XAI_API_KEY_KEEP}" ]; then echo "XAI_API_KEY=${XAI_API_KEY_KEEP}" >> /opt/bina/.env; fi
if [ -n "${XAI_MODEL_ARTICLE_KEEP}" ]; then echo "XAI_MODEL_ARTICLE=${XAI_MODEL_ARTICLE_KEEP}" >> /opt/bina/.env; fi
if [ -n "${XAI_MODEL_FAST_KEEP}" ]; then echo "XAI_MODEL_FAST=${XAI_MODEL_FAST_KEEP}" >> /opt/bina/.env; fi
if [ -n "${XAI_MODEL_KEEP}" ]; then echo "XAI_MODEL=${XAI_MODEL_KEEP}" >> /opt/bina/.env; fi

cd /opt/bina
docker compose up -d --force-recreate
echo "Done — app restarted with domain env"
