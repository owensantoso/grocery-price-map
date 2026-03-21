do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'store_kind'
  ) then
    create type public.store_kind as enum ('physical', 'online');
  end if;
end $$;

alter table public.stores
  add column if not exists store_kind public.store_kind not null default 'physical',
  add column if not exists store_url text;

update public.stores
set store_url = coalesce(
  store_url,
  'https://www.google.com/maps/search/?api=1&query=' || latitude || ',' || longitude
);

alter table public.stores
  alter column store_url set not null,
  alter column latitude drop not null,
  alter column longitude drop not null;

create unique index if not exists stores_store_url_idx on public.stores (store_url);

alter table public.stores
  drop constraint if exists stores_physical_location_check;

alter table public.stores
  add constraint stores_physical_location_check
    check (
      store_kind = 'online'
      or (latitude is not null and longitude is not null)
    );

alter table public.price_logs
  add column if not exists price_tax_excluded_yen numeric(10, 2),
  add column if not exists listing_url text;

update public.price_logs
set price_tax_excluded_yen = round((total_price_yen / 1.1)::numeric, 2)
where price_tax_excluded_yen is null;

alter table public.price_logs
  alter column price_tax_excluded_yen set not null;
