import { spawnSync } from 'child_process';
const url = 'postgresql://postgres.olgkiuvwufildvzqbpiw:1j8fOF8BygRROuX1@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';

const proc = spawnSync('npx', ['prisma', 'db', 'execute', '--stdin', '--url', url], {
  cwd: process.cwd(),
  input: 'select 1;\n',
  encoding: 'utf8',
  shell: false,
  env: process.env,
});
console.log('status', proc.status);
console.log('stdout', proc.stdout);
console.log('stderr', proc.stderr);
if (proc.error) console.error('error', proc.error);
