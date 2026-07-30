import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "manager-dashboard.html"),
  "utf8"
);

[
  'src="./employee-notice-store.js"',
  'id="profileDirectorySendNoticeButton"',
  'id="noticeModalOverlay"',
  'id="noticeModalClose"',
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
  "profileDirectorySendNoticeButton.addEventListener(\"click\", openNoticeModal);",
  "noticeModalClose.addEventListener(\"click\", closeNoticeModal);",
  "noticeCancelButton.addEventListener(\"click\", closeNoticeModal);",
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
  "paidAt: updatedSubmission.paid_at || paidAt",
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
  "manager dashboard should not show the retired employee timesheet shortcut"
);
assert.match(
  html,
  /@media \(max-width: 560px\)[\s\S]*\.profile-directory-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  "manager dashboard should keep its two profile-directory actions in one row on narrow screens"
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
  /noticeModalOverlay\.hidden = false;[\s\S]*await loadNoticeUsers\(\);/,
  "notice modal should open before loading its recipients"
);
assert.match(
  html,
  /noticeSendButton\.disabled = true;[\s\S]*window\.employeeNoticeStore\.createNotice\([\s\S]*noticeSendButton\.disabled = false;/,
  "manual notice sending should prevent duplicate submissions and always re-enable the button"
);
assert.match(
  html,
  /catch \(noticeError\)[\s\S]*marked paid, but the employee notice was not sent/,
  "paid action should warn if notice delivery fails after the submission is marked paid"
);
assert.match(
  html,
  /if \(!data\) throw new Error\([\s\S]*window\.employeeNoticeStore\.createPaymentNotice\([\s\S]*await render\(\);/,
  "payment notice delivery should happen only after the paid update succeeds"
);

console.log("manager-dashboard notice checks passed");
