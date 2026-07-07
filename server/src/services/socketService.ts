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
 * 4. Allows both sura-codex.com and www.sura-codex.com (browser may send
 *    the www origin even after a redirect, since WS upgrades bypass HTTP redirects)
 * 5. Compression disabled for Railway reverse-proxy compatibility
 */
export function registerSocketServer(server: http.Server) {
  const io = new Server(server, {
    /**
     * ✅ CORS - function-based, driven entirely by ALLOWED_ORIGINS_STR from config.ts
     * Covers production (sura-codex.com + www fallback) and dev (localhost).
     */
    cors: {
      origin: (origin, callback) => {
        console.log(`[Socket.IO] Origin received: ${origin ?? '(none)'}`);

        // Allow no origin (server-to-server, curl, Postman, Railway health checks)
        if (!origin) {
          console.log('[Socket.IO] Origin ACCEPTED: no-origin request');
          callback(null, true);
          return;
        }

        // Normalize - remove trailing slash
        const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

        if (ALLOWED_ORIGINS_STR.includes(normalizedOrigin)) {
          console.log(`[Socket.IO] Origin ACCEPTED: ${normalizedOrigin}`);
          callback(null, true);
        } else {
          console.log(`[Socket.IO] Origin REJECTED: ${normalizedOrigin} — not in allowed list: [${ALLOWED_ORIGINS_STR.join(', ')}]`);
          callback(new Error(`CORS: origin '${normalizedOrigin}' is not allowed`), false);
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
    allowUpgrades: false
  });

  // Log any engine-level errors so handshake failures appear in server logs
  io.engine.on('connection_error', (err) => {
    console.error('[Socket.IO] Connection error:', err.code, err.message, err.context);
  });

  io.on('connection', (socket) => {
    const origin = socket.handshake.headers.origin ?? '(none)';
    console.log(`[Socket.IO] Client connected: id=${socket.id} origin=${origin} transport=${socket.conn.transport.name}`);

    socket.on('send_message', (message) => {
      socket.broadcast.emit('receive_message', { ...message, fromAdmin: false });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: id=${socket.id} reason=${reason}`);
    });
  });

  console.log('Socket.io server registered (production-ready)');
}