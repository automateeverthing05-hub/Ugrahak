import { Redis } from "@upstash/redis";
import { logger } from "@/lib/observability/logger";

let redisInstance: Redis | null = null;
let isRedisAvailable: boolean | null = null;

/**
 * Get or initialize Upstash Redis singleton client.
 * Returns null if credentials are not configured.
 */
export function getRedisClient(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (isRedisAvailable !== false) {
      isRedisAvailable = false;
      logger.warn("Upstash Redis credentials missing. Operating in fallback mode.", {
        operation: "REDIS_INIT",
      });
    }
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
    });
    isRedisAvailable = true;
    return redisInstance;
  } catch (error) {
    logger.error("Failed to initialize Upstash Redis client", {
      operation: "REDIS_INIT",
    }, error);
    isRedisAvailable = false;
    return null;
  }
}

/**
 * Safe Redis cache GET helper with automatic fallback
 */
export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    logger.warn(`Redis GET failed for key: ${key}`, {
      operation: "REDIS_GET",
      metadata: { key },
    });
    return null;
  }
}

/**
 * Safe Redis cache SET helper with automatic fallback
 */
export async function setCachedJson<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    logger.warn(`Redis SET failed for key: ${key}`, {
      operation: "REDIS_SET",
      metadata: { key, ttlSeconds },
    });
    return false;
  }
}

/**
 * Safe Redis DELETE helper
 */
export async function deleteCachedKey(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.warn(`Redis DEL failed for key: ${key}`, {
      operation: "REDIS_DEL",
      metadata: { key },
    });
    return false;
  }
}

