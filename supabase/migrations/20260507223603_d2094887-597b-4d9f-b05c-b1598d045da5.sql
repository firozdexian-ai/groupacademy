ALTER TABLE public.learning_track_assignments
ADD COLUMN IF NOT EXISTS last_due_soon_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_lta_due_soon_dedup
ON public.learning_track_assignments (due_at, last_due_soon_notified_at)
WHERE status IN ('active', 'invited');