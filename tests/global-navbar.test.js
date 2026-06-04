import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pages = [
  "employee-dashboard.html",
  "chess-timesheet.html",
  "chess-timesheet-pay.html",
  "manager-dashboard.html",
  "manager-drafts.html",
  "manager-entry.html",
  "webadmin-dashboard.html",
];

const theme = fs.readFileSync(path.join(process.cwd(), "theme.css"), "utf8");
const uiEffects = fs.readFileSync(path.join(process.cwd(), "ui-effects.js"), "utf8");

assert.ok(fs.existsSync(path.join(process.cwd(), "assets", "cg-nav-logo.png")), "global navbar logo asset should exist");

[
  ".cg-navbar",
  ".cg-brand-logo",
  ".cg-nav-list",
  ".cg-nav-item",
  ".cg-nav-trigger",
  ".cg-nav-dropdown",
  ".cg-nav-item.is-active",
].forEach((snippet) => {
  assert.ok(theme.includes(snippet), `theme should include ${snippet}`);
});

[
  "function setupGlobalNavbar",
  ".cg-nav-trigger",
  "aria-expanded",
  "aria-controls",
  "closeAllGlobalNavDropdowns",
  "event.key === \"Escape\"",
  "event.target.closest(\".cg-nav-item\")",
  "window.setupGlobalNavbar = setupGlobalNavbar",
].forEach((snippet) => {
  assert.ok(uiEffects.includes(snippet), `global navbar JS should include ${snippet}`);
});

pages.forEach((fileName) => {
  const html = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
  const header = html.match(/<header class="app-header">[\s\S]*?<\/header>/)?.[0] || "";
  assert.ok(header, `${fileName} should include an app header`);

  [
    'class="cg-brand-logo"',
    'src="./assets/cg-nav-logo.png"',
    'href="./employee-dashboard.html"',
    'class="sr-only">Chess Grande</span>',
    ">Overview<",
    ">Timesheet<",
    ">Submissions<",
    ">Manager<",
    ">Manager-Dashboard<",
    ">Draft Timesheet for Employee<",
    ">Webadmin<",
    'id="managerNavItem"',
    'id="webAdminNavItem"',
    'aria-expanded="false"',
    'aria-controls=',
    'data-nav-section=',
    'class="menu-wrap"',
    'id="userMenuButton"',
    'id="userMenuPanel"',
    'id="menuProfileName"',
    'id="profileButton"',
    'id="logoutButton"',
  ].forEach((snippet) => {
    assert.ok(header.includes(snippet), `${fileName} global navbar should include ${snippet}`);
  });
  assert.match(header, /class="[^"]*\bcg-navbar\b[^"]*"/, `${fileName} global navbar should include cg-navbar class`);

  assert.ok(header.includes("menuProfileName"), `${fileName} profile dropdown should keep the profile display name`);
  assert.ok(header.includes('id="profileButton"'), `${fileName} profile dropdown should keep Profile action`);
  assert.ok(header.includes('id="logoutButton"'), `${fileName} profile dropdown should keep logout action`);
  assert.doesNotMatch(header, /<a class="menu-item"/, `${fileName} profile dropdown should not duplicate navigation links`);
});

const roleVisibilityPages = [
  "employee-dashboard.html",
  "chess-timesheet.html",
  "chess-timesheet-pay.html",
  "manager-dashboard.html",
  "manager-drafts.html",
  "manager-entry.html",
];

roleVisibilityPages.forEach((fileName) => {
  const html = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
  assert.match(
    html,
    /managerNavItem\.hidden\s*=\s*!\(?role === "manager" \|\| role === "webadmin"|managerNavItem\.hidden\s*=\s*!\(?profile && \(profile\.role === "manager" \|\| profile\.role === "webadmin"\)\)?|managerNavItem\.hidden\s*=\s*!canSeeManagerDashboard\(profile\)|managerNavItem\.hidden\s*=\s*!canViewManager/,
    `${fileName} should hide Manager nav unless manager or webadmin`
  );
  assert.match(
    html,
    /webAdminNavItem\.hidden\s*=\s*role !== "webadmin"|webAdminNavItem\.hidden\s*=\s*!\(?profile && profile\.role === "webadmin"\)?|webAdminNavItem\.hidden\s*=\s*!canSeeWebAdminDashboard\(profile\)|webAdminNavItem\.hidden\s*=\s*!canViewWebAdmin/,
    `${fileName} should hide Webadmin nav unless webadmin`
  );
});

console.log("global navbar checks passed");
