import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { logger } from "@/lib/observability/logger";

let poolInstance: Pool | null = null;

/**
 * Get or initialize the Supabase Transaction Pooler connection pool.
 * Configured for high-throughput concurrent transactions with PgBouncer / Supabase pooler.
 */
export function getPool(): Pool | null {
  if (poolInstance) {
    return poolInstance;
  }

  const connectionString = process.env.SUPABASE_TRANSACTION_POOLER_URL;
  if (!connectionString) {
    logger.warn("SUPABASE_TRANSACTION_POOLER_URL is not set. Transaction pooler unavailable.", {
      operation: "POOLER_INIT",
    });
    return null;
  }

  try {
    poolInstance = new Pool({
      connectionString,
      max: 20, // Max concurrent connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    poolInstance.on("error", (err) => {
      logger.error("Unexpected error on idle Supabase pooler client", {
        operation: "POOLER_IDLE_ERROR",
      }, err);
    });

    return poolInstance;
  } catch (err) {
    logger.error("Failed to initialize Supabase Transaction Pooler", {
      operation: "POOLER_INIT",
    }, err);
    return null;
  }
}

/**
 * Executes a parameterised query on the Supabase Transaction Pooler
 */
export async function queryPool<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T> | null> {
  const pool = getPool();
  if (!pool) return null;

  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.info("Pooler query executed", {
      operation: "POOLER_QUERY",
      durationMs: duration,
      metadata: { rowCount: res.rowCount },
    });
    return res;
  } catch (err) {
    logger.error("Pooler query failed", {
      operation: "POOLER_QUERY",
      durationMs: Date.now() - start,
    }, err);
    throw err;
  }
}

/**
 * Helper to run operations within a dedicated pooled client transaction
 */
export async function withTransaction<T>(
  callback: (client: import("pg").PoolClient) => Promise<T>
): Promise<T | null> {
  const pool = getPool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("Transaction rolled back due to error", {
      operation: "POOLER_TRANSACTION",
    }, err);
    throw err;
  } finally {
    client.release();
  }
}

