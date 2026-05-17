import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const source = fs.readFileSync(
  path.join(process.cwd(), "draft-timesheet-store.js"),
  "utf8"
);

const context = {
  console,
  URL,
  window: {
    supabaseClient: {},
  },
};
vm.createContext(context);
vm.runInContext(source, context);

const store = context.window.draftTimesheetStore;

const coachingRow = store.toRow(
  {
    employeeId: "employee-1",
    schoolName: "Anchor Green",
    date: "2026-05-16",
    type: "schoolCoaching",
    startTime: "14:15",
    endTime: "16:15",
    hours: 2,
    status: "active",
  },
  {
    employeeId: "employee-1",
    createdBy: "manager-1",
    updatedBy: "manager-1",
  }
);

assert.equal(coachingRow.type, "School Coaching");
assert.equal(coachingRow.start_time, "14:15");
assert.equal(coachingRow.end_time, "16:15");
assert.equal(coachingRow.start_time_minutes, 855);
assert.equal(coachingRow.claim_amount_cents, 0);
assert.equal("claim_cost" in coachingRow, false);
assert.equal("claim_image_path" in coachingRow, false);
assert.equal("claim_proof_data_url" in coachingRow, false);

const claimRow = store.toRow(
  {
    employeeId: "employee-1",
    schoolName: "",
    date: "2026-05-16",
    type: "claim",
    claimNotes: "Transport",
    claimCost: 14.5,
    claimProofName: "receipt.jpg",
    claimImagePath: "r2/employee-1/2026-05/receipt.jpg",
    claimProofDataUrl: "https://signed.example/receipt.jpg",
    status: "active",
  },
  {
    employeeId: "employee-1",
    createdBy: "employee-1",
    updatedBy: "employee-1",
  }
);

assert.equal(claimRow.type, "Claim");
assert.equal(claimRow.school_name, "Claims");
assert.equal(claimRow.notes, "Transport");
assert.equal(claimRow.claim_amount_cents, 1450);
assert.equal(claimRow.claim_proof_name, "receipt.jpg");
assert.equal(claimRow.claim_image_url, "r2/employee-1/2026-05/receipt.jpg");

const entry = store.toEntry({
  id: "draft-1",
  employee_id: "employee-1",
  status: "active",
  school_name: "Claims",
  date: "2026-05-16",
  type: "claim",
  start_time: null,
  end_time: null,
  start_time_minutes: 0,
  hours: 0,
  notes: "Transport",
  claim_amount_cents: 1450,
  claim_proof_name: "receipt.jpg",
  claim_image_url: "r2/employee-1/2026-05/receipt.jpg",
});

assert.equal(entry.type, "Claim");
assert.equal(entry.claimNotes, "Transport");
assert.equal(entry.claimCost, 14.5);
assert.equal(entry.claimProofName, "receipt.jpg");
assert.equal(entry.claimImagePath, "r2/employee-1/2026-05/receipt.jpg");

console.log("draft-timesheet-store contract tests passed");
