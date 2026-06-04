import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "webadmin-dashboard.html"),
  "utf8"
);

[
  'class="admin-shell"',
  'class="admin-sidebar"',
  'class="sidebar-metrics"',
  'class="member-board"',
  'class="member-table-head"',
  'id="fileList" class="member-list"',
  'item.className = "member-line";',
  'class="member-avatar"',
  'class="role-pill role-',
  "function formatJoinedDate(value)",
  "function getInitials(value)",
  "function formatRoleLabel(value)",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `webadmin directory should include ${snippet}`);
});

assert.ok(
  !html.includes('<section class="hero">'),
  "webadmin directory should use the compact member layout instead of the old hero section"
);

console.log("webadmin directory layout checks passed");
