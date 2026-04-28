create or replace function public.validate_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if auth.uid() <> new.id then
    raise exception 'profile updates require the matching authenticated user';
  end if;

  if new.id <> old.id then
    raise exception 'profile id cannot be changed';
  end if;

  if new.email is distinct from old.email then
    raise exception 'profile email cannot be changed by self-update';
  end if;

  if new.display_name is distinct from old.display_name then
    raise exception 'profile display_name cannot be changed by self-update';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'profile created_at cannot be changed by self-update';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_profile_self_update on public.profiles;
create trigger validate_profile_self_update
  before update on public.profiles
  for each row execute function public.validate_profile_self_update();

create or replace function public.consume_action_rate_limit(
  action_name text,
  max_events integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  event_count integer;
  request_user_id uuid;
  window_start timestamptz;
begin
  request_user_id := auth.uid();

  if request_user_id is null then
    raise exception 'rate limits require an authenticated user';
  end if;

  if action_name is null or char_length(trim(action_name)) = 0 then
    raise exception 'rate limit action is required';
  end if;

  if max_events <= 0 then
    raise exception 'rate limit max_events must be positive';
  end if;

  if window_seconds <= 0 then
    raise exception 'rate limit window_seconds must be positive';
  end if;

  perform pg_advisory_xact_lock(hashtext(request_user_id::text), hashtext(action_name));

  window_start := timezone('utc', now()) - make_interval(secs => window_seconds);

  select count(*)::integer
    into event_count
  from public.action_events
  where user_id = request_user_id
    and action = action_name
    and created_at >= window_start;

  if event_count >= max_events then
    return false;
  end if;

  insert into public.action_events (user_id, action)
  values (request_user_id, action_name);

  return true;
end;
$$;

grant execute on function public.consume_action_rate_limit(text, integer, integer)
  to authenticated;
