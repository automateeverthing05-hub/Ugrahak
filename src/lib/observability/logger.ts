/**
 * Ugrahak Production-Safe Observability & Structured Logger
 *
 * Enforces:
 * 1. Strict redaction of secrets, tokens, and sensitive credentials
 * 2. High-performance JSON structured output with correlation IDs
 * 3. Execution timing for performance monitoring and latency alerts
 */

import * as Sentry from "@sentry/nextjs";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogContext {
  operation: string;
  merchantId?: string | null;
  customerId?: string | null;
  offerId?: string | null;
  correlationId?: string;
  durationMs?: number;
  status?: string;
  errorCategory?: string;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "privatekey",
  "private_key",
  "firebase_private_key",
  "secret",
  "token",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
]);

/**
 * Recursively sanitizes data objects by redacting sensitive keys
 */
export function sanitizeLogData(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[Max Depth Reached]";
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Redact Bearer tokens or long private key strings
    if (obj.startsWith("Bearer ") || obj.includes("BEGIN PRIVATE KEY")) {
      return "[REDACTED]";
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeLogData(item, depth + 1));
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase().replace(/[-_]/g, "");
      if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("secret") || lowerKey.includes("password")) {
        cleaned[key] = "[REDACTED]";
      } else {
        cleaned[key] = sanitizeLogData(value, depth + 1);
      }
    }
    return cleaned;
  }

  return obj;
}

export class Logger {
  private serviceName = "ugrahak-saas";

  private log(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
    const timestamp = new Date().toISOString();
    const correlationId =
      context?.correlationId ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const logEntry: Record<string, unknown> = {
      timestamp,
      service: this.serviceName,
      level,
      message,
      correlationId,
      operation: context?.operation || "GENERAL",
    };

    if (context?.merchantId) logEntry.merchantId = context.merchantId;
    if (context?.customerId) logEntry.customerId = context.customerId;
    if (context?.offerId) logEntry.offerId = context.offerId;
    if (context?.durationMs !== undefined) logEntry.durationMs = context.durationMs;
    if (context?.status) logEntry.status = context.status;
    if (context?.errorCategory) logEntry.errorCategory = context.errorCategory;

    if (context?.metadata) {
      logEntry.metadata = sanitizeLogData(context.metadata);
    }

    if (error) {
      logEntry.error = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : "UnknownError",
        stack: process.env.NODE_ENV !== "production" && error instanceof Error ? error.stack : undefined,
      };
    }

    const jsonString = JSON.stringify(logEntry);

    if (level === "ERROR") {
      console.error(jsonString);
      try {
        if (error) {
          Sentry.captureException(error, { extra: logEntry });
        } else {
          Sentry.captureMessage(message, "error");
        }
      } catch {
        // Ignore Sentry dispatch failure
      }
    } else if (level === "WARN") {
      console.warn(jsonString);
    } else {
      console.log(jsonString);
    }
  }

  info(message: string, context?: LogContext) {
    this.log("INFO", message, context);
  }

  warn(message: string, context?: LogContext, error?: unknown) {
    this.log("WARN", message, context, error);
  }

  error(message: string, context?: LogContext, error?: unknown) {
    this.log("ERROR", message, context, error);
  }

  /**
   * Helper to time asynchronous operations and log execution metrics
   */
  async timed<T>(
    operationName: string,
    fn: () => Promise<T>,
    context?: Omit<LogContext, "operation" | "durationMs">
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - start;
      this.info(`${operationName} completed successfully`, {
        ...context,
        operation: operationName,
        durationMs,
        status: "SUCCESS",
      });
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      this.error(`${operationName} failed`, {
        ...context,
        operation: operationName,
        durationMs,
        status: "FAILED",
        errorCategory: err instanceof Error ? err.name : "ExecutionError",
      }, err);
      throw err;
    }
  }
}

export const logger = new Logger();

