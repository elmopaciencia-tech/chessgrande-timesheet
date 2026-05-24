// Shared Supabase-backed quick-add template storage for the employee composer.
(function initQuickAddStore() {
  const tableName = "quick_add_templates";
  const selectColumns = [
    "id",
    "employee_id",
    "school_name",
    "weekday",
    "start_time",
    "hours",
    "created_at",
    "updated_at",
  ].join(",");
  const colorSelectColumns = [
    "id",
    "employee_id",
    "school_name",
    "weekday",
    "start_time",
    "hours",
    "calendar_color",
    "created_at",
    "updated_at",
  ].join(",");
  let activeSchema = null;
  const fallbackCalendarColors = new Set([
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
  ]);

  function getClient() {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized. Load supabase-client.js first.");
    }
    return window.supabaseClient;
  }

  function normalizeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeTime(value) {
    if (!value) return "";
    return String(value).slice(0, 5);
  }

  function normalizeWeekday(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
      throw new Error("Quick-add weekday must be between Sunday and Saturday.");
    }
    return parsed;
  }

  function normalizeCalendarColor(value) {
    if (window.calendarEntryColors && typeof window.calendarEntryColors.normalizeColor === "function") {
      return window.calendarEntryColors.normalizeColor(value);
    }
    const normalized = String(value || "").trim().toUpperCase();
    return fallbackCalendarColors.has(normalized) ? normalized : "";
  }

  function isMissingColumnError(error) {
    const message = String(error?.message || "");
    return error?.code === "42703"
      || error?.code === "PGRST204"
      || (message.includes("column") && message.includes("does not exist"))
      || message.includes("Could not find")
      || message.includes("schema cache");
  }

  function getSchemaAttempts() {
    return activeSchema
      ? [activeSchema, ...["color", "legacy"].filter((schema) => schema !== activeSchema)]
      : ["color", "legacy"];
  }

  function getSelectColumns(schema) {
    return schema === "color" ? colorSelectColumns : selectColumns;
  }

  function supportsCalendarColor(schema) {
    return schema === "color";
  }

  function toTemplate(row) {
    return {
      id: row.id,
      employeeId: row.employee_id,
      schoolName: row.school_name || "",
      weekday: normalizeWeekday(row.weekday),
      startTime: normalizeTime(row.start_time),
      hours: normalizeNumber(row.hours),
      calendarColor: normalizeCalendarColor(row.calendar_color),
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
    };
  }

  function toRow(template, context = {}, schema = activeSchema || "color") {
    const row = {
      employee_id: context.employeeId || template.employeeId,
      school_name: String(template.schoolName || "").trim(),
      weekday: normalizeWeekday(template.weekday),
      start_time: normalizeTime(template.startTime),
      hours: normalizeNumber(template.hours),
    };
    if (supportsCalendarColor(schema)) {
      row.calendar_color = normalizeCalendarColor(template.calendarColor) || null;
    }
    return row;
  }

  function assertRows(rows, error, fallbackMessage) {
    if (error) {
      throw new Error(error.message || fallbackMessage);
    }
    return rows || [];
  }

  async function loadTemplatesForEmployee(employeeId) {
    const schemas = getSchemaAttempts();
    let lastError = null;

    for (const schema of schemas) {
      const { data, error } = await getClient()
        .from(tableName)
        .select(getSelectColumns(schema))
        .eq("employee_id", employeeId)
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true })
        .order("school_name", { ascending: true });

      if (!error) {
        activeSchema = schema;
        return assertRows(data, error, "Could not load quick-add templates.").map(toTemplate);
      }

      lastError = error;
      if (!isMissingColumnError(error)) break;
    }

    return assertRows(null, lastError, "Could not load quick-add templates.");
  }

  async function createTemplate(template, context) {
    const schemas = getSchemaAttempts();
    let lastError = null;

    for (const schema of schemas) {
      const { data, error } = await getClient()
        .from(tableName)
        .insert(toRow(template, context, schema))
        .select(getSelectColumns(schema))
        .single();

      if (!error) {
        activeSchema = schema;
        return toTemplate(data);
      }

      lastError = error;
      if (!isMissingColumnError(error)) break;
    }

    throw new Error(lastError?.message || "Could not save quick-add template.");
  }

  async function deleteTemplate(id) {
    const { error } = await getClient()
      .from(tableName)
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message || "Could not delete quick-add template.");
    }
  }

  function getNextWeekdayDate(weekday, fromDate = new Date()) {
    const targetWeekday = normalizeWeekday(weekday);
    const base = new Date(fromDate);
    base.setHours(0, 0, 0, 0);

    const daysUntilTarget = (targetWeekday - base.getDay() + 7) % 7;
    const result = new Date(base);
    result.setDate(base.getDate() + daysUntilTarget);
    return result;
  }

  window.quickAddStore = {
    loadTemplatesForEmployee,
    createTemplate,
    deleteTemplate,
    getNextWeekdayDate,
    toTemplate,
    toRow,
  };
})();
