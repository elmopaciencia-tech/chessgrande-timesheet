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
const theme = fs.readFileSync(path.join(process.cwd(), "theme.css"), "utf8");
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
assert.match(
  timesheetHtml,
  /clearMonthButton\.addEventListener\("click", handleClearMonthButtonClick\)/,
  "employee composer clear button should route through edit-aware click handling"
);
assert.match(
  timesheetHtml,
  /function cancelEntryEdit\(\)[\s\S]*resetEntryComposer\(\);[\s\S]*render\(\);/,
  "employee composer should cancel edits through a shared reset path"
);
assert.match(
  timesheetHtml,
  /clearMonthButton\.textContent = isEditing \? "Cancel Edit" : "Clear Month"/,
  "employee composer should relabel Clear Month as Cancel Edit while editing"
);
assert.match(
  timesheetHtml,
  /clearMonthButton\.classList\.toggle\("is-cancel-edit", isEditing\)/,
  "employee composer should visually switch the clear button into cancel-edit mode"
);
assert.match(
  timesheetHtml,
  /event\.key !== "Escape"[\s\S]*cancelEntryEdit\(\)/,
  "employee composer should cancel active entry edits from the Escape key"
);
assert.match(
  timesheetHtml,
  /#clearMonth\.is-cancel-edit/,
  "employee composer cancel edit button should not keep the destructive clear-month styling"
);

const payHtml = fs.readFileSync(path.join(process.cwd(), "chess-timesheet-pay.html"), "utf8");
assert.match(
  payHtml,
  /id="entryEditModal"/,
  "pay review edit action should open a modal entry composer"
);
assert.match(
  payHtml,
  /id="entryEditColorToggle"/,
  "pay review modal should use the compact rainbow colour toggle"
);
assert.match(
  payHtml,
  /id="entryEditColorMenu"/,
  "pay review modal should render the colour picker popover"
);
assert.doesNotMatch(
  payHtml,
  /<label>Calendar Colour<\/label>/,
  "pay review modal colour picker should not show a text label"
);
assert.match(
  payHtml,
  /saveEditedDraftEntry/,
  "pay review modal should save edits back to draft entries"
);
assert.match(
  payHtml,
  /window\.draftTimesheetStore\.updateEntry/,
  "pay review modal should update the existing draft row"
);
assert.doesNotMatch(
  payHtml,
  /editUrl\.searchParams\.set\("edit", entryId\)/,
  "pay review edit action should not redirect to the timesheet editor"
);

const managerHtml = fs.readFileSync(path.join(process.cwd(), "manager-entry.html"), "utf8");
assert.match(
  managerHtml,
  /id="entryEditModal"/,
  "manager entry edit action should open a modal entry composer"
);
assert.match(
  managerHtml,
  /id="entryEditColorToggle"/,
  "manager entry modal should use the compact rainbow colour toggle"
);
assert.match(
  managerHtml,
  /id="entryEditColorMenu"/,
  "manager entry modal should render the colour picker popover"
);
assert.doesNotMatch(
  managerHtml,
  /<label>Calendar Colour<\/label>/,
  "manager entry modal colour picker should not show a text label"
);
assert.match(
  managerHtml,
  /saveEditedSubmittedEntry/,
  "manager entry modal should update submitted payroll rows"
);
assert.doesNotMatch(
  managerHtml,
  /prompt\(/,
  "manager entry edit action should not use browser prompt dialogs"
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
assert.match(
  uiEffects,
  /SKIP_ICON_SELECTOR[\s\S]*\.entry-edit-close/,
  "entry edit modal close buttons should not receive automatic pencil icons"
);
assert.match(
  theme,
  /\.entry-edit-modal:not\(\[hidden\]\)/,
  "entry edit modal overlay should animate when opened"
);
assert.match(
  theme,
  /\.entry-edit-modal:not\(\[hidden\]\) \.entry-edit-card/,
  "entry edit modal card should animate when opened"
);

console.log("ledger entry action checks passed");
