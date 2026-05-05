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
  let statusEl = null;
  let saveButton = null;
  let cancelButton = null;
  let closeButton = null;
  let activeTrigger = null;
  let isSaving = false;
  let menuNameTargets = [];
  let avatarPreviewImg = null;
  let avatarUploadInput = null;
  let avatarUploadButton = null;
  let avatarRemoveButton = null;
  let pendingAvatarFile = null;
  let pendingAvatarUrl = "";

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
        width: min(660px, 100%);
        background: #fff;
        border: 1px solid rgba(29, 42, 42, 0.16);
        border-radius: 24px;
        box-shadow: 0 26px 70px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      }
      .profile-modal-head {
        padding: 20px 22px 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .profile-modal-title {
        margin: 0;
        font-size: 2rem;
        line-height: 1;
        font-weight: 500;
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
        padding: 8px 22px 14px;
      }
      .profile-field {
        border: 0;
        border-radius: 0;
        padding: 0;
        margin: 10px 0;
      }
      .profile-field label {
        display: block;
        font-size: 0.8rem;
        color: #5d6a67;
        margin: 0 0 6px 2px;
        font-weight: 700;
      }
      .profile-field input {
        width: 100%;
        border: 1px solid rgba(29, 42, 42, 0.22);
        border-radius: 12px;
        padding: 12px 14px;
        outline: none;
        font: inherit;
        font-size: 1.05rem;
        color: #1d2a2a;
        background: #fff;
      }
      .profile-modal-note {
        margin: 14px 2px 0;
        color: #7b8784;
        font-size: 0.92rem;
        text-align: center;
      }
      .profile-avatar-section {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 18px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(29, 42, 42, 0.12);
      }
      .profile-avatar-preview {
        width: 96px;
        height: 96px;
        border-radius: 999px;
        border: 2px solid rgba(29, 42, 42, 0.14);
        object-fit: cover;
        background: #f8faf9;
        flex-shrink: 0;
      }
      .profile-avatar-preview[src=""], .profile-avatar-preview:not([src]) {
        background: #eef3f1;
      }
      .profile-avatar-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .profile-avatar-upload {
        font-size: 0.88rem;
        padding: 7px 16px;
      }
      .profile-avatar-remove {
        font-size: 0.82rem;
        padding: 5px 10px;
      }
      .profile-avatar-remove[hidden] {
        display: none;
      }
      .profile-modal-status {
        min-height: 24px;
        margin-top: 10px;
        color: #7a3d25;
        font-weight: 600;
      }
      .profile-modal-footer {
        padding: 8px 22px 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .profile-btn {
        border-radius: 999px;
        border: 1px solid rgba(29, 42, 42, 0.2);
        padding: 10px 24px;
        font: inherit;
        font-size: 1rem;
        cursor: pointer;
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
            <img class="profile-avatar-preview" id="profileAvatarPreview" src="" alt="Profile avatar preview" width="96" height="96">
            <div class="profile-avatar-actions">
              <button type="button" class="profile-btn profile-avatar-upload" id="profileAvatarUpload">Upload Photo</button>
              <button type="button" class="profile-btn profile-avatar-remove ghost" id="profileAvatarRemove" hidden>Remove</button>
              <input type="file" id="profileAvatarInput" accept="image/jpeg,image/png,image/webp" hidden>
            </div>
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
          <p class="profile-modal-note">Your profile helps people recognize you in team workflows.</p>
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
    statusEl = document.getElementById("profileModalStatus");
    saveButton = document.getElementById("profileModalSave");
    cancelButton = document.getElementById("profileModalCancel");
    closeButton = document.getElementById("profileModalClose");
    avatarPreviewImg = document.getElementById("profileAvatarPreview");
    avatarUploadButton = document.getElementById("profileAvatarUpload");
    avatarRemoveButton = document.getElementById("profileAvatarRemove");
    avatarUploadInput = document.getElementById("profileAvatarInput");

    closeButton.addEventListener("click", () => closeModal());
    cancelButton.addEventListener("click", () => closeModal());
    saveButton.addEventListener("click", saveProfile);

    avatarUploadButton.addEventListener("click", () => {
      if (avatarUploadInput) avatarUploadInput.click();
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
            avatarPreviewImg.src = pendingAvatarUrl;
          }
          avatarRemoveButton.hidden = false;
          statusEl.textContent = "Avatar ready. Save to keep it.";
        }
      } catch (e) {
        statusEl.textContent = e.message || "Could not upload avatar.";
      }
    });
    avatarRemoveButton.addEventListener("click", async () => {
      try {
        if (window.profileAvatar && typeof window.profileAvatar.removeProfileAvatar === "function") {
          await window.profileAvatar.removeProfileAvatar();
        }
      } catch (e) {
        console.warn("Failed to clear avatar from profile:", e.message);
      }
      pendingAvatarFile = null;
      pendingAvatarUrl = "";
      avatarPreviewImg.src = "";
      avatarRemoveButton.hidden = true;
      statusEl.textContent = "Avatar removed. Save to keep changes.";
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
    pendingAvatarFile = null;
    pendingAvatarUrl = "";
    if (avatarPreviewImg) avatarPreviewImg.src = "";
    if (avatarRemoveButton) avatarRemoveButton.hidden = true;

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
    } else {
      displayNameInput.value = "";
      displayNameInput.placeholder = user.email || "";
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

    if (data && data.avatar_r2_key && window.profileAvatar && typeof window.profileAvatar.resolveAvatarUrl === "function") {
      var avatarUrl = await window.profileAvatar.resolveAvatarUrl(data.avatar_r2_key);
      if (avatarPreviewImg && avatarUrl) {
        avatarPreviewImg.src = avatarUrl;
        avatarRemoveButton.hidden = false;
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
