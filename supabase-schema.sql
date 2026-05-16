-- Supabase schema for Chess payroll app
-- Safe to paste into the Supabase SQL editor.
-- This script creates:
--   1) profiles
--   2) payroll_submissions
--   3) payroll_entries
--   4) draft_timesheet_entries
-- plus Row Level Security (RLS) policies.

begin;

-- -------------------------------------------------------------------
-- 0) Helpers
-- -------------------------------------------------------------------
-- gen_random_uuid() is used for primary keys.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
  avatar_r2_key text,
  role text not null default 'employee' check (role in ('employee', 'manager', 'webadmin')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Application profile and role for each authenticated user.';
comment on column public.profiles.role is 'Allowed values: employee, manager, webadmin.';
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
alter table public.profiles add column if not exists avatar_r2_key text;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.has_app_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = any(required_roles), false)
$$;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.has_app_role(text[]) to authenticated;

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
-- 4) Draft timesheet entries table
-- -------------------------------------------------------------------
-- Editable working rows. Submitted payroll copies these rows into
-- payroll_submissions/payroll_entries and then locks the source drafts.
create table if not exists public.draft_timesheet_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  submission_id uuid references public.payroll_submissions(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'submitted')),
  school_name text not null default '',
  date date not null,
  type text not null check (type in ('School Coaching', 'Replacement', 'Claim', 'Camp', 'Private', 'Event', 'schoolCoaching', 'replacement', 'claim')),
  start_time text,
  end_time text,
  start_time_minutes integer not null default 0,
  hours numeric(10,2) not null default 0 check (hours >= 0),
  replacement_name text,
  custom_rate numeric(10,2) check (custom_rate is null or custom_rate >= 0),
  notes text,
  repeats_weekly boolean not null default false,
  repeat_until date,
  claim_notes text,
  claim_cost numeric(10,2) check (claim_cost is null or claim_cost >= 0),
  claim_amount_cents integer not null default 0 check (claim_amount_cents >= 0),
  claim_proof_name text,
  claim_image_path text,
  claim_proof_data_url text,
  claim_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.draft_timesheet_entries is 'Editable cross-device payroll draft entries before monthly submission.';
comment on column public.draft_timesheet_entries.status is 'active rows can be edited; submitted rows are locked source drafts linked to a payroll snapshot.';

alter table public.draft_timesheet_entries add column if not exists start_time text;
alter table public.draft_timesheet_entries add column if not exists end_time text;
alter table public.draft_timesheet_entries add column if not exists start_time_minutes integer not null default 0;
alter table public.draft_timesheet_entries add column if not exists custom_rate numeric(10,2) check (custom_rate is null or custom_rate >= 0);
alter table public.draft_timesheet_entries add column if not exists notes text;
alter table public.draft_timesheet_entries add column if not exists repeats_weekly boolean not null default false;
alter table public.draft_timesheet_entries add column if not exists repeat_until date;
alter table public.draft_timesheet_entries add column if not exists claim_notes text;
alter table public.draft_timesheet_entries add column if not exists claim_cost numeric(10,2) check (claim_cost is null or claim_cost >= 0);
alter table public.draft_timesheet_entries add column if not exists claim_amount_cents integer not null default 0 check (claim_amount_cents >= 0);
alter table public.draft_timesheet_entries add column if not exists claim_proof_name text;
alter table public.draft_timesheet_entries add column if not exists claim_image_path text;
alter table public.draft_timesheet_entries add column if not exists claim_proof_data_url text;
alter table public.draft_timesheet_entries add column if not exists claim_image_url text;

alter table public.draft_timesheet_entries drop constraint if exists draft_timesheet_entries_type_check;
alter table public.draft_timesheet_entries
add constraint draft_timesheet_entries_type_check
check (type in ('School Coaching', 'Replacement', 'Claim', 'Camp', 'Private', 'Event', 'schoolCoaching', 'replacement', 'claim'));

create index if not exists draft_timesheet_entries_employee_status_date_idx
  on public.draft_timesheet_entries (employee_id, status, date);
create index if not exists draft_timesheet_entries_employee_date_idx
  on public.draft_timesheet_entries (employee_id, date);
create index if not exists draft_timesheet_entries_submission_id_idx
  on public.draft_timesheet_entries (submission_id);

drop trigger if exists draft_timesheet_entries_set_updated_at on public.draft_timesheet_entries;
create trigger draft_timesheet_entries_set_updated_at
before update on public.draft_timesheet_entries
for each row
execute function public.set_updated_at();

-- -------------------------------------------------------------------
-- 5) Enable RLS
-- -------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.payroll_submissions enable row level security;
alter table public.payroll_entries enable row level security;
alter table public.draft_timesheet_entries enable row level security;

-- -------------------------------------------------------------------
-- 6) Profiles RLS policies
-- -------------------------------------------------------------------
-- Employees can read their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Managers and webadmins can read all profiles.
drop policy if exists "profiles_select_admin_all" on public.profiles;
drop policy if exists "profiles_select_manager_all" on public.profiles;
create policy "profiles_select_admin_all"
on public.profiles
for select
to authenticated
using (public.has_app_role(array['manager', 'webadmin']));

-- Employees can create their own profile as employee.
-- This prevents self-assigning manager at insert time.
drop policy if exists "profiles_insert_self_employee" on public.profiles;
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
drop policy if exists "profiles_update_own_employee_only" on public.profiles;
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
drop policy if exists "profiles_update_own_manager_only" on public.profiles;
create policy "profiles_update_own_manager_only"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = 'manager'
);

-- Webadmins can update any profile row.
drop policy if exists "profiles_update_webadmin_all" on public.profiles;
create policy "profiles_update_webadmin_all"
on public.profiles
for update
to authenticated
using (public.has_app_role(array['webadmin']))
with check (public.has_app_role(array['webadmin']));

-- -------------------------------------------------------------------
-- 7) Payroll submissions RLS policies
-- -------------------------------------------------------------------
-- Employees can insert their own submissions.
drop policy if exists "submissions_insert_own" on public.payroll_submissions;
create policy "submissions_insert_own"
on public.payroll_submissions
for insert
to authenticated
with check (employee_id = auth.uid());

-- Employees can read their own submissions.
drop policy if exists "submissions_select_own" on public.payroll_submissions;
create policy "submissions_select_own"
on public.payroll_submissions
for select
to authenticated
using (employee_id = auth.uid());

-- Managers and webadmins can read all submissions.
drop policy if exists "submissions_select_admin_all" on public.payroll_submissions;
drop policy if exists "submissions_select_manager_all" on public.payroll_submissions;
create policy "submissions_select_admin_all"
on public.payroll_submissions
for select
to authenticated
using (public.has_app_role(array['manager', 'webadmin']));

-- Managers and webadmins can delete any submission.
drop policy if exists "submissions_delete_admin_all" on public.payroll_submissions;
drop policy if exists "submissions_delete_manager_all" on public.payroll_submissions;
create policy "submissions_delete_admin_all"
on public.payroll_submissions
for delete
to authenticated
using (public.has_app_role(array['manager', 'webadmin']));

-- -------------------------------------------------------------------
-- 8) Payroll entries RLS policies
-- -------------------------------------------------------------------
-- Employees can insert entries only into their own submissions.
drop policy if exists "entries_insert_for_own_submission" on public.payroll_entries;
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
drop policy if exists "entries_select_for_own_submission" on public.payroll_entries;
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

-- Managers and webadmins can read all entries.
drop policy if exists "entries_select_admin_all" on public.payroll_entries;
drop policy if exists "entries_select_manager_all" on public.payroll_entries;
create policy "entries_select_admin_all"
on public.payroll_entries
for select
to authenticated
using (public.has_app_role(array['manager', 'webadmin']));

-- Managers and webadmins can delete any entry.
drop policy if exists "entries_delete_manager_all" on public.payroll_entries;
create policy "entries_delete_manager_all"
on public.payroll_entries
for delete
to authenticated
using (public.has_app_role(array['manager', 'webadmin']));

-- -------------------------------------------------------------------
-- 9) Draft timesheet entries RLS policies
-- -------------------------------------------------------------------
drop policy if exists "draft_entries_select_own" on public.draft_timesheet_entries;
create policy "draft_entries_select_own"
on public.draft_timesheet_entries
for select
to authenticated
using (employee_id = auth.uid());

drop policy if exists "draft_entries_select_admin_all" on public.draft_timesheet_entries;
create policy "draft_entries_select_admin_all"
on public.draft_timesheet_entries
for select
to authenticated
using (public.has_app_role(array['manager', 'webadmin']));

drop policy if exists "draft_entries_insert_own_active" on public.draft_timesheet_entries;
create policy "draft_entries_insert_own_active"
on public.draft_timesheet_entries
for insert
to authenticated
with check (
  employee_id = auth.uid()
  and coalesce(created_by, auth.uid()) = auth.uid()
  and coalesce(updated_by, auth.uid()) = auth.uid()
  and status = 'active'
);

drop policy if exists "draft_entries_update_own_active" on public.draft_timesheet_entries;
create policy "draft_entries_update_own_active"
on public.draft_timesheet_entries
for update
to authenticated
using (
  employee_id = auth.uid()
  and status = 'active'
)
with check (
  employee_id = auth.uid()
  and coalesce(updated_by, auth.uid()) = auth.uid()
  and status in ('active', 'submitted')
);

drop policy if exists "draft_entries_delete_own_active" on public.draft_timesheet_entries;
create policy "draft_entries_delete_own_active"
on public.draft_timesheet_entries
for delete
to authenticated
using (
  employee_id = auth.uid()
  and status = 'active'
);

drop policy if exists "draft_entries_insert_admin_lessons" on public.draft_timesheet_entries;
create policy "draft_entries_insert_admin_lessons"
on public.draft_timesheet_entries
for insert
to authenticated
with check (
  status = 'active'
  and type in ('School Coaching', 'Replacement', 'schoolCoaching', 'replacement')
  and coalesce(created_by, auth.uid()) = auth.uid()
  and coalesce(updated_by, auth.uid()) = auth.uid()
  and public.has_app_role(array['manager', 'webadmin'])
);

drop policy if exists "draft_entries_update_admin_lessons" on public.draft_timesheet_entries;
create policy "draft_entries_update_admin_lessons"
on public.draft_timesheet_entries
for update
to authenticated
using (
  status = 'active'
  and type in ('School Coaching', 'Replacement', 'schoolCoaching', 'replacement')
  and public.has_app_role(array['manager', 'webadmin'])
)
with check (
  status = 'active'
  and type in ('School Coaching', 'Replacement', 'schoolCoaching', 'replacement')
  and coalesce(updated_by, auth.uid()) = auth.uid()
  and public.has_app_role(array['manager', 'webadmin'])
);

drop policy if exists "draft_entries_delete_admin_lessons" on public.draft_timesheet_entries;
create policy "draft_entries_delete_admin_lessons"
on public.draft_timesheet_entries
for delete
to authenticated
using (
  status = 'active'
  and type in ('School Coaching', 'Replacement', 'schoolCoaching', 'replacement')
  and public.has_app_role(array['manager', 'webadmin'])
);

commit;

-- -------------------------------------------------------------------
-- Notes:
-- 1) Promote managers by running a trusted SQL update in Supabase:
--      update public.profiles set role = 'manager' where id = '<user-uuid>';
-- 2) Keep using the anon key in browser code; never expose service_role key.
-- -------------------------------------------------------------------
