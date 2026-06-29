const CURRENCY = "INR";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
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
