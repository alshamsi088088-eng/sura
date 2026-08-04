@echo off
cd /d %~dp0
set "DATABASE_URL=postgresql://postgres.olgkiuvwufildvzqbpiw:1j8fOF8BygRROuX1@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&sslaccept=accept_invalid_certs"
echo DATABASE_URL=%DATABASE_URL%
echo select 1 | npx prisma db execute --stdin --url="%DATABASE_URL%"
