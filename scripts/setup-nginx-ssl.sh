#!/bin/bash
set -e

DOMAIN="souqelmemar.com"
EMAIL="admin@souqelmemar.com"

echo "=== Install Certbot ==="
apt-get install -y certbot python3-certbot-nginx

echo "=== Write Nginx config (HTTP only first) ==="
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 120s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== Obtain SSL certificate ==="
certbot --nginx \
  -d $DOMAIN \
  -d www.$DOMAIN \
  --non-interactive \
  --agree-tos \
  --email $EMAIL \
  --redirect

echo "=== Enable auto-renewal ==="
systemctl enable certbot.timer
systemctl start certbot.timer

echo "=== Done ==="
echo "Your app is now live at https://$DOMAIN"
