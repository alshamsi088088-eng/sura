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

/**
 * ⚠️ CORS تم إزالته من هنا - موجود فقط في app.ts
 * هذا يمنع ازدواجية CORS التي سببت المشاكل
 */

/**
 * ✅ مهم جداً: preflight requests - يجب أن يكون في app.ts فقط
 */

const server = http.createServer(app);

/**
 * ✅ Socket.IO مع CORS محدد مسبقاً (سبب المشكلة الأكبر)
 * يستخدم ALLOWED_ORIGINS من config.ts للتconsistent
 */
registerSocketServer(server);

const port = Number(process.env.PORT || 5000);

server.listen(port, '0.0.0.0', async () => {
  console.log(`Server is running successfully on port ${port}`);

  if (process.env.NODE_ENV !== 'development') {
    await initializeSeed();
  }
});