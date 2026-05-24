// Shared Supabase-backed draft timesheet storage.
// Draft rows are editable working data; payroll_entries remain submitted snapshots.
(function initDraftTimesheetStore() {
  const tableName = "draft_timesheet_entries";
  const iosSelectColumns = [
    "id",
    "employee_id",
    "created_by",
    "updated_by",
    "submission_id",
    "status",
    "school_name",
    "date",
    "type",
    "start_time",
    "end_time",
    "start_time_minutes",
    "hours",
    "replacement_name",
    "custom_rate",
    "notes",
    "repeats_weekly",
    "repeat_until",
    "claim_amount_cents",
    "claim_proof_name",
    "claim_image_url",
    "created_at",
    "updated_at",
  ].join(",");
  const iosColorSelectColumns = [
    "id",
    "employee_id",
    "created_by",
    "updated_by",
    "submission_id",
    "status",
    "school_name",
    "date",
    "type",
    "start_time",
    "end_time",
    "start_time_minutes",
    "hours",
    "replacement_name",
    "custom_rate",
    "notes",
    "repeats_weekly",
    "repeat_until",
    "claim_amount_cents",
    "claim_proof_name",
    "claim_image_url",
    "calendar_color",
    "created_at",
    "updated_at",
  ].join(",");
  const webSelectColumns = [
    "id",
    "employee_id",
    "created_by",
    "updated_by",
    "submission_id",
    "status",
    "school_name",
    "date",
    "type",
    "start_time",
    "end_time",
    "hours",
    "replacement_name",
    "custom_rate",
    "claim_notes",
    "claim_cost",
    "claim_proof_name",
    "claim_image_path",
    "claim_proof_data_url",
    "created_at",
    "updated_at",
  ].join(",");
  const webColorSelectColumns = [
    "id",
    "employee_id",
    "created_by",
    "updated_by",
    "submission_id",
    "status",
    "school_name",
    "date",
    "type",
    "start_time",
    "end_time",
    "hours",
    "replacement_name",
    "custom_rate",
    "claim_notes",
    "claim_cost",
    "claim_proof_name",
    "claim_image_path",
    "claim_proof_data_url",
    "calendar_color",
    "created_at",
    "updated_at",
  ].join(",");
  let activeSchema = null;
  const schemaPriority = ["iosColor", "webColor", "ios", "web"];
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

  function normalizeTime(value) {
    if (!value) return "";
    return String(value).slice(0, 5);
  }

  function normalizeType(value) {
    switch (value) {
      case "schoolCoaching":
      case "School Coaching":
      case "Coaching":
        return "School Coaching";
      case "replacement":
      case "Replacement":
        return "Replacement";
      case "claim":
      case "Claim":
        return "Claim";
      case "event":
      case "Event":
        return "Event";
      case "private":
      case "Private":
        return "Private";
      case "camp":
      case "Camp":
        return "Camp";
      default:
        return value || "School Coaching";
    }
  }

  function normalizeCalendarColor(value) {
    if (window.calendarEntryColors && typeof window.calendarEntryColors.normalizeColor === "function") {
      return window.calendarEntryColors.normalizeColor(value);
    }
    const normalized = String(value || "").trim().toUpperCase();
    return fallbackCalendarColors.has(normalized) ? normalized : "";
  }

  function normalizeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function toMinutes(value) {
    const [hours = 0, minutes = 0] = String(value || "0:00").split(":").map(Number);
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
  }

  function minutesToTime(value) {
    const totalMinutes = Math.max(0, normalizeNumber(value));
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function addHoursToTime(startTime, hoursWorked) {
    if (!startTime) return "";
    return minutesToTime(toMinutes(startTime) + Math.round(normalizeNumber(hoursWorked) * 60));
  }

  function hasEventCostPayload(entry) {
    return normalizeType(entry?.type) === "Event"
      && (
        normalizeNumber(entry?.claimCost, 0) > 0
        || String(entry?.claimNotes || "").trim().length > 0
      );
  }

  function getFileNameFromPath(value) {
    if (!value) return "";
    try {
      const parsed = new URL(value);
      return decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "");
    } catch (_error) {
      return String(value).split("/").filter(Boolean).pop() || "";
    }
  }

  function isMissingColumnError(error) {
    const message = String(error?.message || "");
    return error?.code === "42703"
      || error?.code === "PGRST204"
      || (message.includes("column") && message.includes("does not exist"))
      || message.includes("Could not find")
      || message.includes("schema cache");
  }

  function getSelectColumns(schema) {
    switch (schema) {
      case "iosColor":
        return iosColorSelectColumns;
      case "webColor":
        return webColorSelectColumns;
      case "ios":
        return iosSelectColumns;
      default:
        return webSelectColumns;
    }
  }

  function isIosSchema(schema) {
    return schema === "ios" || schema === "iosColor";
  }

  function supportsCalendarColor(schema) {
    return schema === "iosColor" || schema === "webColor";
  }

  function getSchemaAttempts() {
    if (!activeSchema) return schemaPriority;
    return [activeSchema, ...schemaPriority.filter((schema) => schema !== activeSchema)];
  }

  function toEntry(row) {
    const type = normalizeType(row.type);
    const isClaim = type === "Claim";
    const claimImageUrl = row.claim_image_url || row.claim_image_path || row.claim_proof_data_url || "";
    const claimAmountCents = row.claim_amount_cents == null
      ? Math.round(normalizeNumber(row.claim_cost) * 100)
      : normalizeNumber(row.claim_amount_cents);
    const claimNotes = row.notes || row.claim_notes || "";
    const isEventCost = type === "Event" && (claimAmountCents > 0 || String(claimNotes).trim().length > 0);
    const isCostEntry = isClaim || isEventCost;
    const startTime = isCostEntry ? "" : normalizeTime(row.start_time) || minutesToTime(row.start_time_minutes);
    const endTime = isCostEntry ? "" : normalizeTime(row.end_time) || addHoursToTime(startTime, row.hours);
    return {
      id: row.id,
      employeeId: row.employee_id,
      createdBy: row.created_by || "",
      updatedBy: row.updated_by || "",
      submissionId: row.submission_id || "",
      status: row.status || "active",
      schoolName: isClaim ? "Claims" : row.school_name || "",
      date: row.date || "",
      type,
      startTime,
      endTime,
      hours: isCostEntry ? 0 : normalizeNumber(row.hours),
      replacementName: row.replacement_name || "",
      customRate: row.custom_rate == null ? null : normalizeNumber(row.custom_rate),
      claimNotes: isCostEntry ? claimNotes : "",
      claimCost: isCostEntry ? claimAmountCents / 100 : null,
      claimProofName: isClaim ? row.claim_proof_name || getFileNameFromPath(claimImageUrl) : "",
      claimImagePath: isClaim ? claimImageUrl : "",
      claimProofDataUrl: isClaim && /^https?:|^data:/i.test(claimImageUrl) ? claimImageUrl : "",
      calendarColor: normalizeCalendarColor(row.calendar_color),
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
    };
  }

  function toRow(entry, context = {}, schema = activeSchema || "ios") {
    const type = normalizeType(entry.type);
    const isClaim = type === "Claim";
    const isEventCost = hasEventCostPayload({ ...entry, type });
    const isCostEntry = isClaim || isEventCost;
    const calendarColor = normalizeCalendarColor(entry.calendarColor);
    if (isIosSchema(schema)) {
      const row = {
        employee_id: context.employeeId || entry.employeeId,
        created_by: context.createdBy || entry.createdBy || undefined,
        updated_by: context.updatedBy || entry.updatedBy || undefined,
        status: entry.status || "active",
        school_name: isClaim ? "Claims" : entry.schoolName || "",
        replacement_name: type === "Replacement" ? entry.replacementName || null : null,
        date: entry.date,
        type,
        start_time: isCostEntry ? null : entry.startTime || null,
        end_time: isCostEntry ? null : entry.endTime || null,
        start_time_minutes: isCostEntry ? 0 : toMinutes(entry.startTime),
        hours: isCostEntry ? 0 : normalizeNumber(entry.hours),
        notes: isCostEntry ? entry.claimNotes || null : null,
        repeats_weekly: false,
        repeat_until: null,
        claim_amount_cents: isCostEntry && entry.claimCost != null ? Math.round(normalizeNumber(entry.claimCost) * 100) : 0,
        claim_proof_name: isClaim ? entry.claimProofName || null : null,
        claim_image_url: isClaim ? entry.claimImagePath || entry.claimProofDataUrl || null : null,
      };
      if (supportsCalendarColor(schema)) {
        row.calendar_color = calendarColor || null;
      }
      return row;
    }

    const row = {
      employee_id: context.employeeId || entry.employeeId,
      created_by: context.createdBy || entry.createdBy || undefined,
      updated_by: context.updatedBy || entry.updatedBy || undefined,
      status: entry.status || "active",
      school_name: isClaim ? "Claims" : entry.schoolName || "",
      date: entry.date,
      type,
      start_time: isCostEntry ? null : entry.startTime || null,
      end_time: isCostEntry ? null : entry.endTime || null,
      hours: isCostEntry ? 0 : normalizeNumber(entry.hours),
      replacement_name: type === "Replacement" ? entry.replacementName || null : null,
      custom_rate: isCostEntry ? null : entry.customRate != null ? normalizeNumber(entry.customRate) : null,
      claim_notes: isCostEntry ? entry.claimNotes || null : entry.claimNotes || null,
      claim_cost: isCostEntry && entry.claimCost != null ? normalizeNumber(entry.claimCost) : null,
      claim_proof_name: isClaim ? entry.claimProofName || null : null,
      claim_image_path: isClaim ? entry.claimImagePath || null : null,
      claim_proof_data_url: isClaim ? entry.claimProofDataUrl || null : null,
    };
    if (supportsCalendarColor(schema)) {
      row.calendar_color = calendarColor || null;
    }
    return row;
  }

  function assertRows(rows, error, fallbackMessage) {
    if (error) {
      throw new Error(error.message || fallbackMessage);
    }
    return rows || [];
  }

  async function loadEntriesForEmployee(employeeId) {
    const schemas = getSchemaAttempts();
    let lastError = null;

    for (const schema of schemas) {
      const timeColumn = isIosSchema(schema) ? "start_time_minutes" : "start_time";
      const { data, error } = await getClient()
        .from(tableName)
        .select(getSelectColumns(schema))
        .eq("employee_id", employeeId)
        .order("date", { ascending: true })
        .order(timeColumn, { ascending: true });

      if (!error) {
        activeSchema = schema;
        return assertRows(data, error, "Could not load draft timesheet entries.").map((row) => toEntry(row, schema));
      }

      lastError = error;
      if (!isMissingColumnError(error)) break;
    }

    return assertRows(null, lastError, "Could not load draft timesheet entries.");
  }

  async function insertEntries(entries, context) {
    if (!entries.length) return [];
    const schemas = getSchemaAttempts();
    let lastError = null;

    for (const schema of schemas) {
      const rows = entries.map((entry) => toRow(entry, context, schema));
      const { data, error } = await getClient()
        .from(tableName)
        .insert(rows)
        .select(getSelectColumns(schema));

      if (!error) {
        activeSchema = schema;
        return assertRows(data, error, "Could not save draft timesheet entries.").map((row) => toEntry(row, schema));
      }

      lastError = error;
      if (!isMissingColumnError(error)) break;
    }

    return assertRows(null, lastError, "Could not save draft timesheet entries.");
  }

  async function updateEntry(id, entry, context) {
    const schemas = getSchemaAttempts();
    let lastError = null;

    for (const schema of schemas) {
      const { data, error } = await getClient()
        .from(tableName)
        .update(toRow(entry, context, schema))
        .eq("id", id)
        .select(getSelectColumns(schema))
        .single();

      if (!error) {
        activeSchema = schema;
        return toEntry(data, schema);
      }

      lastError = error;
      if (!isMissingColumnError(error)) break;
    }

    throw new Error(lastError?.message || "Could not update draft timesheet entry.");
  }

  async function deleteEntry(id) {
    const { error } = await getClient()
      .from(tableName)
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message || "Could not delete draft timesheet entry.");
    }
  }

  async function deleteEntries(ids) {
    if (!ids.length) return;
    const { error } = await getClient()
      .from(tableName)
      .delete()
      .in("id", ids);

    if (error) {
      throw new Error(error.message || "Could not delete draft timesheet entries.");
    }
  }

  async function markSubmitted(ids, submissionId, userId) {
    if (!ids.length) return [];
    const schemas = getSchemaAttempts();
    let lastError = null;

    for (const schema of schemas) {
      const { data, error } = await getClient()
        .from(tableName)
        .update({
          status: "submitted",
          submission_id: submissionId,
          updated_by: userId,
        })
        .in("id", ids)
        .select(getSelectColumns(schema));

      if (!error) {
        activeSchema = schema;
        return assertRows(data, error, "Could not lock submitted draft entries.").map((row) => toEntry(row, schema));
      }

      lastError = error;
      if (!isMissingColumnError(error)) break;
    }

    return assertRows(null, lastError, "Could not lock submitted draft entries.");
  }

  function isSubmitted(entry) {
    return String(entry?.status || "active").toLowerCase() === "submitted";
  }

  function isManagerEditable(entry) {
    return !isSubmitted(entry)
      && ["School Coaching", "Replacement", "Claim", "Camp", "Private", "Event"].includes(normalizeType(entry?.type));
  }

  function isActive(entry) {
    return !isSubmitted(entry);
  }

  window.draftTimesheetStore = {
    loadEntriesForEmployee,
    insertEntries,
    updateEntry,
    deleteEntry,
    deleteEntries,
    markSubmitted,
    toEntry,
    toRow,
    isSubmitted,
    isManagerEditable,
    isActive,
  };
})();
