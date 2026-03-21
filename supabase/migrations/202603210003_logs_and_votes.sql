create table if not exists public.price_log_votes (
  log_id uuid not null references public.price_logs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (log_id, user_id)
);

create index if not exists price_log_votes_log_id_idx
  on public.price_log_votes (log_id);

alter table public.price_log_votes enable row level security;

create policy "users can view price log votes"
  on public.price_log_votes
  for select
  to authenticated
  using (true);

create policy "users can add their own price log votes"
  on public.price_log_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own price log votes"
  on public.price_log_votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own price log votes"
  on public.price_log_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);
