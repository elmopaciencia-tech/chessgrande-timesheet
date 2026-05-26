// Shared Supabase-backed in-app notice storage.
(function initEmployeeNoticeStore() {
  const noticeTable = "employee_notices";
  const recipientTable = "employee_notice_recipients";
  const noticeTypes = new Set(["manual", "payment", "system"]);
  const recipientSelectColumns = [
    "notice_id",
    "employee_id",
    "read_at",
    "notice:employee_notices(id,created_by,title,body,notice_type,related_submission_id,created_at)",
  ].join(",");
  const noticeSelectColumns = [
    "id",
    "created_by",
    "title",
    "body",
    "notice_type",
    "related_submission_id",
    "created_at",
  ].join(",");

  function getClient() {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized. Load supabase-client.js first.");
    }
    return window.supabaseClient;
  }

  function normalizeText(value, fallback = "") {
    const normalized = String(value || "").trim();
    return normalized || fallback;
  }

  function normalizeNoticeType(value) {
    const normalized = String(value || "manual").trim().toLowerCase();
    return noticeTypes.has(normalized) ? normalized : "manual";
  }

  function uniqueIds(values) {
    return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))];
  }

  function normalizeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatMoney(value) {
    const amount = normalizeNumber(value);
    const sign = amount < 0 ? "-" : "";
    return `${sign}S$${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount))}`;
  }

  function toNotice(row = {}) {
    return {
      id: row.id || row.notice_id || "",
      createdBy: row.created_by || "",
      title: row.title || "",
      body: row.body || "",
      noticeType: normalizeNoticeType(row.notice_type),
      relatedSubmissionId: row.related_submission_id || "",
      createdAt: row.created_at || "",
    };
  }

  function toRecipientNotice(row = {}) {
    const notice = toNotice(row.notice || {});
    return {
      ...notice,
      noticeId: row.notice_id || notice.id,
      employeeId: row.employee_id || "",
      readAt: row.read_at || "",
      isRead: Boolean(row.read_at),
    };
  }

  function toNoticeRow(notice, context = {}) {
    const title = normalizeText(notice.title);
    const body = normalizeText(notice.body);
    if (!title) {
      throw new Error("Notice title is required.");
    }
    if (!body) {
      throw new Error("Notice body is required.");
    }
    const createdBy = normalizeText(context.createdBy || notice.createdBy);
    if (!createdBy) {
      throw new Error("Manager session is required to send notices.");
    }
    return {
      created_by: createdBy,
      title,
      body,
      notice_type: normalizeNoticeType(notice.noticeType),
      related_submission_id: normalizeText(notice.relatedSubmissionId) || null,
    };
  }

  function toRecipientRows(noticeId, recipientIds) {
    return uniqueIds(recipientIds).map((employeeId) => ({
      notice_id: noticeId,
      employee_id: employeeId,
    }));
  }

  async function loadNoticesForEmployee(employeeId, options = {}) {
    const limit = Math.max(1, Number(options.limit || 8));
    const { data, error } = await getClient()
      .from(recipientTable)
      .select(recipientSelectColumns)
      .eq("employee_id", employeeId);

    if (error) {
      throw new Error(error.message || "Could not load notices.");
    }

    return (data || [])
      .map(toRecipientNotice)
      .filter((notice) => notice.id)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, limit);
  }

  async function markNoticeRead(noticeId, context = {}) {
    const employeeId = normalizeText(context.employeeId);
    if (!employeeId) {
      throw new Error("Employee session is required to mark notices as read.");
    }

    const readAt = new Date().toISOString();
    const { error } = await getClient()
      .from(recipientTable)
      .update({ read_at: readAt })
      .eq("notice_id", noticeId)
      .eq("employee_id", employeeId);

    if (error) {
      throw new Error(error.message || "Could not mark notice as read.");
    }

    return readAt;
  }

  async function createNotice(notice, context = {}) {
    const recipientIds = uniqueIds(notice.recipientIds);
    if (!recipientIds.length) {
      throw new Error("Select at least one user before sending a notice.");
    }

    const { data: createdNotice, error: noticeError } = await getClient()
      .from(noticeTable)
      .insert(toNoticeRow(notice, context))
      .select(noticeSelectColumns)
      .single();

    if (noticeError) {
      throw new Error(noticeError.message || "Could not create notice.");
    }

    const recipientRows = toRecipientRows(createdNotice.id, recipientIds);
    const { error: recipientError } = await getClient()
      .from(recipientTable)
      .insert(recipientRows);

    if (recipientError) {
      throw new Error(recipientError.message || "Could not deliver notice.");
    }

    return {
      ...toNotice(createdNotice),
      recipientCount: recipientRows.length,
    };
  }

  function buildPaymentNotice(submission) {
    const employeeName = normalizeText(submission.employeeName, "there");
    const monthLabel = normalizeText(submission.monthLabel || submission.month, "your recent submission");
    const paidAt = submission.paidAt ? new Date(submission.paidAt) : new Date();
    const paidDate = Number.isNaN(paidAt.getTime())
      ? "today"
      : new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(paidAt);

    return {
      title: `${monthLabel} payroll marked paid`,
      body: `Hi ${employeeName}, your ${monthLabel} payroll has been marked paid on ${paidDate}. Total pay: ${formatMoney(submission.totalPay)}.`,
      noticeType: "payment",
      relatedSubmissionId: submission.id,
      recipientIds: [submission.employeeId],
    };
  }

  async function createPaymentNotice(submission, context = {}) {
    if (!submission || !submission.id || !submission.employeeId) {
      throw new Error("A paid submission with an employee is required to create a payment notice.");
    }
    return createNotice(buildPaymentNotice(submission), context);
  }

  window.employeeNoticeStore = {
    loadNoticesForEmployee,
    markNoticeRead,
    createNotice,
    createPaymentNotice,
    buildPaymentNotice,
    toNotice,
    toNoticeRow,
    toRecipientNotice,
    toRecipientRows,
  };
})();
