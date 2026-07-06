import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "webadmin-dashboard.html"), "utf8");
const worker = fs.readFileSync(path.join(process.cwd(), "cloudflare-worker", "claim-proof-worker.js"), "utf8");

[
  'id="openRouterSettingsPanel"',
  'id="openRouterChatModelInput"',
  'id="openRouterImportModelInput"',
  'id="openRouterSettingsStatus"',
  'id="saveOpenRouterSettingsButton"',
  'id="resetOpenRouterSettingsButton"',
  "loadOpenRouterSettings",
  "saveOpenRouterSettings",
  "/api/openrouter-settings",
  "chatModel",
  "importModel",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `webadmin dashboard should include ${snippet}`);
});

[
  /\.openrouter-settings\s*\{[^}]*gap:\s*14px;[^}]*padding:\s*22px;/,
  /\.openrouter-settings h2\s*\{[^}]*margin:\s*0;[^}]*font-size:\s*1\.15rem;/,
  /\.openrouter-field\s*\{[^}]*gap:\s*8px;/,
  /\.openrouter-field input\s*\{[^}]*min-height:\s*48px;[^}]*border-radius:\s*14px;/,
  /\.openrouter-actions\s*\{[^}]*gap:\s*12px;/,
  /\.openrouter-actions \.button\s*\{[^}]*min-height:\s*46px;[^}]*border-radius:\s*14px;/,
  /\.openrouter-status\s*\{[^}]*min-height:\s*1\.35rem;[^}]*font-size:\s*\.9rem;/,
].forEach((pattern) => {
  assert.match(html, pattern, "OpenRouter settings panel should use section-consistent spacing");
});

[
  'pathname === "/api/openrouter-settings"',
  "handleGetOpenRouterSettings(request, env)",
  "handleSaveOpenRouterSettings(request, env)",
  "requireWebadminProfile(request, env)",
  "OPENROUTER_SETTINGS_KEY",
  "getOpenRouterSettings(env)",
  "saveOpenRouterSettings(env, settings)",
  "resolveOpenRouterChatModel(env)",
  "resolveOpenRouterImportModel(env)",
  "model: await resolveOpenRouterImportModel(env)",
  "model: await resolveOpenRouterChatModel(env)",
].forEach((snippet) => {
  assert.ok(worker.includes(snippet), `Worker should include ${snippet}`);
});

assert.match(
  worker,
  /if \(request\.method === "GET" && pathname === "\/api\/openrouter-settings"\)/,
  "Worker should route GET /api/openrouter-settings"
);
assert.match(
  worker,
  /if \(request\.method === "POST" && pathname === "\/api\/openrouter-settings"\)/,
  "Worker should route POST /api/openrouter-settings"
);
assert.match(
  worker,
  /String\(profile\?\.role \|\| ""\)\.toLowerCase\(\) !== "webadmin"/,
  "OpenRouter settings route should be webadmin-only"
);

console.log("webadmin OpenRouter settings checks passed");
