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
