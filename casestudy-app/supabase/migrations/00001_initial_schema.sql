-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users extension (Mock for custom roles handling outside auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role IN ('learner', 'teacher', 'admin')),
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Case Studies Table
CREATE TABLE public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    update_history JSONB DEFAULT '[]'::jsonb,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Submissions Table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    summary_text TEXT,
    draft_keywords JSONB DEFAULT '[]'::jsonb,
    draft_nodes JSONB DEFAULT '[]'::jsonb,
    draft_edges JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'graded'
    final_grade NUMERIC,
    word_count INT DEFAULT 0,
    keyword_count INT DEFAULT 0,
    node_count INT DEFAULT 0,
    has_conclusion BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(case_id, learner_id)
);

-- Extracted Keywords Table
CREATE TABLE public.keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    term TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Concept Mapper Nodes Table
CREATE TABLE public.concept_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('problem', 'cause', 'analysis', 'solution', 'conclusion', 'note', 'evidence')),
    text_content TEXT,
    position_x NUMERIC NOT NULL,
    position_y NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Concept Mapper Edges/Links Table
CREATE TABLE public.concept_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    source_node_id UUID REFERENCES public.concept_nodes(id) ON DELETE CASCADE NOT NULL,
    target_node_id UUID REFERENCES public.concept_nodes(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_edges ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Examples)
-- Profiles: Any authenticated user can read profiles.
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Cases: Everyone can view active cases
CREATE POLICY "Cases viewable by everyone" ON public.cases FOR SELECT USING (status = 'active');
-- Teachers can manage cases
CREATE POLICY "Teachers can manage cases" ON public.cases FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Submissions: Learners can manage their own
CREATE POLICY "Learners can manage own submissions" ON public.submissions FOR ALL USING (auth.uid() = learner_id);
-- Teachers can view all submissions
CREATE POLICY "Teachers can view all submissions" ON public.submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Keywords and Nodes inherit access from submissions implicitly or via explicit checks
CREATE POLICY "Learners manage own keywords" ON public.keywords FOR ALL USING (
    EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND learner_id = auth.uid())
);
CREATE POLICY "Learners manage own nodes" ON public.concept_nodes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND learner_id = auth.uid())
);
CREATE POLICY "Learners manage own edges" ON public.concept_edges FOR ALL USING (
    EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND learner_id = auth.uid())
);

-- Cloud Evaluation RPC Function Mock
CREATE OR REPLACE FUNCTION evaluate_submission(p_submission_id UUID)
RETURNS JSON AS $$
DECLARE
    v_word_count INT;
    v_keyword_count INT;
    v_node_count INT;
    v_has_conclusion BOOLEAN;
    v_score NUMERIC := 0;
    v_result JSON;
BEGIN
    -- 1. Get Word Count (30% weight: optimal 50-200)
    SELECT word_count INTO v_word_count FROM public.submissions WHERE id = p_submission_id;
    IF v_word_count >= 50 AND v_word_count <= 200 THEN
        v_score := v_score + 30;
    ELSIF v_word_count > 0 THEN
        v_score := v_score + 15;
    END IF;

    -- 2. Keyword Count (40% weight: 8 pts each, max 5 keywords)
    SELECT count(*) INTO v_keyword_count FROM public.keywords WHERE submission_id = p_submission_id;
    v_score := v_score + LEAST(v_keyword_count * 8, 40);

    -- 3. Get Nodes (20% weight: assume 4 nodes is max score)
    SELECT count(*) INTO v_node_count FROM public.concept_nodes WHERE submission_id = p_submission_id;
    v_score := v_score + LEAST(v_node_count * 5, 20);

    -- 4. Check Conclusion Node (10% weight)
    SELECT EXISTS(SELECT 1 FROM public.concept_nodes WHERE submission_id = p_submission_id AND node_type = 'conclusion') INTO v_has_conclusion;
    IF v_has_conclusion THEN
        v_score := v_score + 10;
    END IF;

    -- Update Submission
    UPDATE public.submissions SET final_grade = v_score, status = 'graded' WHERE id = p_submission_id;

    -- Return full result
    v_result := json_build_object(
        'score', v_score,
        'word_count', v_word_count,
        'keyword_count', v_keyword_count,
        'node_count', v_node_count,
        'has_conclusion', v_has_conclusion
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
