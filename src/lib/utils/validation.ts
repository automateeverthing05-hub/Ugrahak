/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a password (minimum 6 characters for Supabase Auth)
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long." };
  }
  return { valid: true };
}

/**
 * Validates phone numbers (standard 10-digit Indian phone number or international standard)
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
  // Standard 10-15 digits
  return /^\d{10,15}$/.test(cleanPhone);
}

/**
 * Validates Google Maps URL
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  if (!url) return true; // Optional field
  try {
    const parsed = new URL(url.trim());
    return (
      parsed.hostname.includes("google.com") ||
      parsed.hostname.includes("goo.gl") ||
      parsed.hostname.includes("maps.app.goo.gl")
    );
  } catch {
    return false;
  }
}

