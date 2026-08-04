import { prisma } from './prisma.js';
import { createNotifications } from './notificationService.js';

/**
 * Study Circle service — business logic for study circles.
 *
 * A circle is a CommunityThread with threadType = "study_circle".
 * Membership is stored in CommunityThreadMember (role: owner/moderator/member).
 * Circles have a schedule (StudyCircleSchedule), weekly goals, shared notes,
 * assignments with submissions, and discussion via the existing Comment/
 * CommunityThread infrastructure.
 *
 * Multi-step operations use Prisma transactions ($transaction) per project
 * conventions (e.g. create circle => thread + owner membership + default
 * schedule atomically).
 */

const CIRCLE_THREAD_TYPE = 'study_circle';

/**
 * Resolve a member's role within a circle. Returns null if not an active member.
 */
async function getMemberRole(circleId: string, userId: string) {
  const member = await prisma.communityThreadMember.findUnique({
    where: { threadId_userId: { threadId: circleId, userId } },
    select: { role: true, status: true },
  });
  if (!member || member.status !== 'active') return null;
  return member.role;
}

/**
 * Assert the actor is an active member of the circle (throws otherwise).
 */
async function assertMember(circleId: string, userId: string) {
  const role = await getMemberRole(circleId, userId);
  if (!role) throw new Error('Not a member of this circle');
  return role;
}

/**
 * Assert the actor is an owner or moderator of the circle (throws otherwise).
 */
async function assertModerator(circleId: string, userId: string) {
  const role = await getMemberRole(circleId, userId);
  if (role !== 'owner' && role !== 'moderator') {
    throw new Error('Only circle moderators can perform this action');
  }
  return role;
}

export async function createCircle(params: {
  creatorId: string;
  title: string;
  description: string;
  category?: string;
}) {
  if (!params.title.trim()) throw new Error('Circle title is required');
  if (!params.description.trim()) throw new Error('Circle description is required');

  return prisma.$transaction(async (tx) => {
    const circle = await tx.communityThread.create({
      data: {
        authorId: params.creatorId,
        title: params.title.trim(),
        body: params.description.trim(),
        category: params.category || 'Study Circle',
        threadType: CIRCLE_THREAD_TYPE,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Creator becomes the owner/moderator
    await tx.communityThreadMember.create({
      data: {
        threadId: circle.id,
        userId: params.creatorId,
        role: 'owner',
        status: 'active',
      },
    });

    // Default reading schedule (Monday 18:00 UTC)
    await tx.studyCircleSchedule.create({
      data: { circleId: circle.id },
    });

    return circle;
  });
}

export async function getCircles(params: { search?: string; page?: number; limit?: number }) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const where: Record<string, unknown> = { threadType: CIRCLE_THREAD_TYPE };
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { body: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [circles, total] = await Promise.all([
    prisma.communityThread.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, comments: true } },
        schedule: true,
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.communityThread.count({ where }),
  ]);

  return {
    circles: circles.map((circle) => ({
      ...circle,
      memberCount: circle._count.members,
      activityCount: circle._count.comments,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCircle(circleId: string) {
  const circle = await prisma.communityThread.findUnique({
    where: { id: circleId },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      members: {
        where: { status: { not: 'left' } },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      _count: { select: { members: true, comments: true } },
      schedule: true,
      studyCircleGoals: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      studyCircleNotes: {
        orderBy: { updatedAt: 'desc' },
        include: { author: { select: { id: true, name: true, avatar: true } } },
      },
      studyCircleAssignments: {
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, avatar: true } },
          _count: { select: { submissions: true } },
        },
      },
    },
  });

  if (!circle) return null;

  return {
    id: circle.id,
    title: circle.title,
    body: circle.body,
    category: circle.category,
    threadType: circle.threadType,
    isLocked: circle.isLocked,
    author: circle.author,
    members: circle.members,
    memberCount: circle._count.members,
    activityCount: circle._count.comments,
    schedule: circle.schedule,
    goals: circle.studyCircleGoals,
    notes: circle.studyCircleNotes,
    assignments: circle.studyCircleAssignments.map((a) => ({
      ...a,
      submissionCount: a._count.submissions,
    })),
    createdAt: circle.createdAt,
    updatedAt: circle.updatedAt,
  };
}

export async function joinCircle(circleId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.communityThreadMember.findUnique({
      where: { threadId_userId: { threadId: circleId, userId } },
    });

    if (existing) {
      // Re-join (e.g. previously left)
      return tx.communityThreadMember.update({
        where: { id: existing.id },
        data: { status: 'active', role: existing.role === 'owner' ? 'owner' : 'member' },
      });
    }

    return tx.communityThreadMember.create({
      data: { threadId: circleId, userId, role: 'member', status: 'active' },
    });
  });
}

export async function leaveCircle(circleId: string, userId: string) {
  const member = await prisma.communityThreadMember.findUnique({
    where: { threadId_userId: { threadId: circleId, userId } },
  });
  if (!member) throw new Error('Not a member of this circle');
  if (member.role === 'owner') {
    throw new Error('Owner cannot leave the circle; transfer ownership first');
  }
  return prisma.communityThreadMember.update({
    where: { id: member.id },
    data: { status: 'left' },
  });
}

export async function isMember(circleId: string, userId: string) {
  const member = await prisma.communityThreadMember.findUnique({
    where: { threadId_userId: { threadId: circleId, userId } },
  });
  return member && member.status === 'active' ? member : null;
}

export async function getMembers(circleId: string) {
  return prisma.communityThreadMember.findMany({
    where: { threadId: circleId, status: { not: 'left' } },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function setModerator(params: {
  circleId: string;
  actorId: string;
  targetUserId: string;
}) {
  const actor = await prisma.communityThreadMember.findUnique({
    where: { threadId_userId: { threadId: params.circleId, userId: params.actorId } },
  });
  if (!actor || (actor.role !== 'owner' && actor.role !== 'moderator')) {
    throw new Error('Only owner/moderator can assign moderators');
  }

  const target = await prisma.communityThreadMember.findUnique({
    where: {
      threadId_userId: { threadId: params.circleId, userId: params.targetUserId },
    },
  });
  if (!target) throw new Error('Target user is not a member');

  return prisma.communityThreadMember.update({
    where: { id: target.id },
    data: { role: 'moderator' },
  });
}

export async function getSchedule(circleId: string) {
  return prisma.studyCircleSchedule.findUnique({ where: { circleId } });
}

export async function updateSchedule(params: {
  circleId: string;
  actorId: string;
  dayOfWeek: number;
  timeOfDay: string;
  timezone: string;
}) {
  if (params.dayOfWeek < 1 || params.dayOfWeek > 7) {
    throw new Error('dayOfWeek must be between 1 and 7');
  }
  // Only owner/moderator may change the reading schedule.
  await assertModerator(params.circleId, params.actorId);
  return prisma.studyCircleSchedule.upsert({
    where: { circleId: params.circleId },
    update: {
      dayOfWeek: params.dayOfWeek,
      timeOfDay: params.timeOfDay,
      timezone: params.timezone,
    },
    create: {
      circleId: params.circleId,
      dayOfWeek: params.dayOfWeek,
      timeOfDay: params.timeOfDay,
      timezone: params.timezone,
    },
  });
}

// ─── Weekly Goals ──────────────────────────────────────────────────────────

export async function createGoal(params: {
  circleId: string;
  createdBy: string;
  title: string;
  description?: string;
  target: number;
  week: string;
}) {
  // Any active member may create a weekly goal.
  await assertMember(params.circleId, params.createdBy);
  return prisma.studyCircleGoal.create({
    data: {
      circleId: params.circleId,
      createdBy: params.createdBy,
      title: params.title.trim(),
      description: params.description,
      target: Math.max(1, params.target),
      week: params.week,
    },
  });
}

export async function updateGoalProgress(params: {
  goalId: string;
  userId: string;
  progress: number;
}) {
  const goal = await prisma.studyCircleGoal.findUnique({ where: { id: params.goalId } });
  if (!goal) throw new Error('Goal not found');

  // Only the goal creator or a circle moderator may update progress.
  const role = await getMemberRole(goal.circleId, params.userId);
  if (!role) throw new Error('Not a member of this circle');
  if (role !== 'moderator' && role !== 'owner' && goal.createdBy !== params.userId) {
    throw new Error('Only the goal creator or a moderator can update this goal');
  }

  const progress = Math.max(0, Math.min(goal.target, params.progress));
  return prisma.studyCircleGoal.update({
    where: { id: params.goalId },
    data: { progress, status: progress >= goal.target ? 'completed' : 'active' },
  });
}

export async function getGoals(circleId: string, week?: string) {
  return prisma.studyCircleGoal.findMany({
    where: week ? { circleId, week } : { circleId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: [{ week: 'desc' }, { createdAt: 'desc' }],
  });
}

// ─── Shared Notes ──────────────────────────────────────────────────────────

export async function createNote(params: {
  circleId: string;
  authorId: string;
  title: string;
  content: string;
}) {
  // Only active members can contribute shared notes.
  await assertMember(params.circleId, params.authorId);
  return prisma.studyCircleNote.create({
    data: {
      circleId: params.circleId,
      authorId: params.authorId,
      title: params.title.trim(),
      content: params.content,
    },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function updateNote(params: {
  noteId: string;
  authorId: string;
  title?: string;
  content?: string;
}) {
  const note = await prisma.studyCircleNote.findUnique({ where: { id: params.noteId } });
  if (!note) throw new Error('Note not found');
  if (note.authorId !== params.authorId) throw new Error('Only the author can edit this note');

  return prisma.studyCircleNote.update({
    where: { id: params.noteId },
    data: {
      ...(params.title !== undefined && { title: params.title.trim() }),
      ...(params.content !== undefined && { content: params.content }),
    },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function deleteNote(params: { noteId: string; authorId: string }) {
  const note = await prisma.studyCircleNote.findUnique({ where: { id: params.noteId } });
  if (!note) throw new Error('Note not found');
  if (note.authorId !== params.authorId) throw new Error('Only the author can delete this note');

  await prisma.studyCircleNote.delete({ where: { id: params.noteId } });
  return { success: true };
}

// ─── Assignments & Submissions ─────────────────────────────────────────────

export async function createAssignment(params: {
  circleId: string;
  createdBy: string;
  title: string;
  description?: string;
  dueDate?: Date;
}) {
  // Only owner/moderator may create assignments.
  await assertModerator(params.circleId, params.createdBy);

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.studyCircleAssignment.create({
      data: {
        circleId: params.circleId,
        createdBy: params.createdBy,
        title: params.title.trim(),
        description: params.description,
        dueDate: params.dueDate || null,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Notify active members about the new assignment
    const members = await tx.communityThreadMember.findMany({
      where: { threadId: params.circleId, status: 'active' },
      select: { userId: true },
    });
    const memberIds = members.map((m) => m.userId).filter((uid) => uid !== params.createdBy);

    await createNotifications(
      memberIds.map((uid) => ({
        userId: uid,
        type: 'circle',
        title: 'New assignment in your study circle',
        body: assignment.title,
        link: `/study-circles/${params.circleId}`,
        actorId: params.createdBy,
      }))
    );

    return assignment;
  });
}

export async function getAssignments(circleId: string) {
  return prisma.studyCircleAssignment.findMany({
    where: { circleId },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      submissions: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function submitAssignment(params: {
  assignmentId: string;
  userId: string;
  content: string;
}) {
  // Only active members of the circle may submit work.
  const assignment = await prisma.studyCircleAssignment.findUnique({
    where: { id: params.assignmentId },
    select: { circleId: true },
  });
  if (!assignment) throw new Error('Assignment not found');
  await assertMember(assignment.circleId, params.userId);

  return prisma.studyCircleSubmission.upsert({
    where: { assignmentId_userId: { assignmentId: params.assignmentId, userId: params.userId } },
    update: { content: params.content.trim() },
    create: {
      assignmentId: params.assignmentId,
      userId: params.userId,
      content: params.content.trim(),
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function scoreSubmission(params: {
  submissionId: string;
  score: number;
  actorId: string;
  actorRole?: string;
}) {
  const submission = await prisma.studyCircleSubmission.findUnique({
    where: { id: params.submissionId },
    include: { assignment: true },
  });
  if (!submission) throw new Error('Submission not found');

  // Only moderators/owner of the circle can score
  const actor = await prisma.communityThreadMember.findUnique({
    where: {
      threadId_userId: { threadId: submission.assignment.circleId, userId: params.actorId },
    },
  });
  if (!actor || (actor.role !== 'moderator' && actor.role !== 'owner')) {
    throw new Error('Only circle moderators can score submissions');
  }

  return prisma.studyCircleSubmission.update({
    where: { id: params.submissionId },
    data: { score: params.score },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

// ─── Calendar / Sessions ───────────────────────────────────────────────────

export async function getCalendar(circleId: string) {
  const [schedule, assignments, goals] = await Promise.all([
    prisma.studyCircleSchedule.findUnique({ where: { circleId } }),
    prisma.studyCircleAssignment.findMany({
      where: { circleId, dueDate: { not: null } },
      select: {
        id: true,
        title: true,
        dueDate: true,
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.studyCircleGoal.findMany({
      where: { circleId },
      select: { id: true, title: true, week: true, status: true },
      orderBy: { week: 'asc' },
    }),
  ]);

  return {
    schedule,
    assignments,
    goals,
  };
}
