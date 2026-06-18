
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Diagnostic: print only first 20 chars of DATABASE_URL to verify which pooler/URL is loaded
const dbUrl = process.env.DATABASE_URL || '';
console.log(`[env-debug] DATABASE_URL prefix: ${dbUrl.slice(0, 20)}`);
import { app } from './app.js';
import { initializeSeed } from './services/seedService.js';
import { registerSocketServer } from './services/socketService.js';
import { validateEnvironment } from './services/config.js';

validateEnvironment();

const server = http.createServer(app);
registerSocketServer(server);

const port = Number(process.env.PORT || 5000);
server.listen(port, async () => {
  console.log(`Server listening on http://localhost:${port}`);
  await initializeSeed();
});
