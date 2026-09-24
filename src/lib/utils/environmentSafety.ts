/**
 * Environment Isolation & Safety Verification Guard
 * Prevents accidental execution of staging/load tests against production database or FCM.
 */

export function extractSupabaseProjectRef(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") return null;
  try {
    // Format: https://<project-ref>.supabase.co
    const parsed = new URL(url);
    const hostParts = parsed.hostname.split(".");
    if (hostParts.length >= 3 && hostParts[1] === "supabase" && hostParts[2] === "co") {
      return hostParts[0];
    }
    return parsed.hostname;
  } catch {
    // If not standard URL, extract regex
    const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
    return match ? match[1] : null;
  }
}

export function extractPoolerProjectRef(poolerUrl: string | undefined | null): string | null {
  if (!poolerUrl || typeof poolerUrl !== "string") return null;
  // Match user or host in postgresql://postgres.[project-ref]:password@... or db.[project-ref].supabase.co
  const userMatch = poolerUrl.match(/postgres\.([a-z0-9-]+):/i);
  if (userMatch) return userMatch[1];
  const hostMatch = poolerUrl.match(/db\.([a-z0-9-]+)\.supabase\.co/i);
  if (hostMatch) return hostMatch[1];
  return null;
}

export interface StagingIsolationCheck {
  isConfigured: boolean;
  isIsolated: boolean;
  isMockFcm: boolean;
  isPoolerConfigured: boolean;
  reasons: string[];
}

export function checkStagingIsolation(
  stagingEnv: Record<string, string | undefined>,
  prodEnv: Record<string, string | undefined>
): StagingIsolationCheck {
  const reasons: string[] = [];

  const stagingUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL || "";
  const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL || "";

  const stagingRef = extractSupabaseProjectRef(stagingUrl);
  const prodRef = extractSupabaseProjectRef(prodUrl);

  const isConfigured = Boolean(stagingUrl && stagingEnv.SUPABASE_SECRET_KEY);
  const isMockFcm = stagingEnv.MOCK_FCM === "true";
  const isPoolerConfigured = Boolean(stagingEnv.SUPABASE_TRANSACTION_POOLER_URL);

  let isIsolated = false;

  if (!stagingUrl) {
    reasons.push("Staging Supabase URL is not configured in .env.staging.local");
  } else if (stagingRef && prodRef && stagingRef === prodRef) {
    reasons.push("CRITICAL: Staging Supabase URL matches production project ID!");
    isIsolated = false;
  } else if (stagingRef && (!prodRef || stagingRef !== prodRef)) {
    isIsolated = true;
  } else {
    isIsolated = false;
    reasons.push("Unable to verify distinct project reference for staging");
  }

  if (!isMockFcm) {
    reasons.push("MOCK_FCM is not enabled in staging (must be true)");
  }

  return {
    isConfigured,
    isIsolated,
    isMockFcm,
    isPoolerConfigured,
    reasons,
  };
}

