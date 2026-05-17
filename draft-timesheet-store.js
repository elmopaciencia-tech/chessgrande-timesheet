// Shared Supabase-backed draft timesheet storage.
// Draft rows are editable working data; payroll_entries remain submitted snapshots.
(function initDraftTimesheetStore() {
  const tableName = "draft_timesheet_entries";
  const selectColumns = [
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

  function toRow(entry, context = {}) {
    const type = normalizeType(entry.type);
    const isClaim = type === "Claim";
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
      start_time_minutes: isClaim ? 0 : toMinutes(entry.startTime),
      hours: isClaim ? 0 : normalizeNumber(entry.hours),
      replacement_name: type === "Replacement" ? entry.replacementName || null : null,
      custom_rate: entry.customRate != null ? normalizeNumber(entry.customRate) : null,
      notes: isClaim ? entry.claimNotes || null : entry.notes || null,
      repeats_weekly: false,
      repeat_until: null,
      claim_amount_cents: isClaim && entry.claimCost != null ? Math.round(normalizeNumber(entry.claimCost) * 100) : 0,
      claim_proof_name: isClaim ? entry.claimProofName || null : null,
      claim_image_url: isClaim ? entry.claimImagePath || entry.claimProofDataUrl || null : null,
    };
  }

  function assertRows(rows, error, fallbackMessage) {
    if (error) {
      throw new Error(error.message || fallbackMessage);
    }
    return rows || [];
  }

  async function loadEntriesForEmployee(employeeId) {
    const { data, error } = await getClient()
      .from(tableName)
      .select(selectColumns)
      .eq("employee_id", employeeId)
      .order("date", { ascending: true })
      .order("start_time_minutes", { ascending: true });

    return assertRows(data, error, "Could not load draft timesheet entries.").map(toEntry);
  }

  async function insertEntries(entries, context) {
    if (!entries.length) return [];
    const rows = entries.map((entry) => toRow(entry, context));
    const { data, error } = await getClient()
      .from(tableName)
      .insert(rows)
      .select(selectColumns);

    return assertRows(data, error, "Could not save draft timesheet entries.").map(toEntry);
  }

  async function updateEntry(id, entry, context) {
    const { data, error } = await getClient()
      .from(tableName)
      .update(toRow(entry, context))
      .eq("id", id)
      .select(selectColumns)
      .single();

    if (error) {
      throw new Error(error.message || "Could not update draft timesheet entry.");
    }
    return toEntry(data);
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
    const { data, error } = await getClient()
      .from(tableName)
      .update({
        status: "submitted",
        submission_id: submissionId,
        updated_by: userId,
      })
      .in("id", ids)
      .select(selectColumns);

    return assertRows(data, error, "Could not lock submitted draft entries.").map(toEntry);
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
