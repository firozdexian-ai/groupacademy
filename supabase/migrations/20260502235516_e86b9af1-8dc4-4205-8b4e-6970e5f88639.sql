
create table if not exists public.admin_chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_key text not null,
  title text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, agent_key)
);

create table if not exists public.admin_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.admin_chat_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_chat_messages_thread on public.admin_chat_messages(thread_id, created_at);
create index if not exists idx_admin_chat_threads_user on public.admin_chat_threads(user_id, last_message_at desc);

alter table public.admin_chat_threads enable row level security;
alter table public.admin_chat_messages enable row level security;

create policy "own threads select" on public.admin_chat_threads
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'super_admin'));
create policy "own threads insert" on public.admin_chat_threads
  for insert with check (auth.uid() = user_id);
create policy "own threads update" on public.admin_chat_threads
  for update using (auth.uid() = user_id);
create policy "own threads delete" on public.admin_chat_threads
  for delete using (auth.uid() = user_id);

create policy "own messages select" on public.admin_chat_messages
  for select using (
    exists (select 1 from public.admin_chat_threads t
            where t.id = thread_id and (t.user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin')))
  );
create policy "own messages insert" on public.admin_chat_messages
  for insert with check (
    exists (select 1 from public.admin_chat_threads t
            where t.id = thread_id and t.user_id = auth.uid())
  );
create policy "own messages delete" on public.admin_chat_messages
  for delete using (
    exists (select 1 from public.admin_chat_threads t
            where t.id = thread_id and t.user_id = auth.uid())
  );

create or replace function public.touch_admin_chat_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admin_chat_threads
    set last_message_at = now()
    where id = new.thread_id;
  return new;
end $$;

drop trigger if exists trg_touch_admin_chat_thread on public.admin_chat_messages;
create trigger trg_touch_admin_chat_thread
  after insert on public.admin_chat_messages
  for each row execute function public.touch_admin_chat_thread();
