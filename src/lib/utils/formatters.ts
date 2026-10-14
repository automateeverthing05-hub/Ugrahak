/**
 * Production-Safe Indian Localized Formatters
 *
 * Enforces:
 * 1. Timezone: Indian Standard Time (Asia/Kolkata, UTC+05:30)
 * 2. Currency: Indian Rupee (₹) with en-IN numbering format
 * 3. Consistent date & time representations across merchant and customer views
 */

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Formats a date string or Date object in Indian Standard Time (IST)
 * Example: "14 Oct 2026"
 */
export function formatISTDate(
  date: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("en-IN", {
      timeZone: IST_TIMEZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    });
  } catch {
    return "—";
  }
}

/**
 * Formats date and time in Indian Standard Time (IST)
 * Example: "14 Oct 2026, 05:30 pm"
 */
export function formatISTDateTime(
  date: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";

    return d.toLocaleString("en-IN", {
      timeZone: IST_TIMEZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...options,
    });
  } catch {
    return "—";
  }
}

/**
 * Formats numbers into Indian Numbering System (e.g. 1,00,000)
 */
export function formatIndianNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return num.toLocaleString("en-IN");
}

/**
 * Formats currency in Indian Rupees (e.g. ₹1,499)
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}
