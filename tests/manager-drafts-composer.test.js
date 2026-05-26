import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "manager-drafts.html"),
  "utf8"
);
const schema = fs.readFileSync(
  path.join(process.cwd(), "supabase-schema.sql"),
  "utf8"
);

assert.match(html, /class="workspace"/, "manager drafts should use the two-column workspace shell");
assert.match(html, /class="action-column"/, "draft editor should live in the right-side action column");
assert.match(html, /\.action-column\s*\{[^}]*position:\s*sticky/is, "right-side editor should be sticky on desktop");
assert.match(html, /id="draftList" class="groups"/, "draft rows should use the grouped school ledger layout");
assert.match(html, /card\.className = "school-card"/, "draft groups should render as school cards");
assert.match(html, /#draftList\s+\.school-card:hover/, "draft school cards should keep the ledger hover animation");
assert.match(html, /id="chipContextMenu"[\s\S]*data-chip-action="go"[\s\S]*data-chip-action="edit"[\s\S]*data-chip-action="remove"/, "manager draft calendar chips should expose the context menu actions");
assert.match(html, /id="chipRemoveModal"[\s\S]*role="dialog"[\s\S]*Remove this entry\?[\s\S]*data-chip-remove-confirm="cancel"[\s\S]*data-chip-remove-confirm="remove"/, "manager draft chip remove should confirm in a popup dialog");
assert.match(html, /tr\.is-entry-target-highlight td[\s\S]*@keyframes entry-target-highlight/, "manager draft ledger rows should animate when a chip jumps to them");

[
  '<option value="School Coaching">School Coaching</option>',
  '<option value="Replacement">Replacement</option>',
  '<option value="Camp">Camp</option>',
  '<option value="Private">Private</option>',
  '<option value="Event">Event</option>',
  '<option value="Claim">Claim</option>',
].forEach((optionMarkup) => {
  assert.ok(html.includes(optionMarkup), `manager composer should include ${optionMarkup}`);
});

[
  'src="./quick-add-store.js"',
  'id="quickAddToggle"',
  'id="quickAddMenu"',
  'id="quickAddList"',
  'id="quickAddStatus"',
  'id="saveQuickAdd"',
  'id="calendarColorToggle"',
  'id="calendarColorMenu"',
  'id="calendarColorOptions"',
  'id="claimFieldsTemplate"',
  'id="claimProofField"',
  'id="claimFieldsMount"',
  'id="repeatPanel"',
  'id="isRepeating"',
  'id="repeatDayCount"',
  'id="repeatWeeks"',
  'id="chipContextMenu"',
  'id="chipRemoveModal"',
  '<option value="1">1 day</option>',
  '<option value="5">5 weekdays</option>',
  '<option value="2">2 weekend days</option>',
  '<option value="7">7 days</option>',
].forEach((requiredMarkup) => {
  assert.ok(html.includes(requiredMarkup), `manager composer should include ${requiredMarkup}`);
});

[
  "await loadQuickAddTemplates();",
  "window.quickAddStore.loadTemplatesForEmployee(currentUser.id)",
  "window.quickAddStore.createTemplate(template",
  "window.quickAddStore.getNextWeekdayDate(template.weekday)",
  "button.addEventListener(\"click\", saveQuickAddTemplate);",
  "renderCalendarColorPicker();",
  "calendarColor: getSelectedCalendarColor()",
  "entryType === \"Private\"",
  "claimProofInput.required = !isEvent",
  "setSelectedCalendarColor(defaultCalendarColor)",
  "repeatInput.addEventListener(\"change\", () => syncRepeatControls());",
  "repeatDayCountSelect.addEventListener(\"change\", () => syncRepeatControls());",
  "repeatWeeksInput.addEventListener(\"input\", () => syncRepeatControls());",
  "buildRepeatDraftEntries(draft, repeatSettings)",
  "Repeat weeks must be a whole number from 1 to 52.",
  "renderDraftGroups(monthEntries)",
  "function renderDraftEntryActions(entry)",
  "class=\"entry-actions-inner\"",
  "class=\"entry-action-button entry-edit-button\"",
  "class=\"entry-action-button entry-remove-button\"",
  "data-delete-id=\"${entryId}\"",
  "function formatImageCell(entry)",
  "draftCalendar.addEventListener(\"contextmenu\", onCalendarChipContextMenu);",
  "draftCalendar.addEventListener(\"keydown\", onCalendarChipKeydown);",
  "chip.dataset.entryId = entry.id || \"\";",
  "const chip = target.closest(\".calendar-chip.has-calendar-color[data-entry-id]\");",
  "function openChipRemoveModal(entryId)",
  "async function confirmChipRemoveModal()",
  "await deleteDraft(entryId, { skipConfirm: true });",
  "function scrollToLedgerEntry(entryId)",
  "row.scrollIntoView({ behavior: \"smooth\", block: \"center\" });",
].forEach((requiredCode) => {
  assert.ok(html.includes(requiredCode), `manager composer should include ${requiredCode}`);
});

assert.doesNotMatch(
  html,
  /Repeat weekly for this school until the end of the selected month/,
  "manager composer should replace the old monthly repeat checkbox copy"
);
assert.doesNotMatch(
  html,
  /class="draft-list"|draft-card/,
  "manager draft rows should no longer render as individual draft cards"
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

const repeatBuilderScript = [
  "formatDateInput",
  "parseDateInput",
  "addCalendarDays",
  "buildWeekdayOffsets",
  "buildWeekendOffsets",
  "getRepeatDayOffsets",
  "buildRepeatDraftEntries",
].map((name) => extractFunction(html, name)).join("\n");

const buildRepeatDraftEntries = Function(`${repeatBuilderScript}; return buildRepeatDraftEntries;`)();
const baseDraft = {
  employeeId: "employee-1",
  schoolName: "Mock School",
  date: "2026-06-01",
  type: "School Coaching",
  startTime: "10:00",
  endTime: "12:00",
  hours: 2,
};

const mondayWeekdays = buildRepeatDraftEntries(baseDraft, { dayCount: 5, weeks: 8 });
assert.equal(mondayWeekdays.length, 40, "Monday 5-weekday repeat for 8 weeks should create 40 rows");
assert.deepEqual(
  mondayWeekdays.slice(0, 5).map((entry) => entry.date),
  ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05"],
  "5-weekday repeat should create Monday-Friday for a Monday start"
);
assert.equal(
  mondayWeekdays[5].date,
  "2026-06-08",
  "week 2 should start seven days after the selected Monday"
);

const mondaySingleDay = buildRepeatDraftEntries(baseDraft, { dayCount: 1, weeks: 8 });
assert.equal(mondaySingleDay.length, 8, "Monday 1-day repeat for 8 weeks should create 8 rows");
assert.deepEqual(
  mondaySingleDay.map((entry) => entry.date),
  ["2026-06-01", "2026-06-08", "2026-06-15", "2026-06-22", "2026-06-29", "2026-07-06", "2026-07-13", "2026-07-20"],
  "1-day repeat should repeat the selected date's weekday once per week"
);

const mondaySevenDays = buildRepeatDraftEntries(baseDraft, { dayCount: 7, weeks: 8 });
assert.equal(mondaySevenDays.length, 56, "Monday 7-day repeat for 8 weeks should create 56 rows");
assert.deepEqual(
  mondaySevenDays.slice(0, 7).map((entry) => entry.date),
  ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07"],
  "7-day repeat should create consecutive calendar days"
);

const mondayWeekends = buildRepeatDraftEntries(baseDraft, { dayCount: 2, weeks: 3 });
assert.equal(mondayWeekends.length, 6, "Monday 2-weekend-day repeat for 3 weeks should create 6 rows");
assert.deepEqual(
  mondayWeekends.map((entry) => entry.date),
  ["2026-06-06", "2026-06-07", "2026-06-13", "2026-06-14", "2026-06-20", "2026-06-21"],
  "2-weekend-day repeat should create Saturday and Sunday pairs"
);

const sundayWeekends = buildRepeatDraftEntries({ ...baseDraft, date: "2026-06-07" }, { dayCount: 2, weeks: 1 });
assert.deepEqual(
  sundayWeekends.map((entry) => entry.date),
  ["2026-06-07", "2026-06-13"],
  "2-weekend-day repeat should start on Sunday when Sunday is selected, then use the next Saturday"
);

const fridayWeekdays = buildRepeatDraftEntries({ ...baseDraft, date: "2026-05-01" }, { dayCount: 5, weeks: 1 });
assert.deepEqual(
  fridayWeekdays.map((entry) => entry.date),
  ["2026-05-01", "2026-05-04", "2026-05-05", "2026-05-06", "2026-05-07"],
  "Friday 5-weekday repeat should skip Saturday and Sunday"
);

const crossMonthRows = buildRepeatDraftEntries({ ...baseDraft, date: "2026-05-29" }, { dayCount: 5, weeks: 2 });
assert.ok(
  crossMonthRows.some((entry) => entry.date.startsWith("2026-06")),
  "multi-week repeat should not truncate generated rows at the selected month"
);

const adminPolicyTypeLists = schema.match(/type in \(([^)]*)\)/g) || [];
assert.ok(
  adminPolicyTypeLists.some((typeList) => typeList.includes("'Claim'") && typeList.includes("'Event'")),
  "manager/webadmin draft RLS policies should allow Claim and Event draft rows"
);

console.log("manager-drafts composer checks passed");
