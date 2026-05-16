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

  function normalizeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function toEntry(row) {
    return {
      id: row.id,
      employeeId: row.employee_id,
      createdBy: row.created_by || "",
      updatedBy: row.updated_by || "",
      submissionId: row.submission_id || "",
      status: row.status || "active",
      schoolName: row.type === "Claim" ? "Claims" : row.school_name || "",
      date: row.date || "",
      type: row.type || "School Coaching",
      startTime: normalizeTime(row.start_time),
      endTime: normalizeTime(row.end_time),
      hours: normalizeNumber(row.hours),
      replacementName: row.replacement_name || "",
      customRate: row.custom_rate == null ? null : normalizeNumber(row.custom_rate),
      claimNotes: row.claim_notes || "",
      claimCost: row.claim_cost == null ? null : normalizeNumber(row.claim_cost),
      claimProofName: row.claim_proof_name || "",
      claimImagePath: row.claim_image_path || "",
      claimProofDataUrl: row.claim_proof_data_url || "",
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
    };
  }

  function toRow(entry, context = {}) {
    const isClaim = entry.type === "Claim";
    return {
      employee_id: context.employeeId || entry.employeeId,
      created_by: context.createdBy || entry.createdBy || undefined,
      updated_by: context.updatedBy || entry.updatedBy || undefined,
      status: entry.status || "active",
      school_name: isClaim ? "Claims" : entry.schoolName || "",
      date: entry.date,
      type: entry.type,
      start_time: isClaim ? null : entry.startTime || null,
      end_time: isClaim ? null : entry.endTime || null,
      hours: isClaim ? 0 : normalizeNumber(entry.hours),
      replacement_name: entry.type === "Replacement" ? entry.replacementName || null : null,
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
    const { data, error } = await getClient()
      .from(tableName)
      .select(selectColumns)
      .eq("employee_id", employeeId)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

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
    return !isSubmitted(entry) && ["School Coaching", "Replacement"].includes(entry?.type);
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
