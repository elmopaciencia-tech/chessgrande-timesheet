import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "profile-ui.js"),
  "utf8"
);
const uiEffects = fs.readFileSync(
  path.join(process.cwd(), "ui-effects.js"),
  "utf8"
);
const theme = fs.readFileSync(
  path.join(process.cwd(), "theme.css"),
  "utf8"
);

assert.ok(
  !source.includes("Your profile helps people recognize you in team workflows."),
  "profile modal should not render the old helper sentence"
);

[
  'id="profileAvatarButton"',
  'aria-label="Change Profile Picture"',
  'data-tooltip="Change Profile Picture"',
  'id="profileAvatarInitials"',
  'for="profileHourlyRate"',
  'id="profileHourlyRate"',
  'type="number"',
  'step="0.01"',
  '<svg viewBox="0 0 24 24"',
  'object-position: center center;',
].forEach((markup) => {
  assert.ok(source.includes(markup), `profile modal should include ${markup}`);
});

[
  ".profile-avatar-section {\n        display: grid;\n        place-items: center;",
  ".profile-avatar-button:hover .profile-avatar-edit-icon",
  "avatarButton.addEventListener(\"click\"",
  "if (avatarUploadInput) avatarUploadInput.click();",
  "updateAvatarInitials(displayNameInput.value || displayNameInput.placeholder);",
  "width: min(560px, 100%);",
  "--profile-avatar-size: clamp(104px, 20vw, 132px);",
  "padding: 7px 14px 8px;",
  "min-height: 0;",
  "height: auto;",
  ".profile-field input:focus,",
  "box-shadow: none;",
  "transform: none;",
  'const payrollProfile = readPayrollProfile();',
  'hourlyRateInput.value = payrollProfile.hourlyRate || "";',
  "writePayrollProfile({ hourlyRate });",
].forEach((snippet) => {
  assert.ok(source.includes(snippet), `profile modal should include ${snippet}`);
});

assert.ok(
  !source.includes('data-lucide="camera"'),
  "profile modal should use the custom camera svg instead of a generated lucide camera"
);

assert.ok(
  !source.includes("profileAvatarUpload"),
  "profile picture should be changed by clicking the photo, not a separate upload button"
);

assert.ok(
  uiEffects.includes(".profile-avatar-button"),
  "global icon enhancement should skip the avatar upload button"
);

assert.ok(
  theme.includes(".profile-modal-overlay:not([hidden])"),
  "profile modal overlay should animate when opened"
);

assert.ok(
  theme.includes(".profile-modal-overlay:not([hidden]) .profile-modal"),
  "profile modal card should animate when opened"
);

console.log("profile-ui modal checks passed");
