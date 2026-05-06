
-- ============================================================
-- PHASE 4.8: Destination Agents + Counsellor Pipeline + AI IELTS Coach + Language Lab
-- ============================================================

-- ─── PILLAR 0: DESTINATION AGENTS ───────────────────────────
CREATE TABLE IF NOT EXISTS public.destination_agents (
  country_code text PRIMARY KEY,
  display_name text NOT NULL,
  flag_emoji text,
  tagline text,
  system_prompt text NOT NULL DEFAULT '',
  default_currency text DEFAULT 'USD',
  intake_terms text[] DEFAULT ARRAY['Fall','Spring'],
  visa_processing_weeks integer DEFAULT 8,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.destination_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_view_active_destinations" ON public.destination_agents FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins_manage_destinations" ON public.destination_agents FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.country_knowledge_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL REFERENCES public.destination_agents(country_code) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('visa','scholarship','cost','process','policy','other')),
  title text NOT NULL,
  body_markdown text NOT NULL DEFAULT '',
  source_url text,
  valid_through date,
  is_published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ckp_country ON public.country_knowledge_packs(country_code, is_published);
ALTER TABLE public.country_knowledge_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_published_packs" ON public.country_knowledge_packs FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins_manage_packs" ON public.country_knowledge_packs FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Conversation log for destination agent
CREATE TABLE IF NOT EXISTS public.destination_agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  country_code text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','tool')),
  content text NOT NULL DEFAULT '',
  tool_payload jsonb,
  credits_spent numeric(12,1) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dam_user_country ON public.destination_agent_messages(user_id, country_code, created_at);
ALTER TABLE public.destination_agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_dam" ON public.destination_agent_messages FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins_view_dam" ON public.destination_agent_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed 8 destinations
INSERT INTO public.destination_agents (country_code, display_name, flag_emoji, tagline, default_currency, intake_terms, visa_processing_weeks, display_order, system_prompt) VALUES
  ('GB','UK Destination Agent','🇬🇧','Russell Group, post-study work visa, scholarships','GBP',ARRAY['Fall','Spring'],4,1,'You are the UK Study Abroad Agent. You specialize in UK universities (Russell Group, plate-glass, ancient), visa rules (Student visa, Graduate Route 2-year PSW), IELTS cutoffs, scholarships (Chevening, Commonwealth), and intake terms (September & January).'),
  ('US','USA Destination Agent','🇺🇸','Ivy League to state schools, F-1 visa, OPT/STEM-OPT','USD',ARRAY['Fall','Spring','Summer'],8,2,'You are the USA Study Abroad Agent. You specialize in US universities, F-1 visa process, GRE/GMAT, IELTS/TOEFL, scholarships (Fulbright), assistantships, OPT/STEM-OPT, and intake terms (Fall, Spring, Summer).'),
  ('CA','Canada Destination Agent','🇨🇦','Affordable tuition, PGWP, PR-friendly pathway','CAD',ARRAY['Fall','Winter','Summer'],10,3,'You are the Canada Study Abroad Agent. You specialize in Canadian universities, study permit, GIC, SDS stream, IELTS, Post-Graduation Work Permit (PGWP), and PR pathways via Express Entry / PNP.'),
  ('AU','Australia Destination Agent','🇦🇺','Group of Eight, 485 graduate visa','AUD',ARRAY['Semester 1 (Feb)','Semester 2 (Jul)'],6,4,'You are the Australia Study Abroad Agent. You specialize in Australian universities (Group of Eight), Subclass 500 student visa, IELTS/PTE, GTE statement, and Subclass 485 Temporary Graduate visa.'),
  ('DE','Germany Destination Agent','🇩🇪','Public universities, low/no tuition, blocked account','EUR',ARRAY['Winter (Oct)','Summer (Apr)'],8,5,'You are the Germany Study Abroad Agent. You specialize in German public universities (TU9), APS certificate, blocked account (~€11,208/yr), German language requirements (TestDaF/DSH), and 18-month job-seeker visa post-study.'),
  ('IE','Ireland Destination Agent','🇮🇪','Tech hub, 2-year stay-back, EU access','EUR',ARRAY['Fall','Spring'],4,6,'You are the Ireland Study Abroad Agent. You specialize in Irish universities (Trinity, UCD), Stamp 2 visa, IELTS, scholarships (Government of Ireland), and 24-month Stay Back option for masters graduates.'),
  ('NL','Netherlands Destination Agent','🇳🇱','English-taught programs, orientation year','EUR',ARRAY['Fall','Spring'],6,7,'You are the Netherlands Study Abroad Agent. You specialize in Dutch universities (research vs applied sciences), IND visa process, English-taught programs, Holland Scholarship, and 1-year Orientation Year (Zoekjaar).'),
  ('SG','Singapore Destination Agent','🇸🇬','NUS, NTU, Asia gateway','SGD',ARRAY['Fall (Aug)'],4,8,'You are the Singapore Study Abroad Agent. You specialize in NUS, NTU, SMU, Student Pass, IELTS/TOEFL, ASEAN scholarships, and post-study work options (EP/S-Pass).')
ON CONFLICT (country_code) DO NOTHING;

-- ─── PILLAR 1: ABROAD COUNSELLOR PIPELINE ───────────────────
CREATE TABLE IF NOT EXISTS public.abroad_counsellors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  expertise_countries text[] NOT NULL DEFAULT '{}',
  languages text[] DEFAULT ARRAY['English'],
  commission_pct integer NOT NULL DEFAULT 60,
  bio text,
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.abroad_counsellors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_active_counsellors" ON public.abroad_counsellors FOR SELECT USING (is_active = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "self_manage_counsellor" ON public.abroad_counsellors FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins_manage_counsellors" ON public.abroad_counsellors FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.abroad_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_user_id uuid NOT NULL,
  program_id uuid REFERENCES public.study_abroad_programs(id) ON DELETE SET NULL,
  counsellor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_country text NOT NULL,
  intake_term text,
  stage text NOT NULL DEFAULT 'intake' CHECK (stage IN ('intake','shortlisted','docs_in_progress','submitted','offer','visa','enrolled','declined')),
  notes text,
  roadmap_id uuid REFERENCES public.study_abroad_roadmaps(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_abroad_apps_talent ON public.abroad_applications(talent_user_id);
CREATE INDEX idx_abroad_apps_counsellor ON public.abroad_applications(counsellor_user_id);
CREATE INDEX idx_abroad_apps_stage ON public.abroad_applications(stage);
ALTER TABLE public.abroad_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "talent_view_own_apps" ON public.abroad_applications FOR SELECT USING (talent_user_id = auth.uid() OR counsellor_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "talent_create_own_apps" ON public.abroad_applications FOR INSERT WITH CHECK (talent_user_id = auth.uid());
CREATE POLICY "counsellor_admin_update_apps" ON public.abroad_applications FOR UPDATE USING (counsellor_user_id = auth.uid() OR talent_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins_manage_apps" ON public.abroad_applications FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.abroad_application_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.abroad_applications(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('sop','transcript','ielts_score','passport','lor','financials','visa','other')),
  title text,
  file_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','uploaded','reviewed','approved','rejected')),
  reviewer_user_id uuid,
  review_note text,
  uploaded_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aad_app ON public.abroad_application_docs(application_id);
ALTER TABLE public.abroad_application_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_app_docs" ON public.abroad_application_docs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.abroad_applications a WHERE a.id = application_id
    AND (a.talent_user_id = auth.uid() OR a.counsellor_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)))
);
CREATE POLICY "talent_manage_app_docs" ON public.abroad_application_docs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.abroad_applications a WHERE a.id = application_id AND a.talent_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.abroad_applications a WHERE a.id = application_id AND a.talent_user_id = auth.uid())
);
CREATE POLICY "admins_manage_app_docs" ON public.abroad_application_docs FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.abroad_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.abroad_applications(id) ON DELETE CASCADE,
  event_kind text NOT NULL,
  actor_user_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aae_app ON public.abroad_application_events(application_id, created_at DESC);
ALTER TABLE public.abroad_application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_app_events" ON public.abroad_application_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.abroad_applications a WHERE a.id = application_id
    AND (a.talent_user_id = auth.uid() OR a.counsellor_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)))
);
CREATE POLICY "actor_create_events" ON public.abroad_application_events FOR INSERT WITH CHECK (actor_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Private storage bucket for abroad docs
INSERT INTO storage.buckets (id, name, public) VALUES ('abroad-docs','abroad-docs',false) ON CONFLICT DO NOTHING;
CREATE POLICY "abroad_docs_owner_read" ON storage.objects FOR SELECT USING (
  bucket_id = 'abroad-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role))
);
CREATE POLICY "abroad_docs_owner_write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'abroad-docs' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "abroad_docs_owner_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'abroad-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role))
);

-- Allow new source_kinds in instructor_earnings_ledger for counsellor + language session payouts
ALTER TABLE public.instructor_earnings_ledger DROP CONSTRAINT IF EXISTS instructor_earnings_ledger_source_kind_check;
ALTER TABLE public.instructor_earnings_ledger ADD CONSTRAINT instructor_earnings_ledger_source_kind_check
  CHECK (source_kind IN ('course_revenue_split','cohort_session','bonus','adjustment','abroad_application','language_session','ielts_session'));

-- assign_abroad_counsellor RPC
CREATE OR REPLACE FUNCTION public.assign_abroad_counsellor(_application_id uuid, _counsellor_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.abroad_applications SET counsellor_user_id = _counsellor_user_id, updated_at = now() WHERE id = _application_id;
  INSERT INTO public.abroad_application_events (application_id, event_kind, actor_user_id, payload)
  VALUES (_application_id, 'counsellor_assigned', auth.uid(), jsonb_build_object('counsellor_user_id', _counsellor_user_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.advance_abroad_stage(_application_id uuid, _next_stage text, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_app public.abroad_applications;
BEGIN
  SELECT * INTO v_app FROM public.abroad_applications WHERE id = _application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF NOT (v_app.counsellor_user_id = auth.uid() OR v_app.talent_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.abroad_applications SET stage = _next_stage, updated_at = now() WHERE id = _application_id;
  INSERT INTO public.abroad_application_events (application_id, event_kind, actor_user_id, payload)
  VALUES (_application_id, 'stage_changed', auth.uid(), jsonb_build_object('from', v_app.stage, 'to', _next_stage, 'note', _note));
END;
$$;

-- ─── PILLAR 2: AI IELTS COACH ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.ielts_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('listening','reading','writing','speaking')),
  prompt_text text NOT NULL,
  audio_url text,
  reference_text text,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  band_target numeric(2,1) DEFAULT 7.0,
  task_type text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ielts_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_active_prompts" ON public.ielts_prompts FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins_manage_prompts" ON public.ielts_prompts FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.ielts_mock_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section text NOT NULL CHECK (section IN ('listening','reading','writing','speaking','full')),
  prompt_id uuid REFERENCES public.ielts_prompts(id) ON DELETE SET NULL,
  response_text text,
  audio_path text,
  ai_band_score numeric(2,1),
  ai_feedback jsonb,
  credits_spent numeric(12,1) DEFAULT 0,
  is_free_attempt boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ima_user ON public.ielts_mock_attempts(user_id, created_at DESC);
ALTER TABLE public.ielts_mock_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_ielts_attempts" ON public.ielts_mock_attempts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins_view_ielts_attempts" ON public.ielts_mock_attempts FOR SELECT USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.ielts_streaks (
  user_id uuid PRIMARY KEY,
  current_streak_days integer NOT NULL DEFAULT 0,
  longest_streak_days integer NOT NULL DEFAULT 0,
  last_practice_at timestamptz,
  xp_total integer NOT NULL DEFAULT 0,
  badges text[] DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ielts_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_streaks" ON public.ielts_streaks FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "view_streaks_for_leaderboard" ON public.ielts_streaks FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.ielts_daily_challenges (
  challenge_date date PRIMARY KEY DEFAULT CURRENT_DATE,
  prompt_id uuid REFERENCES public.ielts_prompts(id) ON DELETE SET NULL,
  section text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ielts_daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_daily_challenges" ON public.ielts_daily_challenges FOR SELECT USING (true);
CREATE POLICY "admins_manage_daily" ON public.ielts_daily_challenges FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- Private bucket for IELTS audio
INSERT INTO storage.buckets (id, name, public) VALUES ('ielts-audio','ielts-audio',false) ON CONFLICT DO NOTHING;
CREATE POLICY "ielts_audio_owner" ON storage.objects FOR ALL USING (
  bucket_id = 'ielts-audio' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin'::app_role))
) WITH CHECK (
  bucket_id = 'ielts-audio' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update streak on attempt
CREATE OR REPLACE FUNCTION public.trg_ielts_attempt_update_streak() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_streak public.ielts_streaks;
BEGIN
  SELECT * INTO v_streak FROM public.ielts_streaks WHERE user_id = NEW.user_id;
  IF NOT FOUND THEN
    INSERT INTO public.ielts_streaks (user_id, current_streak_days, longest_streak_days, last_practice_at, xp_total)
    VALUES (NEW.user_id, 1, 1, NEW.created_at, 10 + COALESCE(NEW.ai_band_score::int * 5, 0));
  ELSE
    UPDATE public.ielts_streaks SET
      current_streak_days = CASE
        WHEN v_streak.last_practice_at IS NULL OR v_streak.last_practice_at < NEW.created_at - interval '48 hours' THEN 1
        WHEN date_trunc('day', v_streak.last_practice_at) = date_trunc('day', NEW.created_at) THEN v_streak.current_streak_days
        ELSE v_streak.current_streak_days + 1
      END,
      longest_streak_days = GREATEST(v_streak.longest_streak_days, v_streak.current_streak_days + 1),
      last_practice_at = NEW.created_at,
      xp_total = v_streak.xp_total + 10 + COALESCE(NEW.ai_band_score::int * 5, 0),
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_ielts_attempt_streak ON public.ielts_mock_attempts;
CREATE TRIGGER trg_ielts_attempt_streak AFTER INSERT ON public.ielts_mock_attempts
FOR EACH ROW EXECUTE FUNCTION public.trg_ielts_attempt_update_streak();

-- ─── PILLAR 3: LANGUAGE LAB ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.languages (
  code text PRIMARY KEY,
  name text NOT NULL,
  flag_emoji text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_languages" ON public.languages FOR SELECT USING (true);
CREATE POLICY "admins_manage_languages" ON public.languages FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
INSERT INTO public.languages (code,name,flag_emoji,display_order) VALUES
 ('en','English','🇬🇧',1),('es','Spanish','🇪🇸',2),('fr','French','🇫🇷',3),('de','German','🇩🇪',4),('ja','Japanese','🇯🇵',5),('bn','Bangla','🇧🇩',6)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.language_levels (
  code text PRIMARY KEY CHECK (code IN ('A1','A2','B1','B2','C1','C2')),
  description text NOT NULL,
  display_order integer NOT NULL
);
INSERT INTO public.language_levels (code,description,display_order) VALUES
 ('A1','Beginner — basic phrases',1),('A2','Elementary — simple conversations',2),
 ('B1','Intermediate — everyday topics',3),('B2','Upper-intermediate — fluent on familiar topics',4),
 ('C1','Advanced — complex texts',5),('C2','Mastery — near-native',6)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.language_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  teaches_languages text[] NOT NULL DEFAULT '{}',
  native_language text,
  cefr_proof_url text,
  hourly_rate_credits integer NOT NULL DEFAULT 50,
  bio text,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  rating numeric(3,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.language_instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_active_lang_instructors" ON public.language_instructors FOR SELECT USING (is_active = true OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "self_manage_lang_instructor" ON public.language_instructors FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins_manage_lang_instructors" ON public.language_instructors FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.language_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_user_id uuid NOT NULL,
  instructor_user_id uuid NOT NULL,
  language_code text NOT NULL REFERENCES public.languages(code),
  scheduled_at timestamptz NOT NULL,
  duration_mins integer NOT NULL DEFAULT 30,
  credits_spent numeric(12,1) NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  meet_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lb_talent ON public.language_bookings(talent_user_id);
CREATE INDEX idx_lb_instructor ON public.language_bookings(instructor_user_id);
ALTER TABLE public.language_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_own_lang_bookings" ON public.language_bookings FOR SELECT USING (
  talent_user_id = auth.uid() OR instructor_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role)
);
CREATE POLICY "talent_create_lang_booking" ON public.language_bookings FOR INSERT WITH CHECK (talent_user_id = auth.uid());
CREATE POLICY "parties_update_lang_booking" ON public.language_bookings FOR UPDATE USING (
  talent_user_id = auth.uid() OR instructor_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role)
);

CREATE TABLE IF NOT EXISTS public.language_practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language_code text NOT NULL,
  cefr_level text,
  transcript jsonb DEFAULT '[]'::jsonb,
  corrections jsonb DEFAULT '[]'::jsonb,
  credits_spent numeric(12,1) DEFAULT 0,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lps_user ON public.language_practice_sessions(user_id, created_at DESC);
ALTER TABLE public.language_practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_lps" ON public.language_practice_sessions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Talent verified language levels
CREATE TABLE IF NOT EXISTS public.talent_language_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language_code text NOT NULL REFERENCES public.languages(code),
  cefr_level text NOT NULL CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  source text NOT NULL DEFAULT 'self' CHECK (source IN ('self','placement_test','instructor_verified')),
  verified_at timestamptz DEFAULT now(),
  UNIQUE (user_id, language_code)
);
ALTER TABLE public.talent_language_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_lang_levels" ON public.talent_language_levels FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "public_view_verified_levels" ON public.talent_language_levels FOR SELECT USING (source <> 'self');
