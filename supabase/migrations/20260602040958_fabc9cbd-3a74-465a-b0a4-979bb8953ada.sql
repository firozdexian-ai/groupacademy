-- 1. professionals
DROP POLICY IF EXISTS "Users can update professional profile by email or user_id" ON public.professionals;
DROP POLICY IF EXISTS "Users can update own professional profile" ON public.professionals;
CREATE POLICY "Users can update own professional profile"
ON public.professionals
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR (email = (auth.jwt() ->> 'email'::text)))
WITH CHECK ((auth.uid() = user_id) OR (email = (auth.jwt() ->> 'email'::text)));

-- 2. talent_inbox_settings
DROP POLICY IF EXISTS "Inbox settings publicly readable" ON public.talent_inbox_settings;
DROP POLICY IF EXISTS "Inbox settings readable by authenticated users" ON public.talent_inbox_settings;
CREATE POLICY "Inbox settings readable by authenticated users"
ON public.talent_inbox_settings
FOR SELECT TO authenticated USING (true);

-- 3. storage portfolio-uploads
DROP POLICY IF EXISTS "Anyone can upload portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload to own folder (portfolio-uploads)" ON storage.objects;
CREATE POLICY "Authenticated users upload to own folder (portfolio-uploads)"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. ai_agents: hide system_prompt from non-admin reads via column-level grants.
-- Discover columns dynamically to avoid drift.
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO cols
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'ai_agents'
     AND column_name <> 'system_prompt';

  EXECUTE format('REVOKE SELECT ON public.ai_agents FROM anon, authenticated');
  EXECUTE format('GRANT SELECT (%s) ON public.ai_agents TO anon, authenticated', cols);
  EXECUTE 'GRANT ALL ON public.ai_agents TO service_role';
END
$$;