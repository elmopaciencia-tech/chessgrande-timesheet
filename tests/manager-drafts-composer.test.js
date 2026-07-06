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
  'id="monthPickerTrigger"',
  'id="monthPickerPanel"',
  'id="monthPickerGrid"',
  'id="chipContextMenu"',
  'id="chipRemoveModal"',
  'id="dateContextMenu"',
  'data-date-action="add"',
  'Add Entry On This Date',
  'Repeat entry on selected dates',
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
  "repeatInput.addEventListener(\"change\", onRepeatToggleChange);",
  "entryDateInput.addEventListener(\"change\", onRepeatAnchorChange);",
  "draftCalendar.addEventListener(\"click\", onCalendarRepeatDateClick);",
  "draftCalendar.addEventListener(\"pointerdown\", onCalendarRepeatPointerDown);",
  "draftCalendar.addEventListener(\"pointermove\", onCalendarRepeatPointerMove);",
  "buildDraftsForSelectedRepeatDates(draft)",
  "function renderMonthPickerGrid(monthValue = monthPicker.value)",
  "function setMonthValue(monthValue)",
  "Choose at least one repeat date on the calendar before saving.",
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
  "draftCalendar.addEventListener(\"contextmenu\", onCalendarDateContextMenu);",
  "dateContextMenu.addEventListener(\"click\", onDateContextMenuClick);",
  "function applyDateContextSelection()",
].forEach((requiredCode) => {
  assert.ok(html.includes(requiredCode), `manager composer should include ${requiredCode}`);
});

assert.match(
  html,
  /function getCalendarContextDay\(target\)[\s\S]*target\.closest\("\.calendar-day\[data-entry-date\]"\)/,
  "manager date context menu should target calendar day cells"
);
assert.match(
  html,
  /function applyDateContextSelection\(\)[\s\S]*entryDateInput\.value = dateContextMenu\.dataset\.entryDate[\s\S]*entryDateInput\.dispatchEvent\(new Event\("change"/,
  "manager date context action should update the composer date and refresh repeat selection"
);
assert.match(
  html,
  /\.calendar-day\.is-repeat-selected\s*\{[\s\S]*\.calendar-day\.is-repeat-selected::after/,
  "manager calendar day cells should have a distinct pending repeat selected state"
);
assert.match(
  html,
  /\.calendar-day\.is-repeat-selectable\s*\{[\s\S]*user-select:\s*none;[\s\S]*\.calendar-day\.is-repeat-selectable \*/,
  "manager repeat-selectable days should prevent native text selection during drag"
);
assert.match(
  html,
  /const pendingRepeatDates = new Set\(\)/,
  "manager repeat mode should track pending selected repeat dates"
);
assert.match(
  html,
  /function syncRepeatSelectionFromComposer\(\)[\s\S]*buildWeeklyDraftEntries\(baseDraft, monthPicker\.value\)[\s\S]*pendingRepeatDates\.add\(entry\.date\)/,
  "manager repeat mode should preselect weekly dates from the composer date"
);
assert.match(
  html,
  /function onCalendarRepeatDateClick\(event\)[\s\S]*if \(!repeatInput\.checked\) return;[\s\S]*toggleRepeatDate\(dayCell\.dataset\.entryDate/,
  "manager repeat date clicks should toggle day cells while repeat mode is active"
);
assert.match(
  html,
  /function onCalendarRepeatPointerMove\(event\)[\s\S]*document\.elementFromPoint\(event\.clientX, event\.clientY\)[\s\S]*applyRepeatDragDate\(dayCell\.dataset\.entryDate\)/,
  "manager repeat drag should detect crossed days from pointer coordinates"
);
assert.match(
  html,
  /const draftsToSave = repeatInput\.checked && !editingEntryId && !isCostEntry[\s\S]*\? buildDraftsForSelectedRepeatDates\(draft\)[\s\S]*: \[draft\]/,
  "manager save flow should insert selected repeat dates"
);
assert.doesNotMatch(
  html,
  /id="repeatDayCount"|id="repeatWeeks"|buildRepeatDraftEntries|Repeat weeks must be a whole number from 1 to 52\./,
  "manager composer should remove the old weeks/day-count repeat mode"
);
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

assert.match(
  html,
  /@media \(max-width: 920px\)[\s\S]*\.month-picker-popover\s*\{[^}]*left:\s*50%;[^}]*right:\s*auto;[^}]*transform:\s*translateX\(-50%\);/s,
  "manager drafts month picker popover should center on mobile"
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
  "buildWeeklyDraftEntries",
].map((name) => extractFunction(html, name)).join("\n");

const buildWeeklyDraftEntries = Function(`${repeatBuilderScript}; return buildWeeklyDraftEntries;`)();
const baseDraft = {
  employeeId: "employee-1",
  schoolName: "Mock School",
  date: "2026-06-01",
  type: "School Coaching",
  startTime: "10:00",
  endTime: "12:00",
  hours: 2,
};

const mondaySingleDay = buildWeeklyDraftEntries(baseDraft, "2026-06");
assert.equal(mondaySingleDay.length, 5, "weekly draft repeat should create Monday rows through month end");
assert.deepEqual(
  mondaySingleDay.map((entry) => entry.date),
  ["2026-06-01", "2026-06-08", "2026-06-15", "2026-06-22", "2026-06-29"],
  "weekly draft repeat should use the selected date's weekday until month end"
);

const adminPolicyTypeLists = schema.match(/type in \(([^)]*)\)/g) || [];
assert.ok(
  adminPolicyTypeLists.some((typeList) => typeList.includes("'Claim'") && typeList.includes("'Event'")),
  "manager/webadmin draft RLS policies should allow Claim and Event draft rows"
);

console.log("manager-drafts composer checks passed");
