-- Supabase schema for Chess payroll app
-- Safe to paste into the Supabase SQL editor.
-- This script creates:
--   1) profiles
--   2) payroll_submissions
--   3) payroll_entries
--   4) draft_timesheet_entries
--   5) quick_add_templates
--   6) employee_notices / employee_notice_recipients
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
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;
grant execute on function public.set_updated_at() to service_role;

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

create schema if not exists authz;
revoke all on schema authz from public;
revoke all on schema authz from anon;
grant usage on schema authz to authenticated;
grant usage on schema authz to service_role;

create or replace function authz.current_profile_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p.role
  from public.profiles as p
  where p.id = auth.uid()
$$;

create or replace function authz.has_app_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(authz.current_profile_role() = any(required_roles), false)
$$;

revoke all on function authz.current_profile_role() from public;
revoke all on function authz.current_profile_role() from anon;
revoke all on function authz.has_app_role(text[]) from public;
revoke all on function authz.has_app_role(text[]) from anon;
grant execute on function authz.current_profile_role() to authenticated;
grant execute on function authz.current_profile_role() to service_role;
grant execute on function authz.has_app_role(text[]) to authenticated;
grant execute on function authz.has_app_role(text[]) to service_role;

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
  submitted_at timestamptz not null default now(),
  paid_at timestamptz,
  paid_by uuid references public.profiles(id) on delete set null
);

comment on table public.payroll_submissions is 'Submitted monthly payroll snapshots by employees.';

create index if not exists payroll_submissions_employee_id_idx
  on public.payroll_submissions (employee_id);
create index if not exists payroll_submissions_month_idx
  on public.payroll_submissions (month);
create index if not exists payroll_submissions_submitted_at_idx
  on public.payroll_submissions (submitted_at desc);
create index if not exists payroll_submissions_paid_at_idx
  on public.payroll_submissions (paid_at);

-- For existing projects, safely add newly-added submission fields if missing.
alter table public.payroll_submissions add column if not exists bank_name text;
alter table public.payroll_submissions add column if not exists account_type text;
alter table public.payroll_submissions add column if not exists paid_at timestamptz;
alter table public.payroll_submissions add column if not exists paid_by uuid references public.profiles(id) on delete set null;

revoke update on public.payroll_submissions from anon, authenticated;
grant update (paid_at, paid_by) on public.payroll_submissions to authenticated;
grant update (total_hours, total_pay) on public.payroll_submissions to authenticated;

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
  claim_image_url text,
  calendar_color text
);

comment on table public.payroll_entries is 'Per-entry details for each submitted payroll.';
comment on column public.payroll_entries.claim_image_url is 'Optional URL in Supabase Storage for claim proof image.';

create index if not exists payroll_entries_submission_id_idx
  on public.payroll_entries (submission_id);
create index if not exists payroll_entries_date_idx
  on public.payroll_entries (date);

alter table public.payroll_entries add column if not exists calendar_color text;
alter table public.payroll_entries drop constraint if exists payroll_entries_calendar_color_check;
alter table public.payroll_entries
add constraint payroll_entries_calendar_color_check
check (
  calendar_color is null
  or calendar_color in (
    '#FFF689', '#F4D35E', '#FFB88A', '#FF9C5B', '#F67B45', '#FBC2C2',
    '#E39B99', '#CB7876', '#B4CFA4', '#8BA47C', '#62866C', '#A0C5E3',
    '#81B2D9', '#32769B', '#BBA6DD', '#8C7DA8', '#64557B', '#1E2136'
  )
);

grant update (
  school_name,
  date,
  type,
  start_time,
  end_time,
  hours,
  replacement_name,
  custom_rate,
  claim_notes,
  claim_image_url,
  calendar_color
) on public.payroll_entries to authenticated;

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
  calendar_color text,
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
alter table public.draft_timesheet_entries add column if not exists calendar_color text;

alter table public.draft_timesheet_entries drop constraint if exists draft_timesheet_entries_type_check;
alter table public.draft_timesheet_entries
add constraint draft_timesheet_entries_type_check
check (type in ('School Coaching', 'Replacement', 'Claim', 'Camp', 'Private', 'Event', 'schoolCoaching', 'replacement', 'claim'));

alter table public.draft_timesheet_entries drop constraint if exists draft_timesheet_entries_calendar_color_check;
alter table public.draft_timesheet_entries
add constraint draft_timesheet_entries_calendar_color_check
check (
  calendar_color is null
  or calendar_color in (
    '#FFF689', '#F4D35E', '#FFB88A', '#FF9C5B', '#F67B45', '#FBC2C2',
    '#E39B99', '#CB7876', '#B4CFA4', '#8BA47C', '#62866C', '#A0C5E3',
    '#81B2D9', '#32769B', '#BBA6DD', '#8C7DA8', '#64557B', '#1E2136'
  )
);

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
-- 5) Quick-add templates table
-- -------------------------------------------------------------------
-- Employee-owned shortcuts for recurring school coaching sessions.
create table if not exists public.quick_add_templates (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  school_name text not null,
  weekday integer not null check (weekday between 0 and 6),
  start_time text not null,
  hours numeric(10,2) not null check (hours > 0),
  calendar_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.quick_add_templates is 'Employee-owned composer shortcuts for School Coaching draft entries.';
comment on column public.quick_add_templates.weekday is 'JavaScript weekday number: 0 Sunday through 6 Saturday.';

create index if not exists quick_add_templates_employee_weekday_idx
  on public.quick_add_templates (employee_id, weekday, start_time);
create unique index if not exists quick_add_templates_employee_unique_idx
  on public.quick_add_templates (employee_id, lower(btrim(school_name)), weekday, start_time, hours);

alter table public.quick_add_templates add column if not exists calendar_color text;
alter table public.quick_add_templates drop constraint if exists quick_add_templates_calendar_color_check;
alter table public.quick_add_templates
add constraint quick_add_templates_calendar_color_check
check (
  calendar_color is null
  or calendar_color in (
    '#FFF689', '#F4D35E', '#FFB88A', '#FF9C5B', '#F67B45', '#FBC2C2',
    '#E39B99', '#CB7876', '#B4CFA4', '#8BA47C', '#62866C', '#A0C5E3',
    '#81B2D9', '#32769B', '#BBA6DD', '#8C7DA8', '#64557B', '#1E2136'
  )
);

drop trigger if exists quick_add_templates_set_updated_at on public.quick_add_templates;
create trigger quick_add_templates_set_updated_at
before update on public.quick_add_templates
for each row
execute function public.set_updated_at();

revoke all on public.quick_add_templates from anon, authenticated;
grant select, insert, delete on public.quick_add_templates to authenticated;

-- -------------------------------------------------------------------
-- 6) Employee notices tables
-- -------------------------------------------------------------------
-- Read-only in-app notices sent by managers/webadmins to employees.
create table if not exists public.employee_notices (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  notice_type text not null default 'manual' check (notice_type in ('manual', 'payment', 'system')),
  related_submission_id uuid references public.payroll_submissions(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.employee_notices is 'Manager and system notices delivered inside the employee dashboard.';
comment on column public.employee_notices.notice_type is 'Allowed values: manual, payment, system.';

create table if not exists public.employee_notice_recipients (
  notice_id uuid not null references public.employee_notices(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz,
  primary key (notice_id, employee_id)
);

comment on table public.employee_notice_recipients is 'Delivery and read status for employee dashboard notices.';

create index if not exists employee_notices_created_at_idx
  on public.employee_notices (created_at desc);
create index if not exists employee_notices_related_submission_id_idx
  on public.employee_notices (related_submission_id);
create index if not exists employee_notice_recipients_employee_read_idx
  on public.employee_notice_recipients (employee_id, read_at, notice_id);

revoke all on public.employee_notices from anon, authenticated;
revoke all on public.employee_notice_recipients from anon, authenticated;
grant select, insert on public.employee_notices to authenticated;
grant select, insert on public.employee_notice_recipients to authenticated;
grant update (read_at) on public.employee_notice_recipients to authenticated;

-- -------------------------------------------------------------------
-- 7) Enable RLS
-- -------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.payroll_submissions enable row level security;
alter table public.payroll_entries enable row level security;
alter table public.draft_timesheet_entries enable row level security;
alter table public.quick_add_templates enable row level security;
alter table public.employee_notices enable row level security;
alter table public.employee_notice_recipients enable row level security;

-- -------------------------------------------------------------------
-- 8) Profiles RLS policies
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
using (authz.has_app_role(array['manager', 'webadmin']));

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
drop policy if exists "profiles_update_own_any_role" on public.profiles;
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
using (authz.has_app_role(array['webadmin']))
with check (authz.has_app_role(array['webadmin']));

-- -------------------------------------------------------------------
-- 9) Payroll submissions RLS policies
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
using (authz.has_app_role(array['manager', 'webadmin']));

-- Managers and webadmins can delete any submission.
drop policy if exists "submissions_delete_admin_all" on public.payroll_submissions;
drop policy if exists "submissions_delete_manager_all" on public.payroll_submissions;
create policy "submissions_delete_admin_all"
on public.payroll_submissions
for delete
to authenticated
using (authz.has_app_role(array['manager', 'webadmin']));

-- Managers and webadmins can mark a submission as paid.
drop policy if exists "submissions_update_paid_admin_all" on public.payroll_submissions;
drop policy if exists "submissions_update_paid_manager_all" on public.payroll_submissions;
create policy "submissions_update_paid_admin_all"
on public.payroll_submissions
for update
to authenticated
using (authz.has_app_role(array['manager', 'webadmin']))
with check (
  paid_at is not null
  and paid_by = auth.uid()
  and authz.has_app_role(array['manager', 'webadmin'])
);

-- Managers and webadmins can refresh totals after correcting submitted rows.
drop policy if exists "submissions_update_totals_admin_all" on public.payroll_submissions;
drop policy if exists "submissions_update_totals_manager_all" on public.payroll_submissions;
create policy "submissions_update_totals_admin_all"
on public.payroll_submissions
for update
to authenticated
using (authz.has_app_role(array['manager', 'webadmin']))
with check (authz.has_app_role(array['manager', 'webadmin']));

-- -------------------------------------------------------------------
-- 10) Payroll entries RLS policies
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
using (authz.has_app_role(array['manager', 'webadmin']));

-- Managers and webadmins can delete any entry.
drop policy if exists "entries_delete_admin_all" on public.payroll_entries;
drop policy if exists "entries_delete_manager_all" on public.payroll_entries;
create policy "entries_delete_admin_all"
on public.payroll_entries
for delete
to authenticated
using (authz.has_app_role(array['manager', 'webadmin']));

-- Managers and webadmins can correct submitted entry details.
drop policy if exists "entries_update_admin_all" on public.payroll_entries;
drop policy if exists "entries_update_manager_all" on public.payroll_entries;
create policy "entries_update_admin_all"
on public.payroll_entries
for update
to authenticated
using (authz.has_app_role(array['manager', 'webadmin']))
with check (authz.has_app_role(array['manager', 'webadmin']));

-- -------------------------------------------------------------------
-- 11) Draft timesheet entries RLS policies
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
using (authz.has_app_role(array['manager', 'webadmin']));

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
  and type in ('School Coaching', 'Replacement', 'Claim', 'Camp', 'Private', 'Event', 'schoolCoaching', 'replacement', 'claim')
  and coalesce(created_by, auth.uid()) = auth.uid()
  and coalesce(updated_by, auth.uid()) = auth.uid()
  and authz.has_app_role(array['manager', 'webadmin'])
);

drop policy if exists "draft_entries_update_admin_lessons" on public.draft_timesheet_entries;
create policy "draft_entries_update_admin_lessons"
on public.draft_timesheet_entries
for update
to authenticated
using (
  status = 'active'
  and type in ('School Coaching', 'Replacement', 'Claim', 'Camp', 'Private', 'Event', 'schoolCoaching', 'replacement', 'claim')
  and authz.has_app_role(array['manager', 'webadmin'])
)
with check (
  status = 'active'
  and type in ('School Coaching', 'Replacement', 'Claim', 'Camp', 'Private', 'Event', 'schoolCoaching', 'replacement', 'claim')
  and coalesce(updated_by, auth.uid()) = auth.uid()
  and authz.has_app_role(array['manager', 'webadmin'])
);

drop policy if exists "draft_entries_delete_admin_lessons" on public.draft_timesheet_entries;
create policy "draft_entries_delete_admin_lessons"
on public.draft_timesheet_entries
for delete
to authenticated
using (
  status = 'active'
  and type in ('School Coaching', 'Replacement', 'Claim', 'Camp', 'Private', 'Event', 'schoolCoaching', 'replacement', 'claim')
  and authz.has_app_role(array['manager', 'webadmin'])
);

-- -------------------------------------------------------------------
-- 12) Quick-add templates RLS policies
-- -------------------------------------------------------------------
drop policy if exists "quick_add_templates_select_own" on public.quick_add_templates;
create policy "quick_add_templates_select_own"
on public.quick_add_templates
for select
to authenticated
using (employee_id = (select auth.uid()));

drop policy if exists "quick_add_templates_insert_own" on public.quick_add_templates;
create policy "quick_add_templates_insert_own"
on public.quick_add_templates
for insert
to authenticated
with check (employee_id = (select auth.uid()));

drop policy if exists "quick_add_templates_delete_own" on public.quick_add_templates;
create policy "quick_add_templates_delete_own"
on public.quick_add_templates
for delete
to authenticated
using (employee_id = (select auth.uid()));

-- -------------------------------------------------------------------
-- 13) Employee notices RLS policies
-- -------------------------------------------------------------------
drop policy if exists "employee_notices_select_recipient" on public.employee_notices;
create policy "employee_notices_select_recipient"
on public.employee_notices
for select
to authenticated
using (
  authz.has_app_role(array['manager', 'webadmin'])
  or exists (
    select 1
    from public.employee_notice_recipients r
    where r.notice_id = employee_notices.id
      and r.employee_id = auth.uid()
  )
);

drop policy if exists "employee_notices_insert_admin" on public.employee_notices;
create policy "employee_notices_insert_admin"
on public.employee_notices
for insert
to authenticated
with check (
  created_by = auth.uid()
  and authz.has_app_role(array['manager', 'webadmin'])
);

drop policy if exists "employee_notice_recipients_select_own_or_admin" on public.employee_notice_recipients;
create policy "employee_notice_recipients_select_own_or_admin"
on public.employee_notice_recipients
for select
to authenticated
using (
  employee_id = auth.uid()
  or authz.has_app_role(array['manager', 'webadmin'])
);

drop policy if exists "employee_notice_recipients_insert_admin" on public.employee_notice_recipients;
create policy "employee_notice_recipients_insert_admin"
on public.employee_notice_recipients
for insert
to authenticated
with check (authz.has_app_role(array['manager', 'webadmin']));

drop policy if exists "employee_notice_recipients_update_own_read_at" on public.employee_notice_recipients;
create policy "employee_notice_recipients_update_own_read_at"
on public.employee_notice_recipients
for update
to authenticated
using (employee_id = auth.uid())
with check (employee_id = auth.uid());

drop function if exists public.is_manager(uuid);
drop function if exists public.current_user_has_role(text[]);
drop function if exists public.has_app_role(uuid, text[]);
drop function if exists public.has_app_role(text[]);
drop function if exists public.current_profile_role();

commit;

-- -------------------------------------------------------------------
-- Notes:
-- 1) Promote managers by running a trusted SQL update in Supabase:
--      update public.profiles set role = 'manager' where id = '<user-uuid>';
-- 2) Keep using the anon key in browser code; never expose service_role key.
-- -------------------------------------------------------------------
