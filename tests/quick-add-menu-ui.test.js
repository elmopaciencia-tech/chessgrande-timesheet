import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const employeeHtml = fs.readFileSync(
  path.join(process.cwd(), "chess-timesheet.html"),
  "utf8"
);
const managerHtml = fs.readFileSync(
  path.join(process.cwd(), "manager-drafts.html"),
  "utf8"
);
const uiEffects = fs.readFileSync(
  path.join(process.cwd(), "ui-effects.js"),
  "utf8"
);

assert.ok(
  uiEffects.includes(".quick-add-apply") && uiEffects.includes(".profile-avatar-button"),
  "quick-add apply rows should not receive global text-derived icons"
);

[
  employeeHtml,
  managerHtml,
].forEach((source, index) => {
  const label = index === 0 ? "employee" : "manager";
  assert.ok(
    source.includes("Apply saved shortcut for"),
    `${label} quick-add apply buttons should avoid the words quick add in aria labels`
  );
  assert.ok(
    source.includes("Delete saved shortcut for"),
    `${label} quick-add delete buttons should avoid the words quick add in aria labels`
  );
  assert.ok(
    source.includes("overflow-wrap: anywhere;"),
    `${label} quick-add school names should wrap instead of truncating`
  );
  assert.ok(
    source.includes("justify-items: start;"),
    `${label} quick-add text should align left`
  );
  assert.ok(
    source.includes("applyQuickAddTemplateColor(applyButton, template)"),
    `${label} quick-add apply button should receive its saved calendar colour`
  );
  assert.ok(
    source.includes(".quick-add-apply.has-saved-color"),
    `${label} quick-add apply button should have a saved-colour style`
  );
  assert.ok(
    source.includes("--quick-add-text"),
    `${label} quick-add apply button should set readable text colour for saved colours`
  );
  assert.ok(
    source.includes("No quick adds saved yet."),
    `${label} quick-add empty state should match`
  );
});

assert.ok(
  !managerHtml.includes('removeButton.innerHTML = \'<span data-lucide="trash-2"'),
  "manager quick-add delete button should use the same icon path as the employee menu"
);

assert.ok(
  employeeHtml.includes("#entryComposerPanel.has-quick-add-open"),
  "employee entry composer should raise stacking when quick add menu is open"
);

assert.ok(
  employeeHtml.includes('entryComposerPanel?.classList.add("has-quick-add-open")'),
  "employee quick add open should toggle composer stacking class"
);

assert.ok(
  employeeHtml.includes('entryComposerPanel?.classList.remove("has-quick-add-open")'),
  "employee quick add close should remove composer stacking class"
);

assert.match(
  employeeHtml,
  /#entryComposerPanel\s*\{[^}]*overflow:\s*visible;/,
  "employee entry composer panel should allow quick add menu overflow"
);

assert.match(
  employeeHtml,
  /\.quick-add-list\s*\{[^}]*max-height:[^}]*overflow-y:\s*auto;/,
  "employee quick add list should scroll when templates overflow"
);

assert.match(
  employeeHtml,
  /\.quick-add-menu\s*\{[^}]*z-index:\s*60;/,
  "employee quick add menu should sit above adjacent panels"
);

assert.match(
  employeeHtml,
  /@media \(max-width: 900px\)[\s\S]*\.school-name-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto;[\s\S]*\.quick-add-menu\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*60;/s,
  "employee narrow viewports should keep entry name and quick add on one row with an overlay menu"
);

assert.match(
  employeeHtml,
  /@keyframes quick-add-menu-enter[\s\S]*@keyframes quick-add-menu-exit/,
  "employee quick add menu should animate open and close"
);

assert.match(
  employeeHtml,
  /function closeQuickAddMenu\(\)[\s\S]*is-closing[\s\S]*finishQuickAddMenuClose/,
  "employee quick add close should wait for the exit animation before hiding"
);

assert.match(
  employeeHtml,
  /id="quickAddPreview"[\s\S]*id="quickAddPreviewCard"[\s\S]*id="quickAddTitle"/,
  "employee quick add menu should preview the current entry above the saved shortcuts header"
);

assert.match(
  employeeHtml,
  /function renderQuickAddPreview\(\)[\s\S]*getQuickAddTemplateFromForm\(\)[\s\S]*is-skeleton/,
  "employee quick add preview should fall back to a skeleton when the entry is incomplete"
);

assert.match(
  employeeHtml,
  /function openQuickAddMenu\(\)[\s\S]*renderQuickAddPreview\(\);/,
  "employee quick add open should refresh the current-entry preview"
);

assert.ok(
  employeeHtml.includes('form.addEventListener("input", renderQuickAddPreview)'),
  "employee composer should refresh the quick add preview as fields change"
);

assert.match(
  employeeHtml,
  /id="quickAddPreviewSave"[\s\S]*aria-label="Add current entry as shortcut"/,
  "employee quick add preview should include an add button to save the current entry"
);

assert.match(
  employeeHtml,
  /function saveQuickAddFromPreview\(\)[\s\S]*quickAddStore\.createTemplate\(template/,
  "employee quick add preview save should create a shortcut from the current entry"
);

assert.ok(
  uiEffects.includes(".quick-add-preview-save") && uiEffects.includes('"plus"'),
  "quick-add preview save button should use a plus icon"
);

console.log("quick-add menu UI checks passed");
