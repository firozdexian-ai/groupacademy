
create table public.project_public_settings (
  project_id uuid primary key references public.gig_projects(id) on delete cascade,
  is_public boolean not null default false,
  slug text unique,
  og_image_url text,
  seo_title text,
  seo_description text,
  case_study_md text,
  featured_deliverables jsonb not null default '[]'::jsonb,
  view_count integer not null default 0,
  share_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_pps_public on public.project_public_settings(is_public, published_at desc);
create index idx_pps_slug on public.project_public_settings(slug) where is_public=true;

alter table public.project_public_settings enable row level security;

create policy "public read when is_public" on public.project_public_settings for select using (is_public = true);

create policy "owners read all" on public.project_public_settings for select to authenticated
  using (exists (select 1 from public.gig_projects gp where gp.id = project_public_settings.project_id
    and (public.is_company_member(auth.uid(), gp.company_id) or public.has_any_admin_role(auth.uid()))));

create policy "owners write" on public.project_public_settings for all to authenticated
  using (exists (select 1 from public.gig_projects gp where gp.id = project_public_settings.project_id
    and (public.is_company_admin(auth.uid(), gp.company_id) or public.has_any_admin_role(auth.uid()))))
  with check (exists (select 1 from public.gig_projects gp where gp.id = project_public_settings.project_id
    and (public.is_company_admin(auth.uid(), gp.company_id) or public.has_any_admin_role(auth.uid()))));

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('talent','company','reviewer')),
  period text not null check (period in ('weekly','monthly','alltime')),
  category text,
  payload jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now()
);
create unique index idx_lb_unique on public.leaderboard_snapshots(kind, period, coalesce(category,''));
create index idx_lb_lookup on public.leaderboard_snapshots(kind, period, category);

alter table public.leaderboard_snapshots enable row level security;
create policy "public read leaderboards" on public.leaderboard_snapshots for select using (true);

create table public.discovery_signals (
  id bigserial primary key,
  entity_kind text not null check (entity_kind in ('project','gig','talent','company','reviewer')),
  entity_id uuid not null,
  signal text not null check (signal in ('view','share','apply','hire','complete','dispute_lost')),
  weight numeric(6,2) not null default 1.0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_ds_entity on public.discovery_signals(entity_kind, entity_id, created_at desc);
create index idx_ds_recency on public.discovery_signals(created_at desc);

alter table public.discovery_signals enable row level security;
create policy "admins read signals" on public.discovery_signals for select to authenticated
  using (public.has_any_admin_role(auth.uid()));

create table public.discovery_rules (
  key text primary key,
  weights jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.discovery_rules enable row level security;
create policy "public read rules" on public.discovery_rules for select using (true);
create policy "admins manage rules" on public.discovery_rules for all to authenticated
  using (public.has_any_admin_role(auth.uid())) with check (public.has_any_admin_role(auth.uid()));

insert into public.discovery_rules(key, weights) values
  ('talent_leaderboard', '{"trust":0.35,"completed_30d":0.20,"escrow_30d":0.15,"verified_skills":0.10,"reviewer_tier":0.10,"recency":0.10}'::jsonb),
  ('company_leaderboard', '{"projects_30d":0.40,"escrow_30d":0.30,"reputation":0.20,"recency":0.10}'::jsonb),
  ('reviewer_leaderboard', '{"accuracy":0.40,"items_resolved":0.30,"tier":0.20,"recency":0.10}'::jsonb)
on conflict (key) do nothing;

create trigger trg_pps_updated_at before update on public.project_public_settings
  for each row execute function public.update_updated_at_column();

create or replace function public.fn_pps_auto_draft()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    insert into public.project_public_settings(project_id, is_public, seo_title, seo_description)
    values (new.id, false, new.title, coalesce(new.summary, new.title))
    on conflict (project_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger trg_gp_auto_draft_pps after update on public.gig_projects
  for each row execute function public.fn_pps_auto_draft();

create or replace function public.toggle_project_public(_project_id uuid, _public boolean)
returns public.project_public_settings
language plpgsql security definer set search_path=public as $$
declare v_row public.project_public_settings; v_company uuid; v_title text; v_summary text; v_slug text;
begin
  select company_id, title, summary into v_company, v_title, v_summary from public.gig_projects where id = _project_id;
  if v_company is null then raise exception 'project_not_found'; end if;
  if not (public.is_company_admin(auth.uid(), v_company) or public.has_any_admin_role(auth.uid())) then
    raise exception 'forbidden';
  end if;
  insert into public.project_public_settings(project_id, is_public, seo_title, seo_description)
  values (_project_id, _public, v_title, coalesce(v_summary, v_title))
  on conflict (project_id) do update set is_public = _public,
    published_at = case when _public and project_public_settings.published_at is null then now() else project_public_settings.published_at end,
    updated_at = now()
  returning * into v_row;
  if _public and (v_row.slug is null or v_row.slug = '') then
    v_slug := lower(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    v_slug := substring(v_slug from 1 for 60) || '-' || substring(_project_id::text from 1 for 8);
    update public.project_public_settings set slug = v_slug where project_id = _project_id;
    v_row.slug := v_slug;
  end if;
  return v_row;
end;
$$;

create or replace function public.get_public_projects(_filters jsonb default '{}'::jsonb, _page int default 0, _page_size int default 12)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_results jsonb; v_category text := nullif(_filters->>'category',''); v_search text := nullif(_filters->>'q',''); v_offset int := greatest(_page,0) * greatest(_page_size,1);
begin
  select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) into v_results from (
    select pps.project_id as id, pps.slug, pps.seo_title, pps.seo_description, pps.og_image_url, pps.published_at, pps.view_count,
      gp.title, gp.summary, gp.category, gp.budget_credits, gp.currency_display, gp.status,
      c.id as company_id, c.name as company_name, c.slug as company_slug, c.logo_url as company_logo
    from public.project_public_settings pps
    join public.gig_projects gp on gp.id = pps.project_id
    join public.companies c on c.id = gp.company_id
    where pps.is_public = true
      and (v_category is null or gp.category = v_category)
      and (v_search is null or gp.title ilike '%'||v_search||'%' or gp.summary ilike '%'||v_search||'%')
    order by pps.published_at desc nulls last
    limit greatest(_page_size,1) offset v_offset
  ) r;
  return jsonb_build_object('results', v_results, 'page', _page, 'page_size', _page_size);
end;
$$;

create or replace function public.get_public_project_detail(_slug text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_out jsonb;
begin
  select jsonb_build_object(
    'project', jsonb_build_object('id', pps.project_id, 'slug', pps.slug, 'seo_title', pps.seo_title, 'seo_description', pps.seo_description,
      'og_image_url', pps.og_image_url, 'case_study_md', pps.case_study_md, 'featured_deliverables', pps.featured_deliverables,
      'title', gp.title, 'summary', gp.summary, 'category', gp.category, 'budget_credits', gp.budget_credits,
      'currency_display', gp.currency_display, 'status', gp.status, 'starts_at', gp.starts_at, 'due_at', gp.due_at, 'view_count', pps.view_count),
    'company', jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logo_url', c.logo_url, 'tagline', c.tagline),
    'milestones', coalesce((select jsonb_agg(jsonb_build_object('seq',m.seq,'title',m.title,'status',m.status,'due_at',m.due_at) order by m.seq)
      from public.gig_project_milestones m where m.project_id = pps.project_id),'[]'::jsonb),
    'team', coalesce((select jsonb_agg(distinct jsonb_build_object('handle', t.public_handle, 'name', t.full_name, 'photo', t.profile_photo_url))
      from public.gig_project_assignments a
      join public.gig_project_milestones m on m.id = a.milestone_id
      join public.talents t on t.id = a.talent_id
      where m.project_id = pps.project_id and t.public_profile_enabled = true),'[]'::jsonb)
  ) into v_out
  from public.project_public_settings pps
  join public.gig_projects gp on gp.id = pps.project_id
  join public.companies c on c.id = gp.company_id
  where pps.slug = _slug and pps.is_public = true;
  return v_out;
end;
$$;

create or replace function public.get_leaderboard(_kind text, _period text default 'weekly', _category text default null)
returns jsonb language sql stable security definer set search_path=public as $$
  select coalesce(payload, '[]'::jsonb) from public.leaderboard_snapshots
  where kind = _kind and period = _period and coalesce(category,'') = coalesce(_category,'')
  order by computed_at desc limit 1
$$;

create or replace function public.get_company_public_projects(_slug text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_company jsonb; v_projects jsonb;
begin
  select jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug,'logo_url',c.logo_url,'tagline',c.tagline)
    into v_company from public.companies c where c.slug = _slug;
  if v_company is null then return null; end if;
  select coalesce(jsonb_agg(row_to_json(r) order by r.published_at desc nulls last), '[]'::jsonb) into v_projects from (
    select pps.slug, pps.seo_title, pps.seo_description, pps.og_image_url, pps.published_at,
      gp.title, gp.summary, gp.category, gp.budget_credits, gp.currency_display, gp.status
    from public.project_public_settings pps
    join public.gig_projects gp on gp.id = pps.project_id
    join public.companies c on c.id = gp.company_id
    where pps.is_public = true and c.slug = _slug
  ) r;
  return jsonb_build_object('company', v_company, 'projects', v_projects);
end;
$$;

create or replace function public.get_talent_public_projects(_handle text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_talent_id uuid; v_projects jsonb;
begin
  select id into v_talent_id from public.talents where public_handle = _handle and public_profile_enabled = true;
  if v_talent_id is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(distinct jsonb_build_object('slug', pps.slug, 'title', gp.title, 'summary', gp.summary,
    'company_name', c.name, 'company_slug', c.slug, 'category', gp.category,
    'og_image_url', pps.og_image_url, 'published_at', pps.published_at)), '[]'::jsonb) into v_projects
  from public.gig_project_assignments a
  join public.gig_project_milestones m on m.id = a.milestone_id
  join public.gig_projects gp on gp.id = m.project_id
  join public.project_public_settings pps on pps.project_id = gp.id and pps.is_public = true
  join public.companies c on c.id = gp.company_id
  where a.talent_id = v_talent_id;
  return v_projects;
end;
$$;

create or replace function public.record_discovery_signal(_kind text, _id uuid, _signal text, _weight numeric default 1.0, _metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.discovery_signals(entity_kind, entity_id, signal, weight, metadata) values (_kind, _id, _signal, _weight, _metadata);
  if _kind = 'project' and _signal = 'view' then
    update public.project_public_settings set view_count = view_count + 1 where project_id = _id;
  elsif _kind = 'project' and _signal = 'share' then
    update public.project_public_settings set share_count = share_count + 1 where project_id = _id;
  end if;
end;
$$;

create or replace function public.export_escrow_ledger_csv(_project_id uuid)
returns text language plpgsql stable security definer set search_path=public as $$
declare v_company uuid; v_csv text;
begin
  select company_id into v_company from public.gig_projects where id = _project_id;
  if v_company is null then raise exception 'project_not_found'; end if;
  if not (public.is_company_member(auth.uid(), v_company) or public.has_any_admin_role(auth.uid())) then
    raise exception 'forbidden';
  end if;
  select string_agg(line, E'\n') into v_csv from (
    select 'created_at,milestone_id,talent_id,delta,event_type' as line, 0 as ord
    union all
    select concat_ws(',', created_at::text, coalesce(milestone_id::text,''), coalesce(talent_id::text,''), delta::text, event_type), 1
    from public.gig_escrow_ledger where project_id = _project_id
    order by ord, 1
  ) t;
  return coalesce(v_csv, '');
end;
$$;

insert into storage.buckets(id, name, public) values ('discovery-og','discovery-og', true) on conflict (id) do nothing;

create policy "public read discovery-og" on storage.objects for select using (bucket_id = 'discovery-og');
create policy "service write discovery-og" on storage.objects for insert to authenticated
  with check (bucket_id = 'discovery-og' and public.has_any_admin_role(auth.uid()));
