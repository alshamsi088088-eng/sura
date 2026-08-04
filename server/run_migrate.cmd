@echo off
cd /d %~dp0
set PRISMA_DOTENV_PATH=none
set DATABASE_URL=postgresql://postgres.olgkiuvwufildvzqbpiw:hBfbrLjmHNdPzwTc@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
echo PRISMA_DOTENV_PATH=%PRISMA_DOTENV_PATH%
echo DATABASE_URL=%DATABASE_URL%
npx prisma migrate dev --name add_ads_and_metrics --schema ..\schema.prisma --skip-seed
