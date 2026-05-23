-- MVP additions migration
-- Add budget to trips
alter table trips add column if not exists budget numeric;

-- Add service charge and tax to expenses
alter table expenses add column if not exists service_charge_pct numeric not null default 0;
alter table expenses add column if not exists tax_pct numeric not null default 0;

-- Add granular permissions to trip_members
alter table trip_members add column if not exists permissions jsonb not null default '{
  "add_expense": true,
  "edit_expense": true,
  "delete_expense": true,
  "invite_member": true
}'::jsonb;

-- Trip invite tokens
create table if not exists trip_invites (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  token text not null unique,
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- RLS for trip_invites
alter table trip_invites enable row level security;

create policy "Trip members can view invites" on trip_invites for select
  using (trip_id in (select get_my_trip_ids()));

create policy "Trip members can create invites" on trip_invites for insert
  with check (trip_id in (select get_my_trip_ids()) and auth.uid() = created_by);

create policy "Trip members can delete invites" on trip_invites for delete
  using (trip_id in (select get_my_trip_ids()));
