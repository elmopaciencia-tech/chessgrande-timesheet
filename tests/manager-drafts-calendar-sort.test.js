import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "manager-drafts.html"),
  "utf8"
);

assert.ok(
  html.includes('const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];'),
  "manager drafts calendar should start on Sunday"
);

assert.ok(
  html.includes("const firstDayOffset = firstOfMonth.getDay();"),
  "manager drafts calendar grid should use Sunday-based getDay offsets"
);

assert.ok(
  html.includes("const schoolCompare = String(a.schoolName || \"\").localeCompare(String(b.schoolName || \"\"), undefined,"),
  "manager draft rows should sort by school name before date/time"
);

assert.ok(
  html.indexOf("const schoolCompare") < html.indexOf("const dateCompare"),
  "school-name sorting should take priority over date sorting"
);

assert.match(
  html,
  /function formatCalendarEntryMeta\(entry\)[\s\S]*if \(entry\.type === "Claim"\)[\s\S]*const claimCost = getCostEntryValue\(entry\)[\s\S]*return claimCost > 0 \? formatCurrency\(claimCost\) : "Claim";/,
  "manager draft claim chips should show the formatted claim cost"
);
assert.match(
  html,
  /function getCalendarEntryTitle\(entry\)[\s\S]*entry\?\.type === "Claim" && claimTitle[\s\S]*return claimTitle;/,
  "manager draft claim chips should use claim notes as their visible title"
);
assert.ok(
  html.includes("<strong>${escapeHtml(calendarTitle)}</strong>"),
  "manager draft calendar chips should render the resolved title"
);

console.log("manager-drafts calendar and sorting checks passed");
