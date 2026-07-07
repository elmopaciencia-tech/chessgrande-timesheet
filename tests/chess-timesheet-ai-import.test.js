import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "chess-timesheet.html"), "utf8");

function extractFunction(source, name) {
  const asyncStart = source.indexOf(`async function ${name}`);
  const start = asyncStart === -1 ? source.indexOf(`function ${name}`) : asyncStart;
  assert.notEqual(start, -1, `expected to find function ${name}`);
  const parenStart = source.indexOf("(", start);
  let parenDepth = 0;
  let braceStart = -1;
  for (let index = parenStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth -= 1;
    if (parenDepth === 0) {
      braceStart = source.indexOf("{", index);
      break;
    }
  }
  assert.notEqual(braceStart, -1, `expected to find body for function ${name}`);
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
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      return source.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract function ${name}`);
}

const aiFunctionNames = [
  "parseAiImportJson",
  "repairAiImportJsonText",
  "validateAiDraftImportPlan",
  "normalizeAiDraftEntry",
  "normalizeAiDraftWarning",
  "normalizeAiPayCalculation",
  "validateAiMonth",
  "validateAiDate",
  "validateAiTime",
  "calculateAiDurationHours",
  "calculateAiEndTimeFromHours",
  "parseAiTimeMinutes",
  "normalizeAiNumber",
  "getAiEntrySourceRow",
  "normalizeAiEntryValidationWarning",
  "mergeAiWarnings",
  "getAiWarningTitle",
  "formatAiWarningMessage",
  "formatTimeHoursMismatchWarning",
];

function buildAiHarness() {
  const script = `
    const window = globalThis.window;
    const monthPicker = { value: "2026-06" };
    const defaultCalendarColor = "#B4CFA4";
    const aiAllowedEntryTypes = new Set(["School Coaching", "Replacement", "Claim", "Camp", "Private", "Event"]);
    const aiRequiredEntryFields = ["date", "type", "schoolName", "startTime", "endTime", "hours", "replacementName", "customRate", "claimNotes", "claimCost", "calendarColor"];
    const aiRequiredPayFields = ["standardRate", "schoolHours", "schoolPay", "importableClaimTotal", "importableTotal", "warningClaimTotal", "workbookClaimTotal", "workbookGrandTotal"];
    function trimHours(value) {
      return Number(value || 0).toFixed(2).replace(/\\.00$/, "").replace(/(\\.\\d)0$/, "$1");
    }
    function formatTime(value) {
      if (!value) return "";
      const [hours, minutes] = String(value).split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    function formatCurrency(value) {
      return "S$" + Number(value || 0).toFixed(2);
    }
    ${aiFunctionNames.map((name) => extractFunction(html, name)).join("\n")}
    return { parseAiImportJson, validateAiDraftImportPlan, getAiWarningTitle, formatAiWarningMessage };
  `;
  return Function(script)();
}

globalThis.window = {
  calendarEntryColors: {
    normalizeColor(value) {
      return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : "#B4CFA4";
    },
  },
};

const harness = buildAiHarness();

const hero = html.match(/<section class="hero">[\s\S]*?<\/section>/)?.[0] || "";
assert.match(
  hero,
  /Streamlined Monthly Tracker[\s\S]*<h1>Chess Grande Timesheet<\/h1>[\s\S]*href="#aiXlsxImportPanel"[\s\S]*Import from Excel/,
  "employee hero should show Import from Excel directly below the title"
);

const schoolLedgerIndex = html.indexOf('id="schoolLedgerPanel"');
const importPanelIndex = html.indexOf('id="aiXlsxImportPanel"');
assert.ok(schoolLedgerIndex > -1, "employee page should include the school ledger panel");
assert.ok(importPanelIndex > schoolLedgerIndex, "employee Excel import panel should be below the school ledger");

[
  'src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"',
  'id="aiXlsxFile"',
  'class="ai-upload-card"',
  'class="ai-upload-dropzone"',
  "max-width: none;",
  "width: 100%;",
  "grid-template-columns: auto minmax(0, 1fr);",
  ".ai-upload-label span",
  ".ai-upload-dropzone.is-dragging",
  'data-lucide="upload-cloud"',
  'class="ai-upload-selected"',
  'id="aiSelectedFileName"',
  'id="aiSelectedFileMeta"',
  "Recommended max. size: 10 MB, Accepted file types: XLSX.",
  "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);",
  "#aiParseXlsxButton",
  'id="aiParseXlsxButton"',
  'id="aiImportPreview"',
  'id="aiConfirmImportButton"',
  "function renderIcons()",
  "function selectAiImportFile(files)",
  'aiUploadDropzone.addEventListener("drop"',
  '"dragenter", "dragover"',
  "new DataTransfer()",
  "function formatMonthLabel(value)",
  "async function parseAiXlsxImport()",
  "function parseAiImportJson(content)",
  "function validateAiDraftImportPlan(plan",
  "convertXlsxFileToWorkbookText(file, importContext.month)",
  "callTimesheetXlsxParseWorker",
  "/api/timesheet-xlsx-parse",
  "setAiImportStatus(\"Importing...\", \"\", { loading: true })",
  'aiParseXlsxButton.textContent = isBusy ? "Importing..." : "Parse Excel"',
  "ai-import-status.warning",
  "plan.warnings.length ? \"warning\" : \"success\"",
  "window.draftTimesheetStore.insertEntriesWithDiagnostics(aiPendingImportPlan.entries",
  "createdBy: currentUser.id",
  "updatedBy: currentUser.id",
  "Imported claims still need proof before payroll submission.",
  "Check the month for missing dates, wrong times, duplicate entries, replacement names, and claim dates or costs before you submit.",
  'class="payroll-checklist"',
  "Scan for missing dates, duplicate entries, or work placed on the wrong day.",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `employee Excel import should include ${snippet}`);
});

[
  "https://openrouter.ai/api/v1/chat/completions",
  "aiOpenRouterKey",
  "aiOpenRouterModel",
  "Import Settings",
].forEach((forbiddenSnippet) => {
  assert.ok(!html.includes(forbiddenSnippet), `employee page should not expose ${forbiddenSnippet}`);
});

const repairedJson = harness.parseAiImportJson(`{
  "month": "2026-03",
  "entries": [
    {"date":"2026-03-01","type":"School Coaching","schoolName":"CG","startTime":"09:30","endTime":"11:00","hours":1.5,"replacementName":"","customRate":null,"claimNotes":"","claimCost":null,"calendarColor":"#B4CFA4"}
    {"date":"2026-03-02","type":"Claim","schoolName":"Claims","startTime":"","endTime":"","hours":0,"replacementName":"","customRate":null,"claimNotes":"Transport","claimCost":12.5,"calendarColor":"#B4CFA4"},
  ],
  "warnings": [],
  "payCalculation": {"standardRate":55,"schoolHours":1.5,"schoolPay":82.5,"importableClaimTotal":12.5,"importableTotal":95,"warningClaimTotal":0,"workbookClaimTotal":12.5,"workbookGrandTotal":95}
}`);
assert.equal(repairedJson.entries.length, 2, "employee AI JSON parser should repair missing commas");

const plan = harness.validateAiDraftImportPlan(repairedJson);
assert.equal(plan.entries[1].type, "Claim", "employee import should accept executable claim rows without proof");
assert.equal(plan.entries[1].claimImagePath, "", "imported claim rows should start without a proof path");
assert.equal(plan.entries[1].claimProofDataUrl, "", "imported claim rows should start without proof preview data");

const mismatchPlan = harness.validateAiDraftImportPlan({
  month: "2026-03",
  entries: [
    {
      date: "2026-03-03",
      type: "School Coaching",
      schoolName: "CG",
      startTime: "09:00",
      endTime: "10:00",
      hours: 2,
      replacementName: "",
      customRate: null,
      claimNotes: "",
      claimCost: null,
      calendarColor: "#B4CFA4",
      sourceRow: 37,
    },
    {
      date: "2026-03-04",
      type: "Claim",
      schoolName: "Claims",
      startTime: "",
      endTime: "",
      hours: 0,
      replacementName: "",
      customRate: null,
      claimNotes: "Transport",
      claimCost: 12.5,
      calendarColor: "#B4CFA4",
    },
  ],
  warnings: [],
  payCalculation: { standardRate: 55, schoolHours: 2, schoolPay: 110, importableClaimTotal: 12.5, importableTotal: 122.5, warningClaimTotal: 0, workbookClaimTotal: 12.5, workbookGrandTotal: 122.5 },
});
assert.equal(mismatchPlan.entries.length, 2, "employee import should still preview entries when one row has a warning");
assert.equal(mismatchPlan.entries[0].endTime, "11:00", "employee import should correct mismatched end time from hours");
assert.equal(mismatchPlan.warnings[0].type, "TimeHoursMismatch", "employee import should surface the mismatch as a warning");

const friendlyMismatchWarning = {
  sourceRow: 37,
  type: "TimeHoursMismatch",
  reason: "Interpreted duration from WARNING=timeHoursMismatch durationFromTimes=1 conflicts with row hours=60. Using correction endTime from calculatedEndFromHours (01:00).",
};
assert.equal(harness.getAiWarningTitle(friendlyMismatchWarning), "Time and hours need review (row 37)");
const friendlyMismatchText = harness.formatAiWarningMessage(friendlyMismatchWarning);
assert.match(friendlyMismatchText, /The time range and hours do not match/);
assert.match(friendlyMismatchText, /Please check this row before importing/);
assert.ok(!friendlyMismatchText.includes("durationFromTimes"), "employee warning should hide parser field names");
assert.ok(!friendlyMismatchText.includes("calculatedEndFromHours"), "employee warning should hide correction field names");

console.log("employee timesheet AI import checks passed");
