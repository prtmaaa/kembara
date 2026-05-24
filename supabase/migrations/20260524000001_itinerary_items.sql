create table itinerary_items (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  date date not null,
  time text,
  title text not null,
  notes text,
  type text not null default 'activity' check (type in ('transport', 'stay', 'food', 'activity')),
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now()
);

alter table itinerary_items enable row level security;

create policy "Trip members can view itinerary" on itinerary_items for select
  using (trip_id in (select get_my_trip_ids()));
create policy "Trip members can add itinerary items" on itinerary_items for insert
  with check (trip_id in (select get_my_trip_ids()) and auth.uid() = created_by);
create policy "Item creator can update itinerary item" on itinerary_items for update
  using (created_by = auth.uid());
create policy "Item creator can delete itinerary item" on itinerary_items for delete
  using (created_by = auth.uid());
