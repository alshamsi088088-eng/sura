-- PHASE 9-10: Social Layer - Notifications, Profiles & Library

-- Notifications table
CREATE TABLE IF NOT EXISTS Notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  actorId TEXT,
  actorName TEXT,
  isRead BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_userid ON Notification(userId);
CREATE INDEX IF NOT EXISTS idx_notification_userid_unread ON Notification(userId, isRead) WHERE isRead = false;

-- Follows table
CREATE TABLE IF NOT EXISTS Follow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  followerId TEXT NOT NULL,
  followingId TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(followerId, followingId)
);

CREATE INDEX IF NOT EXISTS idx_follow_followerid ON Follow(followerId);
CREATE INDEX IF NOT EXISTS idx_follow_followingid ON Follow(followingId);

-- Badges table
CREATE TABLE IF NOT EXISTS Badge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL,
  badgeKey TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(userId, badgeKey)
);

CREATE INDEX IF NOT EXISTS idx_badge_userid ON Badge(userId);

-- Reading History table
CREATE TABLE IF NOT EXISTS ReadingHistory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL,
  contentType TEXT NOT NULL,
  contentId TEXT NOT NULL,
  title TEXT,
  progress INTEGER DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readinghistory_userid ON ReadingHistory(userId);
CREATE UNIQUE INDEX IF NOT EXISTS idx_readinghistory_user_content ON ReadingHistory(userId, contentType, contentId);

-- Community Bookmarks (saved discussions)
CREATE TABLE IF NOT EXISTS CommunityBookmark (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL,
  threadId TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(userId, threadId)
);

CREATE INDEX IF NOT EXISTS idx_communitybookmark_userid ON CommunityBookmark(userId);

-- Notification Settings
CREATE TABLE IF NOT EXISTS NotificationSettings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL UNIQUE,
  likes BOOLEAN DEFAULT true,
  comments BOOLEAN DEFAULT true,
  replies BOOLEAN DEFAULT true,
  reactions BOOLEAN DEFAULT true,
  pollVotes BOOLEAN DEFAULT true,
  newChapter BOOLEAN DEFAULT true,
  newArticle BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificationsettings_userid ON NotificationSettings(userId);