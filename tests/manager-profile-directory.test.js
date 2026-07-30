import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "manager-dashboard.html"),
  "utf8"
);
const schema = fs.readFileSync(
  path.join(process.cwd(), "supabase-schema.sql"),
  "utf8"
);

[
  'id="profileDirectorySection"',
  'id="profileDirectorySearch"',
  'id="profileDirectorySeniorityFilter"',
  'id="profileDirectoryList"',
  'id="profileModalOverlay"',
  'role="dialog"',
  'aria-labelledby="profileModalTitle"',
  'id="profileModalSeniority"',
  'id="profileModalPayPolicy"',
  'id="profileModalPayPolicy" disabled',
  'id="profileModalHourlyRate"',
  'id="profileModalWeeklyStipend"',
  'id="profileModalPromotionTarget"',
  "Cumulative submitted hours",
  "Bank account number",
  "Rate per hour",
  "Senior Chess Coach",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `manager profile directory should include ${snippet}`);
});

[
  'class="profile-directory-board"',
  'class="profile-directory-head"',
  'class="profile-directory-list"',
  'class="profile-directory-line"',
  'class="profile-directory-avatar"',
  'class="profile-directory-view-button"',
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `manager profile directory layout should include ${snippet}`);
});

[
  'class="profile-modal-content"',
  'class="profile-compact-sheet"',
  'class="profile-compact-row profile-compact-row-split"',
  'class="profile-overview-band"',
  'class="profile-modal-footer"',
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `compact profile modal should include ${snippet}`);
});
assert.ok(!html.includes('class="profile-modal-grid"'), "profile modal should not use the tall card grid");
assert.ok(!html.includes('class="profile-detail'), "profile modal should not render a card for every field");
assert.match(
  html,
  /\.profile-modal\s*\{[^}]*display:\s*grid;[^}]*grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto;[^}]*overflow:\s*hidden;/,
  "profile modal should keep its header, scrollable content, and footer within the box"
);
assert.match(
  html,
  /\.profile-modal-content\s*\{[^}]*overflow-y:\s*auto;/,
  "only the compact profile content should scroll on short viewports"
);
assert.match(
  html,
  /\.profile-compact-row\s*\{[^}]*padding:\s*9px\s+14px;/,
  "profile information should use compact ledger rows"
);

assert.match(
  html,
  /@media \(max-width: 760px\)[\s\S]*\.profile-directory-head\s*\{[^}]*display:\s*none;[\s\S]*\.profile-directory-line\s*\{[^}]*grid-template-columns:/,
  "manager profile directory should collapse its desktop header and rows on mobile"
);
assert.match(
  html,
  /\.profile-directory-head, \.profile-directory-line\s*\{[^}]*grid-template-columns:\s*minmax\(230px,\s*1\.55fr\)\s*minmax\(145px,\s*\.78fr\)\s*minmax\(140px,\s*\.72fr\)\s*minmax\(180px,\s*\.9fr\)\s*44px\s*34px;/,
  "manager profile directory should use a balanced six-column grid for details and expansion actions"
);

const directoryHead = html.match(/<div class="profile-directory-head"[\s\S]*?<\/div>\s*<div id="profileDirectoryList"/)?.[0] || "";
assert.ok(directoryHead, "manager profile directory should include its table header");
assert.ok(directoryHead.includes("<div>Role</div>"), "manager profile directory should present coaching seniority outwardly as Role");
assert.ok(!html.includes('class="profile-directory-role role-'), "manager profile rows should not render role pills");
assert.ok(!html.includes('class="profile-directory-sub"'), "manager profile rows should not render UUID or username subtitles");

const profileModalMarkup = html.match(/<div class="modal-overlay" id="profileModalOverlay"[\s\S]*?<\/section>\s*<\/div>/)?.[0] || "";
assert.ok(profileModalMarkup, "manager profile modal should render");
assert.ok(!profileModalMarkup.includes("User ID"), "profile modal should not expose the user ID");
assert.ok(!profileModalMarkup.includes('id="profileModalRole"'), "profile modal header should not repeat the app role");
assert.ok(!profileModalMarkup.includes(">Seniority<"), "profile modal should present seniority outwardly as Role");
assert.ok(!profileModalMarkup.includes("Save Seniority"), "profile modal should auto-save without a separate seniority button");
assert.ok(!profileModalMarkup.includes('id="profileModalSaveButton"'), "profile modal should not render a save button");

[
  'from("profiles")',
  '.select("id, full_name, username, phone_number, bank_account_number, bank_name, account_type, hourly_rate, pay_policy, weekly_stipend_amount, promotion_hours_target, avatar_r2_key, role, seniority_level, created_at")',
  "buildCumulativeHoursByEmployee",
  "buildConfirmedHoursByEmployee",
  "getLockedPayPolicy",
  "filterDirectoryProfiles",
  "renderProfileDirectory",
  "openProfileModal",
  "saveProfilePayrollSettings",
  '.rpc("set_profile_payroll_settings"',
  "target_profile_id:",
  "new_seniority_level:",
  "new_hourly_rate:",
  "new_pay_policy:",
  "new_weekly_stipend_amount:",
  "new_promotion_hours_target:",
  'profileModalSeniority.addEventListener("change",',
  'profileModalHourlyRate.addEventListener("change", saveProfilePayrollSettings)',
  'profileModalWeeklyStipend.addEventListener("change", saveProfilePayrollSettings)',
  'profileModalPromotionTarget.addEventListener("change", saveProfilePayrollSettings)',
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `manager profile directory behavior should include ${snippet}`);
});

assert.doesNotMatch(html, /profileModalSeniority\.hidden\s*=/, "all profiles should expose the editable Role control");
assert.doesNotMatch(html, /profileModalSeniorityStatic/, "the modal should not render a read-only role fallback");
assert.doesNotMatch(
  html,
  /profileModalPayPolicy\.addEventListener\("change"/,
  "pay structure should be locked to the selected coaching role"
);
assert.match(
  html,
  /profileModalSeniority\.value = profile\.seniority_level \|\| "chess_coach";[\s\S]*profileModalHourlyRate\.value = formatEditableHourlyRate\(profile\.hourly_rate\);/,
  "every profile should populate the editable role and hourly rate controls"
);
assert.match(
  html,
  /if \(error\) \{[\s\S]*profileModalSeniority\.value = previousSeniority;[\s\S]*profileModalHourlyRate\.value = formatEditableHourlyRate\(previousHourlyRate\);/,
  "failed auto-saves should restore both previous editable values"
);

[
  "alter table public.profiles add column if not exists seniority_level text",
  "alter table public.profiles add column if not exists hourly_rate numeric(10,2)",
  "alter table public.profiles add column if not exists pay_policy text",
  "alter table public.profiles add column if not exists weekly_stipend_amount numeric(10,2)",
  "alter table public.profiles add column if not exists promotion_hours_target numeric(10,2)",
  "'trainee', 'chess_coach', 'senior_chess_coach'",
  "update public.profiles",
  "set seniority_level = 'chess_coach'",
  "where seniority_level is null",
  "alter column seniority_level set default 'chess_coach'",
  "create or replace function public.enforce_profile_seniority()",
  "create trigger profiles_enforce_seniority",
  "create or replace function public.set_profile_payroll_settings",
  "target_profile_id uuid",
  "new_seniority_level text",
  "new_hourly_rate numeric",
  "new_pay_policy text",
  "new_weekly_stipend_amount numeric",
  "new_promotion_hours_target numeric",
  "security definer",
  "authz.has_app_role(array['manager', 'webadmin'])",
  "grant execute on function public.set_profile_payroll_settings(uuid, text, numeric, text, numeric, numeric) to authenticated",
].forEach((snippet) => {
  assert.ok(schema.includes(snippet), `payroll profile schema should include ${snippet}`);
});
assert.match(
  schema,
  /if new\.seniority_level is null then[\s\S]*new\.seniority_level := 'chess_coach';/,
  "all app roles should receive a coaching role default"
);

assert.match(
  schema,
  /revoke all on function public\.set_profile_payroll_settings\(uuid, text, numeric, text, numeric, numeric\) from public;[\s\S]*revoke all on function public\.set_profile_payroll_settings\(uuid, text, numeric, text, numeric, numeric\) from anon;/,
  "payroll profile RPC should not be callable by public or anonymous users"
);
assert.match(
  schema,
  /update public\.profiles[\s\S]*set seniority_level = new_seniority_level,[\s\S]*hourly_rate = new_hourly_rate,[\s\S]*pay_policy = locked_pay_policy,[\s\S]*weekly_stipend_amount = new_weekly_stipend_amount,[\s\S]*promotion_hours_target = new_promotion_hours_target[\s\S]*where id = target_profile_id/,
  "payroll profile RPC should update role and the complete manager-controlled pay policy"
);
assert.match(
  schema,
  /if new_hourly_rate is null or new_hourly_rate < 0 then[\s\S]*Hourly rate must be zero or greater/,
  "payroll profile RPC should reject missing or negative hourly rates"
);
assert.ok(
  schema.includes("revoke update on public.profiles from authenticated"),
  "authenticated users should lose the broad profile update grant"
);
assert.match(
  schema,
  /grant update \(\s*id,\s*full_name,\s*username,\s*phone_number,\s*bank_account_number,\s*bank_name,\s*account_type,\s*hourly_rate,\s*avatar_r2_key\s*\) on public\.profiles to authenticated;/,
  "normal profile fields, including the user's own hourly rate, should retain column-scoped update access"
);
assert.doesNotMatch(
  schema,
  /grant update \([^)]*(?:role|seniority_level)[^)]*\) on public\.profiles to authenticated;/,
  "application role and seniority should not be directly updateable outside restricted RPCs"
);

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `expected to find function ${name}`);
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract function ${name}`);
}

const helperSource = [
  "buildCumulativeHoursByEmployee",
  "buildConfirmedHoursByEmployee",
  "getLockedPayPolicy",
  "filterDirectoryProfiles",
  "formatSeniorityLabel",
].map((name) => extractFunction(html, name)).join("\n");

const helpers = Function(`${helperSource}; return {
  buildCumulativeHoursByEmployee,
  buildConfirmedHoursByEmployee,
  getLockedPayPolicy,
  filterDirectoryProfiles,
  formatSeniorityLabel,
};`)();

const cumulativeHours = helpers.buildCumulativeHoursByEmployee([
  { employee_id: "employee-1", total_hours: "2.5", paid_at: null },
  { employee_id: "employee-1", total_hours: 4, paid_at: "2026-06-01T00:00:00Z" },
  { employee_id: "employee-2", total_hours: 3, paid_at: null },
  { employee_id: "employee-2", total_hours: "not-a-number", paid_at: null },
  { employee_id: "", total_hours: 9, paid_at: null },
]);
assert.equal(cumulativeHours.get("employee-1"), 6.5, "paid and unpaid submitted hours should both count");
assert.equal(cumulativeHours.get("employee-2"), 3, "invalid totals should not corrupt cumulative hours");
assert.equal(cumulativeHours.has(""), false, "submission rows without an employee should be ignored");
assert.equal(cumulativeHours.get("employee-3") || 0, 0, "users without submissions should have zero hours");

const confirmedHours = helpers.buildConfirmedHoursByEmployee([
  { employee_id: "employee-1", total_hours: 2.5, paid_at: null, pay_policy: "weekly_stipend" },
  { employee_id: "employee-1", total_hours: 4, paid_at: "2026-06-01T00:00:00Z", pay_policy: "weekly_stipend" },
  { employee_id: "employee-1", total_hours: 99, paid_at: "2026-06-02T00:00:00Z", pay_policy: "monthly_hourly" },
  { employee_id: "employee-2", total_hours: 3, paid_at: "2026-06-02T00:00:00Z", pay_policy: "weekly_stipend" },
]);
assert.equal(confirmedHours.get("employee-1"), 4, "only paid weekly-stipend hours should be confirmed for promotion");
assert.equal(confirmedHours.get("employee-2"), 3, "confirmed hours should aggregate by employee");
assert.equal(helpers.getLockedPayPolicy("trainee"), "weekly_stipend");
assert.equal(helpers.getLockedPayPolicy("chess_coach"), "monthly_hourly");
assert.equal(helpers.getLockedPayPolicy("senior_chess_coach"), "monthly_hourly");

const profiles = [
  { id: "3", full_name: "Zara Admin", username: "zara", role: "webadmin", seniority_level: null, phone_number: "333", bank_name: "UOB" },
  { id: "1", full_name: "Alex Coach", username: "alex", role: "employee", seniority_level: "senior_chess_coach", phone_number: "111", bank_name: "DBS" },
  { id: "2", full_name: "Ben Manager", username: "ben", role: "manager", seniority_level: null, phone_number: "222", bank_name: "OCBC" },
];
assert.deepEqual(
  helpers.filterDirectoryProfiles(profiles, "", "").map((profile) => profile.id),
  ["1", "2", "3"],
  "the directory should sort all roles alphabetically"
);
assert.deepEqual(
  helpers.filterDirectoryProfiles(profiles, "senior chess", "").map((profile) => profile.id),
  ["1"],
  "directory search should include formatted seniority labels"
);
assert.deepEqual(
  helpers.filterDirectoryProfiles(profiles, "", "senior_chess_coach").map((profile) => profile.id),
  ["1"],
  "the coaching-role filter should narrow the directory"
);
assert.equal(helpers.formatSeniorityLabel("trainee"), "Trainee");
assert.equal(helpers.formatSeniorityLabel("chess_coach"), "Chess Coach");
assert.equal(helpers.formatSeniorityLabel("senior_chess_coach"), "Senior Chess Coach");
assert.equal(helpers.formatSeniorityLabel(null), "Not applicable");

assert.match(
  html,
  /label:\s*"Timesheet submitted, awaiting payment"/,
  "the unpaid status should explain that the submitted timesheet is awaiting payment"
);
assert.match(
  html,
  /profile-directory-month-status \$\{meta\.className\}" role="img" tabindex="0" aria-label="\$\{escapeHtml\(meta\.label\)\}" data-tooltip="\$\{escapeHtml\(meta\.label\)\}"/,
  "monthly status icons should expose the tooltip to hover, focus, and assistive technology"
);
assert.match(
  html,
  /\.profile-directory-month-status:hover::after,\s*\.profile-directory-month-status:focus-visible::after\s*\{[^}]*opacity:\s*1;/,
  "monthly status tooltips should appear on both hover and keyboard focus"
);
assert.match(
  html,
  /\.profile-directory-submission\s*\{[^}]*grid-template-columns:\s*16px minmax\(0, 1fr\) 108px minmax\(96px, max-content\) 14px;[^}]*grid-template-areas:\s*"calendar month payment pay arrow" "\. details payment status arrow";/,
  "the payment control should occupy its own column beside the pay and status stack"
);
assert.match(
  html,
  /\.profile-directory-paid-button,\s*\.profile-directory-paid-spacer\s*\{[^}]*grid-area:\s*payment;[^}]*align-self:\s*center;[^}]*justify-self:\s*center;/,
  "the payment control column should center its button across both submission rows"
);
assert.ok(
  html.includes('<span class="profile-directory-paid-label">Mark as Paid</span>'),
  "desktop and tablet payment controls should include a visible action label"
);
assert.match(
  html,
  /@media \(max-width: 560px\)[\s\S]*\.profile-directory-paid-label\s*\{\s*display:\s*none;/,
  "phone payment controls should remain compact and icon-only"
);
assert.match(
  html,
  /const confirmed = window\.confirm\(`Mark \$\{employeeName\}'s \$\{monthLabel\} submission as paid\?`\);[\s\S]*if \(!confirmed\) return;/,
  "marking a submission paid should require confirmation"
);

console.log("manager profile directory checks passed");
