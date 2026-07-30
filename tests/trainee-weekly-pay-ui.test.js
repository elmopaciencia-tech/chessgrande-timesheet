import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const schema = fs.readFileSync(path.join(process.cwd(), "supabase-schema.sql"), "utf8");
const manager = fs.readFileSync(path.join(process.cwd(), "manager-dashboard.html"), "utf8");
const pay = fs.readFileSync(path.join(process.cwd(), "chess-timesheet-pay.html"), "utf8");
const traineePolicy = fs.readFileSync(path.join(process.cwd(), "trainee-pay-policy.js"), "utf8");
const managerEntry = fs.readFileSync(path.join(process.cwd(), "manager-entry.html"), "utf8");
const migrationFile = fs.readdirSync(path.join(process.cwd(), "supabase", "migrations"))
  .find((name) => name.endsWith("_trainee_weekly_stipend.sql"));
assert.ok(migrationFile, "the trainee weekly-stipend feature should have a Supabase migration");
const migration = fs.readFileSync(
  path.join(process.cwd(), "supabase", "migrations", migrationFile),
  "utf8"
);
const allowUnsetMigrationFile = fs.readdirSync(path.join(process.cwd(), "supabase", "migrations"))
  .find((name) => name.endsWith("_allow_unset_trainee_payroll.sql"));
assert.ok(
  allowUnsetMigrationFile,
  "submitting before trainee payroll values are configured should have a Supabase migration"
);
const allowUnsetMigration = fs.readFileSync(
  path.join(process.cwd(), "supabase", "migrations", allowUnsetMigrationFile),
  "utf8"
);

[
  "pay_policy text not null default 'monthly_hourly'",
  "weekly_stipend_amount numeric(10,2)",
  "promotion_hours_target numeric(10,2)",
  "period_type text not null default 'monthly'",
  "period_start date",
  "period_end date",
  "base_pay numeric(12,2)",
  "reimbursement_pay numeric(12,2)",
  "payroll_submissions_employee_weekly_stipend_unique_idx",
  "create or replace function public.submit_trainee_weekly_payroll",
  "security definer",
  "extract(isodow from requested_period_start) <> 1",
  "now() at time zone 'Asia/Singapore'",
  "configured_profile.weekly_stipend_amount",
  "qualifying_work_hours <= 0",
  "update public.draft_timesheet_entries",
  "set status = 'submitted'",
  "grant execute on function public.submit_trainee_weekly_payroll(date) to authenticated",
].forEach((snippet) => {
  assert.ok(schema.includes(snippet), `weekly trainee schema should include ${snippet}`);
});

assert.ok(migration.trim().startsWith("begin;"), "the migration should be transactional");
assert.ok(migration.trim().endsWith("commit;"), "the migration should commit atomically");
[
  "alter table public.profiles add column if not exists pay_policy text",
  "alter table public.profiles add column if not exists weekly_stipend_amount numeric(10,2)",
  "alter table public.profiles add column if not exists promotion_hours_target numeric(10,2)",
  "profiles_pay_policy_seniority_check",
  "new_pay_policy is distinct from locked_pay_policy",
  "create or replace function public.set_profile_payroll_settings",
  "alter table public.payroll_submissions add column if not exists period_type text",
  "alter table public.payroll_submissions add column if not exists base_pay numeric(12,2)",
  "payroll_submissions_employee_weekly_stipend_unique_idx",
  "create or replace function public.submit_trainee_weekly_payroll",
  "grant execute on function public.submit_trainee_weekly_payroll(date) to authenticated",
].forEach((snippet) => {
  assert.ok(migration.includes(snippet), `weekly trainee migration should include ${snippet}`);
});

assert.match(
  schema,
  /create unique index if not exists payroll_submissions_employee_weekly_stipend_unique_idx[\s\S]*employee_id,\s*period_start[\s\S]*period_type = 'weekly'[\s\S]*pay_policy = 'weekly_stipend'/,
  "the database should enforce at most one trainee stipend per employee and week"
);
assert.match(
  schema,
  /create or replace function public\.set_profile_payroll_settings\([\s\S]*new_pay_policy text[\s\S]*new_weekly_stipend_amount numeric[\s\S]*new_promotion_hours_target numeric/,
  "manager payroll settings should accept the complete pay-policy configuration"
);
assert.match(
  schema,
  /if not authz\.has_app_role\(array\['manager', 'webadmin'\]\)[\s\S]*Only managers and webadmins can change payroll profile settings/,
  "only managers and webadmins should configure trainee pay"
);
assert.match(
  schema,
  /when lower\(d\.type\) in \('claim', 'event'\)[\s\S]*then case/,
  "weekly payroll should reimburse eligible Event costs even when the Event also has work hours"
);
assert.doesNotMatch(
  schema,
  /A manager must set a positive weekly stipend before submission|A manager must set a positive promotion-hours target before submission/,
  "the authoritative trainee submission function should accept unset stipend and promotion values"
);
assert.ok(allowUnsetMigration.trim().startsWith("begin;"), "the allow-unset migration should be transactional");
assert.ok(allowUnsetMigration.trim().endsWith("commit;"), "the allow-unset migration should commit atomically");
assert.match(
  allowUnsetMigration,
  /create or replace function public\.submit_trainee_weekly_payroll\([\s\S]*configured_profile\.weekly_stipend_amount[\s\S]*configured_profile\.promotion_hours_target/,
  "the migration should replace the authoritative weekly-submission function"
);
assert.doesNotMatch(
  allowUnsetMigration,
  /positive weekly stipend before submission|positive promotion-hours target before submission/,
  "the deployed replacement should not block unset manager values"
);
assert.match(
  allowUnsetMigration,
  /create trigger profiles_backfill_unpriced_trainee_submissions[\s\S]*after update of weekly_stipend_amount, promotion_hours_target[\s\S]*execute function public\.backfill_unpriced_trainee_submissions\(\)/,
  "manager payroll updates should backfill unpaid trainee submissions that were submitted before pricing"
);
assert.match(
  allowUnsetMigration,
  /update public\.payroll_submissions[\s\S]*weekly_stipend_amount = case[\s\S]*base_pay = case[\s\S]*total_pay = case[\s\S]*paid_at is null/,
  "the backfill should price only unpaid trainee submissions"
);

[
  'id="profileModalPayPolicy"',
  'id="profileModalPayPolicy" disabled',
  'value="monthly_hourly"',
  'value="weekly_stipend"',
  'id="profileModalWeeklyStipend"',
  'id="profileModalPromotionTarget"',
  "Weekly stipend",
  "Promotion target",
  "new_pay_policy:",
  "new_weekly_stipend_amount:",
  "new_promotion_hours_target:",
  "syncProfilePayPolicyFields",
  "getLockedPayPolicy",
  "buildConfirmedHoursByEmployee",
  'submission.payPolicy === "weekly_stipend"',
  "Weekly stipend",
].forEach((snippet) => {
  assert.ok(manager.includes(snippet), `manager trainee controls should include ${snippet}`);
});
assert.ok(
  manager.includes("pay_policy, weekly_stipend_amount, promotion_hours_target"),
  "the manager directory should load trainee payroll settings"
);
assert.doesNotMatch(
  manager,
  /profileModalPayPolicy\.addEventListener\("change"/,
  "managers should not be able to override the pay structure independently of role"
);
assert.match(
  manager,
  /const nextPayPolicy = getLockedPayPolicy\(nextSeniority\);/,
  "manager saves should derive pay structure from the selected role"
);

[
  '<script src="./trainee-pay-policy.js"></script>',
  'id="payViewEyebrow"',
  "isWeeklyStipendProfile",
  "calculateTraineePaySummary",
  "loadTraineeSubmissions",
  "submitTraineeWeeklyPayroll",
  '.rpc("submit_trainee_weekly_payroll"',
  "requested_period_start:",
  "Submit Ready Weeks",
  'payRateLabel.textContent = "Pay Per Week"',
  'payViewEyebrow.textContent = "Trainee weekly payroll"',
].forEach((snippet) => {
  assert.ok(pay.includes(snippet), `trainee pay page should include ${snippet}`);
});
[
  'id="traineeWeeklySummary"',
  'id="traineeWeekList"',
  'id="traineePromotionProgress"',
  'id="traineePromotionBar"',
  'id="traineePromotionCopy"',
  'aria-label="Trainee weekly stipend summary"',
  ".trainee-weekly-summary",
  "Any positive work qualifies",
  "renderTraineeWeeklySummary",
  "loadTraineePromotionProgress",
  'payRateLabel.textContent = "Weekly stipend"',
].forEach((snippet) => {
  assert.ok(!pay.includes(snippet), `trainee pay page should remove ${snippet}`);
});
assert.doesNotMatch(
  `${pay}\n${traineePolicy}`,
  /promotion/i,
  "trainee-loaded payroll code should never expose a promotion target or promotion progress"
);
assert.doesNotMatch(
  pay,
  /weeklyStipend <= 0|promotionTarget|must set your weekly stipend/,
  "trainee submission should not be blocked while manager payroll values are unset"
);
assert.match(
  pay,
  /if \(isWeeklyStipendProfile\(\)\)[\s\S]*await submitTraineeWeeklyPayroll\(\);[\s\S]*return;/,
  "the pay form should route configured trainees into the weekly submission flow"
);
assert.match(
  pay,
  /function render\(\)[\s\S]*isWeeklyStipendProfile\(\)[\s\S]*calculateTraineePaySummary/,
  "the pay summary should keep weekly stipend calculations without rendering the removed panel"
);
assert.match(
  pay,
  /function calculateTraineePaySummary\(summaryEntries\)[\s\S]*groupEntriesByWeek\(summaryEntries\)[\s\S]*calculateWeeklySummary\(weekEntries, weeklyStipend\)/,
  "the trainee pay total should still be calculated from qualifying weekly entries"
);

[
  'id="payRateLabel"',
  "payPolicy:",
  "weeklyStipendAmount:",
  'payRateLabel.textContent = submission.payPolicy === "weekly_stipend" ? "Weekly stipend" : "Rate";',
].forEach((snippet) => {
  assert.ok(managerEntry.includes(snippet), `manager submission review should include ${snippet}`);
});

console.log("trainee weekly-pay UI and schema checks passed");
