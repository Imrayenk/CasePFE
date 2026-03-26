-- Teachers need UPDATE access to submissions to override grades
CREATE POLICY "Teachers can update submissions" ON public.submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);
