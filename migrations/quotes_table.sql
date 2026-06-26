-- Quote & Highlight System
-- Phase 7 - MVP SAFE

-- Create Quote table
CREATE TABLE IF NOT EXISTS "Quote" (
    "id" TEXT NOT NULL DEFAULT cuPID(),
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "selectedText" TEXT NOT NULL,
    "startOffset" INTEGER,
    "endOffset" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Unique constraint for duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS "Quote_userId_contentId_startOffset_endOffset_key" ON "Quote"("userId", "contentId", "startOffset", "endOffset");

-- Indexes
CREATE INDEX IF NOT EXISTS "Quote_userId_idx" ON "Quote"("userId");
CREATE INDEX IF NOT EXISTS "Quote_contentId_contentType_idx" ON "Quote"("contentId", "contentType");