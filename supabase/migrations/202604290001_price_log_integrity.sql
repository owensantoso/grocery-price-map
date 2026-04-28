create or replace function public.validate_price_log_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_normalized_price numeric(10, 2);
  expected_price_tax_excluded numeric(10, 2);
  item_basis_amount numeric(10, 2);
  item_unit public.measurement_unit;
  request_user_id uuid;
begin
  request_user_id := auth.uid();

  if request_user_id is null then
    raise exception 'price log writes require an authenticated user';
  end if;

  if new.submitted_by <> request_user_id then
    raise exception 'price log submitted_by must match the authenticated user';
  end if;

  if tg_op = 'UPDATE' and new.submitted_by <> old.submitted_by then
    raise exception 'price log ownership cannot be changed';
  end if;

  select comparison_basis_amount, comparison_unit
    into item_basis_amount, item_unit
  from public.items
  where id = new.item_id;

  if item_unit is null then
    raise exception 'price log item must exist';
  end if;

  if new.package_unit <> item_unit then
    raise exception 'price log package_unit must match the item comparison_unit';
  end if;

  expected_normalized_price := round(
    ((new.total_price_yen / new.package_amount) * item_basis_amount)::numeric,
    2
  );

  if new.normalized_price_yen <> expected_normalized_price then
    raise exception 'price log normalized_price_yen must match item pricing inputs';
  end if;

  expected_price_tax_excluded := round((new.total_price_yen / 1.08)::numeric, 0);

  if new.price_tax_excluded_yen <> expected_price_tax_excluded then
    raise exception 'price log price_tax_excluded_yen must match the app tax rule';
  end if;

  if new.photo_path is not null and split_part(new.photo_path, '/', 1) <> new.submitted_by::text then
    raise exception 'price log photo_path must stay inside the submitter storage folder';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_price_log_integrity on public.price_logs;
create trigger validate_price_log_integrity
  before insert or update on public.price_logs
  for each row execute function public.validate_price_log_integrity();
