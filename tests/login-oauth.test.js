import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(process.cwd(), "login.html"),
  "utf8"
);

[
  'class="login-page"',
  'id="googleLoginButton"',
  "Continue with Google",
  'id="passwordToggle"',
  'data-lucide="eye"',
  'data-lucide="eye-off"',
  "Timesheet access, tightened.",
  "window.supabaseClient.auth.signInWithOAuth",
  'provider: "google"',
  "redirectTo: buildOAuthRedirectUrl()",
  "function ensureCurrentUserProfile(user)",
  'role: "employee"',
  "return \"./employee-dashboard.html\";",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `login page should include ${snippet}`);
});

assert.ok(
  !html.includes('href="#"'),
  "login page should not ship placeholder links"
);

console.log("login OAuth checks passed");
