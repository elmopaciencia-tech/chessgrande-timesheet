import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(path.join(process.cwd(), "chess-timesheet-pay.html"), "utf8");

[
  "const claimsMissingProof = activeEntries.filter(isClaimMissingProof)",
  "Some imported claims still need proof images before submission.",
  "function isClaimMissingProof(entry)",
  'entry?.type === "Claim"',
  "entry.claimImagePath || entry.claimProofDataUrl",
].forEach((snippet) => {
  assert.ok(html.includes(snippet), `pay submission should require claim proof via ${snippet}`);
});

assert.match(
  html,
  /if \(\!activeEntries\.length\)[\s\S]*const claimsMissingProof = activeEntries\.filter\(isClaimMissingProof\)[\s\S]*if \(claimsMissingProof\.length\)[\s\S]*return;/,
  "claim proof validation should run after active-entry validation and before submission insert"
);

console.log("pay claim proof submission checks passed");
