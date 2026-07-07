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
  'id="monthPickerControl"',
  'id="monthPickerTrigger"',
  'id="monthPickerLabel"',
  'id="monthPickerPanel"',
  'id="monthPickerFallback"',
  'id="monthNameSelect"',
  'id="monthYearSelect"',
  'id="monthPickerGrid"',
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

const webadminDashboard = fs.readFileSync(path.join(process.cwd(), "webadmin-dashboard.html"), "utf8");
[
  'class="admin-shell"',
  'class="admin-sidebar"',
  'class="member-board"',
  'class="member-table-head"',
  'id="totalUsers"',
  'id="managerCount"',
  'id="webadminCount"',
].forEach((snippet) => {
  assert.ok(webadminDashboard.includes(snippet), `webadmin dashboard compact directory should include ${snippet}`);
});
assert.ok(
  !webadminDashboard.includes('<section class="hero">'),
  "webadmin dashboard should use the compact member directory instead of the old hero"
);

const payPage = fs.readFileSync(path.join(process.cwd(), "chess-timesheet-pay.html"), "utf8");
assert.match(
  payPage,
  /class="hero-stat hero-stat-wide"><span class="stat-label">Calculated Pay<\/span><span class="stat-value" id="summaryPay"/,
  "pay page calculated pay should use the wide hero stat card"
);
assert.match(
  payPage,
  /\.hero-stats\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/is,
  "pay page hero stats should place calculated pay below rate and hours"
);
assert.match(
  payPage,
  /\.hero-stat-wide\s*\{[^}]*grid-column:\s*1 \/ -1;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/is,
  "pay page calculated pay card should span the stats grid as a rectangle"
);
assert.match(
  payPage,
  /#summaryPay\s*\{[^}]*white-space:\s*nowrap;[^}]*word-break:\s*normal;/is,
  "pay page summaryPay should stay on one line"
);
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
  "manager dashboard total submitted pay should keep the pay stat marker"
);
assert.match(
  managerDashboard,
  /\.hero-stats\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/is,
  "manager dashboard hero stats should keep submissions and pay in one row"
);
assert.match(
  managerDashboard,
  /\.hero-stat-wide\s*\{[^}]*grid-column:\s*auto;[^}]*grid-template-columns:\s*1fr;/is,
  "manager dashboard pay total card should no longer span the stats grid"
);
assert.match(
  managerDashboard,
  /#totalSubmittedPay\s*\{[^}]*white-space:\s*nowrap;[^}]*overflow-wrap:\s*normal;[^}]*word-break:\s*normal;/is,
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
  /@media \(max-width: 760px\)[\s\S]*\.entry-edit-grid\.compact,\s*\.entry-edit-grid\.edit-top-row\s*\{[^}]*grid-template-columns:\s*minmax\(118px,\s*0\.78fr\)\s*minmax\(0,\s*1\.22fr\);[\s\S]*\.entry-edit-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  "manager entry mobile composer should keep compact top rows and side-by-side save actions"
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
assert.match(
  managerEntry,
  /@media \(max-width: 760px\)[\s\S]*\.day\s*\{[\s\S]*aspect-ratio:\s*1 \/ 1;[\s\S]*\.chip\s*\{[\s\S]*font-size:\s*6px;[\s\S]*overflow-wrap:\s*anywhere;/s,
  "manager entry mobile calendar should stay squareish with compact 6px chip text"
);
assert.match(
  managerEntry,
  /@media \(max-width: 760px\)[\s\S]*\.month-box-header strong\s*\{[^}]*font-size:\s*clamp\(.66rem, 2.8vw, .76rem\);[\s\S]*\.month-box-value\s*\{[^}]*font-size:\s*clamp\(1.42rem, 6.8vw, 1.8rem\);[\s\S]*#totalPayCount\s*\{[^}]*font-size:\s*clamp\(1.08rem, 5.1vw, 1.32rem\);[\s\S]*h1\s*\{[^}]*font-size:\s*clamp\(1.62rem, 7.4vw, 2.08rem\);[\s\S]*@media \(max-width: 420px\)[\s\S]*h1\s*\{[^}]*font-size:\s*clamp\(1.42rem, 7.2vw, 1.78rem\);[\s\S]*#totalPayCount\s*\{[^}]*font-size:\s*clamp\(.96rem, 4.8vw, 1.12rem\);/s,
  "manager entry mobile hero should use a quieter manager review type hierarchy"
);
assert.match(
  managerEntry,
  /@media \(max-width: 760px\)[\s\S]*\.panel-copy\s*\{[^}]*font-size:\s*clamp\(.86rem, 3.4vw, .98rem\);[\s\S]*@media \(max-width: 420px\)[\s\S]*\.panel-copy\s*\{[^}]*font-size:\s*clamp\(.78rem, 3.5vw, .9rem\);/s,
  "manager entry panel copy should reduce font size as mobile width shrinks"
);
assert.match(
  managerEntry,
  /@media \(max-width: 420px\)[\s\S]*\.action-column \.panel h2\s*\{[^}]*font-size:\s*clamp\(1.35rem, 7.2vw, 1.7rem\);[\s\S]*\.action-column \.pay-line\s*\{[^}]*font-size:\s*clamp\(.9rem, 4.3vw, 1rem\);/s,
  "manager entry employee details panel should compact typography on narrow mobile widths"
);
assert.match(
  managerEntry,
  /@media \(max-width: 760px\)[\s\S]*\.action-column\s*\{\s*order:\s*-1;\s*\}[\s\S]*\.review-column\s*\{\s*order:\s*1;\s*\}/,
  "manager entry mobile layout should show employee details before review content"
);
assert.match(
  html,
  /if \(isMobileComposerMode\(\)\)[\s\S]*reviewColumn\.prepend\(monthlyReviewPanel\);[\s\S]*entryComposerModalBody\.appendChild\(entryComposerPanel\);[\s\S]*reviewColumn\.appendChild\(payrollHandoffPanel\);/,
  "timesheet mobile layout should keep calendar first and move the composer into a modal"
);
assert.match(
  html,
  /#monthPicker\s*\{\s*display:\s*none !important;\s*\}[\s\S]*\.month-picker-popover\s*\{[^}]*z-index:\s*1500;[\s\S]*\.month-picker-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/s,
  "timesheet page should use the custom month picker popover from the pay page"
);
assert.match(
  html,
  /@media \(max-width: 760px\)[\s\S]*\.month-picker-popover\s*\{[^}]*left:\s*50%;[^}]*right:\s*auto;[^}]*transform:\s*translateX\(-50%\);/s,
  "timesheet month picker popover should center on mobile"
);
assert.match(
  html,
  /\.hero\s*\{[^}]*z-index:\s*20;[^}]*overflow:\s*visible;[\s\S]*\.workspace\s*\{[^}]*z-index:\s*1;/s,
  "timesheet hero should let the month picker render above the workspace"
);
assert.match(
  html,
  /function setupMonthPickerUi\(\)[\s\S]*monthPickerTrigger\.addEventListener\("click", toggleMonthPickerPanel\);[\s\S]*monthPickerPrev\.addEventListener\("click", \(\) => shiftMonthValue\(-1\)\);[\s\S]*monthPickerNext\.addEventListener\("click", \(\) => shiftMonthValue\(1\)\);/s,
  "timesheet month picker should wire trigger and arrow navigation"
);
assert.match(
  html,
  /function renderMonthPickerGrid\(monthValue = monthPicker\.value\)[\s\S]*button\.className = "month-picker-month";[\s\S]*setMonthValue\(value\);[\s\S]*syncDateFieldToMonth\(\);[\s\S]*syncPayrollLink\(\);[\s\S]*syncQuickAddSaveButton\(\);[\s\S]*render\(\);/s,
  "timesheet month picker grid should refresh the timesheet when a month is selected"
);

[
  ["employee timesheet", "chess-timesheet.html"],
  ["pay review", "chess-timesheet-pay.html"],
].forEach(([label, fileName]) => {
  const source = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
  if (fileName === "chess-timesheet.html") {
    [
      "aspect-ratio: auto;",
      "min-height: clamp(104px, 24vw, 132px);",
      "overflow: visible;",
      "font-size: 6px;",
      "line-height: 1.1;",
    ].forEach((snippet) => {
      assert.ok(source.includes(snippet), `${label} mobile calendar should include ${snippet}`);
    });
  } else {
    assert.match(
      source,
      /@media \(max-width: 760px\)[\s\S]*\.day\s*\{[\s\S]*aspect-ratio:\s*1 \/ 1;[\s\S]*\.chip\s*\{[\s\S]*font-size:\s*6px;[\s\S]*overflow-wrap:\s*anywhere;/s,
      `${label} mobile calendar should stay squareish with compact 6px chip text`
    );
  }
  assert.match(
    source,
    /@media \(max-width: 760px\)[\s\S]*\.panel-copy\s*\{[^}]*font-size:\s*clamp\(0?\.86rem, 3\.4vw, 0?\.98rem\);[\s\S]*@media \(max-width: 420px\)[\s\S]*\.panel-copy\s*\{[^}]*font-size:\s*clamp\(0?\.78rem, 3\.5vw, 0?\.9rem\);/s,
    `${label} panel copy should reduce font size as mobile width shrinks`
  );
  assert.match(
    source,
    fileName === "chess-timesheet.html"
      ? /@media \(max-width: 760px\)[\s\S]*\.review-column\s*\{\s*order:\s*1;\s*\}[\s\S]*\.action-column\s*\{\s*order:\s*2;\s*\}/
      : /@media \(max-width: 760px\)[\s\S]*\.action-column\s*\{\s*order:\s*-1;\s*\}[\s\S]*\.review-column\s*\{\s*order:\s*1;\s*\}/,
    fileName === "chess-timesheet.html"
      ? `${label} mobile layout should keep review content before action details`
      : `${label} mobile layout should show action details before review content`
  );
});

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
