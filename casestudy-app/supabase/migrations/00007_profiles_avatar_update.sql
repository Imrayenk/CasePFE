-- 1. Add avatar_url column to the profiles table to store base64 strings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Update the RPC function to include avatar_url in the returned fields
DROP FUNCTION IF EXISTS get_users_with_emails();

CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
    id UUID, 
    full_name TEXT, 
    role VARCHAR, 
    email TEXT,
    avatar_url TEXT
) 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Check if the current user is a teacher or admin
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('teacher', 'admin')
    ) THEN
        -- Teachers get actual emails and avatars
        RETURN QUERY 
        SELECT p.id, p.full_name, p.role, u.email::TEXT, p.avatar_url
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id;
    ELSE
        -- Standard users can only see their own email
        RETURN QUERY 
        SELECT p.id, p.full_name, p.role, u.email::TEXT, p.avatar_url
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.id = auth.uid();
    END IF;
END;
$$ LANGUAGE plpgsql;
