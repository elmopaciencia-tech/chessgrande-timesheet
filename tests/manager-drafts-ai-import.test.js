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
  "inferAiDominantMonthFromWorkbookDates",
  "inferAiMonthFromDateCellText",
  "getAiWorkbookDateYear",
  "inferAiMonthFromText",
  "getAiMonthNameMap",
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
    ${aiFunctionNames.map((name) => extractFunction(html, name)).join("\n")}
    return { inferAiImportMonth, inferAiImportMonthFromFileName, inferAiImportMonthFromWorkbook, convertXlsxFileToWorkbookText, buildAiDraftImportPrompt, parseAiImportJson, validateAiDraftImportPlan, getAiWarningTitle, formatAiWarningMessage };
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
  "setAiImportStatus(\"Importing...\", \"\", { loading: true })",
  'aiParseXlsxButton.textContent = isBusy ? "Importing..." : "Parse Excel"',
  "ai-import-status.warning",
  "plan.warnings.length ? \"warning\" : \"success\"",
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
  'Never use a rate/pay, Total, Total Hours, or Total $ column as "hours"',
  "Chess Grande templates vary",
  "column L is Rate/customRate and column M is No. of Hours",
  "column M is Rate/customRate and column N is No. of Hours",
  "trust hours= for entry hours and rate= for customRate",
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

const mismatchedWorkbook = {
  SheetNames: ["Sheet1"],
  Sheets: {
    Sheet1: {
      "!ref": "B8:O37",
      B8: { v: "No" },
      C8: { v: "School/Location" },
      F8: { v: "Date" },
      C9: { v: "SCF Int Replacement" },
      D9: { v: 900, w: "0900" },
      E9: { v: 1030, w: "1030" },
      F9: { v: "02/11" },
      G9: { v: "09/11" },
      H9: { v: "16/11" },
      N9: { v: 1.5, w: "1.5" },
      C12: { v: "SCF Replacement" },
      D12: { v: 1330, w: "1330" },
      E12: { v: 1500, w: "1500" },
      F12: { v: "14/12" },
      N12: { v: 1.5, w: "1.5" },
      C13: { v: "SCF Replacement" },
      D13: { v: 1530, w: "1530" },
      E13: { v: 1700, w: "1700" },
      F13: { v: "14/13" },
      N13: { v: 1.5, w: "1.5" },
      B34: { v: "Private Lessons" },
      B36: { v: "No" },
      C36: { v: "Student Name" },
      D36: { v: "Start Time" },
      E36: { v: "End Time" },
      F36: { v: "Dates" },
      M36: { v: "Rate" },
      N36: { v: "No. of Hours" },
      C37: { v: "Jean + 3" },
      D37: { v: 1300, w: "1300" },
      E37: { v: 1400, w: "1400" },
      F37: { v: "2/11" },
      G37: { v: "9/11" },
      H37: { v: "16/11" },
      I37: { v: "23/11" },
      J37: { v: "30/11" },
      M37: { v: 60, w: "60" },
      N37: { v: 1, w: "1" },
    },
  },
};
assert.equal(
  harness.inferAiImportMonthFromWorkbook(mismatchedWorkbook, "2025-10"),
  "2025-11",
  "workbook date cells should override a mismatched filename month"
);

globalThis.window.XLSX = {
  read() {
    return mismatchedWorkbook;
  },
};
const mismatchedImportContext = await harness.inferAiImportMonth({
  name: "Chess Grande Time Sheet October 2025.xlsx",
  async arrayBuffer() {
    return new ArrayBuffer(8);
  },
}, "2025-10");
assert.deepEqual(
  mismatchedImportContext,
  { month: "2025-11", inferred: true, source: "workbook" },
  "import month inference should prefer actual workbook date cells over the filename"
);

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
          B11: { v: 3, w: "3" },
          C11: { v: "CG Grade 3" },
          D11: { v: 1530, w: "1530" },
          E11: { v: 1200, w: "1200" },
          F11: { v: "11" },
          G11: { v: "25" },
          N11: { v: 1.5, w: "1.5" },
          B12: { v: 4, w: "4" },
          C12: { v: "CG Replacement" },
          D12: { v: 1330, w: "1330" },
          E12: { v: 1500, w: "1500" },
          F12: { v: "12/1" },
          N12: { v: 1.5, w: "1.5" },
          B35: { v: "Private Lessons" },
          B36: { v: "No" },
          C36: { v: "Student Name" },
          D36: { v: "Start Time" },
          E36: { v: "End Time" },
          F36: { v: "Dates" },
          L36: { v: "Status" },
          M36: { v: "Rate" },
          N36: { v: "No. of Hours" },
          B37: { v: 1, w: "1" },
          C37: { v: "Jean + 3" },
          D37: { v: 1300, w: "1300" },
          E37: { v: 1400, w: "1400" },
          F37: { v: "2/1" },
          G37: { v: "9/1" },
          M37: { v: 60, w: "60" },
          N37: { v: 1, w: "1" },
          B62: { v: "Claims" },
          C65: { v: "Grab from CG to SCF" },
          D65: { v: 8.7, w: "8.70" },
          H65: { v: 46032 },
          O63: { t: "e", v: 15, w: "#VALUE!" },
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
assert.match(workbookText, /sourceRow=11[\s\S]*dates=2026-01-11,2026-01-25/, "workbook converter should use file month for day cells even when active view differs");
assert.doesNotMatch(workbookText, /sourceRow=11[\s\S]*template=legacyFlat/, "workbook converter should not treat the current template row number as a legacy date");
assert.match(workbookText, /sourceRow=12[\s\S]*section=schools[\s\S]*type=School Coaching[\s\S]*name=CG Replacement/, "replacement-looking school names should stay school coaching entries");
assert.match(workbookText, /sourceRow=37[\s\S]*section=private[\s\S]*Jean \+ 3[\s\S]*hours=1[\s\S]*rate=60[\s\S]*dates=2026-01-02,2026-01-09/, "workbook converter should read private rate from M and hours from N");
assert.doesNotMatch(workbookText, /sourceRow=37[\s\S]*hours=60/, "workbook converter should not treat private rate as hours");
assert.match(workbookText, /sourceRow=65[\s\S]*Grab from CG to SCF[\s\S]*date=2026-01-10/, "workbook converter should convert Excel date serial claims");
assert.doesNotMatch(workbookText, /#VALUE!/, "workbook converter should omit Excel error cells from AI input");

globalThis.window.XLSX.read = () => mismatchedWorkbook;
globalThis.window.XLSX.utils.decode_range = () => ({ s: { r: 7, c: 1 }, e: { r: 36, c: 14 } });
const mismatchedWorkbookText = await harness.convertXlsxFileToWorkbookText({
  name: "Chess Grande Time Sheet October 2025.xlsx",
  async arrayBuffer() {
    return new ArrayBuffer(8);
  },
}, "2025-11");
assert.match(
  mismatchedWorkbookText,
  /sourceRow=9[\s\S]*SCF Int Replacement[\s\S]*dates=2025-11-02,2025-11-09,2025-11-16/,
  "workbook converter should preserve explicit November dates even when the filename says October"
);
assert.match(
  mismatchedWorkbookText,
  /sourceRow=37[\s\S]*section=private[\s\S]*Jean \+ 3[\s\S]*hours=1[\s\S]*rate=60[\s\S]*dates=2025-11-02,2025-11-09,2025-11-16,2025-11-23,2025-11-30/,
  "mismatched workbook converter should keep private hours separate from rate"
);
assert.doesNotMatch(
  mismatchedWorkbookText,
  /sourceRow=13/,
  "workbook converter should not interpret invalid day/month cells such as 14/13"
);

globalThis.window.XLSX.read = () => ({
  SheetNames: ["January"],
  Sheets: {
    January: {
      "!ref": "A34:O38",
      B34: { v: "Private Lessons (Online Rate- 30, CG - 45, In-house - 55)" },
      B36: { v: "No" },
      C36: { v: "Student Name" },
      D36: { v: "Start Time" },
      E36: { v: "End Time" },
      F36: { v: "Dates" },
      L36: { v: "Rate" },
      M36: { v: "No. of Hours" },
      N36: { v: "Total Hours" },
      O36: { v: "Total $" },
      B37: { v: 1, w: "1" },
      C37: { v: "Alex Lee" },
      D37: { v: 1800, w: "1800" },
      E37: { v: 1900, w: "1900" },
      F37: { v: "5/1" },
      G37: { v: "12/1" },
      L37: { v: 55, w: "55" },
      M37: { v: 1, w: "1" },
      N37: { f: "SUM(M37*COUNTA(F37:K37))", v: 2, w: "2" },
      O37: { f: "SUM(L37*N37)", v: 110, w: "110" },
    },
  },
});
globalThis.window.XLSX.utils.decode_range = () => ({ s: { r: 33, c: 0 }, e: { r: 37, c: 14 } });
const januaryPrivateWorkbookText = await harness.convertXlsxFileToWorkbookText({
  async arrayBuffer() {
    return new ArrayBuffer(8);
  },
}, "2026-01");
assert.match(januaryPrivateWorkbookText, /sourceRow=37[\s\S]*section=private[\s\S]*Alex Lee[\s\S]*hours=1[\s\S]*rate=55[\s\S]*dates=2026-01-05,2026-01-12/, "workbook converter should read newer private rate from L and hours from M");
assert.doesNotMatch(januaryPrivateWorkbookText, /sourceRow=37[\s\S]*hours=55/, "workbook converter should not treat the newer private rate as hours");
assert.doesNotMatch(januaryPrivateWorkbookText, /sourceRow=37[\s\S]*hours=2/, "workbook converter should not treat Total Hours as entry hours");

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

const mismatchPlan = harness.validateAiDraftImportPlan({
  ...validPlan,
  entries: [{ ...validPlan.entries[0], startTime: "09:00", endTime: "10:00", hours: 2, sourceRow: 37 }],
  warnings: [],
});
assert.equal(mismatchPlan.entries.length, 1, "manager import should still preview entries when one row has a warning");
assert.equal(mismatchPlan.entries[0].endTime, "11:00", "manager import should correct mismatched end time from hours");
assert.equal(mismatchPlan.warnings[0].type, "TimeHoursMismatch", "manager import should surface the mismatch as a warning");
assert.equal(mismatchPlan.warnings[0].sourceRow, 37, "manager import should keep the workbook source row in the warning");

const friendlyMismatchWarning = {
  sourceRow: 37,
  type: "TimeHoursMismatch",
  reason: "Interpreted duration from WARNING=timeHoursMismatch durationFromTimes=1 conflicts with row hours=60. Using correction endTime from calculatedEndFromHours (01:00).",
};
assert.equal(harness.getAiWarningTitle(friendlyMismatchWarning), "Time and hours need review (row 37)");
const friendlyMismatchText = harness.formatAiWarningMessage(friendlyMismatchWarning);
assert.match(friendlyMismatchText, /The time range and hours do not match/);
assert.match(friendlyMismatchText, /Please check this row before importing/);
assert.ok(!friendlyMismatchText.includes("durationFromTimes"), "manager warning should hide parser field names");
assert.ok(!friendlyMismatchText.includes("calculatedEndFromHours"), "manager warning should hide correction field names");

const rowWarningCases = [
  {
    name: "missing claim fields",
    plan: { ...validPlan, entries: [{ ...validPlan.entries[1], claimNotes: "", claimCost: null }], warnings: [] },
    message: /missing claimNotes or claimCost/,
  },
  {
    name: "invalid date",
    plan: { ...validPlan, entries: [{ ...validPlan.entries[0], date: "2026-02-31" }], warnings: [] },
    message: /invalid date/,
  },
  {
    name: "invalid time",
    plan: { ...validPlan, entries: [{ ...validPlan.entries[0], startTime: "930" }], warnings: [] },
    message: /must use HH:MM/,
  },
];

rowWarningCases.forEach((caseItem) => {
  const warningPlan = harness.validateAiDraftImportPlan(caseItem.plan);
  assert.equal(warningPlan.entries.length, 0, `validator should skip ${caseItem.name} entry`);
  assert.equal(warningPlan.warnings.length, 1, `validator should warn for ${caseItem.name}`);
  assert.match(warningPlan.warnings[0].reason, caseItem.message, `warning should explain ${caseItem.name}`);
});

[
  {
    name: "empty pay calculation",
    plan: { ...validPlan, payCalculation: {} },
    message: /payCalculation is missing standardRate/,
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
  "setMonthValue(plan.month);",
  "render();",
  "setMonthValue(aiPendingImportPlan.month);",
  "resetAiImportPreview(`Imported ${saved.length} draft entr",
].forEach((requiredCode) => {
  assert.ok(html.includes(requiredCode), `AI executor should include ${requiredCode}`);
});

const parseFlowStart = html.indexOf("async function parseAiXlsxImport()");
assert.notEqual(parseFlowStart, -1, "manager drafts should define parseAiXlsxImport");
const importMonthIndex = html.indexOf("const importContext = await inferAiImportMonth(file, monthPicker.value);", parseFlowStart);
const switchMonthIndex = html.indexOf("setMonthValue(importContext.month);", parseFlowStart);
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
