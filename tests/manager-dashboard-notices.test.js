import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "manager-dashboard.html"),
  "utf8"
);

[
  'src="./employee-notice-store.js"',
  'id="sendNoticeButton"',
  'id="noticeModalOverlay"',
  'id="noticeTitleInput"',
  'id="noticeBodyInput"',
  'id="noticeEmployeeSearch"',
  'id="noticeRecipientList"',
  'id="selectAllNoticeEmployees"',
  'id="noticeSendButton"',
  'id="noticeModalStatus"',
].forEach((requiredMarkup) => {
  assert.ok(html.includes(requiredMarkup), `manager dashboard should include ${requiredMarkup}`);
});

[
  "setupNoticeModal();",
  "sendNoticeButton.addEventListener(\"click\", openNoticeModal);",
  "noticeEmployeeSearch.addEventListener(\"input\", renderNoticeRecipientList);",
  "selectAllNoticeEmployees.addEventListener(\"click\", selectVisibleNoticeEmployees);",
  "noticeSendButton.addEventListener(\"click\", sendEmployeeNotice);",
  ".from(\"profiles\")",
  "let noticeUsers = [];",
  "formatRoleLabel",
  "window.employeeNoticeStore.createNotice({",
  "noticeType: \"manual\"",
  "recipientIds,",
  "createdBy: currentManagerId",
  "window.employeeNoticeStore.createPaymentNotice({",
  "paidAt: updatedSubmission.paid_at || new Date().toISOString()",
].forEach((requiredCode) => {
  assert.ok(html.includes(requiredCode), `manager dashboard should include ${requiredCode}`);
});

assert.ok(
  !html.includes(".eq(\"role\", \"employee\")"),
  "manager notices should not be limited to employee profiles"
);
assert.ok(
  html.includes("Search users"),
  "notice search should make it clear managers can message any user"
);
assert.ok(
  html.includes("Send Notice to Employee"),
  "manager dashboard action should use the requested notice button text"
);
assert.ok(
  html.includes("Draft Timesheet for Employee"),
  "manager dashboard action should use the requested draft timesheet text"
);
assert.ok(
  !html.includes("Open Employee Timesheet"),
  "manager dashboard should not show the employee timesheet shortcut in the submission actions"
);
[
  "@media (min-width: 561px) and (max-width: 760px)",
  ".filters {\n        grid-template-columns: repeat(3, minmax(0, 1fr));",
  ".filter-card {\n        min-width: 0;",
  ".filter-select {\n        min-height: 46px;",
  "grid-template-areas:",
  '"avatar identity hours rate pay"',
  '"avatar identity actions actions actions"',
  'class="file-identity"',
  'class="file-meta file-hours"',
  'class="file-meta file-rate"',
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `manager dashboard tablet submission row should include ${snippet}`);
});
[
  ".file-item-actions .file-action-label",
  "clip: rect(0 0 0 0);",
  "<span class=\"file-action-label\">Paid</span>",
  "<span class=\"file-action-label\">Delete</span>",
  "const paidButtonLabel = button.querySelector(\".file-action-label\");",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `manager dashboard compact file actions should include ${snippet}`);
});
assert.match(
  html,
  /@media \(max-width: 560px\)[\s\S]*\.file-item\s*\{\s*grid-template-columns:\s*1fr;[^}]*align-items:\s*start;/,
  "manager dashboard should keep the fully stacked submission card for phone widths only"
);
assert.match(
  html,
  /@media \(max-width: 560px\)[\s\S]*\.panel-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  "manager dashboard should keep the two primary panel actions in one row on narrow screens"
);
assert.match(
  html,
  /@media \(max-width: 560px\)[\s\S]*\.filters\s*\{\s*grid-template-columns:\s*1fr;/,
  "manager dashboard should keep filters stacked for phone widths only"
);
assert.ok(
  html.includes("Add a title, message, and at least one user."),
  "notice validation should refer to users instead of employees"
);
assert.match(
  html,
  /const recipientIds = getSelectedNoticeRecipientIds\(\);[\s\S]*if \(!title \|\| !body \|\| !recipientIds\.length\)/,
  "manual notices should require title, body, and at least one user"
);
assert.match(
  html,
  /selectedNoticeUserIds = new Set\(\);/,
  "notice modal should reset selected users when opened"
);
assert.match(
  html,
  /alert\(`Marked as paid, but the employee notice was not sent:/,
  "paid action should warn if the payment notice fails after the submission is marked paid"
);

console.log("manager-dashboard notice checks passed");
