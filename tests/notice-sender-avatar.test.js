import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(
  path.join(process.cwd(), "employee-dashboard.html"),
  "utf8"
);
const profileAvatar = fs.readFileSync(
  path.join(process.cwd(), "profile-avatar.js"),
  "utf8"
);
const worker = fs.readFileSync(
  path.join(process.cwd(), "cloudflare-worker", "claim-proof-worker.js"),
  "utf8"
);

assert.ok(
  dashboard.includes('class="notice-avatar-image"'),
  "notice avatars should include an image element for sender profile pictures"
);
assert.ok(
  dashboard.includes("resolveNoticeSenderAvatarUrl"),
  "notice avatars should request a sender image through the profile avatar helper"
);
assert.ok(
  dashboard.includes("Keep the sender initial visible"),
  "notice avatars should retain the initial when no sender image can load"
);
assert.ok(
  !dashboard.includes(".notice-avatar::after"),
  "notice avatars should not render a green status dot"
);

assert.match(
  profileAvatar,
  /async function resolveNoticeSenderAvatarUrl\(noticeId\)[\s\S]*notice-sender-avatar:[\s\S]*\/api\/notices\/sender-avatar/,
  "profile avatar helper should request and cache a notice sender avatar URL"
);
assert.match(
  worker,
  /pathname === "\/api\/notices\/sender-avatar"[\s\S]*handleNoticeSenderAvatar\(request, env\)/,
  "Worker should route private notice sender avatar requests"
);
assert.match(
  worker,
  /async function handleNoticeSenderAvatar\(request, env\)[\s\S]*requireAuthUser\(request, env\)[\s\S]*isUuid\(noticeId\)[\s\S]*getNoticeSenderAvatarKey\(noticeId, user\.id, env\)/,
  "Worker should authenticate and validate a notice before resolving the sender avatar"
);
assert.match(
  worker,
  /async function getNoticeSenderAvatarKey\(noticeId, employeeId, env\)[\s\S]*employee_notice_recipients[\s\S]*notice:employee_notices\(created_by\)[\s\S]*employee_id[\s\S]*avatar_r2_key[\s\S]*r2\/\$\{senderId\}\/profile\//,
  "Worker should only sign a sender profile image for the employee who received the notice"
);

console.log("notice sender avatar checks passed");
