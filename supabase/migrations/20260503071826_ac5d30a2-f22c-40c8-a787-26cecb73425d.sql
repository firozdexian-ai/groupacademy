
-- 1. attachments column
ALTER TABLE public.admin_chat_messages
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. private bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-chat-attachments', 'admin-chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 3. storage policies — admins only (uses existing has_role helper)
DROP POLICY IF EXISTS "admin chat attach: admin read" ON storage.objects;
CREATE POLICY "admin chat attach: admin read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-chat-attachments'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "admin chat attach: admin upload own folder" ON storage.objects;
CREATE POLICY "admin chat attach: admin upload own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-chat-attachments'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "admin chat attach: admin delete own folder" ON storage.objects;
CREATE POLICY "admin chat attach: admin delete own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-chat-attachments'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND auth.uid()::text = (storage.foldername(name))[1]
);
