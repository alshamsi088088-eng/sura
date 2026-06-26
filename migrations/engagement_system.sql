-- Engagement System Migration
-- Phase 1: Core database schema for likes, bookmarks, ratings, and comments
-- Supports: Articles, Novels, Chapters, Books

-- ============================================
-- LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "Like" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "articleId" TEXT REFERENCES "Article"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "novelId" TEXT REFERENCES "Novel"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "chapterId" TEXT REFERENCES "Chapter"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "bookId" TEXT REFERENCES "Book"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Unique constraints
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_articleId_key" UNIQUE ("userId", "articleId");
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_novelId_key" UNIQUE ("userId", "novelId");
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_chapterId_key" UNIQUE ("userId", "chapterId");
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_bookId_key" UNIQUE ("userId", "bookId");

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS "Like_articleId_idx" ON "Like"("articleId");
CREATE INDEX IF NOT EXISTS "Like_novelId_idx" ON "Like"("novelId");
CREATE INDEX IF NOT EXISTS "Like_chapterId_idx" ON "Like"("chapterId");
CREATE INDEX IF NOT EXISTS "Like_bookId_idx" ON "Like"("bookId");
CREATE INDEX IF NOT EXISTS "Like_userId_idx" ON "Like"("userId");
CREATE INDEX IF NOT EXISTS "Like_createdAt_idx" ON "Like"("createdAt" DESC);

-- ============================================
-- COMMENTS TABLE ENHANCEMENTS
-- ============================================
-- Add nested reply support fields to existing Comment table
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "parentId" TEXT REFERENCES "Comment"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 0;

-- Index for nested replies
CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment"("parentId");
CREATE INDEX IF NOT EXISTS "Comment_level_idx" ON "Comment"("level");

-- ============================================
-- ANALYTICS VIEWS
-- ============================================
-- View for content engagement stats
CREATE OR REPLACE VIEW "EngagementStats" AS
SELECT
    'article'::text as entity_type,
    id as entity_id,
    "authorName" as entity_name,
    views as view_count,
    claps as like_count,
    (SELECT COUNT(*) FROM "Comment" c WHERE c."articleId" = a.id) as comment_count,
    (SELECT COUNT(*) FROM "Bookmark" b WHERE b."articleId" = a.id) as bookmark_count,
    (SELECT AVG(value)::numeric(2,1) FROM "Rating" r WHERE r."articleId" = a.id) as avg_rating,
    (SELECT COUNT(*) FROM "Rating" r WHERE r."articleId" = a.id) as rating_count
FROM "Article" a
UNION ALL
SELECT
    'novel'::text as entity_type,
    id as entity_id,
    title as entity_name,
    0 as view_count,
    0 as like_count,
    (SELECT COUNT(*) FROM "Comment" c WHERE c."novelId" = n.id) as comment_count,
    (SELECT COUNT(*) FROM "Bookmark" b WHERE b."novelId" = n.id) as bookmark_count,
    (SELECT AVG(value)::numeric(2,1) FROM "Rating" r WHERE r."novelId" = n.id) as avg_rating,
    (SELECT COUNT(*) FROM "Rating" r WHERE r."novelId" = n.id) as rating_count
FROM "Novel" n
UNION ALL
SELECT
    'chapter'::text as entity_type,
    c.id as entity_id,
    c.title as entity_name,
    0 as view_count,
    0 as like_count,
    (SELECT COUNT(*) FROM "Comment" x WHERE x."chapterId" = c.id) as comment_count,
    (SELECT COUNT(*) FROM "Bookmark" b WHERE b."chapterId" = c.id) as bookmark_count,
    (SELECT AVG(value)::numeric(2,1) FROM "Rating" r WHERE r."chapterId" = c.id) as avg_rating,
    (SELECT COUNT(*) FROM "Rating" r WHERE r."chapterId" = c.id) as rating_count
FROM "Chapter" c
UNION ALL
SELECT
    'book'::text as entity_type,
    id as entity_id,
    title as entity_name,
    0 as view_count,
    0 as like_count,
    (SELECT COUNT(*) FROM "Comment" c WHERE c."bookId" = b.id) as comment_count,
    (SELECT COUNT(*) FROM "Bookmark" b WHERE b."bookId" = b.id) as bookmark_count,
    (SELECT AVG(value)::numeric(2,1) FROM "Rating" r WHERE r."bookId" = b.id) as avg_rating,
    (SELECT COUNT(*) FROM "Rating" r WHERE r."bookId" = b.id) as rating_count
FROM "Book" b;

-- ============================================
-- USER ENGAGEMENT VIEW
-- ============================================
CREATE OR REPLACE VIEW "UserEngagement" AS
SELECT
    u.id as "userId",
    u.name as "userName",
    COUNT(DISTINCT l.id) FILTER (WHERE l."articleId" IS NOT NULL) + COUNT(DISTINCT l.id) FILTER (WHERE l."novelId" IS NOT NULL) +
    COUNT(DISTINCT l.id) FILTER (WHERE l."chapterId" IS NOT NULL) + COUNT(DISTINCT l.id) FILTER (WHERE l."bookId" IS NOT NULL) as total_likes,
    COUNT(DISTINCT b.id) as total_bookmarks,
    COUNT(DISTINCT r.id) as total_ratings,
    COUNT(DISTINCT c.id) as total_comments
FROM "User" u
LEFT JOIN "Like" l ON u.id = l."userId"
LEFT JOIN "Bookmark" b ON u.id = b."userId"
LEFT JOIN "Rating" r ON u.id = r."userId"
LEFT JOIN "Comment" c ON u.id = c."userId"
GROUP BY u.id, u.name;