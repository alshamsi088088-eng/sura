import { Server } from 'socket.io';
import type http from 'http';

export function registerSocketServer(server: http.Server) {
  const allowedOrigins = [
    'https://www.sura-codex.com',
    'https://sura-codex.com',
    'http://localhost:5173'
  ];

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        // Allow all origins in the list
        if (allowedOrigins.includes(origin) {
          callback(null, true);
        } else {
          // Still allow but log
          console.log(`Socket CORS: Allowing origin ${origin}`);
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Force proper WebSocket handling - no redirects
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    socket.on('send_message', (message) => {
      socket.broadcast.emit('receive_message', { ...message, fromAdmin: false });
    });
    socket.on('disconnect', () => {});
  });

  console.log('Socket.io server registered with CORS');
}