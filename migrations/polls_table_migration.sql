-- Phase 3: Poll System
-- Create polls table for poll functionality

-- Create poll options table first (referenced by polls)
CREATE TABLE IF NOT EXISTS "PollOption" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES "Poll"(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create polls table
CREATE TABLE IF NOT EXISTS "Poll" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'novel', 'chapter')),
    question TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'multiple')),
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,
    closes_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key now that Poll exists
ALTER TABLE "PollOption" DROP CONSTRAINT IF EXISTS "PollOption_poll_id_fkey";
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_poll_id_fkey"
    FOREIGN KEY (poll_id) REFERENCES "Poll"(id) ON DELETE CASCADE;

-- Create poll votes table
CREATE TABLE IF NOT EXISTS "PollVote" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES "Poll"(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES "PollOption"(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for fast lookups
CREATE INDEX idx_polls_content ON "Poll" (content_type, content_id);
CREATE INDEX idx_poll_options_poll ON "PollOption" (poll_id);
CREATE INDEX idx_poll_votes_poll ON "PollVote" (poll_id);
CREATE INDEX idx_poll_votes_user ON "PollVote" (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_poll_votes_option ON "PollVote" (option_id);