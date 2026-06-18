
# Sura Codex

**Sura Codex** is a bilingual, literary publishing platform built for deep reading,
creative publishing, and immersive editorial experiences.

## Overview

- **Tagline:** مساحة للفكر والإبداع / A Space for Thought & Creativity
- **Architecture:** React + Vite frontend, Express + Prisma backend, Socket.io chat,
  Stripe checkout, email verification, JWT auth, and offline reading support.
- **Design:** Dark/light theme, RTL/LTR support, rich typography, generous whitespace.

## Prerequisites

- Node 18+ installed
- npm installed
- Optional: PostgreSQL if you want to use a Postgres database

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Make sure the following critical variables are set before running the server:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
3. For production, use PostgreSQL instead of SQLite and update `DATABASE_URL` accordingly.
4. Run:

```bash
npm install
npm run db:seed
npm run dev
```

## نشر الإنتاج مع Docker

1. تأكد من أن الدومين `www.sura-codex.com` يشير إلى عنوان IP الخادم الذي ستنشر عليه.
2. انسخ `.env.production.example` إلى `.env.production` واملأ القيم الحقيقية.
3. ضع الشهادات في مجلد `./certs` باسمين:
   - `fullchain.pem`
   - `privkey.pem`
4. ثم شغّل:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

5. بعد التشغيل، يجب أن يكون الموقع متاحًا عبر HTTPS على `https://www.sura-codex.com`.

## ضبط DNS وCloudflare

1. إذا تستخدم DNS عادي:
   - أنشئ سجل `A` لـ `sura-codex.com` واتجه إلى عنوان IP الخادم.
   - أنشئ سجل `CNAME` لـ `www` واتجه إلى `sura-codex.com`.
2. إذا تستخدم Cloudflare:
   - اجعل الأيقونة رمادية (DNS only) أثناء إصدار الشهادة عبر Let's Encrypt.
   - بعد إصدار الشهادة، يمكنك تفعيل الأيقونة البرتقالية إذا أردت CDN وحماية إضافية.
   - استخدم وضع SSL `Full (Strict)` في Cloudflare إذا كنت تستخدم شهادة صالحة على الخادم.
   - فعل `Always Use HTTPS` و`Automatic HTTPS Rewrites`.
   - أضف Page Rule لـ `https://www.sura-codex.com/*` لتحويل دائم إلى HTTPS.
3. تأكد من أن `CLIENT_URL` و`SERVER_URL` في `.env.production` هما `https://www.sura-codex.com`.

## شهادة Let’s Encrypt تلقائيًا

يمكنك إصدار الشهادة مباشرة على الخادم باستخدام Certbot.

### إصدار شهادة باستخدام DNS-01 عبر Cloudflare

1. ثبت Certbot مع مكون Cloudflare DNS:

```bash
sudo apt update
sudo apt install certbot python3-certbot-dns-cloudflare
```

2. جهز مفتاح API Token في Cloudflare بصلاحية:
   - Zone:DNS:Edit

3. شغّل السكربت المساعد:

```bash
chmod +x scripts/request-cert-cloudflare.sh
EMAIL=admin@yourdomain.com CLOUDFLARE_API_TOKEN=your_cloudflare_api_token ./scripts/request-cert-cloudflare.sh
```

4. أعد نشر التطبيق:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### إصدار شهادة باستخدام HTTP-01

إذا كنت تفضل إصدار الشهادة مباشرة عبر HTTP، اتبع الخطوات التالية:

1. أوقف خدمة `client` مؤقتًا:

```bash
docker compose -f docker-compose.prod.yml stop client
```

2. أصدِر الشهادة:

```bash
sudo certbot certonly --standalone --agree-tos --no-eff-email -m you@example.com -d sura-codex.com -d www.sura-codex.com
```

3. أنشئ روابط رمزية للشهادة داخل المشروع:

```bash
mkdir -p certs
ln -sf /etc/letsencrypt/live/www.sura-codex.com/fullchain.pem certs/fullchain.pem
ln -sf /etc/letsencrypt/live/www.sura-codex.com/privkey.pem certs/privkey.pem
```

4. ثم أعد تشغيل التطبيق:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

1. ثبت Certbot على الخادم (مثال Ubuntu):

```bash
sudo apt update
sudo apt install certbot
```

2. أوقف خدمة `client` مؤقتًا إذا كانت تحت المنفذ 80:

```bash
docker compose -f docker-compose.prod.yml stop client
```

2. يمكنك تشغيل السكربت المساعد من `scripts/request-cert.sh` لتسهيل العملية:

```bash
chmod +x scripts/request-cert.sh
EMAIL=your@email.com ./scripts/request-cert.sh
```

3. أصدِر الشهادة:

```bash
sudo certbot certonly --standalone --agree-tos --no-eff-email -m you@example.com -d sura-codex.com -d www.sura-codex.com
```

4. أنشئ روابط رمزية للشهادة داخل المشروع:

```bash
mkdir -p certs
ln -sf /etc/letsencrypt/live/www.sura-codex.com/fullchain.pem certs/fullchain.pem
ln -sf /etc/letsencrypt/live/www.sura-codex.com/privkey.pem certs/privkey.pem
```

5. ثم أعد تشغيل التطبيق:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

6. جدد الشهادة تلقائيًا باستخدام Cron أو systemd timer.

## CI/CD مع GitHub Actions

المسار الجديد موجود في `.github/workflows/ci-cd.yml`.

### ما يقوم به هذا المسار
- يبني ويختبر الكود عند كل دفع إلى الفرع `main`.
- إذا نجحت الاختبارات، ينشر التغييرات إلى الخادم عبر SSH.

### المتغيرات السرية المطلوب إعدادها في GitHub
- `DEPLOY_SSH_KEY` — مفتاح SSH الخاص للمستخدم على الخادم.
- `DEPLOY_HOST` — عنوان IP أو اسم الخادم.
- `DEPLOY_PORT` — رقم منفذ SSH.
- `DEPLOY_USER` — اسم المستخدم على الخادم.
- `DEPLOY_PATH` — مسار المشروع على الخادم.

### متى يعمل النشر الآلي
- ينفذ فقط عند الدفع إلى الفرع `main`.

## Testing

- Run server tests with `npm --workspace=server run test`
- Watch tests during development with `npm --workspace=server run test:watch`

## Local PostgreSQL with Docker

1. Start Postgres locally:

```bash
docker compose up -d
```

2. استخدم `postgres` كاسم مستخدم وكلمة مرور، وقاعدة البيانات `sura_codex`.
3. انسخ `.env.example` إلى `.env` وتأكد من أن `DATABASE_URL` يشير إلى:

```text
postgresql://postgres:postgres@localhost:5432/sura_codex?schema=public
```

4. ثم شغل:

```bash
npm --workspace=server run db:migrate
npm --workspace=server run dev
```

5. للوصول إلى واجهة إدارة قواعد البيانات استخدم:

- http://localhost:8080

## Local Launch

- Client: http://localhost:5173
- Server: http://localhost:5000

## Pre-seeded accounts

- Admin: `admin@suracodex.com` / `Admin@2025!`
- Member: `reader@suracodex.com` / `Reader@2025!`
- Writer: `writer@suracodex.com` / `Writer@2025!`

## OAuth Setup

- Google OAuth: configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Apple Sign In: configure `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY`.

## Stripe

- Use `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`.
- Checkout sessions are handled via `/api/store/checkout` and webhook at `/api/webhooks/stripe`.

## Folder Structure

- `client/` — React app, pages, UI, theming, chat, and PWA registration.
- `server/` — Express API, auth, content, Stripe, email, Prisma ORM, and socket server.
- `prisma/` — Prisma schema and seeds.
