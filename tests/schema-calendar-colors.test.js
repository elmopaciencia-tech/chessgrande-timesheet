import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const schema = fs.readFileSync(
  path.join(process.cwd(), "supabase-schema.sql"),
  "utf8"
);

[
  "public.draft_timesheet_entries",
  "public.payroll_entries",
  "public.quick_add_templates",
].forEach((tableName) => {
  assert.match(
    schema,
    new RegExp(`alter table ${tableName.replace(".", "\\.")} add column if not exists calendar_color text`, "i"),
    `${tableName} should add nullable calendar_color`
  );
});

[
  "draft_timesheet_entries_calendar_color_check",
  "payroll_entries_calendar_color_check",
  "quick_add_templates_calendar_color_check",
].forEach((constraintName) => {
  assert.match(schema, new RegExp(constraintName, "i"));
});

[
  "#FFF689",
  "#F4D35E",
  "#FFB88A",
  "#FF9C5B",
  "#F67B45",
  "#FBC2C2",
  "#E39B99",
  "#CB7876",
  "#B4CFA4",
  "#8BA47C",
  "#62866C",
  "#A0C5E3",
  "#81B2D9",
  "#32769B",
  "#BBA6DD",
  "#8C7DA8",
  "#64557B",
  "#1E2136",
].forEach((color) => {
  assert.match(schema, new RegExp(color, "i"));
});

console.log("schema calendar-colour checks passed");
