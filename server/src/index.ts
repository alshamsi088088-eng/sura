
import 'dotenv/config';
import http from 'http';
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
