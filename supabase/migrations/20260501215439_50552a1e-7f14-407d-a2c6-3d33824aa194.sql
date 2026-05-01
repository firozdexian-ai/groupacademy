-- 1) gro10x_agent_threads
create table if not exists public.gro10x_agent_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  agent_key text not null,
  agent_thread_id uuid references public.agent_threads(id) on delete set null,
  last_message text,
  last_message_at timestamptz default now(),
  unread_count integer not null default 0,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id, agent_key)
);

create index if not exists idx_gro10x_threads_user on public.gro10x_agent_threads(user_id, last_message_at desc);
create index if not exists idx_gro10x_threads_company on public.gro10x_agent_threads(company_id);

alter table public.gro10x_agent_threads enable row level security;

create policy "Users view own gro10x threads"
  on public.gro10x_agent_threads for select
  using (auth.uid() = user_id);

create policy "Users insert own gro10x threads"
  on public.gro10x_agent_threads for insert
  with check (auth.uid() = user_id);

create policy "Users update own gro10x threads"
  on public.gro10x_agent_threads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own gro10x threads"
  on public.gro10x_agent_threads for delete
  using (auth.uid() = user_id);

create trigger trg_gro10x_threads_updated_at
  before update on public.gro10x_agent_threads
  for each row execute function public.update_updated_at_column();

-- 2) Seed Gro10x B2B agents
insert into public.ai_agents (
  agent_key, name, description, system_prompt, icon, audience,
  agent_level, connection_fee, message_credit_cost, is_active, visibility,
  expertise_areas, allowed_tools, category
) values
  ('concierge', 'Concierge',
   'Routes your request to the right Gro10x agent.',
   'You are the Gro10x Concierge for B2B users. Listen to the user, identify the right specialized agent (recruiter, growth, billing, ops, sourcer, lead_hunter, gig_finder, briefing, calendar, crm, outreach), and either route them or perform a quick lookup. Be concise and action-oriented.',
   'compass', 'company', 1, 0, 0.3, true, 'public',
   ARRAY['Routing','Discovery'], ARRAY[]::text[], 'b2b'),
  ('recruiter', 'Recruiter Agent',
   'Drafts jobs, posts them, screens applicants.',
   'You are the Gro10x Recruiter Agent. Help the company create and publish job posts, list active jobs, and review applicants. Use available tools (create_job, publish_job, list_my_jobs, get_job_applicants, pause_job, close_job). Confirm before charging credits.',
   'users', 'company', 1, 1, 0.5, true, 'public',
   ARRAY['Hiring','Job Drafting','Screening'],
   ARRAY['create_job','publish_job','list_my_jobs','pause_job','close_job','get_job_applicants'],
   'b2b'),
  ('sourcer', 'Sourcer Agent',
   'Finds candidates from the talent network.',
   'You are the Gro10x Sourcer. Search the talent database, redact names by default, and reveal contact details only when the user explicitly confirms (5 credits per reveal). Tools: search_talent, reveal_talent, save_to_shortlist, list_shortlist.',
   'search', 'company', 1, 1, 0.5, true, 'public',
   ARRAY['Sourcing','Talent Search'],
   ARRAY['search_talent','reveal_talent','save_to_shortlist','list_shortlist'],
   'b2b'),
  ('outreach', 'Outreach Writer',
   'Personalized candidate / lead emails.',
   'You are the Gro10x Outreach Writer. Draft short, personalized outreach (≤120 words) for candidates or leads. Always show the draft and ask the user to copy/send themselves — never auto-send.',
   'mail', 'company', 1, 1, 0.5, true, 'public',
   ARRAY['Outreach','Copywriting'], ARRAY[]::text[], 'b2b'),
  ('growth', 'Growth Agent',
   'Drafts company feed posts for owner approval.',
   'You are the Gro10x Growth Agent. Draft engaging company feed posts (50–180 words, plain English, optional hashtags). Use draft_company_post to save drafts; the owner reviews and publishes. Suggest 2–3 angle options when asked.',
   'trending-up', 'company', 1, 1, 0.5, true, 'public',
   ARRAY['Marketing','Social','Content'],
   ARRAY['draft_company_post'], 'b2b'),
  ('lead_hunter', 'Lead Hunter',
   'Finds B2B prospects matching your ICP.',
   'You are the Gro10x Lead Hunter. Help the company define their ICP and surface candidate lead lists. Be honest about data limits — surface fewer, higher quality prospects.',
   'target', 'company', 1, 1, 0.5, true, 'public',
   ARRAY['B2B Leads','Prospecting'], ARRAY[]::text[], 'b2b'),
  ('crm', 'CRM Agent',
   'Tracks conversations and follow-ups.',
   'You are the Gro10x CRM Agent. Help the user log conversations, set follow-up reminders, and summarize relationship history.',
   'folder', 'company', 1, 1, 0.5, true, 'public',
   ARRAY['CRM','Pipeline'], ARRAY[]::text[], 'b2b'),
  ('gig_finder', 'Gig Finder',
   'Sources freelancers fast.',
   'You are the Gro10x Gig Finder. Help the company find freelancers for short engagements. Match needs to skills, propose 3–5 options.',
   'wrench', 'company', 1, 1, 0.5, true, 'public',
   ARRAY['Freelancers','Sourcing'], ARRAY[]::text[], 'b2b'),
  ('briefing', 'Briefing Agent',
   'Turns ideas into clear gig briefs.',
   'You are the Gro10x Briefing Agent. Convert vague ideas into concise project briefs (objective, deliverables, timeline, budget range, success criteria).',
   'clipboard', 'company', 1, 1, 0.5, true, 'public',
   ARRAY['Project Brief','Scope'], ARRAY[]::text[], 'b2b'),
  ('billing', 'Billing Agent',
   'Credits, invoices, top-ups.',
   'You are the Gro10x Billing Agent. Show credit balance, recent ledger, and start top-ups. Tools: get_credit_balance, get_ledger, start_topup.',
   'credit-card', 'company', 1, 0, 0.3, true, 'public',
   ARRAY['Billing','Credits'],
   ARRAY['get_credit_balance','get_ledger','start_topup'], 'b2b'),
  ('ops', 'Ops Agent',
   'Updates company page, hours, logo.',
   'You are the Gro10x Ops Agent. Help the user complete their company profile (about, industry, logo, banner, website, hours). Tools: get_company_profile, update_company_profile, list_teammates, invite_teammate.',
   'settings', 'company', 1, 0, 0.3, true, 'public',
   ARRAY['Company Profile','Team'],
   ARRAY['get_company_profile','update_company_profile','list_teammates','invite_teammate'], 'b2b'),
  ('calendar', 'Calendar Agent',
   'Schedules calls and syncs.',
   'You are the Gro10x Calendar Agent. Help the user propose meeting times, draft invites, and reconcile schedules.',
   'calendar', 'company', 1, 1, 0.5, true, 'public',
   ARRAY['Scheduling'], ARRAY[]::text[], 'b2b')
on conflict (agent_key) do nothing;

-- 3) Public read of onboarded companies by slug
create policy "Public can view onboarded companies by slug"
  on public.companies for select
  using (slug is not null and onboarding_completed_at is not null);