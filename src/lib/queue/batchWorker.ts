/**
 * High-Scale Queue & Batch Processing Worker
 *
 * Provides resilient batching, pacing, and chunked processing for:
 * 1. High-volume FCM multicast broadcasts
 * 2. Bulk notification log insertions (preventing SQL size limits)
 * 3. Token invalidation batches
 * 4. Scheduled review request execution
 */

export interface BatchProcessingOptions {
  batchSize?: number;
  delayBetweenBatchesMs?: number;
}

export interface BatchResult<T, R> {
  totalProcessed: number;
  successful: R[];
  failed: { item: T; error: string }[];
}

/**
 * Splits an array into chunks of specified maximum size
 */
export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Executes an async task on items in controlled batches with optional throttling delay
 */
export async function processInBatches<T, R>(
  items: T[],
  taskFn: (batch: T[], batchIndex: number) => Promise<R[]>,
  options: BatchProcessingOptions = {}
): Promise<BatchResult<T, R>> {
  const batchSize = options.batchSize || 250;
  const delayMs = options.delayBetweenBatchesMs || 0;
  const chunks = chunkArray(items, batchSize);

  const result: BatchResult<T, R> = {
    totalProcessed: 0,
    successful: [],
    failed: [],
  };

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    try {
      const batchResults = await taskFn(chunk, idx);
      result.successful.push(...batchResults);
      result.totalProcessed += chunk.length;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Batch execution failure";
      chunk.forEach((item) => {
        result.failed.push({ item, error: errMsg });
      });
      result.totalProcessed += chunk.length;
    }

    if (delayMs > 0 && idx < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return result;
}

