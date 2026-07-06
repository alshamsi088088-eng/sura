import { Server } from 'socket.io';
import type http from 'http';
import { ALLOWED_ORIGINS_STR } from './config.js';

/**
 * ✅ Socket.IO Service - Production Fixed
 *
 * Key fixes:
 * 1. Uses ALLOWED_ORIGINS from config.ts (consistent with Express)
 * 2. WebSocket-only (no polling fallback) - fixes 308 redirect on Railway
 * 3. Function-based CORS (not array) - mirrors Express CORS policy exactly
 * 4. Production: only https://sura-codex.com (no www — prevents 308 loops)
 * 5. Compression disabled for Railway reverse-proxy compatibility
 */
export function registerSocketServer(server: http.Server) {
  const isProduction = process.env.NODE_ENV === 'production';

  const io = new Server(server, {
    /**
     * ✅ CORS - function-based (mirrors Express CORS policy exactly)
     * Production: only https://sura-codex.com
     * Dev: allow configured origins from ALLOWED_ORIGINS_STR
     */
    cors: {
      origin: (origin, callback) => {
        // Allow no origin (server-to-server, curl, Postman)
        if (!origin) {
          callback(null, true);
          return;
        }

        // ✅ Normalize - remove trailing slash
        const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

        // ✅ Production: strict single-domain (no www — Railway redirects www → non-www via 308)
        if (isProduction) {
          const allowed = normalizedOrigin === 'https://sura-codex.com';
          if (allowed) {
            callback(null, true);
          } else {
            console.log(`Socket CORS REJECTED: ${normalizedOrigin}`);
            callback(new Error('Not allowed by CORS'), false);
          }
          return;
        }

        // ✅ Development: allow configured origins
        if (ALLOWED_ORIGINS_STR.includes(normalizedOrigin)) {
          callback(null, true);
        } else {
          console.log(`Socket CORS REJECTED in dev: ${normalizedOrigin}`);
          callback(new Error('Not allowed by CORS (dev)'), false);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },

    /**
     * ✅ WebSocket-only transport - fixes 308 redirect on Railway
     *
     * Why polling causes 308:
     * - Railway proxy treats HTTP polling as a regular HTTP request
     * - www → non-www redirect fires during the polling handshake
     * - Socket.IO follows the 308 and the handshake fails
     *
     * Solution: WebSocket upgrades bypass the HTTP redirect entirely
     */
    transports: ['websocket'],

    /**
     * ✅ Railway-optimised timing and compression settings
     * - pingTimeout/pingInterval tuned for Railway's reverse proxy idle timeout
     * - perMessageDeflate + httpCompression disabled for Railway compatibility
     */
    pingTimeout: 20000,
    pingInterval: 25000,
    perMessageDeflate: false,
    httpCompression: false,

    /**
     * ✅ Allow upgrades but limit to WebSocket only
     */
    allowUpgrades: true
  });

  io.on('connection', (socket) => {
    socket.on('send_message', (message) => {
      socket.broadcast.emit('receive_message', { ...message, fromAdmin: false });
    });

    socket.on('disconnect', () => {
      // Cleanup if needed
    });
  });

  console.log('Socket.io server registered (production-ready)');
}