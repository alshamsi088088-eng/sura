
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { UserProfile } from '../types';

interface ChatMessage {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  fromAdmin?: boolean;
}

interface ChatContextValue {
  messages: ChatMessage[];
  online: boolean;
  sendMessage: (text: string) => void;
  unread: number;
}

const ChatContext = createContext<ChatContextValue>({ messages: [], online: false, sendMessage: async () => {}, unread: 0 });

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState(false);
  const [unread, setUnread] = useState(0);

  const socket = useMemo(() => io('http://localhost:5000', { autoConnect: false, withCredentials: true }), []);

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => setOnline(true));
    socket.on('disconnect', () => setOnline(false));
    socket.on('receive_message', (message: ChatMessage) => {
      setMessages((current) => [...current, message]);
      setUnread((count) => count + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const sendMessage = (text: string) => {
    const message = {
      id: `${Date.now()}`,
      author: 'You',
      text,
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [...current, message]);
    socket.emit('send_message', message);
  };

  return <ChatContext.Provider value={{ messages, online, sendMessage, unread }}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
