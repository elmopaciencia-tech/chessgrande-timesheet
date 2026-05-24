import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pages = [
  ["employee timesheet", "chess-timesheet.html"],
  ["pay review", "chess-timesheet-pay.html"],
  ["manager entry", "manager-entry.html"],
];

for (const [label, fileName] of pages) {
  const html = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
  assert.match(
    html,
    /class="entry-actions-inner"/,
    `${label} ledger rows should render inline action controls`
  );
  assert.match(
    html,
    /class="entry-action-button entry-edit-button"/,
    `${label} ledger rows should include an icon edit button`
  );
  assert.match(
    html,
    /class="entry-action-button entry-remove-button"/,
    `${label} ledger rows should include an icon remove button`
  );
  assert.match(
    html,
    /data-tooltip="Remove Entry"/,
    `${label} remove button should expose the Remove Entry tooltip`
  );
  assert.match(
    html,
    /data-tooltip="Edit Entry"/,
    `${label} edit button should expose the Edit Entry tooltip`
  );
  assert.match(
    html,
    /\.entry-edit-button\s*\{[^}]*background:\s*#7c3aed;[^}]*color:\s*white;/is,
    `${label} edit button should use the purple background with a white icon`
  );
  assert.match(
    html,
    /#schoolGroups\s+\.school-card:hover/,
    `${label} school ledger cards should animate on hover`
  );
  assert.match(
    html,
    /\.school-card\s*\{[^}]*transition:\s*transform\s+180ms\s+ease/is,
    `${label} school ledger cards should transition their hover lift`
  );
  assert.match(
    html,
    /trashEntryIconSvg/,
    `${label} remove button should use the shared trash icon markup`
  );
}

const timesheetHtml = fs.readFileSync(path.join(process.cwd(), "chess-timesheet.html"), "utf8");
assert.match(
  timesheetHtml,
  /window\.draftTimesheetStore\.updateEntry/,
  "employee ledger edit should save through draftTimesheetStore.updateEntry"
);
assert.match(
  timesheetHtml,
  /openRequestedEntryForEditing/,
  "employee timesheet should support opening an entry from the pay review edit link"
);

const payHtml = fs.readFileSync(path.join(process.cwd(), "chess-timesheet-pay.html"), "utf8");
assert.match(
  payHtml,
  /editUrl\.searchParams\.set\("edit", entryId\)/,
  "pay review edit action should deep-link back to the timesheet editor"
);

const managerHtml = fs.readFileSync(path.join(process.cwd(), "manager-entry.html"), "utf8");
assert.match(
  managerHtml,
  /editEntryFromSubmission/,
  "manager entry ledger edit should update submitted payroll rows"
);

const uiEffects = fs.readFileSync(path.join(process.cwd(), "ui-effects.js"), "utf8");
assert.match(
  uiEffects,
  /\.entry-action-button/,
  "global icon pass should skip ledger action buttons"
);
assert.match(
  uiEffects,
  /hasPendingLucideIcons/,
  "global icon pass should only call Lucide when new icon placeholders are waiting"
);
assert.match(
  uiEffects,
  /removeAttribute\("data-lucide"\)/,
  "rendered Lucide SVGs should not keep data-lucide markers that trigger reprocessing"
);

console.log("ledger entry action checks passed");
