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
  const usesSeparateChipRemoveModal = fileName === "chess-timesheet.html" || fileName === "chess-timesheet-pay.html";
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
    /id="chipContextMenu"[\s\S]*data-chip-action="go"[\s\S]*data-chip-action="edit"[\s\S]*data-chip-action="remove"/,
    `${label} coloured calendar chips should expose a context menu with go, edit, and remove actions`
  );
  if (usesSeparateChipRemoveModal) {
    assert.match(
      html,
      /id="chipRemoveModal"[\s\S]*role="dialog"[\s\S]*Remove this entry\?[\s\S]*data-chip-remove-confirm="cancel"[\s\S]*data-chip-remove-confirm="remove"/,
      `${label} chip remove action should ask for confirmation in a popup dialog`
    );
    assert.doesNotMatch(
      html,
      /data-chip-menu-panel="confirm"|data-chip-confirm/,
      `${label} chip remove confirmation should not render inside the context menu`
    );
  } else {
    assert.match(
      html,
      /data-chip-menu-panel="confirm"[\s\S]*Remove this entry\?[\s\S]*data-chip-confirm="cancel"[\s\S]*data-chip-confirm="remove"/,
      `${label} chip remove action should ask for confirmation inside the menu`
    );
  }
  assert.match(
    html,
    /\.chip-context-menu\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*1450;/is,
    `${label} chip context menu should float above the calendar`
  );
  assert.match(
    html,
    /\.chip-context-menu button\s*\{[^}]*justify-content:\s*flex-start;[^}]*text-align:\s*left;/is,
    `${label} chip context menu items should align their text to the left`
  );
  assert.match(
    html,
    /\.chip-context-menu \.cg-icon\s*\{[^}]*display:\s*none;/is,
    `${label} chip context menu should hide any globally injected icons`
  );
  assert.match(
    html,
    /calendar\.addEventListener\("contextmenu", onCalendarChipContextMenu\)/,
    `${label} calendar should open the chip menu on right click`
  );
  if (fileName === "chess-timesheet.html") {
    assert.match(
      html,
      /id="dateContextMenu"[\s\S]*data-date-action="add"/,
      "employee calendar day cells should expose an add-entry date context menu"
    );
    assert.match(
      html,
      /calendar\.addEventListener\("contextmenu", onCalendarDateContextMenu\)/,
      "employee calendar should open the date menu on right click"
    );
    assert.match(
      html,
      /cell\.dataset\.entryDate = key/,
      "employee calendar day cells should carry the date they represent"
    );
    assert.match(
      html,
      /const dayCell = target\.closest\("\.day\[data-entry-date\]"\)/,
      "employee date context menu should target any calendar day cell"
    );
    assert.match(
      html,
      /function applyDateContextSelection\(\)[\s\S]*entryDateInput\.value = dateContextMenu\.dataset\.entryDate/,
      "employee date context action should update the composer date field"
    );
  }
  assert.match(
    html,
    /calendar\.addEventListener\("keydown", onCalendarChipKeydown\)/,
    `${label} calendar should support keyboard context menu access`
  );
  assert.match(
    html,
    /const chip = target\.closest\("\.chip\.has-calendar-color\[data-entry-id\]"\)/,
    `${label} context menu should target coloured calendar chips with entry ids`
  );
  assert.match(
    html,
    /chip\.dataset\.entryId = entry\.id \|\| ""/,
    `${label} calendar chips should carry their entry id`
  );
  assert.match(
    html,
    /row\.dataset\.ledgerEntryId = entry\.id \|\| ""/,
    `${label} ledger rows should carry their entry id for chip navigation`
  );
  assert.match(
    html,
    /function triggerLedgerEntryAction\(action, entryId\)[\s\S]*button\.click\(\)/,
    `${label} chip edit/remove actions should route through existing ledger buttons`
  );
  if (usesSeparateChipRemoveModal) {
    assert.match(
      html,
      /function onChipContextMenuClick\(event\)[\s\S]*openChipRemoveModal\(entryId\)/,
      `${label} chip remove action should open the confirmation popup`
    );
    assert.match(
      html,
      /function confirmChipRemoveModal\(\)[\s\S]*triggerLedgerEntryAction\("remove", entryId\)/,
      `${label} confirmed chip remove popup should route through the existing remove button`
    );
    assert.match(
      html,
      /function closeChipRemoveModal\(options = \{\}\)[\s\S]*restoreFocus/,
      `${label} chip remove popup should close cleanly and restore focus when cancelled`
    );
  } else {
    assert.match(
      html,
      /function onChipContextMenuClick\(event\)[\s\S]*data-chip-confirm[\s\S]*triggerLedgerEntryAction\("remove", entryId\)/,
      `${label} confirmed chip remove should route through the existing remove button`
    );
    assert.match(
      html,
      /function showChipRemoveConfirmation\(\)[\s\S]*data-chip-menu-panel="actions"[\s\S]*data-chip-menu-panel="confirm"/,
      `${label} remove confirmation should swap the menu into a confirmation state`
    );
  }
  assert.match(
    html,
    /function scrollToLedgerEntry\(entryId\)[\s\S]*scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)[\s\S]*is-entry-target-highlight/,
    `${label} chip go-to action should scroll to and highlight the matching ledger row`
  );
  assert.match(
    html,
    /tr\.is-entry-target-highlight td[\s\S]*@keyframes entry-target-highlight/,
    `${label} ledger rows should animate when highlighted from a chip`
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
  /id="entryComposerTitle">Add Or Update A Session<\/h2>/,
  "employee composer should expose a title that can switch in edit mode"
);
assert.match(
  timesheetHtml,
  /const entryComposerEditTitle = "Edit an Entry"/,
  "employee composer should use the edit-specific title while editing"
);
assert.match(
  timesheetHtml,
  /const entryComposerEditCopy = "Update the selected ledger entry here\./,
  "employee composer should use edit-specific helper copy while editing"
);
assert.match(
  timesheetHtml,
  /function syncEntryComposerMode\(\)[\s\S]*entryComposerPanel\?\.classList\.toggle\("is-editing-entry", isEditing\)[\s\S]*entryComposerTitle\.textContent = isEditing \? entryComposerEditTitle : entryComposerDefaultTitle[\s\S]*entryComposerCopy\.textContent = isEditing \? entryComposerEditCopy : entryComposerDefaultCopy/,
  "employee composer should sync title, copy, and highlight from edit state"
);
assert.match(
  timesheetHtml,
  /#entryComposerPanel\.is-editing-entry::before[\s\S]*animation: composer-edit-aura/,
  "employee composer should show an emanating highlight while editing"
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
assert.match(
  timesheetHtml,
  /const entryDateInput = document\.getElementById\("entryDate"\)/,
  "employee composer should bind the entry date field once"
);
assert.match(
  timesheetHtml,
  /entryDateInput\.addEventListener\("pointerdown", openEntryDatePicker\)/,
  "employee composer date field should open its picker on pointer interaction"
);
assert.match(
  timesheetHtml,
  /entryDateInput\.addEventListener\("click", openEntryDatePicker\)/,
  "employee composer date field should open its picker on click"
);
assert.match(
  timesheetHtml,
  /\["Enter", " ", "ArrowDown"\]\.includes\(event\.key\)[\s\S]*openEntryDatePicker\(event\)/,
  "employee composer date field should support keyboard picker opening"
);
assert.match(
  timesheetHtml,
  /function openEntryDatePicker\(event\)[\s\S]*entryDateInput\.showPicker\(\)/,
  "employee composer should use the browser date picker when available"
);
assert.match(
  timesheetHtml,
  /function openEntryDatePicker\(event\)[\s\S]*closeQuickAddMenu\(\);[\s\S]*closeCalendarColorMenu\(\);/,
  "employee composer date picker should close other composer popovers first"
);
assert.match(
  timesheetHtml,
  /id="chipContextMenu"[\s\S]*data-chip-action="go"[\s\S]*data-chip-action="edit"[\s\S]*data-chip-action="remove"/,
  "employee calendar chips should expose a context menu with go, edit, and remove actions"
);
assert.match(
  timesheetHtml,
  /\.chip-context-menu\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*1450;/is,
  "employee chip context menu should float above the calendar"
);
assert.match(
  timesheetHtml,
  /calendar\.addEventListener\("contextmenu", onCalendarChipContextMenu\)/,
  "employee calendar should open the chip menu on right click"
);
assert.match(
  timesheetHtml,
  /calendar\.addEventListener\("keydown", onCalendarChipKeydown\)/,
  "employee calendar should support keyboard context menu access"
);
assert.match(
  timesheetHtml,
  /const chip = target\.closest\("\.chip\.has-calendar-color\[data-entry-id\]"\)/,
  "employee context menu should target coloured calendar chips with entry ids"
);
assert.match(
  timesheetHtml,
  /chip\.dataset\.entryId = entry\.id \|\| ""/,
  "employee calendar chips should carry their entry id"
);
assert.match(
  timesheetHtml,
  /row\.dataset\.ledgerEntryId = entry\.id \|\| ""/,
  "employee ledger rows should carry their entry id for chip navigation"
);
assert.match(
  timesheetHtml,
  /function triggerLedgerEntryAction\(action, entryId\)[\s\S]*button\.click\(\)/,
  "employee chip edit/remove actions should route through existing ledger buttons"
);
assert.match(
  timesheetHtml,
  /function scrollToLedgerEntry\(entryId\)[\s\S]*scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)[\s\S]*is-entry-target-highlight/,
  "employee chip go-to action should scroll to and highlight the matching ledger row"
);
assert.match(
  timesheetHtml,
  /tr\.is-entry-target-highlight td[\s\S]*@keyframes entry-target-highlight/,
  "employee ledger rows should animate when highlighted from a chip"
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

[
  ["employee timesheet", "chess-timesheet.html", "timesheet"],
  ["pay review", "chess-timesheet-pay.html", "pay"],
].forEach(([label, fileName, varPrefix]) => {
  const html = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
  assert.match(
    html,
    /@media \(max-width: 760px\)[\s\S]*#schoolGroups \.school-card\s*\{[^}]*overflow:\s*hidden;[\s\S]*#schoolGroups table\s*\{[^}]*display:\s*table;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*table-layout:\s*fixed;[\s\S]*#schoolGroups th,[\s\S]*#schoolGroups td\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;[\s\S]*#schoolGroups td::before\s*\{[^}]*content:\s*none;/,
    `${label} mobile school ledger should compress inside the card while keeping desktop-like columns`
  );
  assert.match(
    html,
    new RegExp(`#schoolGroups table\\.is-time-ledger\\s*\\{[\\s\\S]*--${varPrefix}-date-col:\\s*clamp\\(48px, 14vw, 70px\\);[\\s\\S]*--${varPrefix}-type-col:\\s*clamp\\(64px, 20vw, 94px\\);[\\s\\S]*--${varPrefix}-actions-col:\\s*clamp\\(64px, 17vw, 78px\\);[\\s\\S]*#schoolGroups th\\s*\\{[^}]*font-size:\\s*clamp\\(0?\\.62rem, 2\\.7vw, 0?\\.74rem\\);[\\s\\S]*#schoolGroups table\\.is-time-ledger th:nth-child\\(4\\),\\s*#schoolGroups table\\.is-time-ledger td:nth-child\\(4\\)\\s*\\{\\s*width:\\s*calc\\(100% - var\\(--${varPrefix}-date-col\\) - var\\(--${varPrefix}-type-col\\) - var\\(--${varPrefix}-hours-col\\) - var\\(--${varPrefix}-actions-col\\)\\);[\\s\\S]*#schoolGroups table\\.is-time-ledger td:nth-child\\(1\\),[\\s\\S]*#schoolGroups table\\.is-time-ledger td:nth-child\\(2\\),[\\s\\S]*#schoolGroups table\\.is-time-ledger td:nth-child\\(4\\)\\s*\\{[\\s\\S]*white-space:\\s*normal;[\\s\\S]*overflow-wrap:\\s*anywhere;`),
    `${label} mobile date, type, and time columns should wrap instead of clipping`
  );
  assert.match(
    html,
    /table\.classList\.toggle\("is-time-ledger", !isCostOnlyGroup\);/,
    `${label} should mark standard time ledgers for mobile column sizing`
  );
  assert.match(
    html,
    new RegExp(`#schoolGroups table\\.is-cost-ledger\\s*\\{[\\s\\S]*--${varPrefix}-cost-date-col:\\s*clamp\\(56px, 16vw, 76px\\);[\\s\\S]*--${varPrefix}-cost-actions-col:\\s*clamp\\(64px, 17vw, 78px\\);[\\s\\S]*#schoolGroups table\\.is-cost-ledger th:nth-child\\(2\\),\\s*#schoolGroups table\\.is-cost-ledger td:nth-child\\(2\\)\\s*\\{\\s*width:\\s*calc\\(100% - var\\(--${varPrefix}-cost-date-col\\) - var\\(--${varPrefix}-cost-actions-col\\)\\);[\\s\\S]*#schoolGroups table\\.is-cost-ledger td:nth-child\\(1\\),[\\s\\S]*#schoolGroups table\\.is-cost-ledger td:nth-child\\(2\\)\\s*\\{[\\s\\S]*white-space:\\s*normal;[\\s\\S]*overflow-wrap:\\s*anywhere;`),
    `${label} mobile cost ledgers should use matching responsive date and type columns`
  );
  assert.match(
    html,
    /#schoolGroups \.entry-actions \.locked\s*\{[^}]*max-width:\s*100%;[^}]*padding:\s*0 5px;[^}]*font-size:\s*clamp\(0?\.48rem, 2\.1vw, 0?\.58rem\);[^}]*white-space:\s*nowrap;/,
    `${label} submitted status should shrink to fit the mobile action column`
  );
  assert.match(
    html,
    /table\.classList\.toggle\("is-cost-ledger", isCostOnlyGroup && !hasClaimRows\);/,
    `${label} should mark cost-only ledgers for mobile column sizing`
  );
});

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
assert.match(
  managerHtml,
  /\.update\(updates\)[\s\S]*\.eq\("id", editingEntryId\)[\s\S]*\.select\("id"\)[\s\S]*\.maybeSingle\(\)/,
  "manager entry save should require Supabase to return the updated payroll entry"
);
assert.match(
  managerHtml,
  /@media \(max-width: 760px\)[\s\S]*#schoolGroups \.school-card\s*\{[^}]*overflow:\s*hidden;[\s\S]*#schoolGroups table\s*\{[^}]*display:\s*table;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*table-layout:\s*fixed;[\s\S]*#schoolGroups th,[\s\S]*#schoolGroups td\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;[\s\S]*#schoolGroups td::before\s*\{[^}]*content:\s*none;/,
  "manager entry mobile school ledger should compress inside the card while keeping desktop-like columns"
);
assert.match(
  managerHtml,
  /#schoolGroups table\.is-time-ledger\s*\{[\s\S]*--manager-entry-date-col:\s*clamp\(48px, 14vw, 70px\);[\s\S]*--manager-entry-type-col:\s*clamp\(64px, 20vw, 94px\);[\s\S]*--manager-entry-actions-col:\s*clamp\(64px, 17vw, 78px\);[\s\S]*#schoolGroups th\s*\{[^}]*font-size:\s*clamp\(.62rem, 2.7vw, .74rem\);[\s\S]*#schoolGroups table\.is-time-ledger th:nth-child\(4\),\s*#schoolGroups table\.is-time-ledger td:nth-child\(4\)\s*\{\s*width:\s*calc\(100% - var\(--manager-entry-date-col\) - var\(--manager-entry-type-col\) - var\(--manager-entry-hours-col\) - var\(--manager-entry-actions-col\)\);[\s\S]*#schoolGroups table\.is-time-ledger td:nth-child\(1\),[\s\S]*#schoolGroups table\.is-time-ledger td:nth-child\(2\),[\s\S]*#schoolGroups table\.is-time-ledger td:nth-child\(4\)\s*\{[\s\S]*white-space:\s*normal;[\s\S]*overflow-wrap:\s*anywhere;/,
  "manager entry mobile date, type, and time columns should wrap instead of clipping"
);
assert.match(
  managerHtml,
  /@media \(max-width: 420px\)[\s\S]*#schoolGroups table\.is-time-ledger\s*\{[\s\S]*--manager-entry-date-col:\s*clamp\(40px, 13vw, 46px\);[\s\S]*--manager-entry-type-col:\s*clamp\(54px, 18vw, 62px\);[\s\S]*--manager-entry-actions-col:\s*clamp\(48px, 16vw, 54px\);[\s\S]*#schoolGroups table\.is-time-ledger td:nth-child\(4\)\s*\{[\s\S]*overflow-wrap:\s*normal;[\s\S]*#schoolGroups \.entry-actions \.entry-action-button\s*\{[\s\S]*width:\s*24px;/,
  "manager entry very narrow ledger should preserve time column width and compact row actions"
);
assert.match(
  managerHtml,
  /table\.classList\.toggle\("is-time-ledger", !isCostOnlyGroup\);/,
  "manager entry should mark standard time ledgers for mobile column sizing"
);
assert.match(
  managerHtml,
  /#schoolGroups table\.is-cost-ledger\s*\{[\s\S]*--manager-entry-cost-date-col:\s*clamp\(56px, 16vw, 76px\);[\s\S]*--manager-entry-cost-actions-col:\s*clamp\(64px, 17vw, 78px\);[\s\S]*#schoolGroups table\.is-cost-ledger th:nth-child\(2\),\s*#schoolGroups table\.is-cost-ledger td:nth-child\(2\)\s*\{\s*width:\s*calc\(100% - var\(--manager-entry-cost-date-col\) - var\(--manager-entry-cost-actions-col\)\);[\s\S]*#schoolGroups table\.is-cost-ledger td:nth-child\(1\),[\s\S]*#schoolGroups table\.is-cost-ledger td:nth-child\(2\)\s*\{[\s\S]*white-space:\s*normal;[\s\S]*overflow-wrap:\s*anywhere;/,
  "manager entry mobile cost ledgers should use matching responsive date and type columns"
);
assert.match(
  managerHtml,
  /table\.classList\.toggle\("is-cost-ledger", isCostOnlyGroup && !hasClaimRows\);/,
  "manager entry should mark cost-only ledgers for mobile column sizing"
);
assert.match(
  managerHtml,
  /Supabase did not update this row/,
  "manager entry save should show a clear message when RLS filters out an update"
);
assert.match(
  managerHtml,
  /\.update\(\{ total_hours: totalHours, total_pay: totalPay \}\)[\s\S]*\.select\("id"\)[\s\S]*\.maybeSingle\(\)/,
  "manager entry totals refresh should verify the payroll submission update"
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
  uiEffects,
  /SKIP_ICON_SELECTOR[\s\S]*\.chip-context-menu button/,
  "chip context menu buttons should not receive automatic text-based icons"
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
