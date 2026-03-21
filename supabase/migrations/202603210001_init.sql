create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'measurement_unit'
  ) then
    create type public.measurement_unit as enum ('count', 'piece', 'g', 'kg', 'ml', 'l');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  chain_name text,
  address_text text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  comparison_unit public.measurement_unit not null,
  comparison_basis_amount numeric(10, 2) not null check (comparison_basis_amount > 0),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.price_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  submitted_by uuid not null references public.profiles (id) on delete restrict,
  package_amount numeric(10, 2) not null check (package_amount > 0),
  package_unit public.measurement_unit not null,
  total_price_yen numeric(10, 2) not null check (total_price_yen > 0),
  normalized_price_yen numeric(10, 2) not null check (normalized_price_yen > 0),
  observed_at date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists price_logs_item_store_observed_idx
  on public.price_logs (item_id, store_id, observed_at desc, created_at desc);

create index if not exists price_logs_item_normalized_idx
  on public.price_logs (item_id, normalized_price_yen asc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.items enable row level security;
alter table public.price_logs enable row level security;

create policy "profiles are readable by authenticated users"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "users can view stores"
  on public.stores
  for select
  to authenticated
  using (true);

create policy "authenticated users can add stores"
  on public.stores
  for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "users can view items"
  on public.items
  for select
  to authenticated
  using (true);

create policy "authenticated users can add items"
  on public.items
  for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "users can view price logs"
  on public.price_logs
  for select
  to authenticated
  using (true);

create policy "authenticated users can add price logs"
  on public.price_logs
  for insert
  to authenticated
  with check (auth.uid() = submitted_by);

create policy "users can update only their own price logs"
  on public.price_logs
  for update
  to authenticated
  using (auth.uid() = submitted_by)
  with check (auth.uid() = submitted_by);
