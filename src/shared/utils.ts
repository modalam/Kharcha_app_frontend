const CURRENCY = "INR";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Compact currency for chart axes, e.g. 36173 -> "₹36K".
export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Turns a "YYYY-MM" key into a friendly label like "Jun 2026".
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const idx = Number(m) - 1;
  if (!year || Number.isNaN(idx) || !MONTH_NAMES[idx]) return month;
  return `${MONTH_NAMES[idx]} ${year}`;
}

// Turns a "YYYY-Www" key (SQLite strftime) into a short label like "Wk 26".
export function formatWeekLabel(week: string): string {
  const match = week.match(/W(\d+)/);
  return match ? `Wk ${Number(match[1])}` : week;
}

// Turns a "YYYY-MM-DD" key into a short axis label like "29 Jun".
export function formatShortDate(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  if (!m || !d || !MONTH_NAMES[m - 1]) return date;
  return `${d} ${MONTH_NAMES[m - 1]}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function toISODate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

// Local calendar date as YYYY-MM-DD (avoids the UTC shift of toISOString,
// so "today" matches the user's wall clock instead of the UTC date).
export function todayLocalISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStartOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toISODate(d);
}

export function getStartOfMonth(date: Date = new Date()): string {
  const d = new Date(date);
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function getEndOfMonth(date: Date = new Date()): string {
  const d = new Date(date);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
