#!/usr/bin/env bash
set -euo pipefail

DOMAIN="www.sura-codex.com"
EMAIL="${EMAIL:-admin@yourdomain.com}"

if [ -z "$EMAIL" ]; then
  echo "Set EMAIL environment variable or update the script with your email."
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "Certbot is not installed. Install it before running this script."
  exit 1
fi

echo "Stopping client service so Certbot can bind to port 80..."
docker compose -f docker-compose.prod.yml stop client || true

sudo certbot certonly --standalone --agree-tos --no-eff-email \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "sura-codex.com"

mkdir -p certs
ln -sf "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" certs/fullchain.pem
ln -sf "/etc/letsencrypt/live/$DOMAIN/privkey.pem" certs/privkey.pem

echo "Certificate files created in certs/ and linked from /etc/letsencrypt/live/$DOMAIN/."
