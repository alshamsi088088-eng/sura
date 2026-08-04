import { Client } from 'pg';

const urls = [
  'postgresql://postgres:biYpZXdzLuqtvLjULFgBcghoXKrSoHRi@reseau.proxy.rlwy.net:54090/railway?sslmode=require',
  'postgresql://postgres.olgkiuvwufildvzqbpiw:hBfbrLjmHNdPzwTc@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
];

(async () => {
  for (const url of urls) {
    console.log('Testing', url);
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      const res = await client.query('SELECT 1');
      console.log('OK', res.rows);
    } catch (err) {
      console.error('ERROR', err.message);
    } finally {
      await client.end().catch(() => {});
    }
    console.log('---');
  }
})();
