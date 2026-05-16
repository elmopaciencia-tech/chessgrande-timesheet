# websitePLAN.md: Supabase Draft Timesheets For chess-timesheet

## Summary
- Target project: `/Users/elmo/Documents/Codex/2026-05-02-files-mentioned-by-the-user-chess`.
- Add this plan as `websitePLAN.md` in that project.
- Replace draft entry storage currently using `localStorage` key `chessGrandeTimesheetEntries` with Supabase-backed draft rows.
- Managers/webadmins can directly create, edit, and delete employee coaching/replacement draft entries.
- Claims remain employee-owned.
- Existing `payroll_submissions` and `payroll_entries` stay as submitted payroll snapshot tables.

## Key Changes

### Supabase Schema
- Update `supabase-schema.sql` with a new `public.draft_timesheet_entries` table.
- Use the current website entry labels: `School Coaching`, `Replacement`, `Claim`.
- Columns:
  - `id uuid primary key default gen_random_uuid()`
  - `employee_id uuid not null references public.profiles(id) on delete cascade`
  - `created_by uuid references public.profiles(id)`
  - `updated_by uuid references public.profiles(id)`
  - `submission_id uuid references public.payroll_submissions(id) on delete set null`
  - `status text not null default 'active' check (status in ('active', 'submitted'))`
  - `school_name text not null default ''`
  - `date date not null`
  - `type text not null check (type in ('School Coaching', 'Replacement', 'Claim'))`
  - `start_time text`
  - `end_time text`
  - `hours numeric(10,2) not null default 0 check (hours >= 0)`
  - `replacement_name text`
  - `custom_rate numeric(10,2) check (custom_rate is null or custom_rate >= 0)`
  - `claim_notes text`
  - `claim_cost numeric(10,2) check (claim_cost is null or claim_cost >= 0)`
  - `claim_proof_name text`
  - `claim_image_path text`
  - `claim_proof_data_url text`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- Add indexes on `(employee_id, status, date)`, `(employee_id, date)`, and `submission_id`.
- Add RLS:
  - Employees can select/insert/update/delete their own `active` draft rows.
  - Employees can read but not mutate `submitted` draft rows.
  - Managers/webadmins can select all draft rows.
  - Managers/webadmins can insert/update/delete only `active` `School Coaching` and `Replacement` rows.
  - Managers/webadmins cannot mutate `Claim` rows.

### Employee Timesheet
- In `chess-timesheet.html`, replace `loadEntries()` / `saveEntries()` localStorage persistence with async Supabase CRUD.
- Keep `entries` as in-memory render state only.
- On app init, load draft rows for `auth.user.id`.
- On add entry, insert rows into `draft_timesheet_entries`; weekly repeat still expands before insertion.
- On remove/clear month, delete only active rows owned by the employee.
- Claims keep the existing R2 proof upload flow, storing proof fields on the draft row.
- Show submitted rows as locked with a visible `Submitted` tag and no remove/edit action.

### Payroll Submission
- In `chess-timesheet-pay.html`, load selected-month entries from `draft_timesheet_entries` instead of localStorage.
- Keep the current insert flow into `payroll_submissions` and `payroll_entries`.
- After successful `payroll_entries` insert, mark submitted month draft rows:
  - `status = 'submitted'`
  - `submission_id = submission.id`
  - `updated_by = auth.user.id`
- Do not clear draft rows after submission.

### Manager/Webadmin Draft Editing
- Add a manager-facing draft editor page, separate from `manager-entry.html`, because `manager-entry.html` is for submitted payroll review.
- Link the new page from `manager-dashboard.html` and `webadmin-dashboard.html`.
- Manager flow:
  - select employee from `profiles`
  - select month
  - view that employee’s draft entries grouped like the employee ledger
  - add/edit/delete active coaching/replacement entries
  - view claims read-only
  - view submitted rows read-only
- Preserve existing submitted payroll dashboard behavior.

## Test Plan
- Manual SQL/RLS checks:
  - employee can CRUD own active drafts
  - employee cannot edit submitted drafts
  - employee cannot access another employee’s drafts
  - manager/webadmin can read all drafts
  - manager/webadmin can mutate coaching/replacement drafts
  - manager/webadmin cannot mutate claim drafts
- Browser checks:
  - employee adds an entry, refreshes, and sees it from Supabase
  - employee logs in on another browser/device and sees same entries
  - employee submits payroll and entries remain visible but locked
  - manager creates coaching entry for employee and employee sees it
  - manager cannot edit/delete employee claims
  - existing submitted payroll review still reads `payroll_submissions` / `payroll_entries`
- Run available project checks:
  - `npm run worker:dry-run` for the Cloudflare Worker if worker files are touched.

## Assumptions
- The correct website project is `/Users/elmo/Documents/Codex/2026-05-02-files-mentioned-by-the-user-chess`.
- Existing localStorage draft entries will be ignored, not uploaded.
- Draft rows use current web labels, not iOS enum raw values.
- Quick-add remains local/device-only unless planned separately.
- Submitted payroll snapshots remain immutable records in existing submitted tables.
