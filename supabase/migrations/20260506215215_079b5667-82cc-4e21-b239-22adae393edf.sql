ALTER TABLE public.language_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_language_levels" ON public.language_levels FOR SELECT USING (true);
CREATE POLICY "admins_manage_language_levels" ON public.language_levels FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));