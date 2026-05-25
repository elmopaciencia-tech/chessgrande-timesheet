import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "chess-timesheet.html"), "utf8");
const theme = fs.readFileSync(path.join(process.cwd(), "theme.css"), "utf8");
const heroMatch = html.match(/<section class="hero">[\s\S]*?<\/section>/);

assert.ok(heroMatch, "timesheet page should render the compact hero section");

const hero = heroMatch[0];

[
  "Streamlined Monthly Tracker",
  "<h1>Chess Grande Timesheet</h1>",
  'class="hero-stats"',
  'id="monthPicker"',
  'id="monthPickerFallback"',
  'id="monthNameSelect"',
  'id="monthYearSelect"',
  'id="schoolCount"',
  'id="entryCount"',
  'id="hoursCount"',
].forEach((snippet) => {
  assert.ok(hero.includes(snippet), `compact hero should include ${snippet}`);
});

[
  "How this page works",
  "Build the selected month before opening payroll.",
  "Review the month at a glance",
  "The page is structured like a working ledger",
  "Change the month first",
  "hero-guidance",
  "summary-strip",
  "summary-card",
].forEach((snippet) => {
  assert.ok(!html.includes(snippet), `timesheet header should remove ${snippet}`);
});

[
  "@media (max-width: 460px)",
  '.menu-button[data-has-profile-avatar="true"]',
  ".menu-button[data-has-profile-avatar=\"true\"] #userMenuButtonLabel",
  "font-size: 0;",
  ".menu-button[data-has-profile-avatar=\"true\"]::after",
  "display: none;",
  "@media (max-width: 400px)",
  ".app-header-title",
  "white-space: normal;",
  "max-width: 20ch;",
].forEach((snippet) => {
  assert.ok(theme.includes(snippet), `responsive header CSS should include ${snippet}`);
});

const compactPageExpectations = [
  {
    fileName: "chess-timesheet-pay.html",
    required: [
      "Monthly Payroll View",
      "<h1>Chess Grande Pay Summary</h1>",
      'class="hero-stats"',
      'id="monthPicker"',
      'id="monthPickerFallback"',
      'id="rateCount"',
      'id="hoursCount"',
      'id="summaryPay"',
      "S$0.00",
    ],
    removed: [
      "How this page works",
      "Review the selected month, then submit payroll.",
      "hero-guidance",
      "hero-intro",
      "month-box-note",
      "summary-strip",
      "summary-card",
    ],
  },
  {
    fileName: "manager-dashboard.html",
    required: [
      "Manager View",
      "<h1>Payroll Submissions</h1>",
      'class="hero-stats"',
      'id="submissionCount"',
      'id="employeeCount"',
      'id="totalSubmittedPay"',
      "$0.00",
    ],
    removed: [
      "Queue posture",
      "This dashboard is for sorting",
      "summary-strip",
      "summary-card",
    ],
  },
  {
    fileName: "webadmin-dashboard.html",
    required: [
      "Webadmin View",
      "<h1>User Profiles</h1>",
      'class="hero-stats"',
      'id="totalUsers"',
      'id="managerCount"',
      'id="webadminCount"',
    ],
    removed: [
      "Directory posture",
      "This is the maintenance layer",
      "summary-strip",
      "summary-card",
    ],
  },
  {
    fileName: "manager-entry.html",
    required: [
      "Manager View",
      'id="heroTitle"',
      'class="hero-stats"',
      'id="monthValue"',
      'id="entryCount"',
      'id="hoursCount"',
      'id="totalPayCount"',
      "S$0.00",
    ],
    removed: [
      "Submission posture",
      "Manager review stays tied",
      "hero-guidance",
      "hero-intro",
      "month-box-note",
      "summary-strip",
      "summary-card",
    ],
  },
  {
    fileName: "manager-drafts.html",
    required: [
      "Manager View",
      "<h1>Draft Timesheets</h1>",
    ],
    removed: [
      "Prefill employee coaching",
    ],
  },
];

compactPageExpectations.forEach(({ fileName, required, removed }) => {
  const source = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
  const pageHero = source.match(/<section class="hero">[\s\S]*?<\/section>/)?.[0] || "";
  assert.ok(pageHero, `${fileName} should render a compact hero`);
  required.forEach((snippet) => {
    assert.ok(pageHero.includes(snippet), `${fileName} compact hero should include ${snippet}`);
  });
  removed.forEach((snippet) => {
    assert.ok(!source.includes(snippet), `${fileName} compact hero should remove ${snippet}`);
  });
});

const payPage = fs.readFileSync(path.join(process.cwd(), "chess-timesheet-pay.html"), "utf8");
assert.match(
  payPage,
  /\.pay-card\s*\{\s*padding:\s*10px 12px;[^}]*gap:\s*7px;[^}]*border-radius:\s*18px;/is,
  "pay card should use tighter outer spacing"
);
assert.match(
  payPage,
  /\.pay-line\s*\{[^}]*align-items:\s*center;[^}]*gap:\s*8px;[^}]*padding:\s*4px 0;/is,
  "pay card rows should use a tighter vertical rhythm"
);
assert.match(
  payPage,
  /\.pay-line-field input\s*\{[^}]*min-height:\s*36px;[^}]*padding:\s*6px 9px;/is,
  "pay card inputs should override the page-wide large field height"
);

const managerDashboard = fs.readFileSync(path.join(process.cwd(), "manager-dashboard.html"), "utf8");
assert.match(
  managerDashboard,
  /class="hero-stat hero-stat-wide"><span class="stat-label">Total Submitted Pay<\/span><span class="stat-value" id="totalSubmittedPay"/,
  "manager dashboard total submitted pay should use the wide hero stat card"
);
assert.match(
  managerDashboard,
  /\.hero-stats\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/is,
  "manager dashboard hero stats should place the pay total below two count cards"
);
assert.match(
  managerDashboard,
  /\.hero-stat-wide\s*\{[^}]*grid-column:\s*1 \/ -1;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/is,
  "manager dashboard pay total card should span the stats grid as a rectangle"
);
assert.match(
  managerDashboard,
  /#totalSubmittedPay\s*\{[^}]*white-space:\s*nowrap;[^}]*word-break:\s*normal;/is,
  "manager dashboard totalSubmittedPay should stay on one line"
);

const managerEntry = fs.readFileSync(path.join(process.cwd(), "manager-entry.html"), "utf8");
assert.match(
  managerEntry,
  /<span class="stat-label">Total Pay<\/span><span class="stat-value" id="totalPayCount"/,
  "manager entry hero should show total pay instead of hourly rate"
);
assert.doesNotMatch(
  managerEntry,
  /id="rateCount"/,
  "manager entry hero should no longer render a rate stat"
);
assert.match(
  managerEntry,
  /class="hero-stat hero-stat-wide"><span class="stat-label">Total Pay<\/span><span class="stat-value" id="totalPayCount"/,
  "manager entry total pay should use the wide hero stat card"
);
assert.match(
  managerEntry,
  /\.hero-stats\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/is,
  "manager entry hero stats should place total pay below two count cards"
);
assert.match(
  managerEntry,
  /#totalPayCount\s*\{[^}]*white-space:\s*nowrap;/is,
  "manager entry totalPayCount should stay on one line"
);
assert.match(
  managerEntry,
  /<span>Rate<\/span><span id="payRate">S\$0\.00<\/span>/,
  "manager entry payroll snapshot should include the submitted hourly rate"
);
assert.match(
  managerEntry,
  /const payRate = document\.getElementById\("payRate"\)/,
  "manager entry script should bind the pay card rate element"
);
assert.match(
  managerEntry,
  /payRate\.textContent = formatCurrency\(submission\.hourlyRate \|\| 0\)/,
  "manager entry script should render the submitted rate in the pay card"
);

[
  "chess-timesheet.html",
  "chess-timesheet-pay.html",
  "manager-dashboard.html",
  "manager-entry.html",
  "manager-drafts.html",
].forEach((fileName) => {
  const source = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
  assert.ok(!source.includes('currency: "SGD"'), `${fileName} should not render currency with an SGD locale label`);
});

console.log("compact timesheet header checks passed");
