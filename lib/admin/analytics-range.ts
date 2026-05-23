export type AnalyticsPeriod = "daily" | "monthly" | "yearly" | "custom";

export type TimeGranularity = "day" | "month" | "year";

export type ResolvedAnalyticsRange = {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  granularity: TimeGranularity;
  startIso: string;
  endIso: string;
};

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidYmd(value: string): boolean {
  if (!YMD_RE.test(value)) return false;
  const parts = value.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function utcYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseYmdUtc(ymd: string): Date {
  const parts = ymd.split("-").map(Number);
  return new Date(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!));
}

function addUtcDays(ymd: string, days: number): string {
  const d = parseYmdUtc(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return utcYmd(d);
}

function startOfUtcMonth(ymd: string): string {
  const parts = ymd.split("-");
  return `${parts[0]}-${parts[1]}-01`;
}

function addUtcMonths(ymd: string, months: number): string {
  const d = parseYmdUtc(startOfUtcMonth(ymd));
  d.setUTCMonth(d.getUTCMonth() + months);
  return utcYmd(d);
}

function daysBetweenInclusive(startYmd: string, endYmd: string): number {
  const ms =
    parseYmdUtc(endYmd).getTime() - parseYmdUtc(startYmd).getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

function granularityForCustomRange(startYmd: string, endYmd: string): TimeGranularity {
  const days = daysBetweenInclusive(startYmd, endYmd);
  if (days <= 90) return "day";
  if (days <= 730) return "month";
  return "year";
}

/** Bucket key in UTC — works with any Postgres / ISO timestamp string. */
export function periodKeyFromIso(iso: string, granularity: TimeGranularity): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    if (granularity === "year") return iso.slice(0, 4);
    if (granularity === "month") return iso.slice(0, 7);
    return iso.slice(0, 10);
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  if (granularity === "year") return String(y);
  if (granularity === "month") return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

export function resolveAnalyticsRange(input: {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
}): ResolvedAnalyticsRange {
  const period = input.period ?? "daily";
  const today = utcYmd(new Date());

  let endDate =
    input.endDate && isValidYmd(input.endDate) ? input.endDate : today;
  if (endDate > today) endDate = today;

  let startDate: string;
  let granularity: TimeGranularity;

  switch (period) {
    case "monthly":
      startDate = addUtcMonths(endDate, -11);
      startDate = startOfUtcMonth(startDate);
      granularity = "month";
      break;
    case "yearly":
      startDate = `${Number(endDate.slice(0, 4)) - 4}-01-01`;
      granularity = "year";
      break;
    case "custom": {
      startDate =
        input.startDate && isValidYmd(input.startDate)
          ? input.startDate
          : addUtcDays(endDate, -29);
      if (startDate > endDate) {
        const tmp = startDate;
        startDate = endDate;
        endDate = tmp;
      }
      granularity = granularityForCustomRange(startDate, endDate);
      break;
    }
    case "daily":
    default:
      startDate = addUtcDays(endDate, -29);
      granularity = "day";
      break;
  }

  const startIso = `${startDate}T00:00:00.000Z`;
  const endIso = `${addUtcDays(endDate, 1)}T00:00:00.000Z`;

  return {
    period,
    startDate,
    endDate,
    granularity,
    startIso,
    endIso,
  };
}

export function buildPeriodBuckets(range: ResolvedAnalyticsRange): string[] {
  const { granularity, startDate, endDate } = range;
  const keys: string[] = [];

  if (granularity === "day") {
    let cur = startDate;
    while (cur <= endDate) {
      keys.push(cur);
      cur = addUtcDays(cur, 1);
    }
    return keys;
  }

  if (granularity === "month") {
    let y = Number(startDate.slice(0, 4));
    let m = Number(startDate.slice(5, 7));
    const endY = Number(endDate.slice(0, 4));
    const endM = Number(endDate.slice(5, 7));
    while (y < endY || (y === endY && m <= endM)) {
      keys.push(`${y}-${String(m).padStart(2, "0")}`);
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      if (keys.length > 120) break;
    }
    return keys;
  }

  const startYear = Number(startDate.slice(0, 4));
  const endYear = Number(endDate.slice(0, 4));
  for (let y = startYear; y <= endYear; y++) {
    keys.push(String(y));
  }
  return keys;
}

export function formatBucketLabel(
  key: string,
  granularity: TimeGranularity,
): string {
  if (granularity === "year") return key;
  if (granularity === "month") {
    const parts = key.split("-").map(Number);
    const y = parts[0] ?? 0;
    const m = parts[1] ?? 1;
    const d = new Date(Date.UTC(y, m - 1, 1));
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
  }
  const d = parseYmdUtc(key);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function rangeDescription(range: ResolvedAnalyticsRange): string {
  const { period, startDate, endDate, granularity } = range;
  if (period === "daily") return "Last 30 days (daily)";
  if (period === "monthly") return "Last 12 months (monthly)";
  if (period === "yearly") return "Last 5 years (yearly)";
  const g =
    granularity === "day"
      ? "daily"
      : granularity === "month"
        ? "monthly"
        : "yearly";
  return `${startDate} → ${endDate} (${g})`;
}
