
import { Server } from 'socket.io';
import type http from 'http';

export function registerSocketServer(server: http.Server) {
  const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'], credentials: true } });
  io.on('connection', (socket) => {
    socket.on('send_message', (message) => {
      socket.broadcast.emit('receive_message', { ...message, fromAdmin: false });
    });
    socket.on('disconnect', () => {});
  });
}
