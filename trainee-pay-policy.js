// Shared trainee weekly-stipend calculations.
// Browser pages use this for previews; Supabase remains authoritative at submission.
(function initTraineePayPolicy(root) {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function parseDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function formatDate(date) {
    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0"),
    ].join("-");
  }

  function formatMonth(date) {
    return new Intl.DateTimeFormat("en-SG", {
      month: "short",
      timeZone: "UTC",
    }).format(date);
  }

  function formatWeekLabel(start, end) {
    const startDay = start.getUTCDate();
    const endDay = end.getUTCDate();
    const startMonth = formatMonth(start);
    const endMonth = formatMonth(end);
    const startYear = start.getUTCFullYear();
    const endYear = end.getUTCFullYear();

    if (startYear !== endYear) {
      return `${startDay} ${startMonth} ${startYear}–${endDay} ${endMonth} ${endYear}`;
    }
    if (start.getUTCMonth() !== end.getUTCMonth()) {
      return `${startDay} ${startMonth}–${endDay} ${endMonth} ${endYear}`;
    }
    return `${startDay}–${endDay} ${endMonth} ${endYear}`;
  }

  function getWeekPeriod(value) {
    const date = parseDate(value);
    if (!date) return null;
    const daysSinceMonday = (date.getUTCDay() + 6) % 7;
    const start = new Date(date.getTime() - daysSinceMonday * DAY_MS);
    const end = new Date(start.getTime() + 6 * DAY_MS);
    const startValue = formatDate(start);
    return {
      start: startValue,
      end: formatDate(end),
      key: startValue,
      label: formatWeekLabel(start, end),
    };
  }

  function isWeekClosed(periodEnd, todayValue) {
    const end = parseDate(periodEnd);
    const today = parseDate(todayValue);
    return Boolean(end && today && today.getTime() > end.getTime());
  }

  function normalizeType(value) {
    return String(value || "").trim().toLowerCase();
  }

  function positiveNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function isQualifyingWorkEntry(entry) {
    if (!entry || normalizeType(entry.type) === "claim") return false;
    return positiveNumber(entry.hours) > 0;
  }

  function getReimbursementAmount(entry) {
    const type = normalizeType(entry?.type);
    if (type !== "claim" && type !== "event") return 0;
    const direct = positiveNumber(entry?.claimCost);
    if (direct > 0) return direct;
    const cents = positiveNumber(entry?.claimAmountCents ?? entry?.claim_amount_cents);
    return cents > 0 ? cents / 100 : 0;
  }

  function calculateWeeklySummary(entries, weeklyStipend) {
    const rows = Array.isArray(entries) ? entries : [];
    const qualifyingWorkHours = rows.reduce(
      (sum, entry) => sum + (isQualifyingWorkEntry(entry) ? positiveNumber(entry.hours) : 0),
      0
    );
    const reimbursementPay = rows.reduce(
      (sum, entry) => sum + getReimbursementAmount(entry),
      0
    );
    const qualifies = qualifyingWorkHours > 0;
    const basePay = qualifies ? positiveNumber(weeklyStipend) : 0;
    return {
      qualifies,
      qualifyingWorkHours,
      basePay,
      reimbursementPay,
      totalPay: basePay + reimbursementPay,
      entryCount: rows.length,
    };
  }

  function groupEntriesByWeek(entries) {
    const datedEntries = (Array.isArray(entries) ? entries : [])
      .map((entry) => ({ entry, period: getWeekPeriod(entry?.date) }))
      .filter((item) => item.period)
      .sort((a, b) => {
        const dateCompare = String(a.entry.date).localeCompare(String(b.entry.date));
        if (dateCompare !== 0) return dateCompare;
        return String(a.entry.startTime || "").localeCompare(String(b.entry.startTime || ""));
      });
    const grouped = new Map();
    datedEntries.forEach(({ entry, period }) => {
      if (!grouped.has(period.key)) {
        grouped.set(period.key, { period, entries: [] });
      }
      grouped.get(period.key).entries.push(entry);
    });
    return grouped;
  }

  function isWeeklyStipendProfile(profile) {
    return String(profile?.seniority_level || "").trim().toLowerCase() === "trainee"
      && String(profile?.pay_policy || "").trim().toLowerCase() === "weekly_stipend";
  }

  root.traineePayPolicy = {
    calculateWeeklySummary,
    getReimbursementAmount,
    getWeekPeriod,
    groupEntriesByWeek,
    isQualifyingWorkEntry,
    isWeekClosed,
    isWeeklyStipendProfile,
  };
})(typeof window !== "undefined" ? window : globalThis);
