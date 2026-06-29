
import { Server } from 'socket.io';
import type http from 'http';

export function registerSocketServer(server: http.Server) {
  // Use HTTPS in production to avoid Mixed Content
  const clientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://sura-codex.com' : 'http://localhost:5173');
  const io = new Server(server, { cors: { origin: clientUrl, methods: ['GET', 'POST'], credentials: true } });
  io.on('connection', (socket) => {
    socket.on('send_message', (message) => {
      socket.broadcast.emit('receive_message', { ...message, fromAdmin: false });
    });
    socket.on('disconnect', () => {});
  });
}
