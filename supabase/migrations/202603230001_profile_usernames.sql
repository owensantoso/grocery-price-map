create or replace function public.slugify_username(raw text)
returns text
language sql
immutable
as $$
  select nullif(trim(both '-' from regexp_replace(lower(coalesce(raw, '')), '[^a-z0-9]+', '-', 'g')), '');
$$;

create or replace function public.generated_username(user_id uuid, source text default null)
returns text
language sql
immutable
as $$
  select coalesce(public.slugify_username(source), 'shopper') || '-' || left(replace(user_id::text, '-', ''), 6);
$$;

update public.profiles
set public_name = public.generated_username(
  id,
  coalesce(
    nullif(public_name, ''),
    nullif(display_name, ''),
    nullif(split_part(email, '@', 1), '')
  )
);

create unique index if not exists profiles_public_name_unique
  on public.profiles (lower(public_name));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  seeded_name text;
begin
  seeded_name := public.generated_username(
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'preferred_username',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );

  insert into public.profiles (id, display_name, email, public_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    seeded_name
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
    'shopper-' || left(replace(id::text, '-', ''), 6)
  ) as public_name
from public.profiles;

grant select on public.public_profiles to anon, authenticated;
