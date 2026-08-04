import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ThreadAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Room {
  id: string;
  title: string;
  body: string;
  category: string;
  threadType: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  author: ThreadAuthor;
  memberCount: number;
  messageCount: number;
}

export interface RoomsResponse {
  rooms: Room[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  isPinned: boolean;
  isEdited: boolean;
  userId: string;
  parentId: string | null;
  user: ThreadAuthor;
  replies?: ChatMessage[];
}

export interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PinnedMessagesResponse {
  messages: ChatMessage[];
}

export interface SearchMessagesResponse {
  messages: ChatMessage[];
}

export interface UnreadResponse {
  unread: number;
}

// ─── API Service ────────────────────────────────────────────────────────────

const api = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchRooms(params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<RoomsResponse> {
  const query: Record<string, string> = {};
  if (params?.search) query.search = params.search;
  if (params?.category && params.category !== 'All') query.category = params.category;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  const { data } = await api.get('/api/discussion/rooms', { params: query });
  return data;
}

export async function fetchRoom(id: string): Promise<Room> {
  const { data } = await api.get(`/api/discussion/rooms/${id}`);
  return data;
}

export async function createRoom(payload: {
  title: string;
  body?: string;
  category?: string;
}): Promise<Room> {
  const { data } = await api.post('/api/discussion/rooms', payload);
  return data;
}

export async function fetchMessages(
  roomId: string,
  page = 1,
  limit = 50
): Promise<MessagesResponse> {
  const { data } = await api.get(`/api/discussion/rooms/${roomId}/messages`, {
    params: { page, limit },
  });
  return data;
}

export async function sendMessage(
  roomId: string,
  content: string,
  parentId?: string
): Promise<ChatMessage> {
  const { data } = await api.post(`/api/discussion/rooms/${roomId}/messages`, {
    content,
    parentId,
  });
  return data;
}

export async function deleteMessage(messageId: string): Promise<ChatMessage> {
  const { data } = await api.delete('/api/discussion/messages', { data: { messageId } });
  return data;
}

export async function pinMessage(messageId: string): Promise<ChatMessage> {
  const { data } = await api.post('/api/discussion/messages/pin', { messageId });
  return data;
}

export async function unpinMessage(messageId: string): Promise<ChatMessage> {
  const { data } = await api.post('/api/discussion/messages/unpin', { messageId });
  return data;
}

export async function fetchPinnedMessages(roomId: string): Promise<ChatMessage[]> {
  const { data } = await api.get<PinnedMessagesResponse>(`/api/discussion/rooms/${roomId}/pinned`);
  return data.messages;
}

export async function muteMember(
  roomId: string,
  userId: string,
  mutedUntil: string
): Promise<unknown> {
  const { data } = await api.post(`/api/discussion/rooms/${roomId}/mute`, {
    userId,
    mutedUntil,
  });
  return data;
}

export async function unmuteMember(roomId: string, userId: string): Promise<unknown> {
  const { data } = await api.post(`/api/discussion/rooms/${roomId}/unmute`, { userId });
  return data;
}

export async function reportMessage(
  roomId: string,
  payload: { commentId?: string; reportedUserId: string; reason: string }
): Promise<unknown> {
  const { data } = await api.post(`/api/discussion/rooms/${roomId}/report`, payload);
  return data;
}

export async function markRoomRead(roomId: string): Promise<unknown> {
  const { data } = await api.post(`/api/discussion/rooms/${roomId}/read`);
  return data;
}

export async function fetchUnreadCount(roomId: string): Promise<number> {
  const { data } = await api.get<UnreadResponse>(`/api/discussion/rooms/${roomId}/unread`);
  return data.unread;
}

export async function searchMessages(roomId: string, q: string): Promise<ChatMessage[]> {
  const { data } = await api.get<SearchMessagesResponse>(
    `/api/discussion/rooms/${roomId}/search`,
    { params: { q } }
  );
  return data.messages;
}
