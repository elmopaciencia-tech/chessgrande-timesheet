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
].forEach((requiredCode) => {
  assert.ok(html.includes(requiredCode), `manager composer should include ${requiredCode}`);
});

const adminPolicyTypeLists = schema.match(/type in \(([^)]*)\)/g) || [];
assert.ok(
  adminPolicyTypeLists.some((typeList) => typeList.includes("'Claim'") && typeList.includes("'Event'")),
  "manager/webadmin draft RLS policies should allow Claim and Event draft rows"
);

console.log("manager-drafts composer checks passed");
