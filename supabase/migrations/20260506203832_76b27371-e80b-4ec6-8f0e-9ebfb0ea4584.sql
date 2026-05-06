
-- Phase 4.3 — Discussions, Q&A & Peer Review

CREATE TYPE public.submission_kind AS ENUM ('project','scenario','assignment');
CREATE TYPE public.submission_status AS ENUM ('draft','submitted','under_review','reviewed','revisions_requested','approved');
CREATE TYPE public.review_assignment_status AS ENUM ('pending','completed','skipped','expired');
CREATE TYPE public.report_status AS ENUM ('open','reviewed','dismissed','removed');

-- ============================================================
-- Discussions
-- ============================================================
CREATE TABLE public.discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  module_id UUID,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  last_post_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dt_cohort ON public.discussion_threads(cohort_id, is_pinned DESC, last_post_at DESC);
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  parent_post_id UUID REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
  is_solution BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dp_thread ON public.discussion_posts(thread_id, created_at);
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;

-- Helper: is the user a member of this cohort (or the course)
CREATE OR REPLACE FUNCTION public.is_cohort_member(_cohort_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM cohort_enrollments WHERE cohort_id = _cohort_id AND user_id = _user_id)
      OR EXISTS (
        SELECT 1 FROM cohorts k JOIN enrollments e ON e.content_id = k.content_id
        JOIN students s ON s.id = e.student_id
        WHERE k.id = _cohort_id AND s.user_id = _user_id
      );
$$;

CREATE OR REPLACE FUNCTION public.is_course_instructor(_content_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM course_engagements WHERE content_id = _content_id AND user_id = _user_id
  );
$$;

-- Threads RLS
CREATE POLICY "Cohort members read threads" ON public.discussion_threads
  FOR SELECT USING (
    NOT is_hidden AND (
      is_cohort_member(cohort_id, auth.uid())
      OR EXISTS (SELECT 1 FROM cohorts k WHERE k.id = cohort_id AND is_course_instructor(k.content_id, auth.uid()))
      OR has_role(auth.uid(),'admin'::app_role)
    )
  );
CREATE POLICY "Members create threads" ON public.discussion_threads
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND is_cohort_member(cohort_id, auth.uid())
  );
CREATE POLICY "Author edits own thread (15 min)" ON public.discussion_threads
  FOR UPDATE USING (author_id = auth.uid() AND created_at > now() - interval '15 minutes')
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "Instructor or admin manages thread" ON public.discussion_threads
  FOR UPDATE USING (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (SELECT 1 FROM cohorts k WHERE k.id = cohort_id AND is_course_instructor(k.content_id, auth.uid()))
  );
CREATE POLICY "Admin deletes thread" ON public.discussion_threads
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_dt_updated BEFORE UPDATE ON public.discussion_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Posts RLS
CREATE POLICY "Read posts of readable threads" ON public.discussion_posts
  FOR SELECT USING (
    NOT is_hidden AND EXISTS (
      SELECT 1 FROM discussion_threads t WHERE t.id = thread_id
        AND NOT t.is_hidden
        AND (is_cohort_member(t.cohort_id, auth.uid())
             OR EXISTS (SELECT 1 FROM cohorts k WHERE k.id = t.cohort_id AND is_course_instructor(k.content_id, auth.uid()))
             OR has_role(auth.uid(),'admin'::app_role))
    )
  );
CREATE POLICY "Members reply to threads" ON public.discussion_posts
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM discussion_threads t WHERE t.id = thread_id AND NOT t.is_locked
        AND is_cohort_member(t.cohort_id, auth.uid())
    )
  );
CREATE POLICY "Author edits own post (15 min)" ON public.discussion_posts
  FOR UPDATE USING (author_id = auth.uid() AND created_at > now() - interval '15 minutes')
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "Instructor or admin updates post" ON public.discussion_posts
  FOR UPDATE USING (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM discussion_threads t JOIN cohorts k ON k.id = t.cohort_id
      WHERE t.id = thread_id AND is_course_instructor(k.content_id, auth.uid())
    )
  );
CREATE POLICY "Admin deletes post" ON public.discussion_posts
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_dp_updated BEFORE UPDATE ON public.discussion_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Maintain post_count + last_post_at
CREATE OR REPLACE FUNCTION public.bump_thread_on_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussion_threads SET post_count = post_count + 1, last_post_at = now()
      WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussion_threads SET post_count = GREATEST(post_count - 1, 0)
      WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_bump_thread AFTER INSERT OR DELETE ON public.discussion_posts
  FOR EACH ROW EXECUTE FUNCTION public.bump_thread_on_post();

-- ============================================================
-- Lesson Q&A
-- ============================================================
CREATE TABLE public.lesson_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  module_id UUID,
  item_id UUID,
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  accepted_answer_id UUID,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lq_content_item ON public.lesson_questions(content_id, item_id, created_at DESC);
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lesson_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.lesson_questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_instructor BOOLEAN NOT NULL DEFAULT false,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_la_q ON public.lesson_answers(question_id, created_at);
ALTER TABLE public.lesson_answers ENABLE ROW LEVEL SECURITY;

-- Helper: enrolled in this content
CREATE OR REPLACE FUNCTION public.is_content_learner(_content_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments e JOIN students s ON s.id = e.student_id
    WHERE e.content_id = _content_id AND s.user_id = _user_id
  );
$$;

CREATE POLICY "Learners read questions" ON public.lesson_questions
  FOR SELECT USING (
    NOT is_hidden AND (
      is_content_learner(content_id, auth.uid())
      OR is_course_instructor(content_id, auth.uid())
      OR has_role(auth.uid(),'admin'::app_role)
    )
  );
CREATE POLICY "Learners ask questions" ON public.lesson_questions
  FOR INSERT WITH CHECK (author_id = auth.uid() AND is_content_learner(content_id, auth.uid()));
CREATE POLICY "Author edits own question (15 min)" ON public.lesson_questions
  FOR UPDATE USING (author_id = auth.uid() AND created_at > now() - interval '15 minutes')
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "Instructor/admin manages question" ON public.lesson_questions
  FOR UPDATE USING (
    has_role(auth.uid(),'admin'::app_role) OR is_course_instructor(content_id, auth.uid())
  );
CREATE POLICY "Admin removes question" ON public.lesson_questions
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_lq_updated BEFORE UPDATE ON public.lesson_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Read answers of readable questions" ON public.lesson_answers
  FOR SELECT USING (
    NOT is_hidden AND EXISTS (
      SELECT 1 FROM lesson_questions q WHERE q.id = question_id AND NOT q.is_hidden
        AND (is_content_learner(q.content_id, auth.uid())
             OR is_course_instructor(q.content_id, auth.uid())
             OR has_role(auth.uid(),'admin'::app_role))
    )
  );
CREATE POLICY "Members answer questions" ON public.lesson_answers
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM lesson_questions q WHERE q.id = question_id
        AND (is_content_learner(q.content_id, auth.uid()) OR is_course_instructor(q.content_id, auth.uid()))
    )
  );
CREATE POLICY "Author edits own answer (15 min)" ON public.lesson_answers
  FOR UPDATE USING (author_id = auth.uid() AND created_at > now() - interval '15 minutes')
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "Instructor/admin manages answer" ON public.lesson_answers
  FOR UPDATE USING (
    has_role(auth.uid(),'admin'::app_role) OR EXISTS (
      SELECT 1 FROM lesson_questions q WHERE q.id = question_id AND is_course_instructor(q.content_id, auth.uid())
    )
  );
CREATE POLICY "Admin deletes answer" ON public.lesson_answers
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_la_updated BEFORE UPDATE ON public.lesson_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mark instructor flag automatically on insert
CREATE OR REPLACE FUNCTION public.flag_instructor_answer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_questions q
    WHERE q.id = NEW.question_id AND is_course_instructor(q.content_id, NEW.author_id)
  ) THEN
    NEW.is_instructor := true;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_flag_instructor BEFORE INSERT ON public.lesson_answers
  FOR EACH ROW EXECUTE FUNCTION public.flag_instructor_answer();

-- Accept answer RPC
CREATE OR REPLACE FUNCTION public.accept_lesson_answer(_question_id UUID, _answer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_q lesson_questions%ROWTYPE;
BEGIN
  SELECT * INTO v_q FROM lesson_questions WHERE id = _question_id;
  IF v_q.id IS NULL THEN RAISE EXCEPTION 'question not found'; END IF;
  IF auth.uid() <> v_q.author_id
     AND NOT is_course_instructor(v_q.content_id, auth.uid())
     AND NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  UPDATE lesson_questions SET accepted_answer_id = _answer_id, is_resolved = true, updated_at = now()
    WHERE id = _question_id;
END $$;

-- ============================================================
-- Submissions + peer review
-- ============================================================
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  module_id UUID,
  project_id UUID,
  author_id UUID NOT NULL,
  kind public.submission_kind NOT NULL DEFAULT 'project',
  title TEXT,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.submission_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  score NUMERIC(6,2),
  instructor_verdict TEXT,
  is_anonymized BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sub_content ON public.submissions(content_id, status);
CREATE INDEX idx_sub_author ON public.submissions(author_id);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  due_at TIMESTAMPTZ,
  status public.review_assignment_status NOT NULL DEFAULT 'pending',
  is_instructor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, reviewer_id)
);
CREATE INDEX idx_ra_reviewer ON public.review_assignments(reviewer_id, status);
ALTER TABLE public.review_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.submission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rubric JSONB NOT NULL DEFAULT '[]'::jsonb,
  score NUMERIC(6,2),
  comments TEXT,
  is_instructor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, reviewer_id)
);
CREATE INDEX idx_sr_submission ON public.submission_reviews(submission_id);
ALTER TABLE public.submission_reviews ENABLE ROW LEVEL SECURITY;

-- Submissions RLS
CREATE POLICY "Author reads own submission" ON public.submissions
  FOR SELECT USING (
    author_id = auth.uid()
    OR has_role(auth.uid(),'admin'::app_role)
    OR is_course_instructor(content_id, auth.uid())
    OR EXISTS (SELECT 1 FROM review_assignments ra WHERE ra.submission_id = submissions.id AND ra.reviewer_id = auth.uid())
  );
CREATE POLICY "Author creates own submission" ON public.submissions
  FOR INSERT WITH CHECK (author_id = auth.uid() AND is_content_learner(content_id, auth.uid()));
CREATE POLICY "Author edits own submission (pre-submit)" ON public.submissions
  FOR UPDATE USING (
    (author_id = auth.uid() AND status IN ('draft','revisions_requested'))
    OR has_role(auth.uid(),'admin'::app_role)
    OR is_course_instructor(content_id, auth.uid())
  ) WITH CHECK (true);
CREATE POLICY "Admin deletes submission" ON public.submissions
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_sub_updated BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Review assignments RLS
CREATE POLICY "Reviewer or instructor reads assignment" ON public.review_assignments
  FOR SELECT USING (
    reviewer_id = auth.uid()
    OR has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (SELECT 1 FROM submissions s WHERE s.id = submission_id
               AND (s.author_id = auth.uid() OR is_course_instructor(s.content_id, auth.uid())))
  );
CREATE POLICY "Instructor/admin manages assignments" ON public.review_assignments
  FOR ALL USING (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (SELECT 1 FROM submissions s WHERE s.id = submission_id AND is_course_instructor(s.content_id, auth.uid()))
  ) WITH CHECK (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (SELECT 1 FROM submissions s WHERE s.id = submission_id AND is_course_instructor(s.content_id, auth.uid()))
  );

CREATE TRIGGER trg_ra_updated BEFORE UPDATE ON public.review_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Submission reviews RLS
CREATE POLICY "Author + instructor read reviews" ON public.submission_reviews
  FOR SELECT USING (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (SELECT 1 FROM submissions s WHERE s.id = submission_id
               AND (s.author_id = auth.uid() OR is_course_instructor(s.content_id, auth.uid())))
    OR reviewer_id = auth.uid()
  );
CREATE POLICY "Reviewer creates own review" ON public.submission_reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (SELECT 1 FROM review_assignments ra WHERE ra.submission_id = submission_id AND ra.reviewer_id = auth.uid())
  );
CREATE POLICY "Reviewer edits own review" ON public.submission_reviews
  FOR UPDATE USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Admin deletes review" ON public.submission_reviews
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_sr_updated BEFORE UPDATE ON public.submission_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recompute submission score + bump assignment status
CREATE OR REPLACE FUNCTION public.on_submission_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_avg NUMERIC; v_pending INT;
BEGIN
  SELECT round(avg(score), 2) INTO v_avg FROM submission_reviews WHERE submission_id = NEW.submission_id AND score IS NOT NULL;
  UPDATE submissions SET score = v_avg, status = CASE WHEN status IN ('submitted','under_review') THEN 'under_review'::submission_status ELSE status END
    WHERE id = NEW.submission_id;
  UPDATE review_assignments SET status = 'completed'
    WHERE submission_id = NEW.submission_id AND reviewer_id = NEW.reviewer_id;
  SELECT count(*) INTO v_pending FROM review_assignments
    WHERE submission_id = NEW.submission_id AND status = 'pending';
  IF v_pending = 0 THEN
    UPDATE submissions SET status = 'reviewed' WHERE id = NEW.submission_id AND status = 'under_review';
    INSERT INTO notification_dispatch (scope, scope_id, kind, payload)
    VALUES ('submission', NEW.submission_id, 'all_reviews_in', jsonb_build_object('avg_score', v_avg))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_on_review AFTER INSERT OR UPDATE ON public.submission_reviews
  FOR EACH ROW EXECUTE FUNCTION public.on_submission_review();

-- Assign peer reviewers (random N from cohort)
CREATE OR REPLACE FUNCTION public.assign_peer_reviewers(_submission_id UUID, _n INT DEFAULT 2)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sub submissions%ROWTYPE; v_count INT := 0; r RECORD;
BEGIN
  SELECT * INTO v_sub FROM submissions WHERE id = _submission_id;
  IF v_sub.id IS NULL THEN RAISE EXCEPTION 'submission not found'; END IF;
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR is_course_instructor(v_sub.content_id, auth.uid())) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  FOR r IN
    SELECT ce.user_id FROM cohort_enrollments ce
    WHERE ce.cohort_id = v_sub.cohort_id AND ce.user_id <> v_sub.author_id
      AND NOT EXISTS (SELECT 1 FROM review_assignments ra WHERE ra.submission_id = _submission_id AND ra.reviewer_id = ce.user_id)
    ORDER BY random() LIMIT _n
  LOOP
    INSERT INTO review_assignments (submission_id, reviewer_id, due_at)
      VALUES (_submission_id, r.user_id, now() + interval '7 days')
      ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

-- ============================================================
-- Content reports (moderation)
-- ============================================================
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,                -- 'thread' | 'post' | 'question' | 'answer' | 'submission'
  scope_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status public.report_status NOT NULL DEFAULT 'open',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cr_status ON public.content_reports(status, created_at DESC);
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated reports" ON public.content_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Reporter sees own reports" ON public.content_reports
  FOR SELECT USING (reporter_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin manages reports" ON public.content_reports
  FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submission_reviews;
