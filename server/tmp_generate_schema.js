import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootSchemaPath = join(process.cwd(), '..', 'schema.prisma');
const targetSchemaPath = join(process.cwd(), 'tmp_schema.prisma');
const root = readFileSync(rootSchemaPath, 'utf8');
const lines = root.split(/\r?\n/);
let inDatasource = false;
const out = [];
for (const line of lines) {
  if (!inDatasource && line.trim().startsWith('datasource db')) {
    inDatasource = true;
    out.push('datasource db {');
    out.push('  provider = "postgresql"');
    out.push('  url      = "postgresql://postgres.olgkiuvwufildvzqbpiw:hBfbrLjmHNdPzwTc@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&uselibpqcompat=true"');
    continue;
  }
  if (inDatasource) {
    if (line.trim() === '}') {
      inDatasource = false;
      continue;
    }
    continue;
  }
  out.push(line);
}
writeFileSync(targetSchemaPath, out.join('\n'));
console.log('tmp_schema.prisma generated at', targetSchemaPath);
