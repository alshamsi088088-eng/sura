import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import socket from '../services/socketService';
import { useAuth } from './AuthContext';
import type { ChatMessage } from '../services/discussionService';

interface PresenceUser {
  id: string;
  name?: string;
}

interface LiveRoomContextValue {
  roomId: string | null;
  onlineUsers: PresenceUser[];
  onlineCount: number;
  typingUsers: string[];
  realtimeMessages: ChatMessage[];
  connected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  emitTyping: (isTyping: boolean) => void;
  emitMessage: (message: ChatMessage) => void;
  clearRealtimeMessages: () => void;
}

const LiveRoomContext = createContext<LiveRoomContextValue>({
  roomId: null,
  onlineUsers: [],
  onlineCount: 0,
  typingUsers: [],
  realtimeMessages: [],
  connected: false,
  joinRoom: () => {},
  leaveRoom: () => {},
  emitTyping: () => {},
  emitMessage: () => {},
  clearRealtimeMessages: () => {},
});

export function LiveRoomProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const roomIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // Track socket connection state
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Presence + typing + realtime message listeners
  useEffect(() => {
    const onPresenceList = (payload: { roomId: string; users: string[] }) => {
      if (payload.roomId !== roomIdRef.current) return;
      setOnlineUsers(payload.users.map((id) => ({ id })));
    };
    const onPresenceJoin = (payload: { roomId: string; userId: string; name?: string }) => {
      if (payload.roomId !== roomIdRef.current) return;
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.id === payload.userId)) return prev;
        return [...prev, { id: payload.userId, name: payload.name }];
      });
    };
    const onPresenceLeave = (payload: { roomId: string; userId: string }) => {
      if (payload.roomId !== roomIdRef.current) return;
      setOnlineUsers((prev) => prev.filter((u) => u.id !== payload.userId));
    };
    const onTyping = (payload: { roomId: string; userId: string; isTyping: boolean }) => {
      if (payload.roomId !== roomIdRef.current) return;
      if (payload.userId === user?.id) return;
      setTypingUsers((prev) => {
        if (payload.isTyping) {
          if (prev.includes(payload.userId)) return prev;
          return [...prev, payload.userId];
        }
        return prev.filter((id) => id !== payload.userId);
      });
      if (payload.isTyping) {
        if (typingTimeoutRef.current[payload.userId]) {
          clearTimeout(typingTimeoutRef.current[payload.userId]);
        }
        typingTimeoutRef.current[payload.userId] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== payload.userId));
        }, 3000);
      }
    };
    const onMessage = (payload: { roomId: string; message: ChatMessage }) => {
      if (payload.roomId !== roomIdRef.current) return;
      setRealtimeMessages((prev) => {
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
    };

    socket.on('presence:list', onPresenceList);
    socket.on('presence:join', onPresenceJoin);
    socket.on('presence:leave', onPresenceLeave);
    socket.on('room:typing', onTyping);
    socket.on('room:message', onMessage);

    return () => {
      socket.off('presence:list', onPresenceList);
      socket.off('presence:join', onPresenceJoin);
      socket.off('presence:leave', onPresenceLeave);
      socket.off('room:typing', onTyping);
      socket.off('room:message', onMessage);
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, [user?.id]);

  const joinRoom = (newRoomId: string) => {
    if (roomIdRef.current && roomIdRef.current !== newRoomId) {
      socket.emit('room:leave', { roomId: roomIdRef.current });
    }
    setRoomId(newRoomId);
    setOnlineUsers([]);
    setTypingUsers([]);
    setRealtimeMessages([]);
    setConnected(socket.connected);
    socket.connect();
    socket.emit('room:join', { roomId: newRoomId }, (res: { success: boolean }) => {
      if (res?.success) {
        setConnected(true);
      }
    });
  };

  const leaveRoom = () => {
    if (roomIdRef.current) {
      socket.emit('room:leave', { roomId: roomIdRef.current });
    }
    setRoomId(null);
    setOnlineUsers([]);
    setTypingUsers([]);
    setRealtimeMessages([]);
  };

  const emitTyping = (isTyping: boolean) => {
    if (!roomIdRef.current) return;
    socket.emit('room:typing', { roomId: roomIdRef.current, isTyping });
  };

  const emitMessage = (message: ChatMessage) => {
    if (!roomIdRef.current) return;
    socket.emit('room:message', { roomId: roomIdRef.current, message });
  };

  const clearRealtimeMessages = () => setRealtimeMessages([]);

  const value = useMemo<LiveRoomContextValue>(
    () => ({
      roomId,
      onlineUsers,
      onlineCount: onlineUsers.length,
      typingUsers,
      realtimeMessages,
      connected,
      joinRoom,
      leaveRoom,
      emitTyping,
      emitMessage,
      clearRealtimeMessages,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId, onlineUsers, typingUsers, realtimeMessages, connected]
  );

  return <LiveRoomContext.Provider value={value}>{children}</LiveRoomContext.Provider>;
}

export function useLiveRoom() {
  return useContext(LiveRoomContext);
}
