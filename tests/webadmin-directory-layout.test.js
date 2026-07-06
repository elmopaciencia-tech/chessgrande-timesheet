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

[
  /@media \(max-width: 920px\)[\s\S]*\.member-table-head\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.45fr\)\s*minmax\(92px,\s*0\.48fr\)\s*minmax\(92px,\s*0\.48fr\)\s*minmax\(124px,\s*0\.78fr\)\s*72px;/,
  /@media \(max-width: 920px\)[\s\S]*\.member-line\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.45fr\)\s*minmax\(92px,\s*0\.48fr\)\s*minmax\(92px,\s*0\.48fr\)\s*minmax\(124px,\s*0\.78fr\)\s*72px;/,
  /\.member-line\s*\{[^}]*overflow:\s*hidden;/,
  /\.member-identity\s*\{[^}]*min-width:\s*0;/,
  /\.member-actions\s*\{[^}]*min-width:\s*0;/,
].forEach((pattern) => {
  assert.match(html, pattern, "webadmin member rows should size safely without clipping on tablet widths");
});

assert.ok(
  !html.includes('<section class="hero">'),
  "webadmin directory should use the compact member layout instead of the old hero section"
);
assert.ok(
  !html.includes('class="sidebar-nav"'),
  "webadmin directory should remove the local section nav"
);
assert.ok(
  !html.includes("member-presence"),
  "webadmin member avatars should not render the small presence dot"
);

console.log("webadmin directory layout checks passed");
