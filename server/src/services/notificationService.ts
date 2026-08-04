import { prisma } from './prisma.js';

/**
 * Notification service — reuses the existing Notification model and
 * NotificationSettings gating. This is the SINGLE helper for creating
 * in-app notifications across discussion rooms and study circles so that
 * business logic is never duplicated in controllers/services.
 *
 * Settings keys that gate a notification type (must exist on
 * NotificationSettings):
 *   like      -> likes
 *   comment   -> comments
 *   reply     -> replies
 *   reaction  -> reactions
 *   pollVote  -> pollVotes
 *   newChapter-> newChapter
 *   newArticle-> newArticle
 *   mention   -> discussionMentions
 *   circle    -> circleActivity
 */
const SETTINGS_KEY_BY_TYPE: Record<string, keyof import('@prisma/client').NotificationSettings & string> = {
  mention: 'discussionMentions',
  circle: 'circleActivity',
};

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  actorId?: string;
  actorName?: string;
}

/**
 * Create an in-app notification for a single user, unless their
 * NotificationSettings explicitly disable the category.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const settingsKey = SETTINGS_KEY_BY_TYPE[input.type];

  try {
    if (settingsKey) {
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId: input.userId },
        select: { [settingsKey]: true },
      });
      if (settings && settings[settingsKey] === false) {
        return;
      }
    }

    await prisma.notification.create({ data: { ...input } });
  } catch (error) {
    // Notifications must never break the primary request flow.
    console.error('[notificationService] createNotification error:', error);
  }
}

/**
 * Create the same notification for many users (e.g. all circle members).
 * Only users whose settings allow it receive the row.
 */
export async function createNotifications(
  inputs: CreateNotificationInput[]
): Promise<void> {
  if (inputs.length === 0) return;

  const uniqueUserIds = [...new Set(inputs.map((i) => i.userId))];

  try {
    const settingsRows = await prisma.notificationSettings.findMany({
      where: { userId: { in: uniqueUserIds } },
    });
    const settingsByUser = new Map<string, Record<string, boolean>>();
    for (const row of settingsRows) {
      settingsByUser.set(row.userId, row as unknown as Record<string, boolean>);
    }

    const toCreate = inputs.filter((input) => {
      const settings = settingsByUser.get(input.userId);
      const settingsKey = SETTINGS_KEY_BY_TYPE[input.type];
      if (settings && settingsKey && settings[settingsKey] === false) {
        return false;
      }
      return true;
    });

    if (toCreate.length > 0) {
      await prisma.notification.createMany({ data: toCreate });
    }
  } catch (error) {
    console.error('[notificationService] createNotifications error:', error);
  }
}

