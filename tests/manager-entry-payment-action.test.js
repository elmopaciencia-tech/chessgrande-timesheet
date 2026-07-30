import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "manager-entry.html"),
  "utf8"
);

[
  'src="./employee-notice-store.js"',
  'id="paymentReviewCard"',
  'id="paymentReviewStatus"',
  'id="markPaidButton"',
  'id="paymentConfirmPanel"',
  'id="cancelPaidButton"',
  'id="confirmPaidButton"',
  'id="paymentActionMessage"',
].forEach((requiredMarkup) => {
  assert.ok(html.includes(requiredMarkup), `manager entry should include ${requiredMarkup}`);
});

[
  "setupPaymentAction();",
  "renderPaymentState(submission);",
  "async function markSubmissionPaid()",
  ".update({ paid_at: paidAt, paid_by: currentManagerId })",
  '.eq("id", activeSubmission.id)',
  '.is("paid_at", null)',
  '.select("id, paid_at, paid_by")',
  "window.employeeNoticeStore.createPaymentNotice({",
  "createdBy: currentManagerId",
].forEach((requiredCode) => {
  assert.ok(html.includes(requiredCode), `manager entry should include ${requiredCode}`);
});

assert.match(
  html,
  /const user = await requireManager\(\);[\s\S]*currentManagerId = user\.id;/,
  "paid updates should record the authenticated manager"
);
assert.match(
  html,
  /paidAt: submissionRow\.paid_at[\s\S]*paidBy: submissionRow\.paid_by/,
  "the detail page should load the existing payment state"
);
assert.match(
  html,
  /markPaidButton\.addEventListener\("click", openPaymentConfirmation\);[\s\S]*cancelPaidButton\.addEventListener\("click", closePaymentConfirmation\);[\s\S]*confirmPaidButton\.addEventListener\("click", markSubmissionPaid\);/,
  "payment confirmation should require an explicit second action and support cancellation"
);
assert.match(
  html,
  /\.payment-review \[hidden\]\s*\{\s*display:\s*none;/,
  "the confirmation step should replace the first action instead of displaying both controls"
);
assert.match(
  html,
  /\.payment-action-message:empty\s*\{\s*display:\s*none;[\s\S]*#markPaidButton\s*\{[^}]*background:\s*var\(--success\);[\s\S]*#managerDetailsPanel \.calendar-actions\s*\{\s*margin-top:\s*var\(--space-2\);/,
  "the action stack should remove empty status spacing and use the success color for completion"
);
assert.match(
  html,
  /confirmPaidButton\.disabled = true;[\s\S]*confirmPaidButton\.setAttribute\("aria-busy", "true"\);[\s\S]*finally \{[\s\S]*confirmPaidButton\.disabled = false;[\s\S]*confirmPaidButton\.removeAttribute\("aria-busy"\);/,
  "the paid action should prevent duplicate requests and recover after errors"
);
assert.match(
  html,
  /\.is\("paid_at", null\)[\s\S]*if \(!data\) throw new Error\(/,
  "concurrent or already-paid updates should fail safely"
);
assert.match(
  html,
  /const isPaid = Boolean\(submission\.paidAt\);[\s\S]*markPaidButton\.disabled = isPaid;[\s\S]*paymentConfirmPanel\.hidden = true;/,
  "already-paid submissions should render as completed and prevent another payment action"
);
assert.match(
  html,
  /catch \(noticeError\)[\s\S]*marked paid, but the employee notice was not sent/,
  "the manager should be warned if notification delivery fails after payment succeeds"
);

console.log("manager entry payment action checks passed");
