import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const source = fs.readFileSync(
  path.join(process.cwd(), "employee-notice-store.js"),
  "utf8"
);

const context = {
  console,
  Date,
  Intl,
  window: {
    supabaseClient: {},
  },
};
vm.createContext(context);
vm.runInContext(source, context);

const store = context.window.employeeNoticeStore;

const noticeRow = store.toNoticeRow(
  {
    title: "  Payroll update  ",
    body: "  Please check your dashboard.  ",
    noticeType: "manual",
    relatedSubmissionId: "",
  },
  { createdBy: "manager-1" }
);

assert.equal(JSON.stringify(noticeRow), JSON.stringify({
  created_by: "manager-1",
  title: "Payroll update",
  body: "Please check your dashboard.",
  notice_type: "manual",
  related_submission_id: null,
}));

assert.throws(
  () => store.toNoticeRow({ title: "", body: "Body", noticeType: "manual" }, { createdBy: "manager-1" }),
  /Notice title is required/
);

assert.equal(
  JSON.stringify(store.toRecipientRows("notice-1", ["employee-1", "employee-1", "", "employee-2"])),
  JSON.stringify([
    { notice_id: "notice-1", employee_id: "employee-1" },
    { notice_id: "notice-1", employee_id: "employee-2" },
  ]),
  "recipient rows should be unique and non-empty"
);
await assert.rejects(
  () => store.createNotice({ title: "Hello", body: "Body", recipientIds: [] }, { createdBy: "manager-1" }),
  /Select at least one user/
);

const recipientNotice = store.toRecipientNotice({
  notice_id: "notice-1",
  employee_id: "employee-1",
  read_at: "2026-05-26T02:00:00Z",
  notice: {
    id: "notice-1",
    created_by: "manager-1",
    title: "Paid",
    body: "Payroll is paid.",
    notice_type: "payment",
    related_submission_id: "submission-1",
    created_at: "2026-05-26T01:00:00Z",
  },
});

assert.equal(recipientNotice.id, "notice-1");
assert.equal(recipientNotice.employeeId, "employee-1");
assert.equal(recipientNotice.noticeType, "payment");
assert.equal(recipientNotice.relatedSubmissionId, "submission-1");
assert.equal(recipientNotice.isRead, true);

const paymentNotice = store.buildPaymentNotice({
  id: "submission-1",
  employeeId: "employee-1",
  employeeName: "Elmo Paciencia",
  monthLabel: "May 2026",
  totalPay: 123.45,
  paidAt: "2026-05-26T09:00:00Z",
});

assert.equal(paymentNotice.noticeType, "payment");
assert.equal(paymentNotice.relatedSubmissionId, "submission-1");
assert.equal(JSON.stringify(paymentNotice.recipientIds), JSON.stringify(["employee-1"]));
assert.match(paymentNotice.title, /May 2026 payroll marked paid/);
assert.match(paymentNotice.body, /Elmo Paciencia/);
assert.match(paymentNotice.body, /S\$123\.45/);

console.log("employee-notice-store contract tests passed");
