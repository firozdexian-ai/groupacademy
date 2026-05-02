-- Private bucket for gig submission files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gig-submissions',
  'gig-submissions',
  false,
  209715200, -- 200 MB
  NULL -- allow any mime
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 209715200;

-- Talent: upload to own folder
CREATE POLICY "Talents upload own gig files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gig-submissions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Talent: read own files
CREATE POLICY "Talents read own gig files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'gig-submissions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Talent: delete own files
CREATE POLICY "Talents delete own gig files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gig-submissions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins / talent_exec: read everything for review
CREATE POLICY "Admins read all gig files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'gig-submissions'
  AND public.has_any_admin_role(auth.uid())
);