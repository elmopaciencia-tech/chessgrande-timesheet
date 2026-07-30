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
  "convertXlsxFileToWorkbookText",
  "buildAiWorkbookInterpretation",
  "buildAiLegacyFlatSessionInterpretation",
  "buildAiSessionInterpretation",
  "getAiSectionColumnMap",
  "findAiSectionHeaderRow",
  "buildAiClaimInterpretation",
  "getAiCellText",
  "normalizeWorkbookNumber",
  "normalizeWorkbookTime",
  "normalizeWorkbookDate",
  "normalizeWorkbookYear",
  "formatDateParts",
  "formatUtcDate",
  "getWorkbookMonthStartDate",
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
  "getAiEntrySourceRef",
  "getAiEntryReviewId",
  "attachAiWarningToEntry",
  "normalizeAiEntryValidationWarning",
  "mergeAiWarnings",
  "filterAiImportWarningsForRemovedEntry",
  "revalidateAiImportWarningsForEntry",
  "isAiImportEventCostEntry",
  "isAiImportTimeHoursMismatch",
  "getAiWarningEntryContext",
  "formatAiWarningDate",
  "getAiWarningTitle",
  "formatAiWarningMessage",
  "formatTimeHoursMismatchWarning",
  "getAiImportTableColumns",
  "recalculateAiImportPayCalculation",
  "renderAiImportTable",
  "beginAiImportParseRequest",
  "invalidateAiImportParseRequest",
  "isAiImportParseRequestCurrent",
];

function buildAiHarness(source = html) {
  const script = `
    const window = globalThis.window;
    const monthPicker = { value: "2026-06" };
    let aiImportParseRequestId = 0;
    let aiImportParseInFlight = false;
    const defaultCalendarColor = "#B4CFA4";
    const aiWorkbookTextLimit = 52000;
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
    function formatDateInput() {
      return "2026-06-01";
    }
    function formatLongDate(value) {
      return String(value || "");
    }
    function formatTimeRange(entry) {
      return entry.startTime && entry.endTime ? entry.startTime + "-" + entry.endTime : "-";
    }
    function formatEntryType(entry) {
      return escapeHtml(entry.type || "");
    }
    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    const editEntryIconSvg = "<svg></svg>";
    const trashEntryIconSvg = "<svg></svg>";
    ${aiFunctionNames.map((name) => extractFunction(source, name)).join("\n")}
    return {
      convertXlsxFileToWorkbookText,
      buildAiWorkbookInterpretation,
      parseAiImportJson,
      validateAiDraftImportPlan,
      getAiWarningEntryContext,
      getAiWarningTitle,
      formatAiWarningMessage,
      getAiImportTableColumns,
      recalculateAiImportPayCalculation,
      renderAiImportTable,
      filterAiImportWarningsForRemovedEntry,
      revalidateAiImportWarningsForEntry,
      beginAiImportParseRequest,
      invalidateAiImportParseRequest,
      isAiImportParseRequestCurrent,
    };
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

const harness = buildAiHarness(html);
const secondaryHarness = harness;

const hero = html.match(/<section class="hero(?:\s+[^"]*)?">[\s\S]*?<\/section>/)?.[0] || "";
assert.match(
  hero,
  /<h1[^>]*>[\s\S]*Chess Grande[\s\S]*Timesheet[\s\S]*<\/h1>[\s\S]*href="#aiXlsxImportPanel"[\s\S]*Import from Excel/,
  "employee hero should show Import from Excel directly below the title"
);

const schoolLedgerIndex = html.indexOf('id="schoolLedgerPanel"');
const importPanelIndex = html.indexOf('id="aiXlsxImportPanel"');
assert.ok(schoolLedgerIndex > -1, "employee page should include the activity summary panel");
assert.ok(importPanelIndex > schoolLedgerIndex, "employee Excel import panel should be below the activity summary");

[
  'src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"',
  'id="aiXlsxFile"',
  'class="ai-upload-card"',
  'class="ai-upload-dropzone"',
  'id="aiUploadParseStatus"',
  "max-width: none;",
  "width: 100%;",
  "grid-template-columns: auto minmax(0, 1fr);",
  ".ai-upload-label span",
  ".ai-upload-dropzone.is-dragging",
  'data-lucide="upload-cloud"',
  'class="ai-upload-selected"',
  'id="aiClearImportButton"',
  'data-ai-import-action="edit"',
  'data-ai-import-action="remove"',
  'id="aiSelectedFileName"',
  'id="aiSelectedFileMeta"',
  "XLSX only · Max 10 MB.",
  "Upload an XLSX, review the preview, then import.",
  "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);",
  "#aiParseXlsxButton",
  'id="aiParseXlsxButton"',
  'id="aiImportPreview"',
  'id="aiImportPreviewTitle"',
  'id="aiConfirmImportButton"',
  ".ai-import-status-list",
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
  "setAiParseProgress(\"Reading timesheet entries…\", 68)",
  'aiParseXlsxButton.textContent = isBusy ? "Parsing..." : "Parse Excel"',
  "ai-import-status.warning",
  "plan.warnings.length ? \"warning\" : \"success\"",
  "window.draftTimesheetStore.insertEntriesWithDiagnostics(aiPendingImportPlan.entries",
  'aiImportTableWrap.addEventListener("click", onAiImportTableAction)',
  "function editAiImportEntry(index)",
  "function removeAiImportEntry(index)",
  "function updateAiImportEntryFromForm(baseEntry)",
  "const parseRequestId = beginAiImportParseRequest()",
  "isAiImportParseRequestCurrent(parseRequestId)",
  "createdBy: currentUser.id",
  "updatedBy: currentUser.id",
  "Imported claims still need proof before payroll submission.",
  "Check for missing, duplicate, or misdated entries.",
  'class="payroll-checklist"',
  "Check replacement names, claim costs, and missing proof.",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `employee Excel import should include ${snippet}`);
});
assert.match(
  html,
  /id="aiUploadPromptText">Drop or choose an XLSX file[\s\S]*id="aiUploadReadyMessage"[^>]*hidden[^>]*>File loaded\. Click Parse Excel to start\./,
  "employee Excel import should show a ready-to-parse prompt when a file is loaded"
);
assert.match(
  html,
  /\.ai-upload-dropzone\.has-file\s*\{[^}]*border-style:\s*solid;[^}]*background:[^}]*var\(--surface-muted\)[^}]*pointer-events:\s*none;/,
  "employee Excel import should mute and disable the drop zone after a file is loaded"
);
assert.match(
  html,
  /function syncAiUploadAvailability\(\)[\s\S]*const hasFile = Boolean\(aiXlsxFile\.files\?\.\[0\]\)[\s\S]*const isDisabled = aiImportBusy \|\| hasFile[\s\S]*aiXlsxFile\.disabled = isDisabled[\s\S]*setAttribute\("aria-disabled", String\(isDisabled\)\)/,
  "employee Excel import should disable the file picker and expose the loaded state as aria-disabled"
);
assert.match(
  html,
  /\.ai-import-panel\.is-parsing \.ai-import-grid\s*\{[^}]*pointer-events:\s*none;[^}]*user-select:\s*none;/,
  "employee Excel parsing should disable its upload controls"
);
assert.match(
  html,
  /\.ai-import-panel\.is-parsing \.ai-upload-help,[\s\S]*\.ai-import-panel\.is-parsing \.ai-upload-selected\s*\{[^}]*opacity:[^}]*filter:\s*grayscale\(/,
  "employee Excel parsing should mute the non-status upload details"
);
assert.match(
  html,
  /\.ai-upload-dropzone\.is-parsing\s*\{[^}]*opacity:\s*1;[^}]*filter:\s*none;[\s\S]*\.ai-upload-dropzone\.is-parsing \.ai-upload-dropzone-inner\s*\{[^}]*display:\s*none;[\s\S]*\.ai-upload-parse-status\[hidden\]/,
  "employee Excel parsing should replace the ready state with a crisp loading state inside the drop zone"
);
assert.doesNotMatch(
  html,
  /ai-upload-border-glow|ai-upload-dropzone\.is-parsing::after/,
  "employee Excel parsing should not add a distracting animated border"
);
assert.match(
  html,
  /\.ai-import-status\s*\{[^}]*padding-top:\s*0;[^}]*margin-bottom:\s*0;[^}]*font-weight:\s*700;/,
  "employee Excel import status should be bold with the requested spacing"
);
assert.ok(
  html.includes("function renderAiImportStatusMessage(message)")
    && html.includes("normalizedMessage.match(/[^.!?]+")
    && html.includes('className = "ai-import-status-list"')
    && html.includes("document.createElement(\"li\")"),
  "employee Excel import status should render sentence-level bullet points"
);
assert.match(
  html,
  /\.ai-import-status-list\s*\{[^}]*padding-inline-start:\s*0;[^}]*list-style:\s*none;/,
  "employee Excel import status should hide list bullets while preserving point formatting"
);
assert.match(
  html,
  /\.ai-import-panel\.is-parsing \.ai-import-actions\s*\{[^}]*pointer-events:\s*none;[^}]*user-select:\s*none;[\s\S]*\.ai-import-panel\.is-parsing \.ai-import-status\s*\{[^}]*opacity:\s*1;[^}]*filter:\s*none;/,
  "employee Excel parsing should keep the live progress status crisp while controls are disabled"
);
assert.match(
  html,
  /function setAiImportBusy\(isBusy\)[\s\S]*aiClearImportButton\.disabled = isBusy[\s\S]*classList\.toggle\("is-parsing", isBusy\)[\s\S]*setAttribute\("aria-busy", String\(isBusy\)\)[\s\S]*syncAiUploadAvailability\(\)/,
  "employee Excel parsing should synchronize disabled, muted, and busy states"
);
assert.match(
  html,
  /\.ai-loading-progress-fill\s*\{[^}]*display:\s*block;[^}]*transition:\s*width[\s\S]*function renderAiLoadingStatus\(text, progress = 0\)[\s\S]*className = "ai-loading-progress"[\s\S]*role", "progressbar"[\s\S]*aria-valuenow[\s\S]*className = "ai-loading-progress-fill"[\s\S]*style\.width[\s\S]*function setAiImportBusy\(isBusy\)[\s\S]*aiUploadParseStatus\.replaceChildren\(renderAiLoadingStatus[\s\S]*function startAiParseProgress\(\)[\s\S]*aiParseProgressCap[\s\S]*aiParseEstimatedDurationMs[\s\S]*window\.requestAnimationFrame\(tick\)[\s\S]*function setAiParseProgress\(message, value\)[\s\S]*aiUploadParseStatus\.querySelector\("\.ai-loading-text"\)/,
  "employee Excel parsing should show the estimated progress bar inside the drop zone"
);
assert.match(
  html,
  /const aiParseEstimatedDurationMs = 40000[\s\S]*const aiParseProgressCap = 80[\s\S]*setAiParseProgress\("Checking workbook month…", 12\)[\s\S]*setAiParseProgress\("Converting workbook to text…", 48\)[\s\S]*setAiParseProgress\("Reading timesheet entries…", 68\)[\s\S]*setAiParseProgress\("Validating imported entries…", 88\)[\s\S]*setAiParseProgress\("Workbook ready for review\."[,)]/,
  "employee Excel parsing should advance status phases while the estimate caps at 80 percent"
);
assert.doesNotMatch(
  html,
  /aiParseModal|Excel file selected\. Parse it when you are ready\./,
  "employee Excel import should not block the whole screen or repeat the redundant file-selected status"
);
assert.ok(
  !html.includes("aiRemoveSelectedFileButton"),
  "employee Excel import should use the large Clear button as its only file-removal control"
);
assert.match(
  html,
  /function renderAiImportPreview\(plan\)[\s\S]*aiImportPreviewTitle\.textContent = `Imported Entries — \$\{formatMonthLabel\(plan\.month\)\}`;/,
  "employee Excel import should label the preview with its imported month and year"
);
for (const [label, source] of [["employee timesheet", html]]) {
  [
    "function validateAiDraftImportPlan(plan",
    "function renderAiImportTable(importEntries)",
    "function recalculateAiImportPayCalculation(importEntries",
    "function editAiImportEntry(index)",
    "function removeAiImportEntry(index)",
    "function filterAiImportWarningsForRemovedEntry(warnings, entry)",
    "function revalidateAiImportWarningsForEntry(warnings, previousEntry, updatedEntry, entries)",
  ].forEach((snippet) => {
    assert.ok(source.includes(snippet), `${label} should include ${snippet}`);
  });
}
assert.doesNotMatch(
  html,
  /ai-upload-file-status|>\s*Ready\s*</,
  "employee Excel import should omit the redundant Ready status"
);
assert.match(
  html,
  /@container\s*\(max-width:\s*640px\)[\s\S]*\.ai-import-school-card\s*\{[^}]*padding:\s*clamp\(12px, 3\.5vw, 20px\);[\s\S]*\.ai-import-table thead\s*\{[^}]*display:\s*table-header-group;[\s\S]*\.ai-import-entry-actions \.entry-actions-inner\s*\{[^}]*flex-direction:\s*row;/,
  "employee Excel import should match the compact Activity Summary ledger on narrow layouts"
);
assert.doesNotMatch(
  html,
  /Upload a Chess Grande XLSX file, review the parsed entries, then import them into your current timesheet\./,
  "employee Excel import should remove its repeated instructional copy"
);

[
  "https://openrouter.ai/api/v1/chat/completions",
  "aiOpenRouterKey",
  "aiOpenRouterModel",
  "Import Settings",
].forEach((forbiddenSnippet) => {
  assert.ok(!html.includes(forbiddenSnippet), `employee page should not expose ${forbiddenSnippet}`);
});

globalThis.window.XLSX = {
  read() {
    return {
      SheetNames: ["March"],
      Sheets: {
        March: {
          "!ref": "B8:O11",
          B8: { v: "No" },
          C8: { v: "School/Location" },
          F8: { v: "Date" },
          N8: { v: "No. of Hours" },
          B9: { v: 1, w: "1" },
          C9: { v: "CG Replacement" },
          D9: { v: 930, w: "0930" },
          E9: { v: 1100, w: "1100" },
          F9: { v: "1" },
          G9: { v: "8" },
          N9: { v: 1.5, w: "1.5" },
          O11: { t: "e", v: 15, w: "#VALUE!" },
        },
      },
    };
  },
  utils: {
    decode_range() {
      return { s: { r: 7, c: 1 }, e: { r: 10, c: 14 } };
    },
    encode_cell({ r, c }) {
      return `${String.fromCharCode(65 + c)}${r + 1}`;
    },
  },
};

for (const [label, runtime] of [
  ["primary employee timesheet", harness],
  ["secondary employee timesheet", secondaryHarness],
]) {
  const workbookText = await runtime.convertXlsxFileToWorkbookText({
    async arrayBuffer() {
      return new ArrayBuffer(8);
    },
  }, "2026-03");
  assert.match(workbookText, /sourceRef=March!R9[\s\S]*sourceRow=9[\s\S]*section=schools[\s\S]*type=School Coaching[\s\S]*name=CG Replacement[\s\S]*hours=1\.5[\s\S]*dates=2026-03-01,2026-03-08/, `${label} converter should prefer the current template over legacy row-number parsing`);
  assert.doesNotMatch(workbookText, /template=legacyFlat/, `${label} converter should not treat row numbers as legacy dates`);
  assert.doesNotMatch(workbookText, /#VALUE!/, `${label} converter should omit Excel error cells from AI input`);
}

const splitLayoutSheet = {
  Q19: { v: "Claims" },
  B20: { v: "CG Weekly Classes/ Camps" },
  B22: { v: "No" },
  C22: { v: "Grade/ Camp Name" },
  D22: { v: "Start Time" },
  E22: { v: "End Time" },
  F22: { v: "Dates" },
  N22: { v: "No. of Hours" },
  B23: { v: 1, w: "1" },
  C23: { v: "Holiday Camp" },
  D23: { v: 900, w: "0900" },
  E23: { v: 1200, w: "1200" },
  F23: { v: 20, w: "20" },
  N23: { v: 3, w: "3" },
};
for (const [label, runtime] of [
  ["primary employee timesheet", harness],
  ["secondary employee timesheet", secondaryHarness],
]) {
  const interpreted = runtime.buildAiWorkbookInterpretation(
    splitLayoutSheet,
    { s: { r: 18, c: 1 }, e: { r: 22, c: 16 } },
    "2026-03",
    "March Camps"
  ).join("\n");
  assert.match(
    interpreted,
    /sourceRef=March%20Camps!R23[\s\S]*sourceRow=23[\s\S]*section=camp[\s\S]*type=Camp[\s\S]*name=Holiday Camp[\s\S]*hours=3[\s\S]*dates=2026-03-20/,
    `${label} should keep the left-side camp table independent from right-side claim summaries`
  );
  assert.doesNotMatch(
    interpreted,
    /type=Claim[\s\S]*item=Holiday Camp[\s\S]*amount=900/,
    `${label} should never reinterpret a camp start time as a claim amount`
  );
}

const firstParseRequestId = harness.beginAiImportParseRequest();
assert.equal(
  harness.isAiImportParseRequestCurrent(firstParseRequestId),
  true,
  "the active workbook parse request should remain current"
);
harness.invalidateAiImportParseRequest();
assert.equal(
  harness.isAiImportParseRequestCurrent(firstParseRequestId),
  false,
  "selecting or clearing a workbook should invalidate an older parse response"
);

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
assert.equal(plan.payCalculation.importableTotal, 95, "employee import should derive the initial preview total from normalized entries");

const untrustedPayPlan = harness.validateAiDraftImportPlan({
  month: "2026-03",
  entries: [{
    sourceRow: 9,
    sourceRef: "March!R9",
    date: "2026-03-01",
    type: "School Coaching",
    schoolName: "CG",
    startTime: "09:00",
    endTime: "11:00",
    hours: 2,
    replacementName: "",
    customRate: null,
    claimNotes: "",
    claimCost: null,
    calendarColor: "#B4CFA4",
  }],
  warnings: [],
  payCalculation: {
    standardRate: 55,
    schoolHours: 999,
    schoolPay: 999,
    importableClaimTotal: 999,
    importableTotal: 999,
    warningClaimTotal: 0,
    workbookClaimTotal: 0,
    workbookGrandTotal: 999,
  },
});
assert.equal(untrustedPayPlan.payCalculation.schoolHours, 2, "employee import should not trust model-provided preview hours");
assert.equal(untrustedPayPlan.payCalculation.schoolPay, 110, "employee import should derive preview pay from normalized entries");
assert.equal(untrustedPayPlan.payCalculation.importableClaimTotal, 0, "employee import should derive executable claims from normalized entries");
assert.equal(untrustedPayPlan.payCalculation.importableTotal, 110, "employee import should not display arbitrary model-provided totals");
assert.equal(untrustedPayPlan.payCalculation.workbookGrandTotal, 999, "employee import should retain the workbook total as comparison metadata");

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

const warningIsolationPlan = harness.validateAiDraftImportPlan({
  month: "2026-03",
  entries: [
    {
      sourceRow: 37,
      sourceRef: "March!R37",
      reviewId: "model-controlled-shared-id",
      date: "2026-03-03",
      type: "School Coaching",
      schoolName: "CG",
      startTime: "09:00",
      endTime: "10:00",
      hours: 1,
      replacementName: "",
      customRate: null,
      claimNotes: "",
      claimCost: null,
      calendarColor: "#B4CFA4",
    },
    {
      sourceRow: 37,
      sourceRef: "Archive!R37",
      reviewId: "model-controlled-shared-id",
      date: "2026-03-04",
      type: "School Coaching",
      schoolName: "CG",
      startTime: "10:00",
      endTime: "11:00",
      hours: 1,
      replacementName: "",
      customRate: null,
      claimNotes: "",
      claimCost: null,
      calendarColor: "#B4CFA4",
    },
  ],
  warnings: [
    { sourceRow: 37, sourceRef: "March!R37", entryReviewId: "model-controlled-shared-id", type: "TimeHoursMismatch", reason: "Review March row 37." },
    { sourceRow: 37, sourceRef: "Archive!R37", entryReviewId: "model-controlled-shared-id", type: "TimeHoursMismatch", reason: "Review Archive row 37." },
  ],
  payCalculation: { standardRate: 55, schoolHours: 2, schoolPay: 110, importableClaimTotal: 0, importableTotal: 110, warningClaimTotal: 0, workbookClaimTotal: 0, workbookGrandTotal: 110 },
});
assert.notEqual(
  warningIsolationPlan.entries[0].reviewId,
  warningIsolationPlan.entries[1].reviewId,
  "preview entries should have stable entry-level review identifiers"
);
assert.equal(
  warningIsolationPlan.warnings[0].entryReviewId,
  warningIsolationPlan.entries[0].reviewId,
  "a warning should attach to the matching sheet and row"
);
assert.equal(
  warningIsolationPlan.warnings[1].entryReviewId,
  warningIsolationPlan.entries[1].reviewId,
  "same-numbered rows on different sheets should not share warning identity"
);
const warningsAfterRemoval = harness.filterAiImportWarningsForRemovedEntry(
  warningIsolationPlan.warnings,
  warningIsolationPlan.entries[0]
);
assert.deepEqual(
  warningsAfterRemoval.map((warning) => warning.sourceRef),
  ["Archive!R37"],
  "removing one preview entry should preserve warnings for same-numbered rows on other sheets"
);
const warningsAfterEdit = harness.revalidateAiImportWarningsForEntry(
  warningIsolationPlan.warnings,
  warningIsolationPlan.entries[0],
  warningIsolationPlan.entries[0],
  warningIsolationPlan.entries
);
assert.deepEqual(
  warningsAfterEdit.map((warning) => warning.sourceRef),
  ["Archive!R37"],
  "editing a corrected preview entry should resolve only that entry's warning"
);

assert.deepEqual(
  harness.getAiImportTableColumns([{ type: "School Coaching" }]),
  ["date", "type", "hours", "time", "actions"],
  "employee import should omit the Claim column when the preview has no claims"
);
assert.deepEqual(
  harness.getAiImportTableColumns([{ type: "Claim" }]),
  ["date", "type", "claim", "actions"],
  "employee import should show only cost-relevant columns for a claim group"
);

const noClaimTable = harness.renderAiImportTable([{
  date: "2026-03-03",
  type: "School Coaching",
  schoolName: "ACS",
  startTime: "09:00",
  endTime: "11:00",
  hours: 2,
}]);
assert.doesNotMatch(noClaimTable, /<th[^>]*>Claim<\/th>/, "employee import should not render an empty Claim header");
assert.match(noClaimTable, /class="ai-import-groups"[\s\S]*class="school-card ai-import-school-card"[\s\S]*<h3>ACS<\/h3>/, "employee import should group preview rows into Activity Summary-style school cards");
assert.match(noClaimTable, /class="ai-import-table is-time-ledger"[\s\S]*class="ai-import-type-badge"/, "employee import should render the same compact time-ledger structure as Activity Summary");
assert.match(noClaimTable, /data-ai-import-action="edit"[\s\S]*data-ai-import-action="remove"/, "employee import should render edit and remove controls for every preview row");

const claimTable = harness.renderAiImportTable([{
  date: "2026-03-04",
  type: "Claim",
  schoolName: "Claims",
  startTime: "",
  endTime: "",
  hours: 0,
  claimNotes: "Transport",
  claimCost: 12.5,
}]);
assert.match(claimTable, /<th[^>]*>Claim<\/th>/, "employee import should render the Claim header when claim rows exist");
assert.doesNotMatch(claimTable, /<th[^>]*>Hours<\/th>|<th[^>]*>Time<\/th>/, "employee import should omit empty hours and time columns from claim-only groups");
assert.match(claimTable, /class="ai-import-claim"[^>]*>S\$12\.50<\/td>/, "employee import should render the claim amount in the conditional column");

assert.deepEqual(
  harness.getAiImportTableColumns([{ type: "Event", claimNotes: "Tournament", claimCost: 25 }]),
  ["date", "type", "eventCost", "actions"],
  "employee import should give cost-style Events an explicit cost column"
);
const eventCostTable = harness.renderAiImportTable([{
  date: "2026-03-05",
  type: "Event",
  schoolName: "Tournament",
  startTime: "",
  endTime: "",
  hours: 0,
  claimNotes: "Tournament support",
  claimCost: 25,
}]);
assert.match(eventCostTable, /<th[^>]*>Event Cost<\/th>/, "employee import should label Event costs explicitly");
assert.match(eventCostTable, /class="ai-import-event-cost"[^>]*>S\$25\.00<\/td>/, "employee import should display the Event cost amount");
assert.doesNotMatch(eventCostTable, /<th[^>]*>Hours<\/th>|<th[^>]*>Time<\/th>/, "cost-style Events should not render empty time columns");

const recalculatedPay = harness.recalculateAiImportPayCalculation([
  { type: "School Coaching", hours: 2, customRate: null, claimCost: null },
  { type: "Private", hours: 1.5, customRate: 80, claimCost: null },
  { type: "Event", hours: 0, customRate: null, claimCost: 25, claimNotes: "Tournament" },
  { type: "Claim", hours: 0, customRate: null, claimCost: 12.5 },
], {
  standardRate: 55,
  warningClaimTotal: 4,
  workbookClaimTotal: 16.5,
  workbookGrandTotal: 271.5,
});
assert.deepEqual(
  recalculatedPay,
  {
    standardRate: 55,
    schoolHours: 3.5,
    schoolPay: 255,
    importableClaimTotal: 12.5,
    importableTotal: 267.5,
    warningClaimTotal: 4,
    workbookClaimTotal: 16.5,
    workbookGrandTotal: 271.5,
  },
  "employee import should recalculate preview hours and pay after edits or removals"
);

const friendlyMismatchWarning = {
  sourceRow: 37,
  type: "TimeHoursMismatch",
  reason: "Interpreted duration from WARNING=timeHoursMismatch durationFromTimes=1 conflicts with row hours=60. Using correction endTime from calculatedEndFromHours (01:00).",
};
assert.equal(harness.getAiWarningTitle(friendlyMismatchWarning), "Time and hours need review");
const friendlyMismatchText = harness.formatAiWarningMessage(friendlyMismatchWarning);
assert.match(friendlyMismatchText, /The time range and hours do not match/);
assert.match(friendlyMismatchText, /Please check this entry before importing/);
assert.doesNotMatch(friendlyMismatchText, /\brow\b/i, "employee warning copy should not expose workbook row references");
assert.ok(!friendlyMismatchText.includes("durationFromTimes"), "employee warning should hide parser field names");
assert.ok(!friendlyMismatchText.includes("calculatedEndFromHours"), "employee warning should hide correction field names");

const dateConflictWarning = {
  sourceRow: 6,
  sourceRef: "April!R6",
  type: "DateConflict",
  reason: "Interpreted date 2024-01-04 conflicts with raw workbook date 4/1/24; used the raw date as April 1, 2024.",
};
const dateConflictEntry = {
  reviewId: "April!R6#entry-1",
  sourceRef: "April!R6",
  sourceRow: 6,
  schoolName: "NUS High",
  date: "2024-04-01",
  startTime: "16:00",
  endTime: "18:00",
  type: "School Coaching",
};
const dateConflictContext = harness.getAiWarningEntryContext(dateConflictWarning, [dateConflictEntry]);
assert.match(
  dateConflictContext,
  /NUS High · .*Apr 1, 2024 · 4:00 PM–6:00 PM/,
  "date conflict warnings should identify the entry, date, and time"
);
assert.match(harness.getAiWarningTitle(dateConflictWarning, dateConflictContext), /NUS High/);
assert.equal(
  harness.getAiWarningTitle(dateConflictWarning, dateConflictContext).includes("row"),
  false,
  "date conflict warning titles should not mention workbook rows"
);
assert.match(harness.formatAiWarningMessage(dateConflictWarning), /Please verify this entry before importing/);

const secondaryParityPlan = secondaryHarness.validateAiDraftImportPlan({
  month: "2026-03",
  entries: [
    {
      sourceRow: 9,
      sourceRef: "March!R9",
      date: "2026-03-01",
      type: "School Coaching",
      schoolName: "CG",
      startTime: "09:00",
      endTime: "11:00",
      hours: 2,
      replacementName: "",
      customRate: null,
      claimNotes: "",
      claimCost: null,
      calendarColor: "#B4CFA4",
    },
    {
      sourceRow: 42,
      sourceRef: "March!R42",
      date: "2026-03-05",
      type: "Event",
      schoolName: "Tournament",
      startTime: "",
      endTime: "",
      hours: 0,
      replacementName: "",
      customRate: null,
      claimNotes: "Tournament support",
      claimCost: 25,
      calendarColor: "#B4CFA4",
    },
  ],
  warnings: [
    { sourceRow: 9, sourceRef: "March!R9", type: "TimeHoursMismatch", reason: "Review row 9." },
  ],
  payCalculation: {
    standardRate: 55,
    schoolHours: 999,
    schoolPay: 999,
    importableClaimTotal: 999,
    importableTotal: 999,
    warningClaimTotal: 0,
    workbookClaimTotal: 0,
    workbookGrandTotal: 135,
  },
});
assert.deepEqual(
  secondaryParityPlan.payCalculation,
  {
    standardRate: 55,
    schoolHours: 2,
    schoolPay: 135,
    importableClaimTotal: 0,
    importableTotal: 135,
    warningClaimTotal: 0,
    workbookClaimTotal: 0,
    workbookGrandTotal: 135,
  },
  "secondary employee timesheet should derive the same initial preview totals"
);
assert.equal(
  secondaryParityPlan.warnings[0].entryReviewId,
  secondaryParityPlan.entries[0].reviewId,
  "secondary employee timesheet should attach warnings by sheet and row"
);
assert.deepEqual(
  secondaryHarness.getAiImportTableColumns([secondaryParityPlan.entries[1]]),
  ["date", "type", "eventCost", "actions"],
  "secondary employee timesheet should expose Event costs in the preview"
);
assert.match(
  secondaryHarness.renderAiImportTable([secondaryParityPlan.entries[1]]),
  /<th[^>]*>Event Cost<\/th>[\s\S]*class="ai-import-event-cost"[^>]*>S\$25\.00<\/td>/,
  "secondary employee timesheet should render Event cost values"
);

console.log("employee timesheet AI import checks passed");
