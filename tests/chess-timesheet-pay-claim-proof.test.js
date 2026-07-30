import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "chess-timesheet-pay.html"), "utf8");

assert.match(
  html,
  /<section class="hero hero-v1">[\s\S]*<p class="v1-kicker" id="payViewEyebrow">[\s\S]*<h1 class="v1-title"><span>Chess Grande<\/span> <span class="v1-accent">Pay Summary<\/span><\/h1>[\s\S]*class="v1-tally"[\s\S]*id="rateCount"[\s\S]*id="hoursCount"[\s\S]*id="summaryPay"[\s\S]*class="v1-desk"[\s\S]*id="monthPickerControl"/,
  "pay review should reuse the timesheet masthead with payroll totals and month controls"
);

[
  "const claimsMissingProof = activeEntries.filter(isClaimMissingProof)",
  "Some imported claims still need proof images before submission.",
  "function isClaimMissingProof(entry)",
  'entry?.type === "Claim"',
  "entry.claimImagePath || entry.claimProofDataUrl",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `pay submission should require claim proof via ${snippet}`);
});

assert.match(
  html,
  /if \(\!activeEntries\.length\)[\s\S]*const claimsMissingProof = activeEntries\.filter\(isClaimMissingProof\)[\s\S]*if \(claimsMissingProof\.length\)[\s\S]*return;/,
  "claim proof validation should run after active-entry validation and before submission insert"
);

[
  'id="exportSubmissionButton"',
  "Export Submission",
  'id="removeSubmissionButton"',
  "Undo Submission",
  'id="exportStatus"',
  'id="submissionExportView"',
  "Payroll Submission",
  "Submitted Payroll Snapshot",
  "Entries By Activity",
  'id="exportPayRate"',
  'id="exportPayHours"',
  'id="exportPayTotal"',
  'id="exportPayBankName"',
  'id="exportPayAccountType"',
  'id="exportPayBank"',
  "submission-export-details",
  "submission-export-detail-row",
  "function parseClaimNotePayload(rawValue)",
  "function resolveClaimImageUrl(storedValue)",
  "function getClaimProofName(storedValue)",
  "function formatHoursCell(entry)",
  "function formatDateLong(value)",
  'id="monthPickerTrigger"',
  'id="monthPickerPanel"',
  'id="monthPickerGrid"',
  'data-lucide="chevron-left"',
  'data-lucide="chevron-right"',
  "function renderMonthPickerGrid(monthValue = monthPicker.value)",
  "function shiftMonthValue(offset)",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `pay export should include ${snippet}`);
});

assert.match(
  html,
  /<input id="monthPicker" type="month">[\s\S]*class="month-picker"[\s\S]*id="monthPickerTrigger"[\s\S]*aria-controls="monthPickerPanel"[\s\S]*id="monthPickerPanel"[\s\S]*id="monthPickerGrid"/,
  "working month should use a custom popover picker while retaining the hidden month value"
);
assert.match(
  html,
  /function renderMonthPickerGrid\(monthValue = monthPicker\.value\)[\s\S]*button\.dataset\.monthValue = value[\s\S]*button\.classList\.toggle\("is-selected"[\s\S]*setMonthValue\(value\)[\s\S]*render\(\)/,
  "custom month picker grid should select a month and rerender the pay view"
);
assert.match(
  html,
  /\.hero\s*\{[\s\S]*z-index:\s*20;[\s\S]*overflow:\s*visible;/,
  "working month popover should not be clipped or covered by the hero card"
);
assert.match(
  html,
  /\.workspace\s*\{[\s\S]*z-index:\s*1;/,
  "content below the hero should stay below the open working month popover"
);
assert.match(
  html,
  /@media \(max-width: 760px\)[\s\S]*\.month-picker-popover\s*\{[^}]*left:\s*50%;[^}]*right:\s*auto;[^}]*transform:\s*translateX\(-50%\);/s,
  "working month popover should center on mobile"
);
assert.match(
  html,
  /@media \(max-width: 760px\)[\s\S]*\.entry-edit-grid\.compact,\s*\.entry-edit-grid\.edit-top-row\s*\{[^}]*grid-template-columns:\s*minmax\(118px,\s*0\.78fr\)\s*minmax\(0,\s*1\.22fr\);[\s\S]*\.entry-edit-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
  "pay mobile entry composer should keep date and type in one row and save actions side by side"
);
assert.match(
  html,
  /@media \(max-width: 760px\)[\s\S]*\.day\.has-entries\s*\{[^}]*aspect-ratio:\s*auto;[^}]*min-height:\s*86px;[^}]*overflow:\s*visible;/s,
  "pay mobile calendar days with entries should expand vertically"
);
assert.match(
  html,
  /@media \(max-width: 760px\)[\s\S]*\.day\.has-entries \.day-items\s*\{[^}]*overflow:\s*visible;[\s\S]*\.day\.has-entries \.chip\s*\{[^}]*overflow:\s*visible;[^}]*white-space:\s*normal;/s,
  "pay mobile entry chips should show their complete content"
);
assert.match(
  html,
  /const dayEntries = groupedByDate\[key\] \|\| \[\];[\s\S]*cell\.classList\.add\("has-entries"\)[\s\S]*dayEntries\.forEach\(/,
  "pay calendar should mark days that contain entries for the responsive layout"
);
assert.match(
  html,
  /\.calendar-week\s*\{[^}]*grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\);[^}]*align-items:\s*stretch;/,
  "pay calendar should use seven-column week rows that stretch days to the row height"
);
assert.match(
  html,
  /weekRow\.className = "calendar-week is-empty";[\s\S]*weekRow\.classList\.add\("has-entries"\)[\s\S]*weekRow\.classList\.remove\("is-empty"\)/,
  "pay calendar should keep empty weeks squareish and expand populated weeks"
);

assert.ok(
  !html.includes("Remove Submission"),
  "pay page should use Undo Submission wording"
);
assert.match(
  html,
  /<h2>Entries By Activity<\/h2>[\s\S]*id="schoolGroups"[\s\S]*id="exportSubmissionButton">Export Submission<\/button>[\s\S]*id="removeSubmissionButton">Undo Submission<\/button>/,
  "export and undo submission actions should render below the activity entries"
);
assert.match(
  html,
  /<form id="payForm"[\s\S]*<div class="actions pay-actions"><button class="primary" type="submit" id="submitToServer">Submit Payroll<\/button><a class="secondary nav-link" href="\.\/chess-timesheet\.html">Back To Timesheet<\/a><\/div><div class="status-message" id="submitStatus"><\/div><\/form>/,
  "payroll profile actions should only keep submit and back controls"
);
assert.ok(
  !html.includes('<input id="hourlyRate"'),
  "pay card should not edit hourly rate inline"
);
assert.match(
  html,
  /<div class="pay-line"><span id="payRateLabel">Pay Per Hour<\/span><span id="hourlyRate"/,
  "pay card should show the configured hourly or stipend rate as read-only profile data"
);
assert.ok(
  html.includes('const hourlyRateDisplay = document.getElementById("hourlyRate");'),
  "pay page should treat hourly rate as display-only"
);
assert.ok(
  !html.includes("hourlyRateInput.addEventListener"),
  "pay page should not attach inline hourly-rate edit listeners"
);
assert.ok(
  html.includes("hourlyRate: Number(currentProfile?.hourly_rate ?? localProfile.hourlyRate ?? 0)"),
  "pay page should prefer the centrally managed profile hourly rate"
);
assert.ok(
  html.includes("const displayedRate = isWeeklyStipendProfile()")
    && html.includes("hourlyRateDisplay.textContent = formatCurrency(displayedRate || 0);"),
  "pay page should display the manager-updated rate for the active pay policy"
);
assert.ok(
  html.includes("function isPayrollSummaryEntry(entry)"),
  "pay page should define which rows appear in the payroll summary"
);
assert.match(
  html,
  /function isPayrollSummaryEntry\(entry\)[\s\S]*window\.draftTimesheetStore\.isActive\(entry\)[\s\S]*window\.draftTimesheetStore\.isSubmitted\(entry\)/,
  "payroll summary should include active and submitted draft rows"
);
assert.match(
  html,
  /function render\(\)[\s\S]*const summaryEntries = monthEntries\.filter\(isPayrollSummaryEntry\)[\s\S]*const totalHours = summaryEntries\.reduce[\s\S]*const totalPay = summaryEntries\.reduce/,
  "payroll profile totals should include submitted entries when rendering"
);
assert.match(
  html,
  /\.typeset-v3 #payTotal\s*\{[^}]*font-family:\s*"Avenir Next",\s*"Segoe UI",\s*sans-serif;/,
  "calculated pay should use the same sans-serif font as the rest of the payroll card"
);

assert.match(
  html,
  /function exportSubmittedPayrollPdf\(\)[\s\S]*loadLatestSubmittedPayrollForMonth\(user\.id, selectedMonth\)/,
  "export should use the shared latest submitted payroll lookup"
);
assert.match(
  html,
  /async function loadLatestSubmittedPayrollForMonth\(userId, selectedMonth\)[\s\S]*\.from\("payroll_submissions"\)[\s\S]*\.eq\("employee_id", userId\)[\s\S]*\.eq\("month", selectedMonth\)[\s\S]*\.order\("submitted_at", \{ ascending: false \}\)[\s\S]*\.limit\(1\)/,
  "pay page actions should share the latest submitted payroll lookup"
);
assert.match(
  html,
  /async function removeSubmittedPayroll\(\)[\s\S]*loadLatestSubmittedPayrollForMonth\(user\.id, selectedMonth\)[\s\S]*No submitted payroll found for this month\./,
  "remove should show a clear message when the selected month has no submission"
);
assert.match(
  html,
  /async function removeSubmittedPayroll\(\)[\s\S]*submissionRow\.paid_at[\s\S]*This submission has already been marked paid\. Contact a manager if it needs changes\./,
  "remove should block paid submissions"
);
assert.match(
  html,
  /async function removeSubmittedPayroll\(\)[\s\S]*window\.draftTimesheetStore\.unlockSubmittedBySubmission\(submissionRow\.id, user\.id\)[\s\S]*\.from\("payroll_submissions"\)[\s\S]*\.delete\(\)[\s\S]*\.eq\("id", submissionRow\.id\)[\s\S]*\.eq\("employee_id", user\.id\)[\s\S]*\.is\("paid_at", null\)/,
  "remove should unlock linked source drafts before deleting the unpaid submission"
);
assert.match(
  html,
  /async function removeSubmittedPayroll\(\)[\s\S]*const unlockedRows = await window\.draftTimesheetStore\.unlockSubmittedBySubmission\(submissionRow\.id, user\.id\)[\s\S]*if \(deleteError\) \{[\s\S]*relockSubmissionDrafts\(unlockedRows, submissionRow\.id, user\.id\)[\s\S]*if \(!deletedRows\?\.length\) \{[\s\S]*relockSubmissionDrafts\(unlockedRows, submissionRow\.id, user\.id\)[\s\S]*async function relockSubmissionDrafts\(unlockedRows, submissionId, userId\)[\s\S]*window\.draftTimesheetStore\.markSubmitted\(ids, submissionId, userId\)/,
  "remove should relock source drafts if the final submission delete does not complete"
);
assert.match(
  html,
  /async function removeSubmittedPayroll\(\)[\s\S]*entries = await loadEntries\(\)[\s\S]*render\(\)[\s\S]*Your timesheet rows are editable again\./,
  "remove should reload and rerender after success"
);
assert.match(
  html,
  /function loadSubmittedPayrollEntries\(submissionId\)[\s\S]*\.from\("payroll_entries"\)[\s\S]*\.eq\("submission_id", submissionId\)/,
  "export should load payroll entries for the selected submission"
);
assert.match(
  html,
  /function exportSubmittedPayrollPdf\(\)[\s\S]*renderSubmissionExportView\([\s\S]*window\.print\(\)/,
  "export should render the print view before opening the browser print dialog"
);
assert.match(
  html,
  /window\.addEventListener\("afterprint", cleanupSubmissionExportView\)/,
  "export should clean up print-only state after printing"
);
assert.match(
  html,
  /Submit payroll for this month before exporting a PDF\./,
  "export should show a clear message when the month has no submitted payroll"
);
assert.match(
  html,
  /@media print[\s\S]*\.app-header[\s\S]*display: none[\s\S]*#submissionExportView[\s\S]*display: block/s,
  "print CSS should hide app chrome and show the dedicated export view"
);
assert.match(
  html,
  /@page\s*\{[\s\S]*margin:\s*6mm;[\s\S]*\.submission-export\s*\{[\s\S]*width:\s*100%;[\s\S]*font-size:\s*7pt;[\s\S]*\.submission-export-layout\s*\{[\s\S]*grid-template-columns:\s*132mm minmax\(0, 54mm\);[\s\S]*\.submission-export-main\s*\{[\s\S]*display:\s*contents;[\s\S]*\.submission-export-main \.submission-export-section:nth-child\(2\)\s*\{[\s\S]*grid-column:\s*1 \/ -1;[\s\S]*\.submission-export \.groups\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[\s\S]*\.submission-export table\s*\{[\s\S]*display:\s*table !important;[\s\S]*\.submission-export td::before\s*\{[\s\S]*content:\s*none !important;/s,
  "print export should use a compact one-page-oriented layout"
);
assert.match(
  html,
  /\.submission-export \.submission-export-detail-row\s*\{[\s\S]*font-size:\s*7\.5pt;[\s\S]*line-height:\s*1\.16;/s,
  "print employee details should stay readable"
);

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `expected to find function ${name}`);
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract function ${name}`);
}

const maliciousProofUrl = 'https://invalid.example/proof" onerror="globalThis.claimProofXss = true';
for (const fileName of [
  "chess-timesheet.html",
  "chess-timesheet-pay.html",
  "manager-entry.html",
]) {
  const source = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
  const renderImageCell = Function(`
    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    ${extractNamedFunction(source, "formatImageCell")}
    return formatImageCell;
  `)();
  const markup = renderImageCell({
    type: "Claim",
    claimProofDataUrl: maliciousProofUrl,
    claimProofName: "Proof",
  });
  assert.doesNotMatch(
    markup,
    /"\s+onerror=/i,
    `${fileName} should not turn a stored claim-proof URL into an executable attribute`
  );
  assert.ok(
    !markup.includes(maliciousProofUrl),
    `${fileName} should HTML-escape a claim-proof URL before interpolation`
  );
}

console.log("pay claim proof and export submission checks passed");
