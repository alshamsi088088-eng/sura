-- Migration: Add Parts/Volumes support for Novels
-- This implements a Wattpad-style novel structure with Parts (Volumes)

-- Create the Part table
CREATE TABLE IF NOT EXISTS "Part" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (gen_random_uuid()::text),
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "novelId" TEXT NOT NULL REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "Part_novelId_number_unique" UNIQUE ("novelId", "number")
);

-- Add partId to Chapter table (nullable - preserves existing chapters)
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "partId" TEXT REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "Part_novelId_idx" ON "Part"("novelId");
CREATE INDEX IF NOT EXISTS "Chapter_partId_idx" ON "Chapter"("partId");

-- Optional: Migrate existing chapters to an "Uncategorized" part
-- This is commented out to preserve existing data as-is
-- INSERT INTO "Part" (id, title, number, novelId, createdAt, updatedAt)
-- SELECT gen_random_uuid()::text, 'Part 1', 1, "novelId", now(), now()
-- FROM "Chapter" GROUP BY "novelId";

-- Then update chapters to reference this part
-- UPDATE "Chapter" SET "partId" = subquery.id
-- FROM (SELECT "novelId", MIN(id) as id FROM "Part" GROUP BY "novelId") AS subquery
-- WHERE "Chapter"."novelId" = subquery."novelId";