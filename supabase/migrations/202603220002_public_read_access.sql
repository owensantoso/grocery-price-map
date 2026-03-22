alter table public.profiles
  add column if not exists public_name text;

update public.profiles
set public_name = coalesce(
  nullif(trim(public_name), ''),
  nullif(trim(display_name), ''),
  nullif(split_part(email, '@', 1), '')
)
where public_name is null
   or trim(public_name) = '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, public_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        public_name = coalesce(public.profiles.public_name, excluded.public_name);

  return new;
end;
$$;

create or replace view public.public_profiles as
select
  id,
  coalesce(
    nullif(trim(public_name), ''),
    nullif(trim(display_name), ''),
    'user-' || left(replace(id::text, '-', ''), 6)
  ) as public_name
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

create policy "anon can view stores"
  on public.stores
  for select
  to anon
  using (true);

create policy "anon can view items"
  on public.items
  for select
  to anon
  using (true);

create policy "anon can view price logs"
  on public.price_logs
  for select
  to anon
  using (true);

create policy "anon can view price log votes"
  on public.price_log_votes
  for select
  to anon
  using (true);

create policy "anon can view price log comments"
  on public.price_log_comments
  for select
  to anon
  using (true);

create policy "anon can view price log comment votes"
  on public.price_log_comment_votes
  for select
  to anon
  using (true);
