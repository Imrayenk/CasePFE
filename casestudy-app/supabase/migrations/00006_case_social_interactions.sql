-- Case Likes Table
CREATE TABLE public.case_likes (
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (case_id, user_id)
);

-- Case Comments Table
CREATE TABLE public.case_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.case_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY "Anyone can view likes" ON public.case_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.case_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.case_likes FOR DELETE USING (auth.uid() = user_id);

-- Policies for comments
CREATE POLICY "Anyone can view comments" ON public.case_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON public.case_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.case_comments FOR DELETE USING (auth.uid() = user_id);
