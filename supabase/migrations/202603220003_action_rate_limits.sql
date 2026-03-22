create table if not exists public.action_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (char_length(trim(action)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists action_events_user_action_created_idx
  on public.action_events (user_id, action, created_at desc);

alter table public.action_events enable row level security;

create policy "users can view their own action events"
  on public.action_events
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can add their own action events"
  on public.action_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);
