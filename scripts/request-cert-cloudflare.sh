#!/usr/bin/env bash
set -euo pipefail

DOMAIN="www.sura-codex.com"
EMAIL="${EMAIL:-admin@yourdomain.com}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
CLOUDFLARE_CREDENTIALS_FILE="/tmp/cloudflare.ini"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Set CLOUDFLARE_API_TOKEN environment variable."
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "Certbot is not installed. Install it before running this script."
  exit 1
fi

if ! command -v certbot-dns-cloudflare >/dev/null 2>&1; then
  echo "Certbot Cloudflare DNS plugin is not installed. Install certbot-dns-cloudflare."
  exit 1
fi

cat > "$CLOUDFLARE_CREDENTIALS_FILE" <<EOF
# Cloudflare API token used by Certbot
# Set permissions to avoid unauthorized access
# Required scopes: Zone:DNS:Edit for the target zone

dns_cloudflare_api_token = $CLOUDFLARE_API_TOKEN
EOF
chmod 600 "$CLOUDFLARE_CREDENTIALS_FILE"

certbot certonly --dns-cloudflare --dns-cloudflare-credentials "$CLOUDFLARE_CREDENTIALS_FILE" \
  --agree-tos --no-eff-email --email "$EMAIL" \
  -d "$DOMAIN" -d "sura-codex.com"

mkdir -p certs
ln -sf "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" certs/fullchain.pem
ln -sf "/etc/letsencrypt/live/$DOMAIN/privkey.pem" certs/privkey.pem

echo "Certificates are linked in certs/ and will be used by nginx."
