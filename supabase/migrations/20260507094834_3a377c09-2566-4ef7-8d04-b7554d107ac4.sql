-- Extend group_kind CHECK to include community + course_cohort
ALTER TABLE public.messaging_conversations
  DROP CONSTRAINT IF EXISTS messaging_conversations_group_kind_check;

ALTER TABLE public.messaging_conversations
  ADD CONSTRAINT messaging_conversations_group_kind_check
  CHECK (group_kind IS NULL OR group_kind IN ('client_success','internal','community','course_cohort'));

-- Idempotency helper: prevent duplicate course_cohort groups for the same course
CREATE UNIQUE INDEX IF NOT EXISTS uq_messaging_conv_course_cohort
  ON public.messaging_conversations ((metadata->>'course_id'))
  WHERE is_group = true AND group_kind = 'course_cohort' AND metadata->>'course_id' IS NOT NULL;

-- Idempotency helper: prevent duplicate community groups for the same profession×country key
CREATE UNIQUE INDEX IF NOT EXISTS uq_messaging_conv_community_key
  ON public.messaging_conversations ((metadata->>'community_key'))
  WHERE is_group = true AND group_kind = 'community' AND metadata->>'community_key' IS NOT NULL;