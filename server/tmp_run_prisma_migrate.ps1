Set-Location "$PSScriptRoot"
$env:PRISMA_DOTENV_PATH = 'none'
$env:DATABASE_URL = 'postgresql://postgres.olgkiuvwufildvzqbpiw:hBfbrLjmHNdPzwTc@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
Write-Host "PRISMA_DOTENV_PATH=$env:PRISMA_DOTENV_PATH"
Write-Host "DATABASE_URL=$env:DATABASE_URL"
Write-Host "Starting prisma migrate dev..."
& npx prisma migrate dev --name add_ads_and_metrics --schema ..\schema.prisma --skip-seed
