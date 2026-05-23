-- Run this in the Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table trips (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  destination text not null,
  base_currency text not null default 'IDR',
  start_date date,
  end_date date,
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now()
);

create table trip_members (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique (trip_id, user_id)
);

create table expenses (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  paid_by uuid references profiles(id) not null,
  title text not null,
  amount numeric not null,
  currency text not null,
  amount_in_base numeric not null,
  exchange_rate numeric not null default 1,
  category text not null default 'other' check (category in ('food', 'transport', 'accommodation', 'activity', 'shopping', 'other')),
  date date not null default current_date,
  created_at timestamptz default now()
);

create table expense_participants (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  share_amount numeric not null,
  unique (expense_id, user_id)
);

create table settlements (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  from_user_id uuid references profiles(id) not null,
  to_user_id uuid references profiles(id) not null,
  amount numeric not null,
  currency text not null,
  settled_at timestamptz default now()
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- HELPER FUNCTION (security definer — bypasses RLS to avoid
-- infinite recursion in trip_members self-referential policies)
-- ============================================================

create or replace function get_my_trip_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select trip_id from trip_members where user_id = auth.uid()
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table expenses enable row level security;
alter table expense_participants enable row level security;
alter table settlements enable row level security;

-- profiles
create policy "Anyone can view profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- trips
create policy "Trip members can view trip" on trips for select
  using (id in (select get_my_trip_ids()));
create policy "Authenticated users can create trips" on trips for insert
  with check (auth.uid() = created_by);
create policy "Trip owner can update trip" on trips for update
  using (created_by = auth.uid());

-- trip_members (uses helper function to avoid self-referential recursion)
create policy "Trip members can view members" on trip_members for select
  using (trip_id in (select get_my_trip_ids()));
create policy "Users can join a trip" on trip_members for insert
  with check (auth.uid() = user_id);
create policy "Trip owner can manage members" on trip_members for delete
  using (trip_id in (select get_my_trip_ids()) and exists (
    select 1 from trips where id = trip_id and created_by = auth.uid()
  ));

-- expenses
create policy "Trip members can view expenses" on expenses for select
  using (trip_id in (select get_my_trip_ids()));
create policy "Trip members can add expenses" on expenses for insert
  with check (trip_id in (select get_my_trip_ids()) and auth.uid() = paid_by);
create policy "Expense payer can update" on expenses for update
  using (paid_by = auth.uid());

-- expense_participants
create policy "Trip members can view participants" on expense_participants for select
  using (expense_id in (
    select id from expenses where trip_id in (select get_my_trip_ids())
  ));
create policy "Trip members can insert participants" on expense_participants for insert
  with check (expense_id in (
    select id from expenses where trip_id in (select get_my_trip_ids())
  ));

-- settlements
create policy "Trip members can view settlements" on settlements for select
  using (trip_id in (select get_my_trip_ids()));
create policy "Trip members can add settlements" on settlements for insert
  with check (trip_id in (select get_my_trip_ids()));

-- ============================================================
-- MIGRATION — MVP additions
-- Run in Supabase SQL Editor after initial schema
-- ============================================================

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
