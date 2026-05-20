/**
 * Pure period math + label formatting for the Overview Month/Quarter pickers.
 */
export type PeriodMode = "month" | "quarter";

export interface Period {
  from: Date;
  to: Date;
  label: string;
  /** stable URL token: "2026-05" for month, "2026-Q2" for quarter */
  token: string;
}

export function monthPeriod(year: number, monthIndex: number): Period {
  const from = new Date(year, monthIndex, 1);
  const to = new Date(year, monthIndex + 1, 1);
  return {
    from,
    to,
    label: from.toLocaleString(undefined, { month: "long", year: "numeric" }),
    token: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
  };
}

export function quarterPeriod(year: number, q: number /* 0..3 */): Period {
  const from = new Date(year, q * 3, 1);
  const to = new Date(year, q * 3 + 3, 1);
  return {
    from,
    to,
    label: `Q${q + 1} ${year}`,
    token: `${year}-Q${q + 1}`,
  };
}

export function previousPeriod(p: Period, mode: PeriodMode): Period {
  if (mode === "month") {
    const d = new Date(p.from);
    d.setMonth(d.getMonth() - 1);
    return monthPeriod(d.getFullYear(), d.getMonth());
  }
  const d = new Date(p.from);
  d.setMonth(d.getMonth() - 3);
  return quarterPeriod(d.getFullYear(), Math.floor(d.getMonth() / 3));
}

export function shiftPeriod(p: Period, mode: PeriodMode, delta: number): Period {
  if (mode === "month") {
    const d = new Date(p.from);
    d.setMonth(d.getMonth() + delta);
    return monthPeriod(d.getFullYear(), d.getMonth());
  }
  const d = new Date(p.from);
  d.setMonth(d.getMonth() + delta * 3);
  return quarterPeriod(d.getFullYear(), Math.floor(d.getMonth() / 3));
}

export function currentPeriod(mode: PeriodMode): Period {
  const now = new Date();
  if (mode === "month") return monthPeriod(now.getFullYear(), now.getMonth());
  return quarterPeriod(now.getFullYear(), Math.floor(now.getMonth() / 3));
}

export function listPeriods(mode: PeriodMode, count: number): Period[] {
  const out: Period[] = [];
  let p = currentPeriod(mode);
  for (let i = 0; i < count; i++) {
    out.push(p);
    p = previousPeriod(p, mode);
  }
  return out;
}

export function parseToken(mode: PeriodMode, token: string | null): Period | null {
  if (!token) return null;
  if (mode === "month") {
    const m = /^(\d{4})-(\d{2})$/.exec(token);
    if (!m) return null;
    return monthPeriod(Number(m[1]), Number(m[2]) - 1);
  }
  const m = /^(\d{4})-Q([1-4])$/.exec(token);
  if (!m) return null;
  return quarterPeriod(Number(m[1]), Number(m[2]) - 1);
}
