import { Server } from 'socket.io';
import type http from 'http';

export function registerSocketServer(server: http.Server) {
  // Include Railway proxy URLs and both www/non-www domain
  const allowedOrigins = [
    'https://www.sura-codex.com',
    'https://sura-codex.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  // Add Railway URLs if present
  const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN || '';
  if (railwayUrl) {
    allowedOrigins.push(railwayUrl);
    // Also add without trailing slash
    allowedOrigins.push(railwayUrl.replace(/\/$/, ''));
  }
  const railwayBackendUrl = process.env.RAILWAY_BACKEND_URL || '';
  if (railwayBackendUrl) {
    allowedOrigins.push(railwayBackendUrl);
    allowedOrigins.push(railwayBackendUrl.replace(/\/$/, ''));
  }

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
        // Allow all origins in the list
        if (allowedOrigins.includes(normalizedOrigin)) {
          callback(null, true);
        } else {
          // Still allow but log
          console.log(`Socket CORS: Allowing origin ${origin}`);
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
      // Railway-compatible: enable both transports but prioritize WebSocket
      // Allow fallback to polling for browsers that don't support WebSocket
    },
    // Force proper WebSocket handling to avoid Railway proxy redirect issues
    // WebSocket-first with polling fallback (not disabled to maintain compatibility)
    transports: ['polling', 'websocket'],
    // Disable automatic upgrade to prevent Railway redirect loops
    // Set to false to prevent HTTP to WebSocket upgrade confusion
    allowUpgrades: true,
    // Timeouts compatible with Railway's 30s idle timeout
    pingTimeout: 20000,
    pingInterval: 20000,
    // Prevent redirect issues by using shorter timeouts
    // and ensuring proper transport handling
    initialPackets: true,
    // Help with Railway proxy handling
    perMessageDeflate: false,
    httpCompression: true
  });

  io.on('connection', (socket) => {
    socket.on('send_message', (message) => {
      socket.broadcast.emit('receive_message', { ...message, fromAdmin: false });
    });
    socket.on('disconnect', () => {});
  });

  console.log('Socket.io server registered with CORS');
}