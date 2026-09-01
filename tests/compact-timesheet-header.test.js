import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "chess-timesheet.html"), "utf8");
const theme = fs.readFileSync(path.join(process.cwd(), "theme.css"), "utf8");
const heroMatch = html.match(/<section class="hero(?:\s+[^"]*)?"[^>]*>[\s\S]*?<\/section>/);

assert.ok(heroMatch, "timesheet page should render the compact hero section");

const hero = heroMatch[0];

assert.match(
  html,
  /<section class="panel" id="monthlyReviewPanel"[\s\S]*<input id="monthPicker" type="month" hidden>[\s\S]*<div class="calendar-month-nav" role="group" aria-label="Working month">[\s\S]*<button class="month-picker-nav-button" id="calendarMonthPrev"[\s\S]*<h2 id="calendarTitle" class="calendar-month-heading">[\s\S]*<select id="monthNameSelect"[\s\S]*<input id="monthYearSelect" type="number"[\s\S]*<button class="month-picker-nav-button" id="calendarMonthNext"/,
  "calendar view should include inline month and year controls with month seeking"
);
assert.match(
  html,
  /<section class="panel" id="monthlyReviewPanel"[\s\S]*<p class="panel-copy">Click the month or year above to change them, add all of your entries for this month, then finalize your timesheet in Submission View\.<\/p>/,
  "calendar view should explain how to change the working month and year"
);

[
  '<h1 class="v1-title"><span>Chess Grande</span> <span class="v1-accent">Timesheet</span></h1>',
  'class="v1-tally"',
  'id="schoolCount"',
  'id="entryCount"',
  'id="hoursCount"',
].forEach((snippet) => {
  assert.ok(hero.includes(snippet), `compact hero should include ${snippet}`);
});
[
  'class="v1-desk"',
  'href="#aiXlsxImportPanel"',
  'Import from Excel',
  'id="monthPickerControl"',
  'id="monthPickerTrigger"',
  'id="monthPickerLabel"',
  'id="monthPickerPanel"',
  'id="monthPickerFallback"',
  'id="monthPickerGrid"',
  'Working month',
].forEach((snippet) => {
  assert.ok(!hero.includes(snippet), `compact hero should remove ${snippet}`);
});
assert.ok(
  html.includes('id="monthPicker"') && html.includes('id="monthNameSelect"') && html.includes('id="monthYearSelect"'),
  "timesheet page should keep month state controls in the calendar panel"
);
assert.ok(
  !hero.includes("Streamlined Monthly Tracker"),
  "timesheet hero should avoid decorative tracker copy"
);
assert.match(
  html,
  /--space-5:\s*18px;[\s\S]*--space-6:\s*20px;[\s\S]*--space-7:\s*24px;/,
  "timesheet should use a compact shared spacing scale"
);
assert.match(
  html,
  /\.app-header-inner\s*\{[^}]*min-height:\s*64px;[\s\S]*\.hero-v1\s*\{[^}]*gap:\s*20px;[^}]*padding:\s*24px 24px 20px;/,
  "timesheet shell and masthead should use compact layout spacing"
);
assert.match(
  html,
  /input\[type="month"\],[\s\S]*min-height:\s*48px;[\s\S]*\.panel\s*\{[^}]*padding:\s*var\(--space-6\);[\s\S]*button\s*\{[^}]*min-height:\s*44px;/,
  "timesheet controls should stay compact without dropping below touch-target sizes"
);

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
      '<section class="hero hero-v1">',
      '<h1 class="v1-title"><span>Chess Grande</span> <span class="v1-accent">Pay Summary</span></h1>',
      'class="v1-tally"',
      'id="rateCount"',
      'id="hoursCount"',
      'id="summaryPay"',
      "S$0.00",
    ],
    removed: [
      "Monthly Payroll View",
      "How this page works",
      "Review the selected month, then submit payroll.",
      "hero-guidance",
      "hero-intro",
      "month-box-note",
      "summary-strip",
      "summary-card",
      'class="v1-desk"',
      'id="monthPickerControl"',
      'id="monthPickerFallback"',
    ],
  },
  {
    fileName: "manager-dashboard.html",
    required: [
      "Manager View",
      'class="v1-title"',
      'class="v1-rule"',
      'class="v1-tally"',
      'class="v1-metric"',
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
      "Manager Review",
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
  const pageHero =
    fileName === "manager-entry.html"
      ? source.match(/<div class="payroll-dossier-shell"[^>]*>[\s\S]*?<\/div>\s*<div class="workspace"/)?.[0] || ""
      : source.match(/<section class="hero(?:\s+[^"]*)?"[^>]*>[\s\S]*?<\/section>/)?.[0] || "";
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
  /<section class="hero hero-v1">[\s\S]*class="v1-title"[\s\S]*class="v1-tally"[\s\S]*id="rateCount"[\s\S]*id="hoursCount"[\s\S]*id="summaryPay"/,
  "pay page should match the timesheet masthead while retaining live payroll totals"
);
assert.ok(
  !payPage.includes('class="v1-desk"') && !payPage.includes('id="monthPickerControl"'),
  "pay page hero should not keep a separate working-month desk picker"
);
assert.match(
  payPage,
  /<section class="panel" id="payCalendarPanel"[\s\S]*<input id="monthPicker" type="month" hidden>[\s\S]*<div class="calendar-month-nav" role="group" aria-label="Working month">[\s\S]*<button class="month-picker-nav-button" id="calendarMonthPrev"[\s\S]*<h2 id="calendarTitle" class="calendar-month-heading">[\s\S]*<select id="monthNameSelect"[\s\S]*<input id="monthYearSelect" type="number"[\s\S]*<button class="month-picker-nav-button" id="calendarMonthNext"/,
  "pay calendar view should include inline month and year controls with month seeking"
);
assert.match(
  payPage,
  /function setupMonthPickerUi\(\)[\s\S]*calendarMonthPrev\.addEventListener\("click", \(\) => shiftMonthValue\(-1\)\);[\s\S]*calendarMonthNext\.addEventListener\("click", \(\) => shiftMonthValue\(1\)\);[\s\S]*monthNameSelect\.addEventListener\("change", onFallbackMonthChange\);[\s\S]*monthYearSelect\.addEventListener\("change", onFallbackMonthChange\);[\s\S]*monthYearSelect\.addEventListener\("blur", onYearInputBlur\);/s,
  "pay calendar month picker should wire inline month, year, and arrow navigation"
);
assert.ok(
  !payPage.includes("calendarTitle.textContent"),
  "pay calendar should keep inline month and year controls in calendarTitle"
);
assert.match(
  payPage,
  /\.hero-v1\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);[\s\S]*\.hero-v1 \.v1-title\s*\{[^}]*font-family:\s*Georgia,[^}]*font-weight:\s*400;[\s\S]*\.hero-v1 \.v1-metric-value\s*\{[^}]*font-family:\s*"Avenir Next",\s*"Segoe UI",\s*sans-serif;/is,
  "pay page should use the same editorial masthead proportions and title treatment as the timesheet"
);
[
  /\.hero-v1 \.v1-masthead\s*\{[^}]*container-type:\s*inline-size;/is,
  /\.hero-v1 \.v1-tally\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*padding:\s*0;/is,
  /\.hero-v1 \.v1-metric\s*\{[^}]*min-width:\s*0;[^}]*padding:\s*0 clamp\(/is,
  /\.hero-v1 \.v1-metric-value\s*\{[^}]*font-size:\s*clamp\([^}]*white-space:\s*nowrap;/is,
].forEach((pattern) => {
  assert.match(
    payPage,
    pattern,
    "pay page payroll metrics should stay in one shrinkable row and keep currency values intact"
  );
});
assert.doesNotMatch(
  payPage,
  /\.typeset-v3 #summaryPay\s*(?:,|\{)[^}]*font-family:\s*Georgia/is,
  "pay page calculated summary should not be forced back to the serif stat font"
);
assert.match(
  payPage,
  /@media \(max-width: 760px\)[\s\S]*body\.mobile-full-bleed \.hero-v1\s*\{[^}]*width:\s*100vw;[^}]*border-radius:\s*0;/is,
  "pay page masthead should retain the matching full-bleed mobile treatment"
);
assert.match(
  payPage,
  /\.pay-form\s*\{[^}]*display:\s*grid;[^}]*gap:\s*var\(--space-5\);/is,
  "pay form should sit directly in the panel without a nested card shell"
);
assert.match(
  payPage,
  /<form id="payForm" class="pay-form layout-v1">[\s\S]*<ul class="v1-tally" aria-label="Payroll summary">[\s\S]*class="v1-metric-label"[\s\S]*id="payMonth"[\s\S]*id="payHours"[\s\S]*id="payTotal"/,
  "pay summary should reuse the timesheet hero tally layout"
);
assert.match(
  payPage,
  /\.pay-form \.v1-tally\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[\s\S]*\.pay-form \.v1-metric-value\s*\{[^}]*font-size:\s*clamp\(0\.98rem,\s*5\.2cqi,\s*1\.22rem\);/is,
  "pay summary tally should keep three columns and scale type to the panel width"
);
assert.ok(
  !payPage.includes("pay-card-header") && !payPage.includes("Payroll card"),
  "pay profile panel should not repeat payroll card chrome inside the form"
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
  /class="v1-tally"[^>]*aria-label="Dashboard summary"/,
  "manager dashboard should expose a labeled payroll summary tally"
);
assert.match(
  managerDashboard,
  /class="v1-metric"[^>]*>[\s\S]*?id="submissionCount"[\s\S]*?class="v1-metric"[^>]*>[\s\S]*?id="totalSubmittedPay"/,
  "manager dashboard should keep submissions and pay in the hero tally"
);
assert.match(
  managerDashboard,
  /\.hero-v1\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/is,
  "manager dashboard hero should use the payroll masthead single-column layout"
);
assert.match(
  managerDashboard,
  /\.hero-v1 \.v1-tally\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/is,
  "manager dashboard hero tally should keep its metrics in one row"
);

const managerEntry = fs.readFileSync(path.join(process.cwd(), "manager-entry.html"), "utf8");
assert.match(
  managerEntry,
  /<span class="stat-label">Total Pay<\/span><span class="stat-value" id="totalPayCount"/,
  "manager entry hero should show total pay instead of hourly rate"
);
assert.match(
  managerEntry,
  /body\.mobile-full-bleed \.hero:not\(\.payroll-dossier\)/s,
  "manager entry mobile full-bleed should not pull the dossier title out of its shell"
);
assert.match(
  managerEntry,
  /@media \(max-width: 960px\)[\s\S]*\.payroll-dossier-summary\s*\{[\s\S]*calc\(-1 \* var\(--dossier-inline\)\)/s,
  "manager entry tablet summary should span the shell edges without a viewport breakout"
);
assert.match(
  managerEntry,
  /@media \(max-width: 960px\)[\s\S]*\.payroll-dossier h1\s*\{[^}]*font-size:\s*clamp\(2rem, 5\.4vw, 2\.75rem\);/s,
  "manager entry tablet title should stay readable inside the shell"
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
  /<span id="payRateLabel">Rate<\/span><span id="payRate">S\$0\.00<\/span>/,
  "manager entry payroll snapshot should include the submitted hourly or stipend rate"
);
assert.match(
  managerEntry,
  /const payRate = document\.getElementById\("payRate"\)/,
  "manager entry script should bind the pay card rate element"
);
assert.match(
  managerEntry,
  /payRateLabel\.textContent = submission\.payPolicy === "weekly_stipend" \? "Weekly stipend" : "Rate";[\s\S]*payRate\.textContent = formatCurrency\(/,
  "manager entry script should render the submitted rate for the active pay policy"
);
assert.match(
  managerEntry,
  /body\.mobile-full-bleed #managerCalendarPanel \.day\s*\{[^}]*min-height:\s*clamp\(104px, 24vw, 132px\);[^}]*aspect-ratio:\s*auto;[^}]*overflow:\s*visible;[\s\S]*body\.mobile-full-bleed #managerCalendarPanel \.chip\s*\{[^}]*font-size:\s*9px;[^}]*overflow:\s*visible;/s,
  "manager entry mobile calendar should expand like the employee timesheet calendar"
);
assert.match(
  managerEntry,
  /<body class="mobile-full-bleed">[\s\S]*id="managerCalendarPanel"[\s\S]*id="managerActivityPanel"[\s\S]*id="managerDetailsPanel"/s,
  "manager entry should opt its primary mobile surfaces into the full-bleed layout"
);
assert.match(
  managerEntry,
  /renderHeroTitle\(submission\.employeeName \|\| "Payroll Entry"\);[\s\S]*function renderHeroTitle\(value\)[\s\S]*className = "hero-title-line hero-title-accent";/s,
  "manager entry should retain the dynamic employee name while adding the mobile title accent"
);
assert.match(
  managerEntry,
  /@media \(max-width: 760px\)[\s\S]*\.payroll-dossier-summary \.month-box-header strong\s*\{[^}]*font-size:\s*clamp\(.66rem, 2.8vw, .76rem\);[\s\S]*\.payroll-dossier-summary \.month-box-value\s*\{[^}]*font-size:\s*clamp\(1\.18rem, 5vw, 1\.38rem\);[\s\S]*\.payroll-dossier-summary #totalPayCount\s*\{[^}]*font-size:\s*clamp\(1rem, 4vw, 1\.18rem\);[\s\S]*h1\s*\{[^}]*font-size:\s*clamp\(1\.62rem, 7\.4vw, 2\.08rem\);[\s\S]*@media \(max-width: 420px\)[\s\S]*h1\s*\{[^}]*font-size:\s*clamp\(1\.42rem, 7\.2vw, 1\.78rem\);[\s\S]*#totalPayCount\s*\{[^}]*font-size:\s*clamp\(.96rem, 4\.8vw, 1\.12rem\);/s,
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
  /const mobileComposerQuery = window\.matchMedia\("\(max-width: 960px\)"\)/,
  "timesheet mobile composer mode should align with the compact layout breakpoint at 960px"
);
assert.match(
  html,
  /@media \(max-width: 960px\)[\s\S]*\.entry-composer-modal\s*\{\s*display:\s*grid;\s*\}[\s\S]*\.entry-composer-modal-close\s*\{\s*display:\s*grid;\s*\}/,
  "timesheet tablet and mobile widths should enable the entry composer modal overlay"
);
assert.ok(
  !html.includes("reviewColumn.prepend(entryComposerPanel)"),
  "timesheet compact layout should not inline the composer in the review column"
);
assert.match(
  html,
  /function setupMonthPickerUi\(\)[\s\S]*calendarMonthPrev\.addEventListener\("click", \(\) => shiftMonthValue\(-1\)\);[\s\S]*calendarMonthNext\.addEventListener\("click", \(\) => shiftMonthValue\(1\)\);[\s\S]*monthNameSelect\.addEventListener\("change", onFallbackMonthChange\);[\s\S]*monthYearSelect\.addEventListener\("change", onFallbackMonthChange\);[\s\S]*monthYearSelect\.addEventListener\("blur", onYearInputBlur\);/s,
  "timesheet calendar month picker should wire inline month, year, and arrow navigation"
);
assert.match(
  html,
  /function renderCalendar\(activeEntries, monthValue\)[\s\S]*const groupedByDate = groupBy\(activeEntries, \(entry\) => entry\.date\);/s,
  "timesheet calendar render should not overwrite calendarTitle text content"
);
assert.ok(
  !html.includes("calendarTitle.textContent"),
  "timesheet calendar should keep inline month and year controls in calendarTitle"
);

[
  ["employee timesheet", "chess-timesheet.html"],
  ["pay review", "chess-timesheet-pay.html"],
].forEach(([label, fileName]) => {
  const source = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
  if (fileName === "chess-timesheet.html") {
    [
      "aspect-ratio: auto;",
      "min-height: clamp(96px, 22vw, 120px);",
      "overflow: visible;",
      "font-size: 9px;",
      "line-height: 1.1;",
    ].forEach((snippet) => {
      assert.ok(source.includes(snippet), `${label} mobile calendar should include ${snippet}`);
    });
  } else {
    assert.match(
      source,
      /@media \(max-width: 760px\)[\s\S]*\.day\s*\{[\s\S]*aspect-ratio:\s*1 \/ 1;[\s\S]*\.chip\s*\{[\s\S]*font-size:\s*9px;[\s\S]*overflow-wrap:\s*anywhere;/s,
      `${label} mobile calendar should use the shared 9px entry size`
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
