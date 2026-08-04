Set-Location "$PSScriptRoot"
$env:DATABASE_URL = 'postgresql://postgres.olgkiuvwufildvzqbpiw:1j8fOF8BygRROuX1@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
Write-Host "DATABASE_URL=$env:DATABASE_URL"
"select 1" | npx prisma db execute --stdin --url $env:DATABASE_URL
