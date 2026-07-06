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

  const MOBILE_PROFILE_NAV_ITEMS = [
    { label: "Overview", href: "./employee-dashboard.html", section: "overview" },
    { label: "Timesheet", href: "./chess-timesheet.html", section: "timesheet" },
    { label: "Submissions", href: "./chess-timesheet-pay.html", section: "timesheet" },
    { label: "Manager Dashboard", href: "./manager-dashboard.html", section: "manager", role: "manager" },
    { label: "Draft Timesheet for Employee", href: "./manager-drafts.html", section: "manager", role: "manager" },
    { label: "Webadmin", href: "./webadmin-dashboard.html", section: "webadmin", role: "webadmin" }
  ];

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

  function openGlobalNavDropdown(trigger) {
    const navItem = trigger.closest(".cg-nav-item");
    const dropdown = document.getElementById(trigger.getAttribute("aria-controls"));
    if (!navItem || !dropdown) {
      return;
    }

    closeAllGlobalNavDropdowns(navItem);
    trigger.setAttribute("aria-expanded", "true");
    dropdown.hidden = false;
    positionGlobalNavDropdown(trigger, dropdown);
  }

  function closeGlobalNavDropdown(trigger) {
    const dropdown = document.getElementById(trigger.getAttribute("aria-controls"));
    trigger.setAttribute("aria-expanded", "false");
    if (dropdown) {
      dropdown.hidden = true;
    }
  }

  function positionGlobalNavDropdown(trigger, dropdown) {
    const rect = trigger.getBoundingClientRect();
    const margin = 12;
    const dropdownWidth = Math.max(dropdown.offsetWidth || 232, 210);
    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - dropdownWidth - margin));

    dropdown.style.position = "fixed";
    dropdown.style.left = `${left}px`;
    dropdown.style.right = "auto";
    dropdown.style.top = `${rect.bottom + 8}px`;
    dropdown.style.minWidth = `${dropdownWidth}px`;
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

  function closeUserMenuPanel() {
    const userMenuPanel = document.getElementById("userMenuPanel");
    const userMenuButton = document.getElementById("userMenuButton");
    if (userMenuPanel) {
      userMenuPanel.hidden = true;
    }
    if (userMenuButton) {
      userMenuButton.setAttribute("aria-expanded", "false");
    }
  }

  function ensureMobileProfileNav(root = document) {
    const menuPanel = document.getElementById("userMenuPanel");
    if (!menuPanel) {
      return null;
    }

    let section = menuPanel.querySelector(".cg-mobile-menu-section");
    if (!section) {
      section = document.createElement("nav");
      section.className = "cg-mobile-menu-section";
      section.setAttribute("aria-label", "Mobile navigation");

      MOBILE_PROFILE_NAV_ITEMS.forEach((item) => {
        const link = document.createElement("a");
        link.className = "cg-mobile-menu-link";
        link.href = item.href;
        link.textContent = item.label;
        link.dataset.mobileSection = item.section;
        if (item.role) {
          link.dataset.mobileRole = item.role;
          link.setAttribute("data-mobile-role", item.role);
        }
        link.addEventListener("click", closeUserMenuPanel);
        section.append(link);
      });

      const profileButton = menuPanel.querySelector("#profileButton");
      menuPanel.insertBefore(section, profileButton || menuPanel.firstChild);
    }

    syncMobileProfileNavVisibility(root);
    return section;
  }

  function syncMobileProfileNavVisibility(root = document) {
    const section = document.querySelector(".cg-mobile-menu-section");
    if (!section) {
      return;
    }

    const managerNavItem = document.getElementById("managerNavItem");
    const webAdminNavItem = document.getElementById("webAdminNavItem");
    const managerVisible = Boolean(managerNavItem && !managerNavItem.hidden);
    const webAdminVisible = Boolean(webAdminNavItem && !webAdminNavItem.hidden);
    const fileName = getCurrentFileName();

    section.querySelectorAll(".cg-mobile-menu-link").forEach((link) => {
      const role = link.dataset.mobileRole || "";
      if (role === "manager") {
        link.hidden = !managerVisible;
      } else if (role === "webadmin") {
        link.hidden = !webAdminVisible;
      }

      const href = link.getAttribute("href") || "";
      const linkFileName = href.split("#")[0].split("?")[0].split("/").pop();
      link.classList.toggle("is-active", linkFileName === fileName);
    });
  }

  function watchMobileProfileNavVisibility() {
    if (document.documentElement.dataset.cgMobileNavObserverReady === "true") {
      return;
    }

    ["managerNavItem", "webAdminNavItem"].forEach((id) => {
      const item = document.getElementById(id);
      if (!item) {
        return;
      }

      const observer = new MutationObserver(() => syncMobileProfileNavVisibility(document));
      observer.observe(item, {
        attributes: true,
        attributeFilter: ["hidden"]
      });
    });

    document.documentElement.dataset.cgMobileNavObserverReady = "true";
  }

  function setupGlobalNavbar(root = document) {
    const triggers = Array.from(root.querySelectorAll(".cg-nav-trigger"));
    ensureMobileProfileNav(root);
    watchMobileProfileNavVisibility();
    const hoverCloseDelayMs = 360;

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
        const willOpen = trigger.getAttribute("aria-expanded") !== "true";
        if (willOpen) {
          trigger.dataset.cgHoverOpen = "false";
          openGlobalNavDropdown(trigger);
        } else {
          closeGlobalNavDropdown(trigger);
        }
      });

      const navItem = trigger.closest(".cg-nav-item");
      if (navItem) {
        let hoverCloseTimer = 0;
        const cancelHoverClose = () => {
          window.clearTimeout(hoverCloseTimer);
          hoverCloseTimer = 0;
        };

        const openFromHover = () => {
          cancelHoverClose();
          trigger.dataset.cgHoverOpen = "true";
          openGlobalNavDropdown(trigger);
        };

        const closeFromHover = () => {
          cancelHoverClose();
          hoverCloseTimer = window.setTimeout(() => {
            trigger.dataset.cgHoverOpen = "false";
            closeGlobalNavDropdown(trigger);
          }, hoverCloseDelayMs);
        };

        navItem.addEventListener("pointerenter", (event) => {
          if (event.pointerType !== "touch") {
            openFromHover();
          }
        });

        navItem.addEventListener("pointerleave", (event) => {
          if (event.pointerType !== "touch") {
            closeFromHover();
          }
        });

        navItem.addEventListener("mouseenter", openFromHover);
        navItem.addEventListener("mouseleave", closeFromHover);
        navItem.addEventListener("mouseover", (event) => {
          if (!navItem.contains(event.relatedTarget)) {
            openFromHover();
          }
        });
        navItem.addEventListener("mouseout", (event) => {
          if (!navItem.contains(event.relatedTarget)) {
            closeFromHover();
          }
        });
      }

      dropdown.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => closeAllGlobalNavDropdowns());
      });

      trigger.dataset.cgNavReady = "true";
    });

    syncGlobalNavActive(root);
    syncMobileProfileNavVisibility(root);

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
