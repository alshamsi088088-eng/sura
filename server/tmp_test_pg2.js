import pkg from 'pg';
const { Client } = pkg;
const url = 'postgresql://postgres.olgkiuvwufildvzqbpiw:1j8fOF8BygRROuX1@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  console.log('SUCCESS', url);
  await client.end();
} catch (error) {
  console.error('FAIL', url, error.message, error.code);
}
