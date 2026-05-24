-- Allow trip owner to delete their own trip
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'trips' and policyname = 'Trip owner can delete trip') then
    create policy "Trip owner can delete trip" on trips for delete
      using (created_by = auth.uid());
  end if;
end $$;
