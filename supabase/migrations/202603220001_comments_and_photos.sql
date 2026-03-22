alter table public.price_logs
  add column if not exists photo_path text;

create table if not exists public.price_log_comments (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.price_logs (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists price_log_comments_log_created_idx
  on public.price_log_comments (log_id, created_at desc);

create table if not exists public.price_log_comment_votes (
  comment_id uuid not null references public.price_log_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (comment_id, user_id)
);

create index if not exists price_log_comment_votes_comment_idx
  on public.price_log_comment_votes (comment_id);

alter table public.price_log_comments enable row level security;
alter table public.price_log_comment_votes enable row level security;

create policy "users can view price log comments"
  on public.price_log_comments
  for select
  to authenticated
  using (true);

create policy "users can add their own price log comments"
  on public.price_log_comments
  for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "users can view price log comment votes"
  on public.price_log_comment_votes
  for select
  to authenticated
  using (true);

create policy "users can add their own price log comment votes"
  on public.price_log_comment_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own price log comment votes"
  on public.price_log_comment_votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own price log comment votes"
  on public.price_log_comment_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'price-log-photos',
  'price-log-photos',
  true,
  1048576,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "public can view price log photos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'price-log-photos');

create policy "authenticated users can upload their own price log photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'price-log-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "authenticated users can update their own price log photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'price-log-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'price-log-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "authenticated users can delete their own price log photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'price-log-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
