import { Server } from 'socket.io';
import type http from 'http';
import { ALLOWED_ORIGINS_LIST } from './config.js';
import { prisma } from './prisma.js';

/**
 * In-memory presence map for live discussion rooms & study circles.
 * Key: roomId (CommunityThread id) -> Map<userId, socketId>
 * This keeps the realtime presence lightweight and avoids extra DB writes.
 * It is intentionally NOT persisted — presence is ephemeral by design.
 */
const presence = new Map<string, Map<string, string>>();

function addPresence(roomId: string, userId: string, socketId: string) {
  if (!presence.has(roomId)) presence.set(roomId, new Map());
  presence.get(roomId)!.set(userId, socketId);
}

function removePresence(roomId: string, userId: string) {
  const room = presence.get(roomId);
  if (room) {
    room.delete(userId);
    if (room.size === 0) presence.delete(roomId);
  }
}

function getRoomPresence(roomId: string): string[] {
  return Array.from(presence.get(roomId)?.keys() ?? []);
}

/**
 * Server-side authorization check for a room event. A user must be an
 * active member of the room (CommunityThreadMember.status === 'active')
 * to emit room events. This is enforced on EVERY event, not only at join
 * time, so a client cannot emit to a room it never joined (or after leaving).
 */
async function isRoomMember(roomId: string, userId: string): Promise<boolean> {
  try {
    const member = await prisma.communityThreadMember.findUnique({
      where: { threadId_userId: { threadId: roomId, userId } },
      select: { status: true },
    });
    return !!member && member.status === 'active';
  } catch {
    return false;
  }
}

/**
 * Best-effort resolution of the authenticated user from the socket handshake.
 * Accepts a JWT in the socket `auth.token` (matching the client's
 * socketService.ts which sends `{ token }`). Falls back to reading the
 * Authorization header if present.
 */
async function resolveUserFromSocket(socket: any): Promise<{ id: string; name: string; role: string } | null> {
  try {
    const token = socket.handshake?.auth?.token || socket.handshake?.headers?.authorization?.replace('Bearer ', '');
    if (!token) return null;

    const jwt = (await import('jsonwebtoken')).default;
    const { JWT_SECRET } = await import('./config.js');
    const payload: any = jwt.verify(token, JWT_SECRET);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, role: true },
    });
    return user;
  } catch {
    return null;
  }
}

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
     * ✅ CORS - function-based, driven entirely by ALLOWED_ORIGINS_LIST from config.ts
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

        if (ALLOWED_ORIGINS_LIST.includes(normalizedOrigin)) {
          console.log(`[Socket.IO] Origin ACCEPTED: ${normalizedOrigin}`);
          callback(null, true);
        } else {
          console.log(`[Socket.IO] Origin REJECTED: ${normalizedOrigin} — not in allowed list: [${ALLOWED_ORIGINS_LIST.join(', ')}]`);
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

    // Existing anonymous chat (backward compatible)
    socket.on('send_message', (message) => {
      socket.broadcast.emit('receive_message', { ...message, fromAdmin: false });
    });

    // ─── Sprint 15 realtime: live discussion rooms & study circles ─────────
    // Join a room (socket.io room named by CommunityThread id). Emits the
    // current online user list to the joined client and broadcasts the new
    // online count to everyone in the room.
    socket.on('room:join', async (payload: { roomId: string }, ack?: (r: any) => void) => {
      const user = await resolveUserFromSocket(socket);
      if (!user) {
        ack?.({ success: false, error: 'Unauthorized' });
        return;
      }
      const { roomId } = payload || {};
      if (!roomId) {
        ack?.({ success: false, error: 'Missing roomId' });
        return;
      }
      // Server-side membership check — only active members may join.
      if (!(await isRoomMember(roomId, user.id))) {
        ack?.({ success: false, error: 'Forbidden: not a member of this room' });
        return;
      }

      socket.join(`room:${roomId}`);
      // Track presence keyed by the last socket for this user
      const prevSocket = presence.get(roomId)?.get(user.id);
      if (prevSocket && prevSocket !== socket.id) {
        socket.to(`room:${roomId}`).emit('presence:leave', { userId: user.id });
      }
      addPresence(roomId, user.id, socket.id);
      socket.emit('presence:list', { roomId, users: getRoomPresence(roomId) });
      socket.to(`room:${roomId}`).emit('presence:join', { roomId, userId: user.id, name: user.name });
      ack?.({ success: true, users: getRoomPresence(roomId) });
    });

    // Leave a room (cleanup presence + notify others)
    socket.on('room:leave', (payload: { roomId: string }, ack?: (r: any) => void) => {
      const { roomId } = payload || {};
      if (!roomId) return;
      socket.leave(`room:${roomId}`);
      // Resolve from presence (we stored userId -> socketId; find user by socketId)
      for (const [roomKey, users] of presence.entries()) {
        if (roomKey !== roomId) continue;
        for (const [userId, sId] of users.entries()) {
          if (sId === socket.id) {
            removePresence(roomId, userId);
            socket.to(`room:${roomId}`).emit('presence:leave', { userId });
            break;
          }
        }
      }
      ack?.({ success: true });
    });

// Typing indicator: broadcast to the room (excluding sender).
    // Only active members may emit typing events.
    socket.on('room:typing', async (payload: { roomId: string; isTyping: boolean }, ack?: (r: any) => void) => {
      const { roomId, isTyping } = payload || {};
      if (!roomId) {
        ack?.({ success: false, error: 'Missing roomId' });
        return;
      }
      const user = await resolveUserFromSocket(socket);
      if (!user || !(await isRoomMember(roomId, user.id))) {
        ack?.({ success: false, error: 'Forbidden: not a member of this room' });
        return;
      }
      socket.to(`room:${roomId}`).emit('room:typing', { roomId, userId: user.id, isTyping });
      ack?.({ success: true });
    });

    // New chat message broadcast (the actual persistence is done via the
    // REST API; this only relays to connected clients in the room).
    // Only active members may relay messages.
    socket.on('room:message', async (payload: { roomId: string; message: any }, ack?: (r: any) => void) => {
      const { roomId, message } = payload || {};
      if (!roomId || !message) {
        ack?.({ success: false, error: 'Missing roomId or message' });
        return;
      }
      const user = await resolveUserFromSocket(socket);
      if (!user || !(await isRoomMember(roomId, user.id))) {
        ack?.({ success: false, error: 'Forbidden: not a member of this room' });
        return;
      }
      io.to(`room:${roomId}`).emit('room:message', { roomId, message, userId: user.id });
      ack?.({ success: true });
    });

    // Disconnect: clean up presence across all rooms for this socket
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: id=${socket.id} reason=${reason}`);
      for (const [roomKey, users] of presence.entries()) {
        for (const [userId, sId] of users.entries()) {
          if (sId === socket.id) {
            removePresence(roomKey, userId);
            socket.to(`room:${roomKey}`).emit('presence:leave', { userId });
            break;
          }
        }
      }
    });
  });

  console.log('Socket.io server registered (production-ready)');
}