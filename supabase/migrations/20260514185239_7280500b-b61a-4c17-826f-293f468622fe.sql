drop function if exists public.get_workforce_dashboard();

create or replace function public.get_workforce_dashboard()
returns table (
  id uuid,
  talent_id uuid,
  user_id uuid,
  role_type text,
  status text,
  city text,
  country text,
  hired_at timestamptz,
  probation_ends_at timestamptz,
  created_at timestamptz,
  team_id uuid,
  grade_id uuid,
  specialization jsonb,
  reports_to uuid,
  talent_name text,
  talent_email text,
  assigned_count bigint,
  commission_earned numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    w.id,
    w.talent_id,
    w.user_id,
    w.role_type::text,
    w.status,
    w.city,
    w.country,
    w.hired_at,
    w.probation_ends_at,
    w.created_at,
    w.team_id,
    w.grade_id,
    w.specialization,
    w.reports_to,
    t.full_name as talent_name,
    t.email as talent_email,
    coalesce((select count(*)::bigint from talent_assignments ta where ta.assigned_to = w.id), 0) as assigned_count,
    coalesce((select sum(amount) from credit_transactions ct
              where ct.talent_id = w.talent_id
                and ct.transaction_type = 'commission'), 0)::numeric as commission_earned
  from workforce_members w
  left join talents t on t.id = w.talent_id
  where public.has_role(auth.uid(), 'admin'::app_role)
  order by w.created_at desc;
$$;

grant execute on function public.get_workforce_dashboard() to authenticated;