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

const coloredCoachingRow = store.toRow(
  {
    employeeId: "employee-1",
    schoolName: "Anchor Green",
    date: "2026-05-16",
    type: "School Coaching",
    startTime: "14:15",
    endTime: "16:15",
    hours: 2,
    status: "active",
    calendarColor: "#a0c5e3",
  },
  {
    employeeId: "employee-1",
    createdBy: "employee-1",
    updatedBy: "employee-1",
  },
  "iosColor"
);

assert.equal(coloredCoachingRow.calendar_color, "#A0C5E3");

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

const eventCostRow = store.toRow(
  {
    employeeId: "employee-1",
    schoolName: "Tournament Support",
    date: "2026-05-18",
    type: "Event",
    claimNotes: "Pairing desk",
    claimCost: 45,
    status: "active",
  },
  {
    employeeId: "employee-1",
    createdBy: "employee-1",
    updatedBy: "employee-1",
  }
);

assert.equal(eventCostRow.type, "Event");
assert.equal(eventCostRow.school_name, "Tournament Support");
assert.equal(eventCostRow.start_time, null);
assert.equal(eventCostRow.end_time, null);
assert.equal(eventCostRow.start_time_minutes, 0);
assert.equal(eventCostRow.hours, 0);
assert.equal(eventCostRow.notes, "Pairing desk");
assert.equal(eventCostRow.claim_amount_cents, 4500);
assert.equal(eventCostRow.claim_proof_name, null);
assert.equal(eventCostRow.claim_image_url, null);

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
  calendar_color: "#BBA6DD",
});

assert.equal(entry.type, "Claim");
assert.equal(entry.claimNotes, "Transport");
assert.equal(entry.claimCost, 14.5);
assert.equal(entry.claimProofName, "receipt.jpg");
assert.equal(entry.claimImagePath, "r2/employee-1/2026-05/receipt.jpg");
assert.equal(entry.calendarColor, "#BBA6DD");

const eventEntry = store.toEntry({
  id: "draft-2",
  employee_id: "employee-1",
  status: "active",
  school_name: "Tournament Support",
  date: "2026-05-18",
  type: "Event",
  start_time: null,
  end_time: null,
  start_time_minutes: 0,
  hours: 0,
  notes: "Pairing desk",
  claim_amount_cents: 4500,
});

assert.equal(eventEntry.type, "Event");
assert.equal(eventEntry.schoolName, "Tournament Support");
assert.equal(eventEntry.startTime, "");
assert.equal(eventEntry.endTime, "");
assert.equal(eventEntry.hours, 0);
assert.equal(eventEntry.claimNotes, "Pairing desk");
assert.equal(eventEntry.claimCost, 45);
assert.equal(eventEntry.claimProofName, "");

assert.equal(store.isManagerEditable({ type: "Private", status: "active" }), true);
assert.equal(store.isManagerEditable({ type: "Event", status: "active", hours: 2 }), true);
assert.equal(store.isManagerEditable({ type: "Event", status: "active", claimCost: 45 }), true);
assert.equal(store.isManagerEditable({ type: "Camp", status: "active" }), true);
assert.equal(store.isManagerEditable({ type: "Claim", status: "active" }), true);
assert.equal(store.isManagerEditable({ type: "Private", status: "submitted" }), false);

let insertCallCount = 0;
context.window.supabaseClient = {
  from() {
    return {
      insert(rows) {
        insertCallCount += 1;
        return {
          select() {
            if (rows.length > 1) {
              return Promise.resolve({
                data: null,
                error: { message: 'new row violates row-level security policy for table "draft_timesheet_entries"' },
              });
            }
            if (rows[0].type === "Claim") {
              return Promise.resolve({
                data: null,
                error: { message: "claims are blocked by current RLS policy" },
              });
            }
            return Promise.resolve({
              data: rows.map((row, index) => ({ ...row, id: `saved-${index}` })),
              error: null,
            });
          },
        };
      },
    };
  },
};

const diagnosticResult = await store.insertEntriesWithDiagnostics(
  [
    {
      employeeId: "employee-1",
      schoolName: "Anchor Green",
      date: "2026-05-16",
      type: "School Coaching",
      startTime: "14:15",
      endTime: "16:15",
      hours: 2,
      status: "active",
    },
    {
      employeeId: "employee-1",
      schoolName: "Claims",
      date: "2026-05-16",
      type: "Claim",
      claimNotes: "Transport",
      claimCost: 14.5,
      status: "active",
    },
  ],
  {
    employeeId: "employee-1",
    createdBy: "manager-1",
    updatedBy: "manager-1",
  }
);

assert.equal(insertCallCount, 3, "diagnostic insert should try bulk once and each row after bulk failure");
assert.equal(diagnosticResult.saved.length, 1, "diagnostic insert should keep rows that pass RLS");
assert.equal(diagnosticResult.failed.length, 1, "diagnostic insert should report blocked rows");
assert.match(diagnosticResult.failed[0].error, /claims are blocked/, "diagnostic insert should preserve row failure messages");

const unlockCall = {
  updatePayload: null,
  filters: [],
};
context.window.supabaseClient = {
  from(tableName) {
    assert.equal(tableName, "draft_timesheet_entries");
    return {
      update(payload) {
        unlockCall.updatePayload = payload;
        return {
          eq(column, value) {
            unlockCall.filters.push([column, value]);
            return this;
          },
          select(columns) {
            unlockCall.selectColumns = columns;
            return Promise.resolve({
              data: [
                {
                  id: "draft-locked-1",
                  employee_id: "employee-1",
                  updated_by: "employee-1",
                  submission_id: null,
                  status: "active",
                  school_name: "Anchor Green",
                  date: "2026-05-16",
                  type: "School Coaching",
                  start_time: "14:15",
                  end_time: "16:15",
                  hours: 2,
                },
              ],
              error: null,
            });
          },
        };
      },
    };
  },
};

const unlockedRows = await store.unlockSubmittedBySubmission("submission-1", "employee-1");
assert.deepEqual(
  JSON.parse(JSON.stringify(unlockCall.updatePayload)),
  {
    status: "active",
    submission_id: null,
    updated_by: "employee-1",
  },
  "unlock should restore linked submitted draft rows to active rows"
);
assert.deepEqual(
  unlockCall.filters,
  [
    ["employee_id", "employee-1"],
    ["submission_id", "submission-1"],
    ["status", "submitted"],
  ],
  "unlock should be scoped to the current employee, submission, and submitted rows"
);
assert.equal(unlockedRows.length, 1, "unlock should return unlocked draft rows");
assert.equal(unlockedRows[0].status, "active", "unlocked draft rows should be active entries");

console.log("draft-timesheet-store contract tests passed");
