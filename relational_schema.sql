-- Execute this script in Supabase SQL Editor.
-- It replaces the previous incompatible schema with one row per application entity.

-- Remove the legacy JSON that was stored in Auth metadata and caused oversized headers.
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'app_state'
where raw_user_meta_data ? 'app_state';

drop table if exists audit_logs cascade;
drop table if exists notifications cascade;
drop table if exists transactions cascade;
drop table if exists budgets cascade;
drop table if exists goals cascade;
drop table if exists family_members cascade;
drop table if exists categories cascade;
drop table if exists settings cascade;

create table if not exists categories (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  type text not null,
  is_default boolean not null default false
);

create table if not exists transactions (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric(12,2) not null,
  category_id text not null,
  description text not null,
  date timestamptz not null,
  member_id text not null,
  recurrence text not null default 'none',
  notes text,
  parent_transaction_id text,
  is_recurring_generated boolean not null default false,
  status text not null default 'approved',
  approval_requested_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists budgets (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null,
  amount numeric(12,2) not null,
  month integer not null,
  year integer not null,
  unique(owner_id, category_id, month, year)
);

create table if not exists goals (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  deadline text,
  icon text not null,
  color text not null,
  created_at timestamptz not null,
  completed_at timestamptz
);

create table if not exists family_members (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar text not null,
  role text not null,
  created_at timestamptz not null
);

create table if not exists notifications (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null
);

create table if not exists audit_logs (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text,
  title text not null,
  message text not null,
  actor_id text not null,
  actor_name text not null,
  actor_role text not null,
  created_at timestamptz not null
);

create table if not exists settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'BRL',
  locale text not null default 'pt-BR',
  theme text not null default 'light',
  active_member_id text not null,
  dashboard_widgets jsonb not null default '[]'::jsonb,
  home_dashboard_preset text not null default 'inicio',
  onboarding_completed boolean not null default false
);

alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;
alter table family_members enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['categories','transactions','budgets','goals','family_members','notifications','audit_logs','settings'] loop
    execute format('drop policy if exists "Users manage own %s" on %I', table_name, table_name);
    execute format('create policy "Users manage own %s" on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', table_name, table_name);
  end loop;
end $$;

create index if not exists transactions_owner_date on transactions(owner_id, date desc);
create index if not exists transactions_owner_category on transactions(owner_id, category_id);
