import crypto from "crypto";

// Use clear characters (excluding ambiguous: 0, O, 1, I, L)
const CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generates a cryptographically random, human-friendly reward reference code.
 * Example output: "AG-7K9M-3P2Q"
 */
export function generateReferenceCode(prefix = "AG"): string {
  const segment1 = getRandomChars(4);
  const segment2 = getRandomChars(4);
  return `${prefix}-${segment1}-${segment2}`;
}

function getRandomChars(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}

/**
 * Normalizes phone numbers to standard 10 digits
 * E.g. "+91 98765-43210" -> "9876543210"
 * "09876543210" -> "9876543210"
 */
export function normalizePhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Masks phone number for merchant display to protect customer privacy
 * E.g. "9876543210" -> "+91 98765 •••••"
 */
export function maskPhone(phone: string): string {
  const clean = normalizePhone(phone);
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} •••••`;
  }
  if (clean.length > 5) {
    return `${clean.slice(0, 4)} •••• ${clean.slice(-2)}`;
  }
  return clean;
}

