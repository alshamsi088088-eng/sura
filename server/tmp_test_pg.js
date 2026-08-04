import pkg from 'pg';
const { Client } = pkg;
const urls = [
  'postgresql://postgres:biYpZXdzLuqtvLjULFgBcghoXKrSoHRi@reseau.proxy.rlwy.net:54090/railway',
  'postgresql://postgres.olgkiuvwufildvzqbpiw:hBfbrLjmHNdPzwTc@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require',
  'postgresql://postgres.olgkiuvwufildvzqbpiw:1j8fOF8BygRROuX1@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
];
for (const url of urls) {
  try {
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('SUCCESS', url);
    await client.end();
  } catch (error) {
    console.error('FAIL', url, error.message);
  }
}
