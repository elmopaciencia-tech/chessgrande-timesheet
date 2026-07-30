import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "chess-timesheet.html"), "utf8");
const selectedFileCard = html.match(
  /<div class="ai-upload-selected" id="aiSelectedFileCard"[\s\S]*?id="aiSelectedFileMeta">0 KB<\/span><\/p>\s*<\/div>/
)?.[0] || "";

assert.ok(selectedFileCard, "employee Excel import should render the selected-file card");
assert.match(
  selectedFileCard,
  /data-lucide="file-spreadsheet"[\s\S]*id="aiSelectedFileName"[\s\S]*id="aiSelectedFileMeta">0 KB<\/span>/,
  "selected-file card should show the file icon, name, and metadata"
);
assert.doesNotMatch(
  selectedFileCard,
  /ai-upload-file-status|>\s*Ready\s*<|ai-upload-remove|aiRemoveSelectedFileButton|data-lucide="trash-2"|data-lucide="x"/,
  "selected-file card should not show status copy or a secondary removal control"
);
assert.match(
  html,
  /<button class="secondary" id="aiClearImportButton" type="button">Clear<\/button>/,
  "the large Clear button should remain as the only file-removal control"
);
assert.match(
  html,
  /aiClearImportButton\.addEventListener\("click", \(\) => \{\s*clearAiSelectedFile\("Import cleared\."\);\s*\}\);/,
  "the large Clear button should continue clearing the selected file"
);
assert.doesNotMatch(
  html,
  /aiRemoveSelectedFileButton|aria-label="Remove selected Excel file"|\.ai-upload-remove/,
  "the smaller trash button and its unused code should be removed"
);

console.log("selected Excel file card UI checks passed");
