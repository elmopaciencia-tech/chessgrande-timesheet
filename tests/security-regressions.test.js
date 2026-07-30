import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const schema = fs.readFileSync(path.join(root, "supabase-schema.sql"), "utf8");
const worker = fs.readFileSync(
  path.join(root, "cloudflare-worker", "claim-proof-worker.js"),
  "utf8"
);
const profileUpdateGrant = schema.match(
  /grant update \(([\s\S]*?)\) on public\.profiles to authenticated;/i
)?.[1] ?? "";
assert.match(profileUpdateGrant, /\bhourly_rate\b/i);
assert.doesNotMatch(profileUpdateGrant, /\brole\b/i);
assert.match(
  schema,
  /create or replace function public\.set_profile_app_role\(\s*target_profile_id uuid,\s*new_role text\s*\)/i
);
assert.match(
  schema,
  /if not authz\.has_app_role\(array\['webadmin'\]\) then/i
);

const unpaidUpdatePolicy = schema.match(
  /create policy "payroll_submissions_manager_update_unpaid"([\s\S]*?);/i
)?.[1] ?? "";
assert.match(unpaidUpdatePolicy, /using\s*\(\s*paid_at is null/i);
assert.match(unpaidUpdatePolicy, /with check\s*\(\s*paid_at is null/i);

const unpaidDeletePolicy = schema.match(
  /create policy "payroll_submissions_manager_delete_unpaid"([\s\S]*?);/i
)?.[1] ?? "";
assert.match(unpaidDeletePolicy, /using\s*\(\s*paid_at is null/i);

for (const policyName of [
  "entries_update_admin_unpaid",
  "entries_delete_admin_unpaid",
]) {
  const entryPolicy = schema.match(
    new RegExp(`create policy "${policyName}"([\\s\\S]*?);`, "i")
  )?.[1] ?? "";
  assert.match(entryPolicy, /s\.paid_at is null/i);
}

assert.equal(
  fs.existsSync(path.join(root, "chess-timesheet-2.html")),
  false,
  "the vulnerable legacy page must remain removed"
);
for (const testFile of fs.readdirSync(path.join(root, "tests"))) {
  if (!testFile.endsWith(".test.js")) continue;
  if (testFile === "security-regressions.test.js") continue;
  const source = fs.readFileSync(path.join(root, "tests", testFile), "utf8");
  assert.doesNotMatch(source, /chess-timesheet-2\.html/);
}

assert.match(worker, /ALLOWED_UPLOAD_CONTENT_TYPES/);
assert.match(worker, /Only supported image files can be uploaded/);
assert.match(worker, /X-Content-Type-Options", "nosniff"/);
assert.doesNotMatch(
  worker,
  /OpenRouter \$\{response\.status\}: \$\{text\.slice/,
  "third-party response bodies must not be disclosed to clients"
);
console.log("security regression tests passed");
