-- Profile card themes (Doodle-style backgrounds)
create table public.profile_card_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  media_type text not null check (media_type in ('image','gif','video','lottie','gradient')),
  media_url text,
  poster_url text,
  gradient_css text,
  overlay_opacity numeric not null default 0.55,
  text_color text not null default 'auto' check (text_color in ('auto','light','dark')),
  start_at timestamptz,
  end_at timestamptz,
  priority int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_card_themes enable row level security;

create policy "Anyone can view active in-window themes"
on public.profile_card_themes for select
using (
  is_active
  and (start_at is null or start_at <= now())
  and (end_at is null or end_at >= now())
);

create policy "Admins manage profile card themes"
on public.profile_card_themes for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create trigger profile_card_themes_updated_at
before update on public.profile_card_themes
for each row execute function public.update_updated_at_column();

-- Lifetime credit volume view
create or replace view public.talent_lifetime_credits
with (security_invoker = true) as
select
  talent_id,
  coalesce(sum(abs(amount)), 0)::numeric as lifetime_volume,
  coalesce(sum(case when amount > 0 then amount else 0 end), 0)::numeric as lifetime_earned,
  coalesce(sum(case when amount < 0 then -amount else 0 end), 0)::numeric as lifetime_spent,
  count(*)::int as transaction_count
from public.credit_transactions
group by talent_id;

grant select on public.talent_lifetime_credits to authenticated;