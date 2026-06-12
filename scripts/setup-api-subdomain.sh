#!/bin/bash
set -e

DOMAIN="api.souqelmemar.com"

echo "=== Write Nginx config for Supabase API ==="
cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name api.souqelmemar.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        client_max_body_size 50m;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
nginx -t && systemctl reload nginx

echo "=== Obtain SSL certificate ==="
certbot --nginx \
  -d $DOMAIN \
  --non-interactive \
  --agree-tos \
  --email admin@souqelmemar.com \
  --redirect

echo "=== Update Supabase self-hosted .env ==="
sed -i "s|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://api.souqelmemar.com|" /opt/supabase-docker/.env
sed -i "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=https://api.souqelmemar.com|" /opt/supabase-docker/.env

echo "=== Update app .env ==="
ANON_KEY=$(grep '^ANON=' /tmp/jwt_keys.txt | cut -d= -f2-)
SVC_KEY=$(grep '^SVC=' /tmp/jwt_keys.txt | cut -d= -f2-)

cat > /opt/bina/.env << ENVEOF
NEXT_PUBLIC_SUPABASE_URL=https://api.souqelmemar.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SVC_KEY}
NEXT_PUBLIC_APP_URL=https://souqelmemar.com
NEXT_PUBLIC_STORAGE_BASE_URL=https://api.souqelmemar.com/storage/v1/object/public
ENVEOF

echo "=== Restart Supabase stack ==="
cd /opt/supabase-docker && docker compose restart

echo "=== Restart app ==="
cd /opt/bina && docker compose up -d --force-recreate

echo "=== All done ==="
echo "Supabase API: https://api.souqelmemar.com"
echo "App: https://souqelmemar.com"
