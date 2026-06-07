import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const schema = fs.readFileSync(
  path.join(process.cwd(), "supabase-schema.sql"),
  "utf8"
);

[
  "create table if not exists public.employee_notices",
  "create table if not exists public.employee_notice_recipients",
  "id uuid primary key default gen_random_uuid()",
  "created_by uuid references public.profiles(id) on delete set null",
  "notice_type text not null default 'manual' check (notice_type in ('manual', 'payment', 'system'))",
  "related_submission_id uuid references public.payroll_submissions(id) on delete set null",
  "primary key (notice_id, employee_id)",
  "employee_notices_created_at_idx",
  "employee_notices_related_submission_id_idx",
  "employee_notice_recipients_employee_read_idx",
].forEach((requiredSql) => {
  assert.ok(schema.includes(requiredSql), `schema should include ${requiredSql}`);
});

[
  "alter table public.employee_notices enable row level security",
  "alter table public.employee_notice_recipients enable row level security",
  "grant select, insert on public.employee_notices to authenticated",
  "grant select, insert on public.employee_notice_recipients to authenticated",
  "grant update (read_at) on public.employee_notice_recipients to authenticated",
].forEach((requiredSql) => {
  assert.ok(schema.includes(requiredSql), `schema should include ${requiredSql}`);
});

[
  "employee_notices_select_recipient",
  "employee_notices_insert_admin",
  "employee_notice_recipients_select_own_or_admin",
  "employee_notice_recipients_insert_admin",
  "employee_notice_recipients_update_own_read_at",
].forEach((policyName) => {
  assert.match(schema, new RegExp(policyName, "i"), `schema should define policy ${policyName}`);
});

assert.match(
  schema,
  /authz\.has_app_role\(array\['manager', 'webadmin'\]\)/,
  "notice policies should use the security definer role helper"
);
assert.match(
  schema,
  /employee_id = auth\.uid\(\)/,
  "employees should be scoped to their own notice recipient rows"
);

assert.match(
  schema,
  /create policy "submissions_delete_own_unpaid"[\s\S]*on public\.payroll_submissions[\s\S]*for delete[\s\S]*using \([\s\S]*employee_id = auth\.uid\(\)[\s\S]*paid_at is null[\s\S]*\);/,
  "employees should be able to delete only their own unpaid payroll submissions"
);
assert.match(
  schema,
  /create policy "draft_entries_unlock_own_unpaid_submission"[\s\S]*on public\.draft_timesheet_entries[\s\S]*for update[\s\S]*using \([\s\S]*employee_id = auth\.uid\(\)[\s\S]*status = 'submitted'[\s\S]*exists \([\s\S]*from public\.payroll_submissions s[\s\S]*s\.id = submission_id[\s\S]*s\.employee_id = auth\.uid\(\)[\s\S]*s\.paid_at is null[\s\S]*\)[\s\S]*with check \([\s\S]*employee_id = auth\.uid\(\)[\s\S]*status = 'active'[\s\S]*submission_id is null[\s\S]*coalesce\(updated_by, auth\.uid\(\)\) = auth\.uid\(\)[\s\S]*\);/,
  "employees should be able to unlock only their own submitted draft rows from unpaid submissions"
);

console.log("schema notice checks passed");
