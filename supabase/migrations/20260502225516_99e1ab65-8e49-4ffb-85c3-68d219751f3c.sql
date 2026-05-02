
ALTER TABLE public.agent_tools DROP CONSTRAINT IF EXISTS agent_tools_handler_kind_check;
ALTER TABLE public.agent_tools ADD CONSTRAINT agent_tools_handler_kind_check
  CHECK (handler_kind = ANY (ARRAY['edge_function','rpc','internal','connector','skill']));

ALTER TABLE public.agent_tools
  ADD COLUMN IF NOT EXISTS connector_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available';

CREATE TABLE IF NOT EXISTS public.agent_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_key text UNIQUE NOT NULL,
  label text NOT NULL,
  direction text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage channels" ON public.agent_channels;
CREATE POLICY "Admins manage channels" ON public.agent_channels FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.agent_tool_bindings (
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  tool_id  uuid REFERENCES public.agent_tools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, tool_id)
);
ALTER TABLE public.agent_tool_bindings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage tool bindings" ON public.agent_tool_bindings;
CREATE POLICY "Admins manage tool bindings" ON public.agent_tool_bindings FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.agent_channel_bindings (
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.agent_channels(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, channel_id)
);
ALTER TABLE public.agent_channel_bindings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage channel bindings" ON public.agent_channel_bindings;
CREATE POLICY "Admins manage channel bindings" ON public.agent_channel_bindings FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

INSERT INTO public.agent_channels (channel_key,label,direction,description) VALUES
  ('in_app_chat','In-App Chat','both','Conversational chat surface'),
  ('feed_prompt','Feed Prompt','talent','Inline AI prompts in the social feed'),
  ('profile_sidebar','Profile Sidebar','both','Contextual assistant on profile pages'),
  ('email_reply','Email Reply','both','Triggered when user replies to a transactional email'),
  ('cron','Scheduled (Cron)','admin','Time-based runs'),
  ('webhook','Webhook','admin','External webhook trigger')
ON CONFLICT (channel_key) DO NOTHING;

INSERT INTO public.agent_tools (tool_key,name,description,category,handler_kind,handler_ref,connector_id,status,is_active) VALUES
  ('connector_resend','Resend','Transactional email API','email','connector','resend','resend','available',true),
  ('connector_gmail','Gmail','Send/read Gmail','email','connector','google_mail','google_mail','available',true),
  ('connector_outlook','Microsoft Outlook','Outlook email','email','connector','microsoft_outlook','microsoft_outlook','available',true),
  ('connector_slack','Slack','Slack messaging','comms','connector','slack','slack','available',true),
  ('connector_telegram','Telegram','Telegram bot messaging','comms','connector','telegram','telegram','available',true),
  ('connector_twilio','Twilio','SMS / voice / WhatsApp','comms','connector','twilio','twilio','available',true),
  ('connector_hubspot','HubSpot','CRM sync','crm','connector','hubspot','hubspot','available',true),
  ('connector_airtable','Airtable','Airtable bases','data','connector','airtable','airtable','available',true),
  ('connector_gsheets','Google Sheets','Spreadsheet I/O','data','connector','google_sheets','google_sheets','available',true),
  ('connector_gdrive','Google Drive','File storage','data','connector','google_drive','google_drive','available',true),
  ('connector_gcal','Google Calendar','Calendar events','scheduling','connector','google_calendar','google_calendar','available',true),
  ('connector_linear','Linear','Issue tracking','ops','connector','linear','linear','available',true),
  ('connector_asana','Asana','Project/task ops','ops','connector','asana','asana','available',true),
  ('connector_aws_s3','AWS S3','Object storage','data','connector','aws_s3','aws_s3','available',true),
  ('connector_elevenlabs','ElevenLabs','Voice / TTS','media','connector','elevenlabs','elevenlabs','available',true),
  ('connector_firecrawl','Firecrawl','Web scraping','search','connector','firecrawl','firecrawl','available',true),
  ('connector_perplexity','Perplexity','AI search','search','connector','perplexity','perplexity','available',true),
  ('connector_gemini_ent','Gemini Enterprise','Enterprise search','search','connector','gemini_enterprise','gemini_enterprise','available',true)
ON CONFLICT (tool_key) DO NOTHING;

INSERT INTO public.agent_tools (tool_key,name,description,category,handler_kind,handler_ref,is_active) VALUES
  ('skill_cv_review','CV Review Skill','Reviews a CV and returns structured feedback','career','skill','cv_review',true),
  ('skill_job_match','Job Match Skill','Ranks jobs against a talent profile','jobs','skill','job_match',true),
  ('skill_outreach_writer','Outreach Writer Skill','Drafts personalized outreach copy','comms','skill','outreach_writer',true),
  ('skill_interview_prep','Interview Prep Skill','Generates interview prep packs','career','skill','interview_prep',true)
ON CONFLICT (tool_key) DO NOTHING;
