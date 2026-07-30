import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const source = fs.readFileSync(
  path.join(process.cwd(), "trainee-pay-policy.js"),
  "utf8"
);

const context = {
  console,
  Date,
  Intl,
  window: {},
};
vm.createContext(context);
vm.runInContext(source, context);

const policy = context.window.traineePayPolicy;

assert.ok(policy, "trainee pay policy should be available to browser pages");
assert.equal(
  policy.isWeeklyStipendProfile({
    seniority_level: "trainee",
    pay_policy: "weekly_stipend",
  }),
  true,
  "an explicitly configured trainee should use weekly stipend payroll"
);
assert.equal(
  policy.isWeeklyStipendProfile({
    seniority_level: "trainee",
    pay_policy: "monthly_hourly",
  }),
  false,
  "trainee seniority alone must not silently change the pay policy"
);

assert.deepEqual(
  { ...policy.getWeekPeriod("2026-07-23") },
  {
    start: "2026-07-20",
    end: "2026-07-26",
    key: "2026-07-20",
    label: "20–26 Jul 2026",
  },
  "a Singapore payroll week should run Monday through Sunday"
);
assert.deepEqual(
  { ...policy.getWeekPeriod("2026-01-01") },
  {
    start: "2025-12-29",
    end: "2026-01-04",
    key: "2025-12-29",
    label: "29 Dec 2025–4 Jan 2026",
  },
  "week periods should remain correct across a year boundary"
);
assert.equal(
  policy.isWeekClosed("2026-07-26", "2026-07-27"),
  true,
  "a week should be submittable on the Monday after it closes"
);
assert.equal(
  policy.isWeekClosed("2026-07-26", "2026-07-26"),
  false,
  "a trainee should not submit before Sunday has finished"
);

const shortWork = {
  date: "2026-07-21",
  type: "School Coaching",
  hours: 0.25,
  status: "active",
};
const longerWork = {
  date: "2026-07-22",
  type: "Replacement",
  hours: 8,
  status: "active",
};
const timedEvent = {
  date: "2026-07-23",
  type: "Event",
  hours: 1.5,
  status: "active",
};
const claim = {
  date: "2026-07-24",
  type: "Claim",
  hours: 0,
  claimCost: 14.5,
  status: "active",
};
const eventCost = {
  date: "2026-07-25",
  type: "Event",
  hours: 0,
  claimCost: 45,
  claimNotes: "Tournament materials",
  status: "active",
};

assert.equal(policy.isQualifyingWorkEntry(shortWork), true, "any positive work should qualify");
assert.equal(policy.isQualifyingWorkEntry(claim), false, "claims should not activate a stipend");
assert.equal(policy.isQualifyingWorkEntry(eventCost), false, "expense-only events should not activate a stipend");
assert.equal(policy.isQualifyingWorkEntry(timedEvent), true, "positive-hour event work should qualify");

const oneEntryWeek = policy.calculateWeeklySummary([shortWork, claim], 120);
assert.equal(oneEntryWeek.qualifyingWorkHours, 0.25);
assert.equal(oneEntryWeek.basePay, 120);
assert.equal(oneEntryWeek.reimbursementPay, 14.5);
assert.equal(oneEntryWeek.totalPay, 134.5);

const manyHoursWeek = policy.calculateWeeklySummary(
  [shortWork, longerWork, timedEvent, claim, eventCost],
  120
);
assert.equal(manyHoursWeek.qualifyingWorkHours, 9.75);
assert.equal(
  manyHoursWeek.basePay,
  120,
  "additional hours in the same week must not increase the fixed stipend"
);
assert.equal(manyHoursWeek.reimbursementPay, 59.5);
assert.equal(manyHoursWeek.totalPay, 179.5);

const expenseOnlyWeek = policy.calculateWeeklySummary([claim, eventCost], 120);
assert.equal(expenseOnlyWeek.qualifies, false);
assert.equal(expenseOnlyWeek.basePay, 0);
assert.equal(expenseOnlyWeek.reimbursementPay, 59.5);

const groups = policy.groupEntriesByWeek([
  shortWork,
  { ...longerWork, date: "2026-07-27" },
  { ...claim, date: "not-a-date" },
]);
assert.deepEqual(
  Array.from(groups.keys()),
  ["2026-07-20", "2026-07-27"],
  "entries should group into stable Monday week keys and ignore invalid dates"
);

assert.doesNotMatch(
  source,
  /promotion/i,
  "the policy bundle loaded by trainees should not expose promotion targets or progress"
);
assert.equal(
  policy.calculatePromotionProgress,
  undefined,
  "promotion progress should remain manager-only"
);

console.log("trainee pay-policy checks passed");
