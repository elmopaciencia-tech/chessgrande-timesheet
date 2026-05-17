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
  let activeSchema = null;

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
      default:
        return value || "School Coaching";
    }
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
    return schema === "ios" ? iosSelectColumns : webSelectColumns;
  }

  function getAlternateSchema(schema) {
    return schema === "ios" ? "web" : "ios";
  }

  function toEntry(row) {
    const type = normalizeType(row.type);
    const isClaim = type === "Claim";
    const startTime = isClaim ? "" : normalizeTime(row.start_time) || minutesToTime(row.start_time_minutes);
    const endTime = isClaim ? "" : normalizeTime(row.end_time) || addHoursToTime(startTime, row.hours);
    const claimImageUrl = row.claim_image_url || row.claim_image_path || row.claim_proof_data_url || "";
    const claimAmountCents = row.claim_amount_cents == null
      ? Math.round(normalizeNumber(row.claim_cost) * 100)
      : normalizeNumber(row.claim_amount_cents);
    const claimNotes = row.notes || row.claim_notes || "";
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
      hours: isClaim ? 0 : normalizeNumber(row.hours),
      replacementName: row.replacement_name || "",
      customRate: row.custom_rate == null ? null : normalizeNumber(row.custom_rate),
      claimNotes: isClaim ? claimNotes : "",
      claimCost: isClaim ? claimAmountCents / 100 : null,
      claimProofName: row.claim_proof_name || getFileNameFromPath(claimImageUrl),
      claimImagePath: claimImageUrl,
      claimProofDataUrl: /^https?:|^data:/i.test(claimImageUrl) ? claimImageUrl : "",
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
    };
  }

  function toRow(entry, context = {}, schema = activeSchema || "ios") {
    const type = normalizeType(entry.type);
    const isClaim = type === "Claim";
    if (schema === "ios") {
      return {
        employee_id: context.employeeId || entry.employeeId,
        created_by: context.createdBy || entry.createdBy || undefined,
        updated_by: context.updatedBy || entry.updatedBy || undefined,
        status: entry.status || "active",
        school_name: isClaim ? "Claims" : entry.schoolName || "",
        replacement_name: type === "Replacement" ? entry.replacementName || null : null,
        date: entry.date,
        type,
        start_time: isClaim ? null : entry.startTime || null,
        end_time: isClaim ? null : entry.endTime || null,
        start_time_minutes: isClaim ? 0 : toMinutes(entry.startTime),
        hours: isClaim ? 0 : normalizeNumber(entry.hours),
        notes: isClaim ? entry.claimNotes || null : null,
        repeats_weekly: false,
        repeat_until: null,
        claim_amount_cents: isClaim && entry.claimCost != null ? Math.round(normalizeNumber(entry.claimCost) * 100) : 0,
        claim_proof_name: isClaim ? entry.claimProofName || null : null,
        claim_image_url: isClaim ? entry.claimImagePath || entry.claimProofDataUrl || null : null,
      };
    }

    return {
      employee_id: context.employeeId || entry.employeeId,
      created_by: context.createdBy || entry.createdBy || undefined,
      updated_by: context.updatedBy || entry.updatedBy || undefined,
      status: entry.status || "active",
      school_name: isClaim ? "Claims" : entry.schoolName || "",
      date: entry.date,
      type,
      start_time: isClaim ? null : entry.startTime || null,
      end_time: isClaim ? null : entry.endTime || null,
      hours: isClaim ? 0 : normalizeNumber(entry.hours),
      replacement_name: type === "Replacement" ? entry.replacementName || null : null,
      custom_rate: entry.customRate != null ? normalizeNumber(entry.customRate) : null,
      claim_notes: isClaim ? entry.claimNotes || null : entry.claimNotes || null,
      claim_cost: isClaim && entry.claimCost != null ? normalizeNumber(entry.claimCost) : null,
      claim_proof_name: isClaim ? entry.claimProofName || null : null,
      claim_image_path: isClaim ? entry.claimImagePath || null : null,
      claim_proof_data_url: isClaim ? entry.claimProofDataUrl || null : null,
    };
  }

  function assertRows(rows, error, fallbackMessage) {
    if (error) {
      throw new Error(error.message || fallbackMessage);
    }
    return rows || [];
  }

  async function loadEntriesForEmployee(employeeId) {
    const schemas = activeSchema ? [activeSchema, getAlternateSchema(activeSchema)] : ["ios", "web"];
    let lastError = null;

    for (const schema of schemas) {
      const timeColumn = schema === "ios" ? "start_time_minutes" : "start_time";
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
    const schemas = activeSchema ? [activeSchema, getAlternateSchema(activeSchema)] : ["ios", "web"];
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
    const schemas = activeSchema ? [activeSchema, getAlternateSchema(activeSchema)] : ["ios", "web"];
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
    const schemas = activeSchema ? [activeSchema, getAlternateSchema(activeSchema)] : ["ios", "web"];
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
    return !isSubmitted(entry) && ["School Coaching", "Replacement"].includes(normalizeType(entry?.type));
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
