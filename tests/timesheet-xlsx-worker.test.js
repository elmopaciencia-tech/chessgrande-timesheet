import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const worker = fs.readFileSync(
  path.join(process.cwd(), "cloudflare-worker", "claim-proof-worker.js"),
  "utf8"
);
const wrangler = fs.readFileSync(
  path.join(process.cwd(), "cloudflare-worker", "wrangler.toml"),
  "utf8"
);

[
  'pathname === "/api/timesheet-xlsx-parse"',
  "handleTimesheetXlsxParse(request, env)",
  "const user = await requireAuthUser(request, env)",
  "isRoleAllowed(profile?.role)",
  "OPENROUTER_API_KEY is not configured.",
  "MAX_IMPORT_WORKBOOK_TEXT_CHARS",
  "workbookText is too large.",
  "response_format: { type: \"json_object\" }",
  "model: await resolveOpenRouterImportModel(env)",
  '"X-Title": "Chess Grande Timesheet XLSX Import"',
].forEach((snippet) => {
  assert.ok(worker.includes(snippet), `timesheet XLSX Worker parser should include ${snippet}`);
});

assert.match(
  worker,
  /function buildTimesheetXlsxImportPrompt[\s\S]*You are parsing a Chess Grande timesheet XLSX into draft timesheet entries/,
  "Worker should own the timesheet XLSX parse prompt"
);
assert.match(
  worker,
  /if \(request\.method === "POST" && pathname === "\/api\/timesheet-xlsx-parse"\)/,
  "Worker should route POST /api/timesheet-xlsx-parse"
);
assert.match(
  wrangler,
  /OPENROUTER_IMPORT_MODEL\s*=\s*"openai\/gpt-5-mini"/,
  "Worker config should expose a non-secret import model var"
);
assert.doesNotMatch(
  wrangler,
  /OPENROUTER_API_KEY\s*=/,
  "Worker config should not hardcode the OpenRouter secret"
);

console.log("timesheet XLSX Worker checks passed");
