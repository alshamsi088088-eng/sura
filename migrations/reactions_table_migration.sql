-- Phase 2: Emoji Reactions
-- Create reactions table for emoji-based reactions

CREATE TABLE IF NOT EXISTS "Reaction" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'novel', 'chapter', 'book')),
    emoji TEXT NOT NULL CHECK (emoji IN ('love', 'fire', 'funny', 'sad', 'wow', 'clap', 'mind_blown', 'excellent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint: one reaction per user per content
ALTER TABLE "Reaction" ADD CONSTRAINT unique_user_content_reaction UNIQUE (user_id, content_id);

-- Index for counting reactions by content
CREATE INDEX idx_reactions_content ON "Reaction" (content_type, content_id);
CREATE INDEX idx_reactions_emoji ON "Reaction" (content_type, content_id, emoji);