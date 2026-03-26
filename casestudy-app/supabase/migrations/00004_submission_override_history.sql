ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS override_history JSONB DEFAULT '[]'::jsonb;
