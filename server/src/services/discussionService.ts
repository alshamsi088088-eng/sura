import { prisma } from './prisma.js';
import { createNotification } from './notificationService.js';

/**
 * Discussion service — business logic for live discussion rooms.
 *
 * Rooms are modelled as CommunityThread with threadType = "room".
 * Chat messages are modelled as Comment rows with communityId set to the
 * room id (reusing the existing polymorphic Comment model).
 * Membership is modelled via CommunityThreadMember.
 *
 * This service reuses the existing Prisma Comment/CommunityThread/Reaction
 * infrastructure and never duplicates notification/authorization logic.
 */

const ROOM_THREAD_TYPES = ['room', 'discussion'];

export async function createRoom(params: {
  authorId: string;
  title: string;
  body?: string;
  category?: string;
}) {
  return prisma.communityThread.create({
    data: {
      authorId: params.authorId,
      title: params.title.trim(),
      body: (params.body || '').trim(),
      category: params.category || 'Discussion',
      threadType: 'room',
    },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  });
}

export async function getRooms(params: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const where: Record<string, unknown> = {
    threadType: { in: ROOM_THREAD_TYPES },
  };
  if (params.category && params.category !== 'All') {
    where.category = params.category;
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { body: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [rooms, total] = await Promise.all([
    prisma.communityThread.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, comments: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.communityThread.count({ where }),
  ]);

  return {
    rooms: rooms.map((room) => ({
      ...room,
      memberCount: room._count.members,
      messageCount: room._count.comments,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRoom(roomId: string) {
  const room = await prisma.communityThread.findUnique({
    where: { id: roomId },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      _count: { select: { members: true, comments: true } },
    },
  });
  if (!room) return null;
  return {
    ...room,
    memberCount: room._count.members,
    messageCount: room._count.comments,
  };
}

export async function getMessages(roomId: string, page = 1, limit = 50) {
  const where = { communityId: roomId, isDeleted: false };
  const [messages, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        replies: {
          where: { isDeleted: false },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);
  return { messages, total, page, totalPages: Math.ceil(total / limit) };
}

export async function sendMessage(params: {
  roomId: string;
  userId: string;
  content: string;
  parentId?: string;
}) {
  const content = params.content.trim();
  if (!content) throw new Error('Message cannot be empty');

  const member = await prisma.communityThreadMember.findUnique({
    where: { threadId_userId: { threadId: params.roomId, userId: params.userId } },
  });
  if (!member || member.status === 'left') {
    throw new Error('Not a member of this room');
  }
  if (member.status === 'muted' && member.mutedUntil && member.mutedUntil > new Date()) {
    throw new Error('You are muted in this room');
  }
  if (member.status === 'muted' && !member.mutedUntil) {
    throw new Error('You are muted in this room');
  }

  // Atomic — message + room activity timestamp must succeed or fail together.
  const [, message] = await prisma.$transaction([
    prisma.communityThread.update({
      where: { id: params.roomId },
      data: { updatedAt: new Date() },
    }),
    prisma.comment.create({
      data: {
        userId: params.userId,
        content,
        communityId: params.roomId,
        parentId: params.parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    }),
  ]);

  return message;
}

export async function deleteMessage(params: {
  messageId: string;
  userId: string;
  role?: string;
}) {
  const message = await prisma.comment.findUnique({ where: { id: params.messageId } });
  if (!message) throw new Error('Message not found');
  if (message.userId !== params.userId && params.role !== 'admin' && params.role !== 'moderator') {
    throw new Error('Not authorized to delete this message');
  }
  // Soft delete to preserve conversation history/threads
  return prisma.comment.update({
    where: { id: params.messageId },
    data: { isDeleted: true, content: '[deleted]' },
  });
}

/**
 * Resolve the actor's effective moderation role for a room. A user is
 * considered a moderator within a room if they are an admin globally OR
 * they hold a "moderator"/"owner" membership role in that specific room.
 */
async function isRoomModerator(roomId: string, userId: string, globalRole?: string) {
  if (globalRole === 'admin') return true;
  const member = await prisma.communityThreadMember.findUnique({
    where: { threadId_userId: { threadId: roomId, userId } },
    select: { role: true, status: true },
  });
  return !!member && member.status === 'active' && (member.role === 'moderator' || member.role === 'owner');
}

export async function pinMessage(params: { messageId: string; userId: string; role?: string }) {
  const message = await prisma.comment.findUnique({ where: { id: params.messageId } });
  if (!message) throw new Error('Message not found');
  if (!(await isRoomModerator(message.communityId!, params.userId, params.role))) {
    throw new Error('Not authorized to pin messages');
  }
  return prisma.comment.update({
    where: { id: params.messageId },
    data: { isPinned: true },
  });
}

export async function unpinMessage(params: { messageId: string; userId: string; role?: string }) {
  const message = await prisma.comment.findUnique({ where: { id: params.messageId } });
  if (!message) throw new Error('Message not found');
  if (!(await isRoomModerator(message.communityId!, params.userId, params.role))) {
    throw new Error('Not authorized to unpin messages');
  }
  return prisma.comment.update({
    where: { id: params.messageId },
    data: { isPinned: false },
  });
}

export async function getPinnedMessages(roomId: string) {
  return prisma.comment.findMany({
    where: { communityId: roomId, isPinned: true, isDeleted: false },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function setMemberMuted(params: {
  roomId: string;
  userId: string;
  mutedUntil: Date;
  actorId: string;
  actorRole?: string;
}) {
  if (!(await isRoomModerator(params.roomId, params.actorId, params.actorRole))) {
    throw new Error('Not authorized to mute members');
  }
  return prisma.communityThreadMember.update({
    where: { threadId_userId: { threadId: params.roomId, userId: params.userId } },
    data: { status: 'muted', mutedUntil: params.mutedUntil },
  });
}

export async function unmuteMember(params: {
  roomId: string;
  userId: string;
  actorId: string;
  actorRole?: string;
}) {
  if (!(await isRoomModerator(params.roomId, params.actorId, params.actorRole))) {
    throw new Error('Not authorized to unmute members');
  }
  return prisma.communityThreadMember.update({
    where: { threadId_userId: { threadId: params.roomId, userId: params.userId } },
    data: { status: 'active', mutedUntil: null },
  });
}

export async function reportMessage(params: {
  roomId: string;
  commentId?: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
}) {
  const report = await prisma.report.create({
    data: {
      threadId: params.roomId,
      commentId: params.commentId || null,
      reporterId: params.reporterId,
      reportedUserId: params.reportedUserId,
      reason: params.reason,
    },
  });

  // Notify the room's moderators (not the reported user) so reports can be
  // reviewed discreetly without leaking the reporter's identity. Uses the
  // 'mention' type (gated by discussionMentions) which is the closest
  // existing category for moderation-related in-app alerts.
  const moderators = await prisma.communityThreadMember.findMany({
    where: { threadId: params.roomId, role: { in: ['moderator', 'owner'] }, status: 'active' },
    select: { userId: true },
  });
  for (const mod of moderators) {
    if (mod.userId === params.reporterId) continue;
    await createNotification({
      userId: mod.userId,
      type: 'mention',
      title: 'New report',
      body: `A message was reported in your room: ${params.reason}`,
      link: `/community/thread/${params.roomId}`,
    });
  }

  return report;
}

export async function markRoomRead(params: { roomId: string; userId: string }) {
  return prisma.communityThreadMember.update({
    where: { threadId_userId: { threadId: params.roomId, userId: params.userId } },
    data: { lastReadAt: new Date() },
  });
}

export async function getUnreadCount(params: { roomId: string; userId: string }) {
  const member = await prisma.communityThreadMember.findUnique({
    where: { threadId_userId: { threadId: params.roomId, userId: params.userId } },
  });
  if (!member || !member.lastReadAt) {
    // No last read -> count all messages
    return prisma.comment.count({ where: { communityId: params.roomId, isDeleted: false } });
  }
  return prisma.comment.count({
    where: {
      communityId: params.roomId,
      isDeleted: false,
      createdAt: { gt: member.lastReadAt },
    },
  });
}

export async function searchMessages(roomId: string, query: string) {
  return prisma.comment.findMany({
    where: {
      communityId: roomId,
      isDeleted: false,
      content: { contains: query, mode: 'insensitive' },
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
