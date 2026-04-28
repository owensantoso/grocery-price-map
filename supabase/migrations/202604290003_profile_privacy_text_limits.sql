drop policy if exists "profiles are readable by authenticated users"
  on public.profiles;

drop policy if exists "users can read their own profile"
  on public.profiles;

create policy "users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create or replace view public.public_profiles
with (security_invoker = false)
as
select
  id,
  coalesce(
    nullif(trim(public_name), ''),
    'shopper-' || left(replace(id::text, '-', ''), 6)
  ) as public_name
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'price_log_comments_body_max_length'
      and conrelid = 'public.price_log_comments'::regclass
  ) then
    alter table public.price_log_comments
      add constraint price_log_comments_body_max_length
      check (char_length(body) <= 1000)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'stores_notes_max_length'
      and conrelid = 'public.stores'::regclass
  ) then
    alter table public.stores
      add constraint stores_notes_max_length
      check (notes is null or char_length(notes) <= 2000)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'price_logs_notes_max_length'
      and conrelid = 'public.price_logs'::regclass
  ) then
    alter table public.price_logs
      add constraint price_logs_notes_max_length
      check (notes is null or char_length(notes) <= 2000)
      not valid;
  end if;
end $$;
