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
    [".delete-button, .danger, .entry-remove, .row-remove-button, .quick-add-remove, .ghost", "trash-2"],
    [".edit-button", "pencil"],
    [".avatar-btn", "upload"]
  ];

  const ICON_ONLY_SELECTOR = ".chat-send, .chat-close, .icon-close, .lightbox-close, .chat-launcher";
  const SKIP_ICON_SELECTOR = ".quick-add-apply, .quick-link, .profile-avatar-button, .entry-action-button, .entry-edit-close, .chip-context-menu button";

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
    if (element.matches(SKIP_ICON_SELECTOR)) {
      return false;
    }

    if (element.dataset.cgIconified === "true") {
      return false;
    }

    const iconName = getIconName(element);
    if (!iconName) {
      return false;
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
    return true;
  }

  function hasPendingLucideIcons(root = document) {
    return Boolean(root.querySelector("i.cg-icon[data-lucide]"));
  }

  function stripLucideMarkers(root = document) {
    root.querySelectorAll("svg.cg-icon[data-lucide]").forEach((icon) => {
      icon.removeAttribute("data-lucide");
    });
  }

  function applyIcons(root = document) {
    let addedIcon = false;
    root.querySelectorAll(ACTION_SELECTOR).forEach((element) => {
      addedIcon = addIcon(element) || addedIcon;
    });
    root.querySelectorAll(".app-header-title").forEach((element) => {
      addedIcon = addIcon(element) || addedIcon;
    });

    if (window.lucide && (addedIcon || hasPendingLucideIcons(root))) {
      window.lucide.createIcons({
        attrs: {
          "aria-hidden": "true",
          focusable: "false"
        }
      });
      stripLucideMarkers(document);
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
    setupGlobalNavbar(root);
  }

  const ACTIVE_NAV_BY_FILE = {
    "employee-dashboard.html": "overview",
    "chess-timesheet.html": "timesheet",
    "chess-timesheet-pay.html": "timesheet",
    "manager-dashboard.html": "manager",
    "manager-drafts.html": "manager",
    "manager-entry.html": "manager",
    "webadmin-dashboard.html": "webadmin"
  };

  function getCurrentFileName() {
    const path = window.location.pathname || "";
    return path.split("/").pop() || "employee-dashboard.html";
  }

  function closeAllGlobalNavDropdowns(exceptItem = null) {
    document.querySelectorAll(".cg-nav-trigger[aria-controls]").forEach((trigger) => {
      const item = trigger.closest(".cg-nav-item");
      if (exceptItem && item === exceptItem) {
        return;
      }

      const dropdown = document.getElementById(trigger.getAttribute("aria-controls"));
      trigger.setAttribute("aria-expanded", "false");
      if (dropdown) {
        dropdown.hidden = true;
      }
    });
  }

  function syncGlobalNavActive(root = document) {
    const fileName = getCurrentFileName();
    const activeSection = document.body?.dataset.activeNav || ACTIVE_NAV_BY_FILE[fileName] || "";

    root.querySelectorAll(".cg-nav-item[data-nav-section]").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.navSection === activeSection);
    });

    root.querySelectorAll(".cg-nav-dropdown-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const linkFileName = href.split("#")[0].split("?")[0].split("/").pop();
      link.classList.toggle("is-active", linkFileName === fileName);
    });
  }

  function setupGlobalNavbar(root = document) {
    const triggers = Array.from(root.querySelectorAll(".cg-nav-trigger"));
    if (!triggers.length) {
      return;
    }

    triggers.forEach((trigger) => {
      if (trigger.dataset.cgNavReady === "true") {
        return;
      }

      const dropdown = document.getElementById(trigger.getAttribute("aria-controls"));
      if (!dropdown) {
        return;
      }

      trigger.addEventListener("click", () => {
        const navItem = trigger.closest(".cg-nav-item");
        const willOpen = trigger.getAttribute("aria-expanded") !== "true";
        closeAllGlobalNavDropdowns(navItem);
        trigger.setAttribute("aria-expanded", String(willOpen));
        dropdown.hidden = !willOpen;
      });

      dropdown.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => closeAllGlobalNavDropdowns());
      });

      trigger.dataset.cgNavReady = "true";
    });

    syncGlobalNavActive(root);

    if (document.documentElement.dataset.cgNavGlobalReady !== "true") {
      document.addEventListener("click", (event) => {
        if (!event.target.closest(".cg-nav-item")) {
          closeAllGlobalNavDropdowns();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeAllGlobalNavDropdowns();
        }
      });

      document.documentElement.dataset.cgNavGlobalReady = "true";
    }
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

  window.setupGlobalNavbar = setupGlobalNavbar;
})();
