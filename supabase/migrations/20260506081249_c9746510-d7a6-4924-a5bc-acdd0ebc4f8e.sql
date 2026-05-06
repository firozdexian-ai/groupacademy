CREATE TABLE IF NOT EXISTS public.module_item_revision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('quiz','scenario')),
  module_id uuid,
  before jsonb NOT NULL,
  after jsonb NOT NULL,
  flags_addressed text[] NOT NULL DEFAULT '{}',
  applied_by uuid,
  applied_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.module_item_revision_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read revisions" ON public.module_item_revision_log;
CREATE POLICY "Admins read revisions" ON public.module_item_revision_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins insert revisions" ON public.module_item_revision_log;
CREATE POLICY "Admins insert revisions" ON public.module_item_revision_log
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_revision_log_item ON public.module_item_revision_log(item_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_revision_log_module ON public.module_item_revision_log(module_id, applied_at DESC);