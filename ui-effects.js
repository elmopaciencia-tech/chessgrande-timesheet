(() => {
  const ACTION_SELECTOR = [
    "button:not(.entry-image-button)",
    "a.button",
    "a.nav-button",
    "a.nav-link",
    "a.menu-item",
    "a.signup-link",
    ".footnote a"
  ].join(",");

  const REVEAL_SELECTOR = [
    ".card",
    ".hero",
    ".panel",
    ".summary-card",
    ".filter-card",
    ".file-item",
    ".draft-card",
    ".pay-card",
    ".day",
    ".school-group",
    ".chat-popup"
  ].join(",");

  const TEXT_ICON_RULES = [
    [/log\s*in|sign\s*in/i, "log-in"],
    [/log\s*out/i, "log-out"],
    [/create account|sign\s*up/i, "user-plus"],
    [/save|submit|change/i, "save"],
    [/continue|open submission/i, "arrow-right"],
    [/back/i, "arrow-left"],
    [/monthly pay|payroll|submitted payroll/i, "wallet-cards"],
    [/timesheet|draft/i, "calendar-days"],
    [/manager|dashboard|queue/i, "layout-dashboard"],
    [/webadmin|admin/i, "shield-check"],
    [/profile|account/i, "circle-user-round"],
    [/upload|photo|proof/i, "upload"],
    [/download|export/i, "download"],
    [/paid|mark paid/i, "badge-check"],
    [/add|new/i, "plus"],
    [/edit/i, "pencil"],
    [/delete|remove|clear/i, "trash-2"],
    [/cancel/i, "x"],
    [/view|inspect|review/i, "eye"],
    [/home/i, "home"],
    [/chat|message|ask/i, "message-circle"]
  ];

  const SPECIAL_ICON_RULES = [
    [".app-header-title", "landmark"],
    [".chat-launcher", "bot"],
    [".chat-send", "send"],
    [".chat-close, .icon-close, .lightbox-close", "x"],
    [".delete-button, .danger, .entry-remove, .row-remove-button, .ghost", "trash-2"],
    [".edit-button", "pencil"],
    [".avatar-btn", "upload"]
  ];

  const ICON_ONLY_SELECTOR = ".chat-send, .chat-close, .icon-close, .lightbox-close, .chat-launcher";

  function getText(element) {
    return `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`.trim();
  }

  function getIconName(element) {
    for (const [selector, iconName] of SPECIAL_ICON_RULES) {
      if (element.matches(selector)) {
        return iconName;
      }
    }

    const text = getText(element);
    const match = TEXT_ICON_RULES.find(([pattern]) => pattern.test(text));
    return match ? match[1] : null;
  }

  function addIcon(element) {
    if (element.dataset.cgIconified === "true") {
      return;
    }

    const iconName = getIconName(element);
    if (!iconName) {
      return;
    }

    const icon = document.createElement("i");
    icon.className = "cg-icon";
    icon.dataset.lucide = iconName;
    icon.setAttribute("aria-hidden", "true");

    if (element.matches(ICON_ONLY_SELECTOR)) {
      element.textContent = "";
      element.classList.add("cg-icon-only");
    }

    element.prepend(icon);
    element.dataset.cgIconified = "true";
  }

  function applyIcons(root = document) {
    root.querySelectorAll(ACTION_SELECTOR).forEach(addIcon);
    root.querySelectorAll(".app-header-title").forEach(addIcon);

    if (window.lucide) {
      window.lucide.createIcons({
        attrs: {
          "aria-hidden": "true",
          focusable: "false"
        }
      });
    }
  }

  function reveal(element, index) {
    if (element.dataset.cgReveal === "true") {
      return;
    }

    element.style.setProperty("--cg-order", String(index % 9));
    element.classList.add("cg-reveal");
    element.dataset.cgReveal = "true";
  }

  function applyReveals(root = document) {
    root.querySelectorAll(REVEAL_SELECTOR).forEach(reveal);
  }

  function enhance(root = document) {
    applyIcons(root);
    applyReveals(root);
  }

  function scheduleEnhance() {
    window.clearTimeout(scheduleEnhance.timer);
    scheduleEnhance.timer = window.setTimeout(() => enhance(document), 60);
  }

  document.addEventListener("DOMContentLoaded", () => {
    enhance(document);

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
        scheduleEnhance();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
