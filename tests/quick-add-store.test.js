import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const source = fs.readFileSync(
  path.join(process.cwd(), "quick-add-store.js"),
  "utf8"
);

const context = {
  console,
  Date,
  window: {
    supabaseClient: {},
  },
};
vm.createContext(context);
vm.runInContext(source, context);

const store = context.window.quickAddStore;

const row = store.toRow(
  {
    employeeId: "employee-1",
    schoolName: "  Anchor Green  ",
    weekday: 4,
    startTime: "14:15:00",
    hours: "2.50",
    calendarColor: "#ffb88a",
  },
  {
    employeeId: "employee-1",
  },
  "color"
);

assert.equal(row.employee_id, "employee-1");
assert.equal(row.school_name, "Anchor Green");
assert.equal(row.weekday, 4);
assert.equal(row.start_time, "14:15");
assert.equal(row.hours, 2.5);
assert.equal(row.calendar_color, "#FFB88A");

const template = store.toTemplate({
  id: "quick-1",
  employee_id: "employee-1",
  school_name: "Anchor Green",
  weekday: 6,
  start_time: "09:30:00",
  hours: "1.25",
  calendar_color: "#8C7DA8",
  created_at: "2026-05-24T00:00:00Z",
  updated_at: "2026-05-24T00:00:00Z",
});

assert.equal(template.id, "quick-1");
assert.equal(template.schoolName, "Anchor Green");
assert.equal(template.weekday, 6);
assert.equal(template.startTime, "09:30");
assert.equal(template.hours, 1.25);
assert.equal(template.calendarColor, "#8C7DA8");

const sunday = new Date(2026, 4, 24, 12, 30);
const nextThursday = store.getNextWeekdayDate(4, sunday);
assert.equal(nextThursday.getFullYear(), 2026);
assert.equal(nextThursday.getMonth(), 4);
assert.equal(nextThursday.getDate(), 28);
assert.equal(nextThursday.getDay(), 4);

const sameDayThursday = new Date(2026, 4, 28, 22, 10);
const sameThursday = store.getNextWeekdayDate(4, sameDayThursday);
assert.equal(sameThursday.getFullYear(), 2026);
assert.equal(sameThursday.getMonth(), 4);
assert.equal(sameThursday.getDate(), 28);
assert.equal(sameThursday.getDay(), 4);
assert.equal(sameThursday.getHours(), 0);
assert.equal(sameThursday.getMinutes(), 0);

assert.throws(
  () => store.getNextWeekdayDate(7, sunday),
  /weekday must be between Sunday and Saturday/
);

console.log("quick-add-store contract tests passed");
