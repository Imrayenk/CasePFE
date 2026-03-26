-- Safely fetches user profiles along with their auth.users email
-- Accessible only to teachers/admins (or the user themselves)
CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
    id UUID, 
    full_name TEXT, 
    role VARCHAR, 
    email TEXT
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
        RETURN QUERY 
        SELECT p.id, p.full_name, p.role, u.email::TEXT
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id;
    ELSE
        -- Standard users can only see their own email
        RETURN QUERY 
        SELECT p.id, p.full_name, p.role, u.email::TEXT
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.id = auth.uid();
    END IF;
END;
$$ LANGUAGE plpgsql;
