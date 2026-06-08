// Shared profile menu + modal UI for static HTML pages.
(function initProfileUi() {
  let mounted = false;
  let overlay = null;
  let modal = null;
  let displayNameInput = null;
  let phoneInput = null;
  let bankAccountInput = null;
  let bankNameInput = null;
  let accountTypeInput = null;
  let hourlyRateInput = null;
  let statusEl = null;
  let saveButton = null;
  let cancelButton = null;
  let closeButton = null;
  let activeTrigger = null;
  let isSaving = false;
  let menuNameTargets = [];
  let avatarButton = null;
  let avatarPreviewImg = null;
  let avatarInitialsEl = null;
  let avatarUploadInput = null;
  let pendingAvatarFile = null;
  let pendingAvatarUrl = "";
  let hasAvatarImage = false;
  const payrollProfileKey = "chessGrandePayrollProfile";

  function ensureMounted() {
    if (mounted) return;
    injectStyles();
    injectMarkup();
    mounted = true;
  }

  function injectStyles() {
    if (document.getElementById("profileModalStyles")) return;
    const style = document.createElement("style");
    style.id = "profileModalStyles";
    style.textContent = `
      .menu-profile-name {
        font-weight: 700;
        color: #1d2a2a;
        cursor: default;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(29, 42, 42, 0.12);
        margin-bottom: 4px;
      }
      .profile-modal-overlay[hidden] { display: none; }
      .profile-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(16, 24, 24, 0.38);
        display: grid;
        place-items: center;
        padding: 14px;
        z-index: 1000;
      }
      .profile-modal {
        width: min(560px, 100%);
        background: #fff;
        border: 1px solid rgba(29, 42, 42, 0.16);
        border-radius: 18px;
        box-shadow: 0 22px 58px rgba(0, 0, 0, 0.18);
        overflow: visible;
      }
      .profile-modal-head {
        padding: 22px 22px 0;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
      }
      .profile-modal-title {
        margin: 0;
        font-size: clamp(1.55rem, 3vw, 2rem);
        line-height: 1.08;
        font-weight: 500;
        letter-spacing: 0;
      }
      .profile-modal-close {
        border: 0;
        background: transparent;
        border-radius: 8px;
        padding: 7px 9px;
        cursor: pointer;
        font: inherit;
      }
      .profile-modal-body {
        padding: 24px 22px 6px;
      }
      .profile-field {
        border: 1px solid rgba(29, 42, 42, 0.18);
        border-radius: 10px;
        padding: 7px 14px 8px;
        margin: 0 0 8px;
        background: #fff;
      }
      .profile-field:focus-within {
        border-color: rgba(29, 42, 42, 0.34);
        box-shadow: inset 0 0 0 1px rgba(29, 42, 42, 0.08);
      }
      .profile-field label {
        display: block;
        font-size: 0.78rem;
        color: #1b1f1e;
        margin: 0 0 4px;
        font-weight: 500;
      }
      .profile-field input {
        width: 100%;
        border: 0;
        border-radius: 0;
        padding: 0;
        min-height: 0;
        height: auto;
        outline: none;
        font: inherit;
        font-size: 0.96rem;
        line-height: 1.18;
        color: #111615;
        background: transparent;
      }
      .profile-field input:focus,
      .profile-field input:focus-visible {
        border-color: transparent;
        box-shadow: none;
        outline: none;
        transform: none;
      }
      .profile-avatar-section {
        display: grid;
        place-items: center;
        margin: 0 auto 22px;
      }
      .profile-avatar-button {
        --profile-avatar-size: clamp(104px, 20vw, 132px);
        position: relative;
        width: var(--profile-avatar-size);
        height: var(--profile-avatar-size);
        border-radius: 999px;
        border: 3px solid #0b61d8;
        padding: 5px;
        background: #fff;
        cursor: pointer;
        box-shadow: 0 12px 24px rgba(13, 92, 201, 0.1);
      }
      .profile-avatar-preview {
        width: 100%;
        height: 100%;
        border-radius: 999px;
        border: 0;
        object-fit: cover;
        object-position: center center;
        background: #2fcf74;
        display: block;
      }
      .profile-avatar-preview[src=""], .profile-avatar-preview:not([src]) {
        display: none;
      }
      .profile-avatar-initials {
        position: absolute;
        inset: 5px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: #2fcf74;
        color: rgba(255, 255, 255, 0.88);
        font-size: clamp(2.2rem, 7vw, 3.55rem);
        font-weight: 400;
        line-height: 1;
        letter-spacing: 0;
      }
      .profile-avatar-button.has-image .profile-avatar-initials {
        display: none;
      }
      .profile-avatar-edit-icon {
        position: absolute;
        right: 8px;
        bottom: 6px;
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        border: 2px solid rgba(16, 24, 24, 0.1);
        background: #fff;
        color: #5b6361;
        box-shadow: 0 7px 18px rgba(16, 24, 24, 0.2);
        opacity: 0;
        transform: translateY(4px) scale(0.96);
        transition: opacity 150ms ease, transform 150ms ease;
      }
      .profile-avatar-edit-icon svg {
        width: 18px;
        height: 18px;
      }
      .profile-avatar-button::before,
      .profile-avatar-button::after {
        position: absolute;
        left: 50%;
        opacity: 0;
        pointer-events: none;
        transition: opacity 150ms ease, transform 150ms ease;
        z-index: 2;
      }
      .profile-avatar-button::before {
        content: attr(data-tooltip);
        bottom: calc(100% + 12px);
        width: max-content;
        max-width: 220px;
        padding: 7px 9px;
        border-radius: 9px;
        background: #111615;
        color: #fff;
        font-size: 0.75rem;
        line-height: 1;
        font-weight: 700;
        transform: translate(-50%, 4px);
        white-space: nowrap;
      }
      .profile-avatar-button::after {
        content: "";
        bottom: calc(100% + 5px);
        border: 7px solid transparent;
        border-top-color: #111615;
        transform: translate(-50%, 4px);
      }
      .profile-avatar-button:hover::before,
      .profile-avatar-button:hover::after,
      .profile-avatar-button:focus-visible::before,
      .profile-avatar-button:focus-visible::after {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      .profile-avatar-button:hover .profile-avatar-edit-icon,
      .profile-avatar-button:focus-visible .profile-avatar-edit-icon {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .profile-avatar-button:focus-visible {
        outline: 3px solid rgba(11, 97, 216, 0.28);
        outline-offset: 4px;
      }
      .profile-modal-status {
        min-height: 18px;
        margin-top: 6px;
        color: #7a3d25;
        font-size: 0.86rem;
        font-weight: 600;
        text-align: center;
      }
      .profile-modal-footer {
        padding: 8px 22px 18px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      .profile-btn {
        border-radius: 999px;
        border: 1px solid rgba(29, 42, 42, 0.2);
        min-width: 88px;
        min-height: 44px;
        padding: 9px 18px;
        font: inherit;
        font-size: 1rem;
        cursor: pointer;
        background: #fff;
        color: #111615;
      }
      .profile-btn-primary {
        background: #0f1211;
        color: #fff;
        border-color: #0f1211;
      }
      .profile-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
      @media (max-width: 640px) {
        .profile-modal-head {
          padding: 18px 16px 0;
        }
        .profile-modal-body {
          padding: 20px 16px 6px;
        }
        .profile-avatar-section {
          margin-bottom: 18px;
        }
        .profile-field {
          padding: 7px 12px 8px;
        }
        .profile-field input {
          font-size: 0.95rem;
        }
        .profile-modal-footer {
          padding-inline: 16px;
          gap: 10px;
        }
        .profile-btn {
          min-width: 0;
          flex: 1;
          min-height: 44px;
          font-size: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function injectMarkup() {
    overlay = document.createElement("div");
    overlay.className = "profile-modal-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">
        <div class="profile-modal-head">
          <h2 class="profile-modal-title" id="profileModalTitle">Edit profile</h2>
          <button type="button" class="profile-modal-close" id="profileModalClose" aria-label="Close">×</button>
        </div>
        <div class="profile-modal-body">
          <div class="profile-avatar-section">
            <button class="profile-avatar-button" id="profileAvatarButton" type="button" aria-label="Change Profile Picture" data-tooltip="Change Profile Picture">
              <img class="profile-avatar-preview" id="profileAvatarPreview" src="" alt="Profile picture preview" width="132" height="132">
              <span class="profile-avatar-initials" id="profileAvatarInitials" aria-hidden="true">?</span>
              <span class="profile-avatar-edit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">
                  <path d="M8.25 6.5 9.7 4.75h4.6l1.45 1.75h2.5c1.05 0 1.9.85 1.9 1.9v8.75c0 1.05-.85 1.9-1.9 1.9H5.75c-1.05 0-1.9-.85-1.9-1.9V8.4c0-1.05.85-1.9 1.9-1.9h2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                  <circle cx="12" cy="12.75" r="3.45" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M17.2 9.25h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                </svg>
              </span>
            </button>
            <input type="file" id="profileAvatarInput" accept="image/jpeg,image/png,image/webp" hidden>
          </div>
          <div class="profile-field">
            <label for="profileDisplayName">Display name</label>
            <input id="profileDisplayName" type="text" autocomplete="off">
          </div>
          <div class="profile-field">
            <label for="profilePhone">Phone number</label>
            <input id="profilePhone" type="text" autocomplete="tel">
          </div>
          <div class="profile-field">
            <label for="profileBankAccount">Bank account number</label>
            <input id="profileBankAccount" type="text" autocomplete="off">
          </div>
          <div class="profile-field">
            <label for="profileBankName">Bank</label>
            <input id="profileBankName" type="text" autocomplete="off">
          </div>
          <div class="profile-field">
            <label for="profileAccountType">Account type</label>
            <input id="profileAccountType" type="text" autocomplete="off" placeholder="e.g. Savings">
          </div>
          <div class="profile-field">
            <label for="profileHourlyRate">Pay per hour</label>
            <input id="profileHourlyRate" type="number" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 55">
          </div>
          <div class="profile-modal-status" id="profileModalStatus"></div>
        </div>
        <div class="profile-modal-footer">
          <button type="button" class="profile-btn" id="profileModalCancel">Cancel</button>
          <button type="button" class="profile-btn profile-btn-primary" id="profileModalSave">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    modal = overlay.querySelector('[role="dialog"]');
    displayNameInput = document.getElementById("profileDisplayName");
    phoneInput = document.getElementById("profilePhone");
    bankAccountInput = document.getElementById("profileBankAccount");
    bankNameInput = document.getElementById("profileBankName");
    accountTypeInput = document.getElementById("profileAccountType");
    hourlyRateInput = document.getElementById("profileHourlyRate");
    statusEl = document.getElementById("profileModalStatus");
    saveButton = document.getElementById("profileModalSave");
    cancelButton = document.getElementById("profileModalCancel");
    closeButton = document.getElementById("profileModalClose");
    avatarButton = document.getElementById("profileAvatarButton");
    avatarPreviewImg = document.getElementById("profileAvatarPreview");
    avatarInitialsEl = document.getElementById("profileAvatarInitials");
    avatarUploadInput = document.getElementById("profileAvatarInput");

    closeButton.addEventListener("click", () => closeModal());
    cancelButton.addEventListener("click", () => closeModal());
    saveButton.addEventListener("click", saveProfile);

    avatarButton.addEventListener("click", () => {
      if (avatarUploadInput) avatarUploadInput.click();
    });
    displayNameInput.addEventListener("input", () => {
      if (!hasAvatarImage) {
        updateAvatarInitials(displayNameInput.value || displayNameInput.placeholder);
      }
    });
    avatarUploadInput.addEventListener("change", async () => {
      var file = avatarUploadInput.files && avatarUploadInput.files[0];
      if (!file) return;
      try {
        if (window.profileAvatar && typeof window.profileAvatar.uploadProfileAvatar === "function") {
          statusEl.textContent = "Uploading avatar...";
          var result = await window.profileAvatar.uploadProfileAvatar(file);
          pendingAvatarFile = null;
          pendingAvatarUrl = result.previewUrl || "";
          if (pendingAvatarUrl) {
            setAvatarImage(pendingAvatarUrl);
          }
          statusEl.textContent = "Profile picture updated.";
        }
      } catch (e) {
        statusEl.textContent = e.message || "Could not upload avatar.";
      }
    });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (overlay.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key === "Tab") {
        trapFocus(event);
      }
    });
  }

  function trapFocus(event) {
    const focusable = modal.querySelectorAll('button:not([disabled]), input:not([disabled])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function getInitials(value) {
    const words = String(value || "")
      .trim()
      .replace(/@.*/, "")
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return "?";
    const first = words[0].charAt(0);
    const second = words.length > 1 ? words[words.length - 1].charAt(0) : words[0].charAt(1);
    return `${first || ""}${second || ""}`.toUpperCase();
  }

  function updateAvatarInitials(value) {
    if (avatarInitialsEl) {
      avatarInitialsEl.textContent = getInitials(value);
    }
  }

  function setAvatarImage(src) {
    const imageUrl = String(src || "").trim();
    hasAvatarImage = Boolean(imageUrl);
    if (avatarButton) {
      avatarButton.classList.toggle("has-image", hasAvatarImage);
    }
    if (avatarPreviewImg) {
      avatarPreviewImg.src = imageUrl;
      avatarPreviewImg.alt = imageUrl ? "Profile picture preview" : "No profile picture selected";
    }
  }

  async function openModal(trigger) {
    ensureMounted();
    const user = await window.requireLogin();
    if (!user) return;
    activeTrigger = trigger || document.activeElement;
    statusEl.textContent = "";
    displayNameInput.value = "";
    displayNameInput.placeholder = "";
    phoneInput.value = "";
    phoneInput.placeholder = "";
    bankAccountInput.value = "";
    bankNameInput.value = "";
    accountTypeInput.value = "";
    hourlyRateInput.value = "";
    pendingAvatarFile = null;
    pendingAvatarUrl = "";
    setAvatarImage("");
    updateAvatarInitials(user.email || "Profile");

    const { data, error } = await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      statusEl.textContent = `Could not load profile: ${error.message || "unknown error"}`;
    }

    const profileName = (data && data.full_name) ? String(data.full_name).trim() : "";
    if (profileName) {
      displayNameInput.value = profileName;
      displayNameInput.placeholder = "";
      updateAvatarInitials(profileName);
    } else {
      displayNameInput.value = "";
      displayNameInput.placeholder = user.email || "";
      updateAvatarInitials(user.email || "Profile");
    }

    if (data && typeof data.phone_number === "string") {
      phoneInput.value = data.phone_number;
    } else {
      phoneInput.value = "";
    }

    if (data && typeof data.bank_account_number === "string") {
      bankAccountInput.value = data.bank_account_number;
    } else {
      bankAccountInput.value = "";
    }
    if (data && typeof data.bank_name === "string") {
      bankNameInput.value = data.bank_name;
    } else {
      bankNameInput.value = "";
    }
    if (data && typeof data.account_type === "string") {
      accountTypeInput.value = data.account_type;
    } else {
      accountTypeInput.value = "";
    }

    const payrollProfile = readPayrollProfile();
    hourlyRateInput.value = payrollProfile.hourlyRate || "";

    if (data && data.avatar_r2_key && window.profileAvatar && typeof window.profileAvatar.resolveAvatarUrl === "function") {
      var avatarUrl = await window.profileAvatar.resolveAvatarUrl(data.avatar_r2_key);
      if (avatarPreviewImg && avatarUrl) {
        setAvatarImage(avatarUrl);
      }
    }

    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    displayNameInput.focus();
  }

  function closeModal() {
    if (!overlay || overlay.hidden || isSaving) return;
    overlay.hidden = true;
    statusEl.textContent = "";
    pendingAvatarFile = null;
    pendingAvatarUrl = "";
    document.body.style.overflow = "";
    if (activeTrigger && typeof activeTrigger.focus === "function") {
      activeTrigger.focus();
    }
  }

  async function saveProfile() {
    if (isSaving) return;
    const user = await window.getCurrentUser();
    if (!user) {
      statusEl.textContent = "Please log in again.";
      return;
    }

    isSaving = true;
    saveButton.disabled = true;
    cancelButton.disabled = true;
    closeButton.disabled = true;
    statusEl.textContent = "Saving profile...";

    const fullName = displayNameInput.value.trim();
    const phoneNumber = phoneInput.value.trim();
    const bankAccountNumber = bankAccountInput.value.trim();
    const bankName = bankNameInput.value.trim();
    const accountType = accountTypeInput.value.trim();
    const hourlyRate = Number(hourlyRateInput.value || 0);
    writePayrollProfile({ hourlyRate });

    const { data, error } = await window.supabaseClient
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          phone_number: phoneNumber || null,
          bank_account_number: bankAccountNumber || null,
          bank_name: bankName || null,
          account_type: accountType || null,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (error) {
      if (/(phone_number|bank_account_number|bank_name|account_type)/i.test(error.message || "")) {
        statusEl.textContent = "Could not save profile: run the latest SQL migration to add new profile columns.";
      } else {
        statusEl.textContent = `Could not save profile: ${error.message || "unknown error"}`;
      }
      isSaving = false;
      saveButton.disabled = false;
      cancelButton.disabled = false;
      closeButton.disabled = false;
      return;
    }

    updateMenuDisplayName(data?.full_name || fullName || "Profile");
    window.dispatchEvent(new CustomEvent("profile-updated", { detail: data || null }));
    statusEl.textContent = "Profile saved.";

    window.setTimeout(() => {
      isSaving = false;
      saveButton.disabled = false;
      cancelButton.disabled = false;
      closeButton.disabled = false;
      closeModal();
    }, 300);
  }

  function readPayrollProfile() {
    try {
      return JSON.parse(window.localStorage.getItem(payrollProfileKey) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function writePayrollProfile(updates) {
    const nextProfile = {
      ...readPayrollProfile(),
      ...updates,
    };
    window.localStorage.setItem(payrollProfileKey, JSON.stringify(nextProfile));
  }

  function updateMenuDisplayName(name) {
    menuNameTargets.forEach((el) => {
      el.textContent = name || "Profile";
    });
  }

  async function hydrateMenuDisplayName() {
    const profile = await window.getCurrentProfile?.();
    const name = profile?.full_name || "Profile";
    updateMenuDisplayName(name);
  }

  function attachProfileMenu(opts) {
    ensureMounted();
    const profileButton = opts.profileButton;
    const menuPanel = opts.menuPanel;
    const menuButton = opts.menuButton;
    const displayNameEl = opts.displayNameEl;
    if (displayNameEl) menuNameTargets.push(displayNameEl);

    if (profileButton) {
      profileButton.addEventListener("click", async () => {
        if (menuPanel) menuPanel.hidden = true;
        if (menuButton) menuButton.setAttribute("aria-expanded", "false");
        await openModal(profileButton);
      });

      profileButton.addEventListener("keydown", async (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (menuPanel) menuPanel.hidden = true;
          if (menuButton) menuButton.setAttribute("aria-expanded", "false");
          await openModal(profileButton);
        }
      });
    }

    hydrateMenuDisplayName();
  }

  window.attachProfileMenu = attachProfileMenu;
})();
