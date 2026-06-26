-- CreateCommunityThreads
CREATE TABLE "CommunityThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "contentId" TEXT,
    "contentType" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "CommunityThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "CommunityThread_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityThread"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "CommunityThread_authorId_idx" ON "CommunityThread"("authorId");
CREATE INDEX "CommunityThread_contentId_contentType_idx" ON "CommunityThread"("contentId", "contentType");
CREATE INDEX "CommunityThread_category_idx" ON "CommunityThread"("category");
CREATE INDEX "CommunityThread_createdAt_idx" ON "CommunityThread"("createdAt");