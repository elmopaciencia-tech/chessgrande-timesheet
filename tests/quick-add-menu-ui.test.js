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

console.log("quick-add menu UI checks passed");
