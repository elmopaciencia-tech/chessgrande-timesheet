// Shared calendar-chip colour palette and helpers.
(function initCalendarEntryColors() {
  const palette = [
    "#FFF689",
    "#F4D35E",
    "#FFB88A",
    "#FF9C5B",
    "#F67B45",
    "#FBC2C2",
    "#E39B99",
    "#CB7876",
    "#B4CFA4",
    "#8BA47C",
    "#62866C",
    "#A0C5E3",
    "#81B2D9",
    "#32769B",
    "#BBA6DD",
    "#8C7DA8",
    "#64557B",
    "#1E2136",
  ];
  const paletteSet = new Set(palette);

  function normalizeColor(value) {
    const normalized = String(value || "").trim().toUpperCase();
    return paletteSet.has(normalized) ? normalized : "";
  }

  function getTextColor(backgroundColor) {
    const color = normalizeColor(backgroundColor);
    if (!color) return "";
    const red = Number.parseInt(color.slice(1, 3), 16);
    const green = Number.parseInt(color.slice(3, 5), 16);
    const blue = Number.parseInt(color.slice(5, 7), 16);
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    return luminance > 0.52 ? "#1E2136" : "#FFFFFF";
  }

  function applyToChip(chip, color) {
    const normalized = normalizeColor(color);
    if (!chip || !normalized) return;
    chip.classList.add("has-calendar-color");
    chip.style.setProperty("--entry-calendar-color", normalized);
    chip.style.setProperty("--entry-calendar-text", getTextColor(normalized));
  }

  window.calendarEntryColors = {
    palette,
    normalizeColor,
    getTextColor,
    applyToChip,
  };
})();
