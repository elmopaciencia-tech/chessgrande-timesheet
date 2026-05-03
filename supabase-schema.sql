-- Supabase schema for Chess payroll app
-- Safe to paste into the Supabase SQL editor.
-- This script creates:
--   1) profiles
--   2) payroll_submissions
--   3) payroll_entries
-- plus Row Level Security (RLS) policies.

begin;

-- -------------------------------------------------------------------
-- 0) Helpers
-- -------------------------------------------------------------------
-- gen_random_uuid() is used for primary keys.
create extension if not exists pgcrypto;

-- -------------------------------------------------------------------
-- 1) Profiles table
-- -------------------------------------------------------------------
-- Stores app-level user metadata and role.
-- id mirrors auth.users.id.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  username text,
  phone_number text,
  bank_account_number text,
  bank_name text,
  account_type text,
  role text not null default 'employee' check (role in ('employee', 'manager')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Application profile and role for each authenticated user.';
comment on column public.profiles.role is 'Allowed values: employee, manager.';
comment on column public.profiles.username is 'Optional profile username.';
comment on column public.profiles.phone_number is 'Optional profile phone number.';
comment on column public.profiles.bank_account_number is 'Optional bank account number used for payroll.';
comment on column public.profiles.bank_name is 'Optional bank name for payroll.';
comment on column public.profiles.account_type is 'Optional account type (e.g. savings/current).';

-- For existing projects, safely add profile customization columns if missing.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists bank_account_number text;
alter table public.profiles add column if not exists bank_name text;
alter table public.profiles add column if not exists account_type text;

-- -------------------------------------------------------------------
-- 2) Payroll submissions table
-- -------------------------------------------------------------------
-- One row per employee per submitted month snapshot.
create table if not exists public.payroll_submissions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  employee_name text not null,
  bank_name text,
  account_type text,
  bank_account text not null,
  month text not null,           -- format: YYYY-MM
  month_label text not null,     -- e.g. "May 2026"
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0),
  total_hours numeric(10,2) not null check (total_hours >= 0),
  total_pay numeric(12,2) not null check (total_pay >= 0),
  submitted_at timestamptz not null default now()
);

comment on table public.payroll_submissions is 'Submitted monthly payroll snapshots by employees.';

create index if not exists payroll_submissions_employee_id_idx
  on public.payroll_submissions (employee_id);
create index if not exists payroll_submissions_month_idx
  on public.payroll_submissions (month);
create index if not exists payroll_submissions_submitted_at_idx
  on public.payroll_submissions (submitted_at desc);

-- For existing projects, safely add newly-added submission fields if missing.
alter table public.payroll_submissions add column if not exists bank_name text;
alter table public.payroll_submissions add column if not exists account_type text;

-- -------------------------------------------------------------------
-- 3) Payroll entries table
-- -------------------------------------------------------------------
-- Detailed line items linked to a submission snapshot.
create table if not exists public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.payroll_submissions(id) on delete cascade,
  school_name text not null,
  date date not null,
  type text not null,
  start_time time,
  end_time time,
  hours numeric(10,2) not null default 0 check (hours >= 0),
  replacement_name text,
  custom_rate numeric(10,2) check (custom_rate is null or custom_rate >= 0),
  claim_notes text,
  claim_image_url text
);

comment on table public.payroll_entries is 'Per-entry details for each submitted payroll.';
comment on column public.payroll_entries.claim_image_url is 'Optional URL in Supabase Storage for claim proof image.';

create index if not exists payroll_entries_submission_id_idx
  on public.payroll_entries (submission_id);
create index if not exists payroll_entries_date_idx
  on public.payroll_entries (date);

-- -------------------------------------------------------------------
-- 4) Enable RLS
-- -------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.payroll_submissions enable row level security;
alter table public.payroll_entries enable row level security;

-- -------------------------------------------------------------------
-- 5) Profiles RLS policies
-- -------------------------------------------------------------------
-- Employees can read their own profile.
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Managers can read all profiles.
create policy "profiles_select_manager_all"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  )
);

-- Employees can create their own profile as employee.
-- This prevents self-assigning manager at insert time.
create policy "profiles_insert_self_employee"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'employee'
);

-- Employees can update their own row only while role remains employee.
-- This allows full_name edits but blocks promoting self to manager.
create policy "profiles_update_own_employee_only"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = 'employee'
);

-- Managers can also update only their own profile row while remaining manager.
create policy "profiles_update_own_manager_only"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = 'manager'
);

-- -------------------------------------------------------------------
-- 6) Payroll submissions RLS policies
-- -------------------------------------------------------------------
-- Employees can insert their own submissions.
create policy "submissions_insert_own"
on public.payroll_submissions
for insert
to authenticated
with check (employee_id = auth.uid());

-- Employees can read their own submissions.
create policy "submissions_select_own"
on public.payroll_submissions
for select
to authenticated
using (employee_id = auth.uid());

-- Managers can read all submissions.
create policy "submissions_select_manager_all"
on public.payroll_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  )
);

-- Managers can delete any submission.
create policy "submissions_delete_manager_all"
on public.payroll_submissions
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  )
);

-- -------------------------------------------------------------------
-- 7) Payroll entries RLS policies
-- -------------------------------------------------------------------
-- Employees can insert entries only into their own submissions.
create policy "entries_insert_for_own_submission"
on public.payroll_entries
for insert
to authenticated
with check (
  exists (
    select 1
    from public.payroll_submissions s
    where s.id = submission_id
      and s.employee_id = auth.uid()
  )
);

-- Employees can read entries only from their own submissions.
create policy "entries_select_for_own_submission"
on public.payroll_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.payroll_submissions s
    where s.id = submission_id
      and s.employee_id = auth.uid()
  )
);

-- Managers can read all entries.
create policy "entries_select_manager_all"
on public.payroll_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  )
);

-- Managers can delete any entry.
create policy "entries_delete_manager_all"
on public.payroll_entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  )
);

commit;

-- -------------------------------------------------------------------
-- Notes:
-- 1) Promote managers by running a trusted SQL update in Supabase:
--      update public.profiles set role = 'manager' where id = '<user-uuid>';
-- 2) Keep using the anon key in browser code; never expose service_role key.
-- -------------------------------------------------------------------
