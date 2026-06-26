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

// يقرأ المنفذ من Railway (8080 أو أي منفذ ديناميكي آخر)
const port = Number(process.env.PORT || 5000);

// إضافة '0.0.0.0' ضرورية جداً لبيئات الإنتاج والاستضافة الخارجية
server.listen(port, '0.0.0.0', async () => {
  console.log(`Server is running successfully on port ${port}`);
  if (process.env.NODE_ENV !== 'development') {
    await initializeSeed();
  }
});