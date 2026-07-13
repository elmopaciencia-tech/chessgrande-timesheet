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
  "Dashboard",
  "id=\"nextClassTitle\"",
  "id=\"nextClassIcon\"",
  "id=\"weeklySchedule\"",
  "id=\"schoolCount\"",
  "id=\"entryCount\"",
  "id=\"hoursCount\"",
  "id=\"entryActivityScroll\"",
  "id=\"entryActivityMonths\"",
  "id=\"entryActivityCalendar\"",
  "id=\"entryActivityError\"",
  "id=\"entryActivityTooltip\"",
  "entry-activity-grid",
  "entry-activity-month-label",
  "entry-activity-view-switch",
  "data-activity-view=\"daily\"",
  "data-activity-view=\"weekly\"",
  "data-activity-view=\"cumulative\" aria-pressed=\"true\"",
  "Cumulative Hours",
  "Daily",
  "Weekly",
  "Cumulative",
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
  "Review this month's payroll.",
  "Review and submit payroll.",
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
  "const item = document.createElement(\"a\")",
  "`./chess-timesheet-pay.html?month=${encodeURIComponent(month)}`",
  "renderIcons();",
  "getUpcomingClassEntries(entries, new Date(), 60)",
  "getUpcomingClassEntries(entries, new Date(), 7)",
  "getCurrentMonthStats(entries, monthKey)",
  "renderCumulativeHours(entries, today)",
  "renderCumulativeHoursError()",
  "scrollEntryActivityToCurrentMonth(days, today)",
  "getCumulativeHourDays(entries, today)",
  "getCumulativeHourWeeks(days, entries, today)",
  "setActivityView(button.dataset.activityView)",
  "renderCumulativeHourView()",
  "getActivityFillLevel(week.hours, maxWeeklyHours)",
  "getActivityFillLevel(week.cumulativeHours, maxCumulativeHours)",
  "getCumulativeHourColor(day.hours)",
  "showEntryActivityTooltip(cell, tooltipText, event)",
  "document.body.appendChild(entryActivityTooltip)",
  "cell.addEventListener(\"mousemove\", positionEntryActivityTooltip)",
  "event.clientX + pointerOffset",
  "event.clientY + pointerOffset",
  "during week of",
  "through week of",
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
assert.match(
  html,
  /\.entry-activity-scroll \{[\s\S]*?overflow-x: auto;[\s\S]*?overflow-y: hidden;/,
  "entry activity should only scroll horizontally"
);
assert.match(
  html,
  /\.entry-activity-grid \{[\s\S]*?grid-template-rows: repeat\(7, 12px\);/,
  "cumulative hours grid should keep seven daily cells in every week column"
);
assert.match(
  html,
  /<div class="entry-activity-grid" id="entryActivityCalendar"><\/div>[\s\S]*?<div class="entry-activity-months" id="entryActivityMonths"/,
  "cumulative hours should render month labels below the activity grid"
);
assert.match(
  html,
  /\.entry-activity-tooltip \{[\s\S]*?position: fixed;[\s\S]*?z-index: 2147483647;[\s\S]*?pointer-events: none;/,
  "activity tooltips should float above the scrolling grid without intercepting input"
);
assert.match(
  html,
  /function renderCumulativeHoursError\(\) \{[\s\S]*?entryActivityScroll\.hidden = true;[\s\S]*?entryActivityError\.hidden = false;[\s\S]*?hideEntryActivityTooltip\(\);/,
  "cumulative hours should expose a clear unavailable state when entries fail to load"
);
assert.match(
  html,
  /@media \(max-width: 640px\) \{[\s\S]*?\.stat-grid \{[^}]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[^}]*?gap: 8px;/,
  "month progress stats should stay in one compact row on mobile"
);
assert.match(
  html,
  /@media \(max-width: 640px\) \{[\s\S]*?\.history-item \{[\s\S]*?grid-template-columns: auto minmax\(0, 1fr\);[\s\S]*?\.history-item > \.badge \{[\s\S]*?grid-column: 1 \/ -1;/,
  "payment history content should stay aligned beside its icon on mobile"
);
assert.match(
  html,
  /@media \(max-width: 640px\) \{[\s\S]*?\.notice-actions \{[\s\S]*?position: absolute;[\s\S]*?top: 12px;[\s\S]*?right: 12px;/,
  "notice actions should sit in the top-right corner on mobile"
);
[
  "Check what is coming up, keep this month tidy, and catch payroll updates from one place.",
  "Upcoming active sessions from your timesheet drafts.",
  "Manager updates and paid confirmations.",
  "Recent submitted payroll months.",
  "This month has not been submitted yet. Open the submission view when your timesheet is ready.",
].forEach((verboseCopy) => {
  assert.ok(!html.includes(verboseCopy), `dashboard should remove redundant copy: ${verboseCopy}`);
});
assert.ok(
  html.includes('submissionStatusCopy.textContent = "Submit when this month is ready.";'),
  "submission status should use concise not-submitted copy"
);
assert.match(
  html,
  /submissionStatusCopy\.textContent = `\$\{submission\.month_label \|\| submission\.month\} · (?:Paid|Submitted)/,
  "submission status details should use compact state copy"
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
  "formatDateKey",
  "getUpcomingClassEntries",
  "getCurrentMonthStats",
  "getCumulativeHourDays",
  "getCumulativeHourWeeks",
  "getActivityFillLevel",
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
    getCumulativeHourDays,
    getCumulativeHourWeeks,
    getActivityFillLevel,
    getLatestSubmissionForMonth
  };
`);
const {
  canSeeManagerDashboard,
  canSeeWebAdminDashboard,
  getUpcomingClassEntries,
  getCurrentMonthStats,
  getCumulativeHourDays,
  getCumulativeHourWeeks,
  getActivityFillLevel,
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

const activityDays = getCumulativeHourDays(entries, new Date(2026, 4, 30, 12));
assert.equal(activityDays.length, 371, "cumulative hours should render a fixed 53-week calendar");
const may26 = activityDays.find((day) => day.dateKey === "2026-05-26");
const may27 = activityDays.find((day) => day.dateKey === "2026-05-27");
const may29 = activityDays.find((day) => day.dateKey === "2026-05-29");
assert.equal(may26.hours, 2, "cumulative hours should sum active hours on a date");
assert.equal(may27.hours, 1, "cumulative hours should include submitted hours and ignore zero-hour claims");
assert.equal(may29.hours, 0, "cumulative hours should leave zero-hour event and cost rows unfilled");
assert.equal(activityDays[0].weekday, 0, "cumulative hours should start on Sunday for stable week columns");
assert.equal(
  activityDays.find((day) => day.dateKey === "2026-05-01").isMonthStart,
  true,
  "cumulative hours should mark month boundaries"
);
assert.equal(
  activityDays.find((day) => day.dateKey === "2026-05-01").monthLabel,
  "May",
  "cumulative hours should label month boundaries"
);

const cumulativeEntries = [
  { status: "active", type: "School Coaching", date: "2026-05-24", hours: 2 },
  { status: "submitted", type: "Private", date: "2026-05-30", hours: 1.5 },
  { status: "submitted", type: "Camp", date: "2024-01-10", hours: 4 },
  { status: "active", type: "Claim", date: "2026-05-29", hours: 0 },
  { status: "active", type: "Event", date: "2026-05-28", hours: -2 },
  { status: "active", type: "School Coaching", date: "2026-05-31", hours: 9 },
];
const cumulativeDays = getCumulativeHourDays(cumulativeEntries, new Date(2026, 4, 30, 12));
const cumulativeWeeks = getCumulativeHourWeeks(cumulativeDays, cumulativeEntries, new Date(2026, 4, 30, 12));
assert.equal(cumulativeWeeks.length, 53, "weekly and cumulative views should preserve 53 stable week columns");
assert.equal(cumulativeWeeks.at(-1).hours, 3.5, "weekly activity should include active and submitted hours through today");
assert.equal(cumulativeWeeks.at(-1).cumulativeHours, 7.5, "cumulative activity should include history before the visible year");
assert.equal(cumulativeWeeks.at(-1).cumulativeHours < 16.5, true, "future and non-positive rows should not affect cumulative activity");
assert.equal(getActivityFillLevel(0, 7), 0, "empty weeks should leave all seven cells unfilled");
assert.equal(getActivityFillLevel(1, 7), 1, "small positive weeks should remain visible");
assert.equal(getActivityFillLevel(3.5, 7), 4, "weekly bars should scale proportionally across seven cells");
assert.equal(getActivityFillLevel(7, 7), 7, "the maximum week should fill its full column");

const submission = getLatestSubmissionForMonth([
  { id: "old", month: "2026-05", submitted_at: "2026-05-20T00:00:00Z" },
  { id: "new", month: "2026-05", submitted_at: "2026-05-25T00:00:00Z" },
  { id: "other", month: "2026-04", submitted_at: "2026-05-26T00:00:00Z" },
], "2026-05");
assert.equal(submission.id, "new", "submission status should use the latest current-month submission");

console.log("employee-dashboard checks passed");
