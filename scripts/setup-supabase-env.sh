#!/bin/bash
set -e

JWT_SECRET=$(cat /tmp/jwt_secret.txt)
ANON_KEY=$(grep '^ANON=' /tmp/jwt_keys.txt | cut -d= -f2-)
SVC_KEY=$(grep '^SVC=' /tmp/jwt_keys.txt | cut -d= -f2-)
PGPASS=$(openssl rand -base64 16 | tr -d '/+=')

echo "$PGPASS" > /tmp/pgpass.txt

ENV=/opt/supabase-docker/.env

sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$PGPASS|" $ENV
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" $ENV
sed -i "s|^ANON_KEY=.*|ANON_KEY=$ANON_KEY|" $ENV
sed -i "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SVC_KEY|" $ENV
sed -i "s|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=http://178.105.219.175:8000|" $ENV
sed -i "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=http://178.105.219.175:8000|" $ENV

# Disable email confirmations for now (re-enable after SMTP is configured)
sed -i "s|^GOTRUE_MAILER_AUTOCONFIRM=.*|GOTRUE_MAILER_AUTOCONFIRM=true|" $ENV
sed -i "s|^ENABLE_EMAIL_AUTOCONFIRM=.*|ENABLE_EMAIL_AUTOCONFIRM=true|" $ENV

echo "=== Supabase .env configured ==="
echo "PGPASS=$PGPASS"
echo "JWT_SECRET=$JWT_SECRET"
echo "ANON_KEY=$ANON_KEY"
echo "SVC_KEY=$SVC_KEY"
