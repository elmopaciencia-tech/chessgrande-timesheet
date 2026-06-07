import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "employee-dashboard.html"),
  "utf8"
);
const loginHtml = fs.readFileSync(
  path.join(process.cwd(), "login.html"),
  "utf8"
);
const profileSetupHtml = fs.readFileSync(
  path.join(process.cwd(), "profile-setup.html"),
  "utf8"
);
const uiEffectsSource = fs.readFileSync(
  path.join(process.cwd(), "ui-effects.js"),
  "utf8"
);

[
  "Workday Snapshot",
  "id=\"nextClassTitle\"",
  "id=\"nextClassIcon\"",
  "id=\"weeklySchedule\"",
  "id=\"schoolCount\"",
  "id=\"entryCount\"",
  "id=\"hoursCount\"",
  "id=\"submissionStatusBadge\"",
  "id=\"noticeList\"",
  "id=\"unreadNoticeCount\"",
  "id=\"paymentHistory\"",
  "submission-panel",
  "quick-link-text",
  "quick-link-arrow",
  "notice-action-button",
  "data-dismiss-notice-id",
  "Dismiss notice",
  "history-icon",
  "submissionStatusIcon",
  "data-lucide=\"arrow-up-right\"",
  "href=\"./chess-timesheet.html\"",
  "href=\"./chess-timesheet-pay.html\"",
  "src=\"./draft-timesheet-store.js\"",
  "src=\"./employee-notice-store.js\"",
  ".menu-item[hidden] { display: none; }",
].forEach((requiredMarkup) => {
  assert.ok(html.includes(requiredMarkup), `employee dashboard should include ${requiredMarkup}`);
});

[
  "window.employeeNoticeStore.loadNoticesForEmployee(employeeId, { limit: 8 })",
  "window.employeeNoticeStore.markNoticeRead(noticeId, { employeeId: currentUserId })",
  "function dismissNotice",
  "cgDismissedNotices:",
  "window.localStorage.setItem(getDismissedNoticeStorageKey()",
  "const visibleNotices = notices.filter((notice) => !dismissedNoticeIds.has(getNoticeKey(notice)))",
  "renderIcons();",
  "getUpcomingClassEntries(entries, new Date(), 60)",
  "getUpcomingClassEntries(entries, new Date(), 7)",
  "getCurrentMonthStats(entries, monthKey)",
  "getLatestSubmissionForMonth(submissions, currentMonth)",
  "setSnapshotIcon(\"calendar-x-2\", \"is-empty\")",
  "setSnapshotIcon(\"calendar-clock\", \"is-active\")",
  "setSubmissionStatusIcon(\"send\", \"is-due\")",
  "setSubmissionStatusIcon(\"badge-check\", \"is-submitted\")",
  "setSubmissionStatusIcon(\"circle-dollar-sign\", \"is-paid\")",
  "canSeeManagerDashboard(profile)",
  "canSeeWebAdminDashboard(profile)",
].forEach((requiredCode) => {
  assert.ok(html.includes(requiredCode), `employee dashboard should include ${requiredCode}`);
});

assert.ok(
  loginHtml.includes("return \"./employee-dashboard.html\";"),
  "normal employee login should default to the employee dashboard"
);
assert.ok(
  profileSetupHtml.includes("let nextUrl = \"./employee-dashboard.html\";"),
  "profile setup should return employees to the employee dashboard by default"
);
assert.ok(
  uiEffectsSource.includes(".quick-link"),
  "quick links should opt out of generated text icons because they render their own icons"
);
assert.ok(
  !html.includes('<span class="quick-link-arrow" aria-hidden="true">-&gt;</span>'),
  "quick links should use lucide arrow icons instead of raw arrow text"
);
assert.match(
  html,
  /\.submission-panel \.quick-link \{[\s\S]*?box-shadow: none;/,
  "submission quick link should use a flatter treatment"
);

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `expected to find function ${name}`);
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      return source.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract function ${name}`);
}

const dashboardHelpers = [
  "getProfileRole",
  "canSeeManagerDashboard",
  "canSeeWebAdminDashboard",
  "startOfDay",
  "addDays",
  "parseDateInput",
  "getUpcomingClassEntries",
  "getCurrentMonthStats",
  "getLatestSubmissionForMonth",
].map((name) => extractFunction(html, name)).join("\n");

const helperFactory = Function(`
  const classEntryTypes = new Set(["School Coaching", "Replacement", "Camp", "Private"]);
  ${dashboardHelpers}
  return {
    canSeeManagerDashboard,
    canSeeWebAdminDashboard,
    getUpcomingClassEntries,
    getCurrentMonthStats,
    getLatestSubmissionForMonth
  };
`);
const {
  canSeeManagerDashboard,
  canSeeWebAdminDashboard,
  getUpcomingClassEntries,
  getCurrentMonthStats,
  getLatestSubmissionForMonth,
} = helperFactory();

assert.equal(canSeeManagerDashboard({ role: "employee" }), false, "employees should not see manager dashboard links");
assert.equal(canSeeWebAdminDashboard({ role: "employee" }), false, "employees should not see webadmin dashboard links");
assert.equal(canSeeManagerDashboard({ role: "manager" }), true, "managers should see manager dashboard links");
assert.equal(canSeeWebAdminDashboard({ role: "manager" }), false, "managers should not see webadmin dashboard links");
assert.equal(canSeeManagerDashboard({ role: "webadmin" }), true, "webadmins should see manager dashboard links");
assert.equal(canSeeWebAdminDashboard({ role: "webadmin" }), true, "webadmins should see webadmin dashboard links");
assert.equal(canSeeManagerDashboard({ role: " WebAdmin " }), true, "role checks should ignore case and whitespace");

const entries = [
  { id: "1", status: "active", type: "School Coaching", schoolName: "Bishop School", date: "2026-05-26", startTime: "14:00", hours: 2 },
  { id: "2", status: "active", type: "Claim", schoolName: "Claims", date: "2026-05-27", startTime: "", hours: 0 },
  { id: "3", status: "submitted", type: "School Coaching", schoolName: "Archived School", date: "2026-05-27", startTime: "09:00", hours: 1 },
  { id: "4", status: "active", type: "Private", schoolName: "Knight Home", date: "2026-05-28", startTime: "10:00", hours: 1.5 },
  { id: "5", status: "active", type: "Event", schoolName: "Tournament", date: "2026-05-29", startTime: "", hours: 0 },
];

const upcoming = getUpcomingClassEntries(entries, new Date(2026, 4, 26, 8), 7);
assert.deepEqual(
  upcoming.map((entry) => entry.id),
  ["1", "4"],
  "dashboard upcoming classes should include active time entries only"
);

const stats = getCurrentMonthStats(entries, "2026-05");
assert.deepEqual(
  stats,
  { schoolCount: 3, entryCount: 4, hours: 3.5 },
  "month stats should count active rows, unique non-claim schools, and time hours"
);

const submission = getLatestSubmissionForMonth([
  { id: "old", month: "2026-05", submitted_at: "2026-05-20T00:00:00Z" },
  { id: "new", month: "2026-05", submitted_at: "2026-05-25T00:00:00Z" },
  { id: "other", month: "2026-04", submitted_at: "2026-05-26T00:00:00Z" },
], "2026-05");
assert.equal(submission.id, "new", "submission status should use the latest current-month submission");

console.log("employee-dashboard checks passed");
