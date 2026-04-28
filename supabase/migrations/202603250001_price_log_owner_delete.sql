do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'price_logs'
      and policyname = 'users can delete only their own price logs'
  ) then
    create policy "users can delete only their own price logs"
      on public.price_logs
      for delete
      to authenticated
      using (auth.uid() = submitted_by);
  end if;
end $$;
