-- Update submissions table to store workspace draft state
-- We use JSONB so we don't need to save works-in-progress to the final relational tables
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS draft_keywords JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS draft_nodes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS draft_edges JSONB DEFAULT '[]'::jsonb;
