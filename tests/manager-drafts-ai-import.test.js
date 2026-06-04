import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "manager-drafts.html"),
  "utf8"
);

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
  "inferAiImportMonth",
  "inferAiImportMonthFromFileName",
  "inferAiImportMonthFromWorkbook",
  "inferAiMonthFromText",
  "getAiMonthNameMap",
  "convertXlsxFileToWorkbookText",
  "buildAiWorkbookInterpretation",
  "buildAiLegacyFlatSessionInterpretation",
  "buildAiSessionInterpretation",
  "buildAiClaimInterpretation",
  "getAiCellText",
  "normalizeWorkbookNumber",
  "normalizeWorkbookTime",
  "normalizeWorkbookDate",
  "normalizeWorkbookYear",
  "formatDateParts",
  "formatUtcDate",
  "getWorkbookMonthStartDate",
  "buildAiDraftImportPrompt",
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
];

function buildAiHarness() {
  const script = `
    const window = globalThis.window;
    const monthPicker = { value: "2026-06" };
    const defaultCalendarColor = "#B4CFA4";
    const aiWorkbookTextLimit = 52000;
    const aiAllowedEntryTypes = new Set(["School Coaching", "Replacement", "Claim", "Camp", "Private", "Event"]);
    const aiRequiredEntryFields = ["date", "type", "schoolName", "startTime", "endTime", "hours", "replacementName", "customRate", "claimNotes", "claimCost", "calendarColor"];
    const aiRequiredPayFields = ["standardRate", "schoolHours", "schoolPay", "importableClaimTotal", "importableTotal", "warningClaimTotal", "workbookClaimTotal", "workbookGrandTotal"];
    ${aiFunctionNames.map((name) => extractFunction(html, name)).join("\n")}
    return { inferAiImportMonth, inferAiImportMonthFromFileName, inferAiImportMonthFromWorkbook, convertXlsxFileToWorkbookText, buildAiDraftImportPrompt, parseAiImportJson, validateAiDraftImportPlan };
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

[
  'src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"',
  'id="aiXlsxImportPanel"',
  'id="aiXlsxFile"',
  'id="aiParseXlsxButton"',
  'id="aiImportPreview"',
  'id="aiConfirmImportButton"',
  "callTimesheetXlsxParseWorker",
  "/api/timesheet-xlsx-parse",
].forEach((requiredMarkup) => {
  assert.ok(html.includes(requiredMarkup), `Draft Timesheets AI importer should include ${requiredMarkup}`);
});

[
  "aiImportSettingsButton",
  "aiImportSettingsModal",
  "aiOpenRouterKey",
  "aiOpenRouterModel",
  "aiImportKeyStorage",
  "aiImportModelStorage",
  "localStorage.getItem(aiImportKeyStorage)",
  "hydrateAiImportSettings",
  "https://openrouter.ai/api/v1/chat/completions",
  "AI Excel import",
  "Parse Excel With AI",
  "AI Import Settings",
  "Only .xlsx files are supported for AI import.",
  "AI import failed.",
].forEach((removedCopy) => {
  assert.ok(!html.includes(removedCopy), `Draft Timesheets should not expose ${removedCopy}`);
});

[
  "ai-loading-breadcrumb",
  "ai-draw-stroke",
  "ai-text-shimmer",
  "renderAiLoadingStatus",
  "setAiImportStatus(\"Parsing workbook with secure AI import\", \"\", { loading: true })",
].forEach((requiredCode) => {
  assert.ok(html.includes(requiredCode), `AI importer should include ${requiredCode}`);
});

const prompt = harness.buildAiDraftImportPrompt({
  fileName: "Chess Grande Time Sheet March 2026.xlsx",
  selectedMonth: "2026-03",
  workbookText: "SHEET: March\nROW 1: A1=Name | B1=Value",
});
const januaryPrompt = harness.buildAiDraftImportPrompt({
  fileName: "Chess Grande Time Sheet January 2026.xlsx",
  selectedMonth: "2026-01",
  workbookText: "SHEET: January\nROW 1: A1=Name | B1=Value",
});

[
  "Return valid JSON only",
  '"month": "YYYY-MM"',
  '"entries": []',
  '"warnings": []',
  '"payCalculation"',
  "Every entry MUST include this exact full shape",
  '"replacementName": string',
  '"customRate": number | null',
  '"claimNotes": string',
  '"claimCost": number | null',
  '"calendarColor": "#B4CFA4"',
  'For Claim entries, set schoolName "Claims", startTime "", endTime "", hours 0, replacementName "", customRate null.',
  "Claim rows with item and amount but no date MUST become Claim entries dated on the first day of the selected month.",
  "Use the INTERPRETED TIMESHEET ROWS section first",
  "duration from startTime to endTime must match hours",
  "If workbook end time conflicts with hours, calculate endTime from startTime + hours and add a warning.",
  'Any interpreted row with WARNING=timeHoursMismatch must produce a warning with type "TimeHoursMismatch"',
  '"sourceRow": number',
  '"reason": string',
  "standardRate",
  "schoolHours",
  "schoolPay",
  "schoolPay is the sum of pay for all executable non-claim paid rows",
  "Private Lessons rows must contribute to importableTotal using their rate column when present.",
  "importableClaimTotal",
  "importableTotal",
  "warningClaimTotal",
  "workbookClaimTotal",
  "workbookGrandTotal",
].forEach((requiredPromptText) => {
  assert.ok(prompt.includes(requiredPromptText), `AI prompt should include ${requiredPromptText}`);
});
assert.ok(januaryPrompt.includes("Selected month: 2026-01"), "AI prompt should use the inferred file month");

assert.equal(
  harness.inferAiImportMonthFromFileName("Chess Grande Time Sheet January 2026.xlsx"),
  "2026-01",
  "filename inference should parse Month YYYY"
);
assert.equal(
  harness.inferAiImportMonthFromFileName("Timesheet 2026-04.xlsx"),
  "2026-04",
  "filename inference should parse YYYY-MM"
);

const workbookMonth = harness.inferAiImportMonthFromWorkbook({
  SheetNames: ["Sheet1"],
  Sheets: {
    Sheet1: {
      "!ref": "Q4:R4",
      Q4: { v: "Month" },
      R4: { v: "January 2026" },
    },
  },
});
assert.equal(workbookMonth, "2026-01", "workbook inference should parse visible month cells");

globalThis.window.XLSX = {
  read() {
    return {
      SheetNames: ["March"],
      Sheets: {
        March: {
          "!ref": "A1:O65",
          A1: { v: "Date" },
          B1: { v: "School" },
          C2: { v: 930, w: "0930" },
          A3: { v: "Claim" },
          C3: { v: 27.8, w: "27.80" },
          B6: { v: "Schools (MOE Schools/ International Schools/Ingenius/ Sunflower/ SCF)" },
          C11: { v: "CG Grade 3" },
          D11: { v: 1530, w: "1530" },
          E11: { v: 1200, w: "1200" },
          F11: { v: "11/1" },
          N11: { v: 1.5, w: "1.5" },
          B62: { v: "Claims" },
          C65: { v: "Grab from CG to SCF" },
          D65: { v: 8.7, w: "8.70" },
          H65: { v: 46032 },
        },
      },
    };
  },
  utils: {
    decode_range() {
      return { s: { r: 0, c: 0 }, e: { r: 64, c: 14 } };
    },
    encode_cell({ r, c }) {
      return `${String.fromCharCode(65 + c)}${r + 1}`;
    },
  },
};

const workbookText = await harness.convertXlsxFileToWorkbookText({
  async arrayBuffer() {
    return new ArrayBuffer(8);
  },
}, "2026-01");
assert.match(workbookText, /SHEET: March/, "workbook converter should include sheet names");
assert.match(workbookText, /RANGE: A1:O65/, "workbook converter should include ranges");
assert.match(workbookText, /ROW 1: A1=Date \| B1=School/, "workbook converter should expose non-empty cell coordinates and values");
assert.match(workbookText, /ROW 2: C2=0930/, "workbook converter should preserve visible cell text");
assert.match(workbookText, /INTERPRETED TIMESHEET ROWS/, "workbook converter should add interpreted row hints");
assert.match(workbookText, /sourceRow=11[\s\S]*CG Grade 3[\s\S]*startTime=15:30[\s\S]*endTime=12:00[\s\S]*calculatedEndFromHours=17:00/, "workbook converter should flag time and hours conflicts");
assert.match(workbookText, /sourceRow=11[\s\S]*dates=2026-01-11/, "workbook converter should use file month for day\/month cells even when active view differs");
assert.match(workbookText, /sourceRow=65[\s\S]*Grab from CG to SCF[\s\S]*date=2026-01-10/, "workbook converter should convert Excel date serial claims");

globalThis.window.XLSX.read = () => ({
  SheetNames: ["March"],
  Sheets: {
    March: {
      "!ref": "B62:H66",
      B62: { v: "Claims" },
      C66: { v: "Grab from NTU to CG." },
      D66: { v: 22.2, w: "22.20" },
    },
  },
});
globalThis.window.XLSX.utils.decode_range = () => ({ s: { r: 61, c: 1 }, e: { r: 65, c: 7 } });
const undatedClaimWorkbookText = await harness.convertXlsxFileToWorkbookText({
  async arrayBuffer() {
    return new ArrayBuffer(8);
  },
}, "2026-01");
assert.match(
  undatedClaimWorkbookText,
  /sourceRow=66[\s\S]*Grab from NTU to CG\.[\s\S]*date=2026-01-01[\s\S]*dateDefaultedToMonthStart=true/,
  "workbook converter should default undated claims to the first day of the file month"
);

globalThis.window.XLSX.read = () => ({
  SheetNames: ["Sheet1"],
  Sheets: {
    Sheet1: {
      "!ref": "B4:J15",
      H4: { v: "Month" },
      B6: { v: 45267 },
      C6: { v: "UWC" },
      D6: { v: 1500, w: "1500" },
      E6: { v: 1630, w: "1630" },
      F6: { v: 1.5, w: "1.5" },
      B7: { v: 45278 },
      C7: { v: "NASCANS Bukit Merah" },
      D7: { v: 1200, w: "1200" },
      E7: { v: 1630, w: "1630" },
      F7: { v: 4.5, w: "4.5" },
    },
  },
});
globalThis.window.XLSX.utils.decode_range = () => ({ s: { r: 3, c: 1 }, e: { r: 14, c: 9 } });
const legacyWorkbookText = await harness.convertXlsxFileToWorkbookText({
  async arrayBuffer() {
    return new ArrayBuffer(8);
  },
}, "2023-12");
assert.match(
  legacyWorkbookText,
  /sourceRow=6[\s\S]*template=legacyFlat[\s\S]*name=UWC[\s\S]*startTime=15:00[\s\S]*endTime=16:30[\s\S]*hours=1.5[\s\S]*dates=2023-12-07/,
  "workbook converter should interpret legacy flat session rows"
);
assert.match(
  legacyWorkbookText,
  /sourceRow=7[\s\S]*template=legacyFlat[\s\S]*name=NASCANS Bukit Merah[\s\S]*hours=4.5[\s\S]*dates=2023-12-18/,
  "workbook converter should interpret legacy flat rows with Excel serial dates"
);

const repairedJson = harness.parseAiImportJson(`{
  "month": "2023-12",
  "entries": [
    {"date":"2023-12-07","type":"School Coaching","schoolName":"UWC","startTime":"15:00","endTime":"16:30","hours":1.5,"replacementName":"","customRate":null,"claimNotes":"","claimCost":null,"calendarColor":"#B4CFA4"}
    {"date":"2023-12-18","type":"School Coaching","schoolName":"NASCANS Bukit Merah","startTime":"12:00","endTime":"16:30","hours":4.5,"replacementName":"","customRate":null,"claimNotes":"","claimCost":null,"calendarColor":"#B4CFA4"},
  ],
  "warnings": [],
  "payCalculation": {"standardRate":45,"schoolHours":6,"schoolPay":270,"importableClaimTotal":0,"importableTotal":270,"warningClaimTotal":0,"workbookClaimTotal":0,"workbookGrandTotal":270}
}`);
assert.equal(repairedJson.entries.length, 2, "AI JSON parser should repair missing commas between array objects");
assert.equal(repairedJson.entries[1].schoolName, "NASCANS Bukit Merah", "AI JSON parser should preserve repaired entry content");

const validPlan = {
  month: "2026-03",
  entries: [
    {
      date: "2026-03-01",
      type: "School Coaching",
      schoolName: "CG Replacement",
      startTime: "09:30",
      endTime: "11:00",
      hours: 1.5,
      replacementName: "",
      customRate: null,
      claimNotes: "",
      claimCost: null,
      calendarColor: "#B4CFA4",
    },
    {
      date: "2026-03-01",
      type: "Claim",
      schoolName: "Claims",
      startTime: "",
      endTime: "",
      hours: 0,
      replacementName: "",
      customRate: null,
      claimNotes: "Grab from Home to CG for last min replacement",
      claimCost: 27.8,
      calendarColor: "#B4CFA4",
    },
  ],
  warnings: [
    {
      sourceRow: 66,
      type: "ClaimWithoutDate",
      reason: "Claim has item and amount but no date.",
      claimNotes: "Grab from NTU to CG.",
      claimCost: 22.2,
    },
  ],
  payCalculation: {
    standardRate: 55,
    schoolHours: 1.5,
    schoolPay: 82.5,
    importableClaimTotal: 27.8,
    importableTotal: 110.3,
    warningClaimTotal: 22.2,
    workbookClaimTotal: 50,
    workbookGrandTotal: 132.5,
  },
};

const normalized = harness.validateAiDraftImportPlan(validPlan);
assert.equal(normalized.entries.length, 2, "validator should accept executable coaching and claim entries");
assert.equal(normalized.entries[0].calendarColor, "#B4CFA4", "validator should preserve/default calendar color");

[
  {
    name: "missing claim fields",
    plan: {
      ...validPlan,
      entries: [{ ...validPlan.entries[1], claimNotes: "", claimCost: null }],
    },
    message: /missing claimNotes or claimCost/,
  },
  {
    name: "empty pay calculation",
    plan: { ...validPlan, payCalculation: {} },
    message: /payCalculation is missing standardRate/,
  },
  {
    name: "invalid date",
    plan: {
      ...validPlan,
      entries: [{ ...validPlan.entries[0], date: "2026-02-31" }],
    },
    message: /invalid date/,
  },
  {
    name: "invalid time",
    plan: {
      ...validPlan,
      entries: [{ ...validPlan.entries[0], startTime: "930" }],
    },
    message: /must use HH:MM/,
  },
  {
    name: "time and hours mismatch",
    plan: {
      ...validPlan,
      entries: [{ ...validPlan.entries[0], startTime: "15:30", endTime: "12:00", hours: 1.5 }],
    },
    message: /time range does not match hours/,
  },
  {
    name: "missing warning reason",
    plan: {
      ...validPlan,
      warnings: [{ ...validPlan.warnings[0], reason: "" }],
    },
    message: /must include sourceRow and reason/,
  },
  {
    name: "conflicting inferred month",
    plan: { ...validPlan, month: "2026-02" },
    options: { expectedMonth: "2026-01", inferredMonth: true },
    message: /does not match inferred file month/,
  },
].forEach((caseItem) => {
  assert.throws(
    () => harness.validateAiDraftImportPlan(caseItem.plan, caseItem.options),
    caseItem.message,
    `validator should reject ${caseItem.name}`
  );
});

[
  "Choose an employee before importing.",
  "window.draftTimesheetStore.insertEntriesWithDiagnostics",
  "callTimesheetXlsxParseWorker",
  "createdBy: currentUser.id",
  "updatedBy: currentUser.id",
  "await loadSelectedEmployeeEntries();",
  "monthPicker.value = plan.month;",
  "render();",
  "monthPicker.value = aiPendingImportPlan.month;",
  "resetAiImportPreview(`Imported ${saved.length} draft entr",
].forEach((requiredCode) => {
  assert.ok(html.includes(requiredCode), `AI executor should include ${requiredCode}`);
});

const parseFlowStart = html.indexOf("async function parseAiXlsxImport()");
assert.notEqual(parseFlowStart, -1, "manager drafts should define parseAiXlsxImport");
const importMonthIndex = html.indexOf("const importContext = await inferAiImportMonth(file, monthPicker.value);", parseFlowStart);
const switchMonthIndex = html.indexOf("monthPicker.value = importContext.month;", parseFlowStart);
const pauseIndex = html.indexOf("await pauseAiImportAfterMonthSwitch();", parseFlowStart);
const convertIndex = html.indexOf("const workbookText = await convertXlsxFileToWorkbookText(file, importContext.month);", parseFlowStart);
assert.ok(importMonthIndex > parseFlowStart, "AI import should infer the file month before parsing entries");
assert.ok(switchMonthIndex > importMonthIndex, "AI import should switch the active month immediately after inferring the file month");
assert.ok(pauseIndex > switchMonthIndex, "AI import should pause after changing the visible month");
assert.ok(convertIndex > pauseIndex, "AI import should parse workbook entries only after the month switch pause");

const marchFixture = {
  entries: [
    ["2026-03-01", "CG Replacement", "09:30", "11:00", 1.5],
    ["2026-03-01", "CG Replacement", "13:30", "15:00", 1.5],
    ["2026-03-11", "ACS", "14:15", "16:15", 2],
    ["2026-03-25", "ACS", "14:15", "16:15", 2],
    ["2026-03-12", "Anchor Green", "14:00", "16:00", 2],
    ["2026-03-26", "Anchor Green", "14:00", "16:00", 2],
    ["2026-03-29", "CG Grade 5", "13:30", "15:00", 1.5],
    ["2026-03-29", "CG Grade 4", "15:30", "17:00", 1.5],
    ["2026-03-16", "Shaws Replacement", "16:30", "17:30", 1],
  ].map(([date, schoolName, startTime, endTime, hours]) => ({
    date,
    type: "School Coaching",
    schoolName,
    startTime,
    endTime,
    hours,
    replacementName: "",
    customRate: null,
    claimNotes: "",
    claimCost: null,
    calendarColor: "#B4CFA4",
  })),
  warnings: [],
  payCalculation: {
    standardRate: 55,
    schoolHours: 15,
    schoolPay: 825,
    importableClaimTotal: 118.5,
    importableTotal: 943.5,
    warningClaimTotal: 0,
    workbookClaimTotal: 118.5,
    workbookGrandTotal: 943.5,
  },
};

const marchImportPlan = harness.validateAiDraftImportPlan({
  month: "2026-03",
  entries: [
    ...marchFixture.entries,
    {
      date: "2026-03-01",
      type: "Claim",
      schoolName: "Claims",
      startTime: "",
      endTime: "",
      hours: 0,
      replacementName: "",
      customRate: null,
      claimNotes: "Grab from Home to CG for last min replacement",
      claimCost: 27.8,
      calendarColor: "#B4CFA4",
    },
    {
      date: "2026-03-01",
      type: "Claim",
      schoolName: "Claims",
      startTime: "",
      endTime: "",
      hours: 0,
      replacementName: "",
      customRate: null,
      claimNotes: "Grab from NTU to CG (for chessboard) + Grab from CG to Shaws Replacement + Grab from Shaws to NTU",
      claimCost: 68.5,
      calendarColor: "#B4CFA4",
    },
    {
      date: "2026-03-01",
      type: "Claim",
      schoolName: "Claims",
      startTime: "",
      endTime: "",
      hours: 0,
      replacementName: "",
      customRate: null,
      claimNotes: "Grab from NTU to CG.",
      claimCost: 22.2,
      calendarColor: "#B4CFA4",
    },
  ],
  warnings: marchFixture.warnings,
  payCalculation: marchFixture.payCalculation,
});

assert.equal(
  marchImportPlan.entries.filter((entry) => entry.type === "School Coaching").length,
  9,
  "March fixture should contain 9 coaching entries"
);
assert.equal(
  marchImportPlan.entries.filter((entry) => entry.type === "Claim").length,
  3,
  "March fixture should contain 3 claim entries with undated claims defaulted to month start"
);
assert.equal(marchImportPlan.warnings.length, 0, "March fixture should not warn for undated claims");
assert.equal(marchImportPlan.payCalculation.schoolHours, 15, "March fixture should calculate 15 school hours");
assert.equal(marchImportPlan.payCalculation.schoolPay, 825, "March fixture should calculate 825 school pay");
assert.equal(marchImportPlan.payCalculation.importableClaimTotal, 118.5, "March fixture should import all claims");
assert.equal(marchImportPlan.payCalculation.warningClaimTotal, 0, "March fixture should not leave undated claims in warning totals");
assert.equal(marchImportPlan.payCalculation.workbookGrandTotal, 943.5, "March fixture should calculate workbook grand total");

console.log("manager-drafts AI import checks passed");
