import { io, Socket } from 'socket.io-client';

/**
 * ✅ Client-side Socket.IO singleton service
 *
 * Uses VITE_SOCKET_URL when provided and falls back to the local
 * development server so the same client can run locally or in production.
 * - transports: ['websocket'] — WebSocket-only, no polling fallback.
 * - withCredentials: true — required to send cookies for authenticated sessions,
 *   must match server-side CORS `credentials: true`.
 * - autoConnect: false — connection is initiated explicitly so components can
 *   control the lifecycle and avoid connecting before auth state is known.
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';


const socket: Socket = io(SOCKET_URL, {
  /**
   * WebSocket-only transport.
   * Eliminates the polling → 308 redirect failure path on Railway.
   */
  transports: ['websocket'],

  /**
   * Send cookies with every request so the server can authenticate the user.
   * Must align with server CORS `credentials: true`.
   */
  withCredentials: true,

  /**
   * Do not connect automatically on import.
   * Call socket.connect() explicitly where needed (e.g. ChatProvider).
   */
  autoConnect: false,

  /**
   * Reconnection settings — reasonable defaults for a production app.
   */
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('connect_error', (err) => {
  console.error('[Socket.IO] Connection error:', err.message);
});

socket.on('connect', () => {
  console.log('[Socket.IO] Connected via', socket.io.engine.transport.name);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket.IO] Disconnected:', reason);
});

export default socket;
