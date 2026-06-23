# Sura Codex Production Deployment Guide
# ==================================

## Table of Contents
1. [Environment Variables](#1-environment-variables)
2. [VPS Setup](#2-vps-setup)
3. [Cloudflare & SSL](#3-cloudflare--ssl)
4. [Docker Deployment](#4-docker-deployment)
5. [GitHub Actions Setup](#5-github-actions-setup)
6. [Post-Deploy Checklist](#6-post-deploy-checklist)

---

## 1. Environment Variables

### Required Variables for `.env.production`
Create your `.env.production` file with real values:

```bash
# ==============================================
# SURA CODEX PRODUCTION ENVIRONMENT VARIABLES
# ==============================================

# ==============
# APP SETTINGS
# ==============
NODE_ENV=production
PORT=5000
CLIENT_URL=https://www.sura-codex.com
SERVER_URL=https://www.sura-codex.com

# ==============
# DATABASE (Internal - DO NOT CHANGE)
# ==============
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/sura_codex?schema=public

# ==============
# JWT SECRETS - Generate with: openssl rand -base64 64
# ==============
JWT_SECRET=<paste 64-char output from openssl>
JWT_REFRESH_SECRET=<paste 64-char output from openssl>

# ==============
# FIREBASE AUTH - Get from Firebase Console
# ==============
GOOGLE_CLIENT_ID=<from Firebase > Authentication > Sign-in method >
GOOGLE_CLIENT_SECRET=<from Firebase project settings > Web SDK > OAuth2>

# ==============
# APPLE AUTH - Get from Apple Developer Portal
# ==============
APPLE_CLIENT_ID=<from Apple Developer >
APPLE_TEAM_ID=<from Apple Developer >
APPLE_KEY_ID=<from Apple Developer >
APPLE_PRIVATE_KEY=<base64 encoded key from Apple Developer >

# ==============
# GOOGLE ANALYTICS - Get from GA4
# ==============
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ==============
# GOOGLE ADSENSE - Get from AdSense
# ==============
VITE_GOOGLE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXX
VITE_GOOGLE_ADSENSE_SLOT=1234567890

# ==============
# STRIPE - Get from Stripe Dashboard
# ==============
STRIPE_SECRET_KEY=<from Stripe Dashboard > Developers > API keys>
STRIPE_PUBLISHABLE_KEY=<from Stripe Dashboard >
STRIPE_WEBHOOK_SECRET=<from Stripe Dashboard > Webhooks > Create endpoint >

# ==============
# EMAIL (SMTP) - Use Resend, AWS SES, or Mailgun
# ==============
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<from Resend API keys>
FROM_EMAIL=no-reply@sura-codex.com
```

### Quick Generate Secrets:
```bash
# Generate JWT secrets
openssl rand -base64 64 | tr -d '\n'
openssl rand -base64 64 | tr -d '\n'
```

---

## 2. VPS Setup (Ubuntu 22.04)

### SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

### Initial server setup:
```bash
# Update system
apt update && apt upgrade -y

# Create sura user
adduser sura
usermod -aG docker sura
usermod -aG sudo sura

# Setup firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
mkdir -p /usr/local/lib/docker/cli-plugins
curl -L https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Exit and login as sura
exit
```

### Login as sura and clone project:
```bash
ssh sura@YOUR_SERVER_IP

# Clone or upload your project
git clone https://github.com/YOUR_USERNAME/sura.git /home/sura/sura
cd /home/sura/sura

# Create production environment file
cp .env.production.example .env.production
nano .env.production
# Fill in all the values from Section 1
```

---

## 3. Cloudflare & SSL

### Option A: Cloudflare Auto SSL (Recommended)

1. Add your domain to Cloudflare
2. Update nameservers at your registrar
3. Go to SSL/TLS > Overview > Flexible
4. Enable "Always Use HTTPS"

### Option B: Manual SSL with certbot

```bash
# Install certbot
snap install --classic certbot

# Get SSL certificate
certbot certonly --webroot -w /tmp/sura-codex -d www.sura-codex.com -d sura-codex.com

# Note: This requires HTTP challenge - we'll use Cloudflare instead
```

### Create certificates directory:
```bash
# On your server
mkdir -p /home/sura/sura/certs

# Download certificates from Cloudflare or convertcert
# Cloudflare会自动生成证书，下载并放在certs目录

# Or use this script for Cloudflare:
cd /home/sura/sura/certs
wget -O fullchain.pem "https://cloudflare.com/cert/pem?domain=sura-codex.com"
wget -O privkey.pem "https://cloudflare.com/cert/key?domain=sura-codex.com"
chmod 600 *.pem
```

### Update nginx.conf domain:
```nginx
# Edit client/nginx.conf
server_name www.sura-codex.com;
```

---

## 4. Docker Deployment

### Build and Run:
```bash
cd /home/sura/sura

# Build images
docker compose -f docker-compose.prod.yml build --no-cache

# Run containers
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Database Migration:
```bash
# Run Prisma migrations
docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy

# Or create initial migration
docker compose -f docker-compose.prod.yml exec server npx prisma migrate dev --name init

# Seed database (optional)
docker compose -f docker-compose.prod.yml exec server npx tsx seed.ts
```

### Useful Docker Commands:
```bash
# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# SSH into container
docker compose -f docker-compose.prod.yml exec server sh

# Check resource usage
docker stats

# Clean up unused images
docker system prune -a
```

---

## 5. GitHub Actions Setup

### Add Repository Secrets:
Go to: `GitHub > Settings > Secrets and variables > Actions`

Add these secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SSH_PRIVATE_KEY` | Private key for SSH | `-----BEGIN OPENSSH...` |
| `DEPLOY_USER` | SSH username | `sura` |
| `DEPLOY_HOST` | Server IP/hostname | `192.168.1.100` |
| `DEPLOY_PORT` | SSH port | `22` |
| `DEPLOY_PATH` | Project path | `/home/sura/sura` |
| `DOMAIN` | Your domain | `www.sura-codex.com` |

### Generate SSH Key for GitHub Actions:
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@sura-codex"

# Add public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub sura@SERVER_IP

# Add private key to GitHub Secrets
cat ~/.ssh/id_ed25519
# Copy the entire output to SSH_PRIVATE_KEY secret
```

### Workflow Triggers:
- Push to `main` branch triggers deployment
- Pull requests to `main` run tests

---

## 6. Post-Deploy Checklist

### Immediate Checks:
```bash
# 1. Check all containers are running
docker compose -f docker-compose.prod.yml ps

# 2. Check application health
curl -f https://www.sura-codex.com || echo "FAILED"
curl -f https://www.sura-codex.com/api/health || echo "API FAILED"

# 3. Check logs for errors
docker compose -f docker-compose.prod.yml logs --since=5m | grep -i error

# 4. Verify database connection
docker compose -f docker-compose.prod.yml exec server npx prisma db execute --sql "SELECT 1"
```

### Functional Tests:
```bash
# 1. Homepage loads
curl -sI https://www.sura-codex.com | head -1

# 2. API responds
curl -sI https://www.sura-codex.com/api/store | head -1

# 3. Assets load correctly
curl -sI https://www.sura-codex.com/*.js | head -1

# 4. Socket.io works (optional)
curl -sI https://www.sura-codex.com/socket.io/?EIO=4 | head -1
```

### Testing Features:
- [ ] Homepage loads
- [ ] Store page displays books
- [ ] User registration/login works
- [ ] Google OAuth works
- [ ] Apple OAuth works
- [ ] Stripe checkout works
- [ ] Comments load
- [ ] Analytics tracking
- [ ] Ads display

### Monitoring:
```bash
# Setup health check cron
crontab -e

# Add this line
*/5 * * * * curl -sf https://www.sura-codex.com > /dev/null 2>&1 || echo "Site down" | mail admin@sura-codex.com
```

### Rollback commands:
```bash
# If something goes wrong
docker compose -f docker-compose.prod.yml down

# Rollback to previous tag
docker pull sura-codex/server:TAG
docker pull sura-codex/client:TAG

# Or restore from backup
docker compose -f docker-compose.prod.yml up -d
```

---

## Quick Reference Commands Summary

```bash
# ===== DEPLOYMENT ONE-LINER =====
cd /home/sura/sura && \
  docker compose -f docker-compose.prod.yml down && \
  git pull origin main && \
  docker compose -f docker-compose.prod.yml build --no-cache && \
  docker compose -f docker-compose.prod.yml up -d && \
  docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy

# ===== HEALTH CHECK =====
curl -sf https://www.sura-codex.com && echo "OK" || echo "FAILED"
```

---

## Support

If deployment fails:
1. Check logs: `docker compose -f docker-compose.prod.yml logs`
2. Check Docker: `docker ps -a`
3. Check ports: `netstat -tlnp | grep -E '80|443|5000'`
4. Check firewall: `ufw status`
5. Check Cloudflare: Ensure SSL mode is "Flexible" or "Full"

---
Generated: $(date)