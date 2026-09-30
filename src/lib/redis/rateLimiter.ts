import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "./client";
import { logger } from "@/lib/observability/logger";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory fallback tracking when Redis is not available
const inMemoryFallbackStore = new Map<string, { count: number; expiresAt: number }>();

function fallbackRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = inMemoryFallbackStore.get(key);

  if (!entry || entry.expiresAt < now) {
    inMemoryFallbackStore.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor((now + windowMs) / 1000),
    };
  }

  if (entry.count < limit) {
    entry.count += 1;
    return {
      success: true,
      limit,
      remaining: limit - entry.count,
      reset: Math.floor(entry.expiresAt / 1000),
    };
  }

  return {
    success: false,
    limit,
    remaining: 0,
    reset: Math.floor(entry.expiresAt / 1000),
  };
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function handleLimiterFallback(
  key: string,
  limit: number,
  windowMs: number,
  operation: string,
  securitySensitive: boolean = true
): RateLimitResult {
  if (isProduction() && securitySensitive) {
    logger.error(
      `CRITICAL: Production Redis unavailable for security-sensitive rate limiter [${key}]. Failing safely to protect system integrity.`,
      {
        operation,
        metadata: { key, limit, windowMs },
      }
    );
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.floor((Date.now() + windowMs) / 1000),
    };
  }

  return fallbackRateLimit(key, limit, windowMs);
}

/**
 * Creates a rate limiter instance if Redis is configured
 */
function createRateLimiter(
  requests: number,
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`,
  prefix: string
): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: `ugrahak:ratelimit:${prefix}`,
  });
}

// Pre-configured rate limiters
let checkinLimiter: Ratelimit | null = null;
let nearbyLimiter: Ratelimit | null = null;
let tokenRegisterLimiter: Ratelimit | null = null;
let offerSendLimiter: Ratelimit | null = null;
let redeemLimiter: Ratelimit | null = null;
let authLimiter: Ratelimit | null = null;

export async function rateLimitCheckin(identifier: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return handleLimiterFallback(`checkin:${identifier}`, 60, 60_000, "RATELIMIT_CHECKIN", true);
  }

  if (!checkinLimiter) {
    checkinLimiter = createRateLimiter(60, "1 m", "checkin");
  }

  try {
    const res = await checkinLimiter!.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  } catch (error) {
    logger.warn("Rate limiting failed on checkin, handling fallback", {
      operation: "RATELIMIT_CHECKIN",
      metadata: { identifier },
    });
    return handleLimiterFallback(`checkin:${identifier}`, 60, 60_000, "RATELIMIT_CHECKIN", true);
  }
}

export async function rateLimitNearbyCheck(identifier: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return handleLimiterFallback(`nearby:${identifier}`, 120, 60_000, "RATELIMIT_NEARBY", false);
  }

  if (!nearbyLimiter) {
    nearbyLimiter = createRateLimiter(120, "1 m", "nearby");
  }

  try {
    const res = await nearbyLimiter!.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  } catch (error) {
    logger.warn("Rate limiting failed on nearby check, handling fallback", {
      operation: "RATELIMIT_NEARBY",
      metadata: { identifier },
    });
    return handleLimiterFallback(`nearby:${identifier}`, 120, 60_000, "RATELIMIT_NEARBY", false);
  }
}

export async function rateLimitTokenRegistration(identifier: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return handleLimiterFallback(`token_reg:${identifier}`, 60, 60_000, "RATELIMIT_TOKEN_REG", true);
  }

  if (!tokenRegisterLimiter) {
    tokenRegisterLimiter = createRateLimiter(60, "1 m", "token_reg");
  }

  try {
    const res = await tokenRegisterLimiter!.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  } catch (error) {
    logger.warn("Rate limiting failed on token registration, handling fallback", {
      operation: "RATELIMIT_TOKEN_REG",
      metadata: { identifier },
    });
    return handleLimiterFallback(`token_reg:${identifier}`, 60, 60_000, "RATELIMIT_TOKEN_REG", true);
  }
}

export async function rateLimitOfferSend(merchantId: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return handleLimiterFallback(`offer_send:${merchantId}`, 30, 60_000, "RATELIMIT_OFFER_SEND", true);
  }

  if (!offerSendLimiter) {
    offerSendLimiter = createRateLimiter(30, "1 m", "offer_send");
  }

  try {
    const res = await offerSendLimiter!.limit(merchantId);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  } catch (error) {
    logger.warn("Rate limiting failed on offer send, handling fallback", {
      operation: "RATELIMIT_OFFER_SEND",
      metadata: { merchantId },
    });
    return handleLimiterFallback(`offer_send:${merchantId}`, 30, 60_000, "RATELIMIT_OFFER_SEND", true);
  }
}

export async function rateLimitRedeem(identifier: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return handleLimiterFallback(`redeem:${identifier}`, 30, 60_000, "RATELIMIT_REDEEM", true);
  }

  if (!redeemLimiter) {
    redeemLimiter = createRateLimiter(30, "1 m", "redeem");
  }

  try {
    const res = await redeemLimiter!.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  } catch (error) {
    logger.warn("Rate limiting failed on redeem, handling fallback", {
      operation: "RATELIMIT_REDEEM",
      metadata: { identifier },
    });
    return handleLimiterFallback(`redeem:${identifier}`, 30, 60_000, "RATELIMIT_REDEEM", true);
  }
}

export async function rateLimitAuth(identifier: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return handleLimiterFallback(`auth:${identifier}`, 20, 60_000, "RATELIMIT_AUTH", true);
  }

  if (!authLimiter) {
    authLimiter = createRateLimiter(20, "1 m", "auth");
  }

  try {
    const res = await authLimiter!.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  } catch (error) {
    logger.warn("Rate limiting failed on auth, handling fallback", {
      operation: "RATELIMIT_AUTH",
      metadata: { identifier },
    });
    return handleLimiterFallback(`auth:${identifier}`, 20, 60_000, "RATELIMIT_AUTH", true);
  }
}

