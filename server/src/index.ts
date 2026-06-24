
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

  // MVP-first / dev stability:
  // Disable seedService in development to avoid failing on invalid DB credentials.
  if (process.env.NODE_ENV !== 'development') {
    await initializeSeed();
  }
});
