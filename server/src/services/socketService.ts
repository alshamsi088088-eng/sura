import { Server } from 'socket.io';
import type http from 'http';
import { ALLOWED_ORIGINS_STR } from './config.js';

/**
 * ✅ Socket.IO Service - Production Fixed
 *
 * Key fixes:
 * 1. Uses ALLOWED_ORIGINS from config.ts (consistent with Express)
 * 2. WebSocket-first (not polling) - fixes 308 redirect on Railway
 * 3. Function-based CORS (not array) - consistent with Express
 * 4. No duplicate domain (www only)
 */
export function registerSocketServer(server: http.Server) {
  const isProduction = process.env.NODE_ENV === 'production';

  const io = new Server(server, {
    /**
     * ✅ CORS -function based (consistent with Express)
     * Allows proper callback-based validation
     */
    cors: {
      origin: (origin, callback) => {
        // Allow no origin (direct server connections)
        if (!origin) {
          callback(null, true);
          return;
        }

        // ✅ Normalize - remove trailing slash
        const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

        // ✅ Production: strict www only
        if (isProduction) {
          if (ALLOWED_ORIGINS_STR.includes(normalizedOrigin)) {
            callback(null, true);
          } else {
            console.log(`Socket CORS REJECTED: ${normalizedOrigin}`);
            callback(new Error('Not allowed'), false);
          }
          return;
        }

        // ✅ Development: allow configured origins
        if (ALLOWED_ORIGINS_STR.includes(normalizedOrigin)) {
          callback(null, true);
        } else {
          // Dev mode: allow but log
          console.log(`Socket CORS: Dev allowing ${origin}`);
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },

    /**
     * ✅ WebSocket-first - fixes 308 redirect on Railway
     *
     * Why polling-first causes 308:
     * - Railway proxy sees HTTP polling as regular HTTP
     * - Gets redirected to www (non-www redirect)
     * - Socket.IO follows redirect -> 308 error
     *
     * Solution: WebSocket upgrades directly, bypasses redirect
     */
    transports: ['websocket'],

    /**
     * ✅ Minimal configuration for Railway
     */
    pingTimeout: 20000,
    pingInterval: 25000,
    perMessageDeflate: false,
    httpCompression: true,

    /**
     * ✅ Allow upgrades but limit to WebSocket only
     */
    allowUpgrades: true,
    initialPackets: false
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