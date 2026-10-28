/**
 * File: map-limit.ts
 * Purpose: Runs an async function over a list with at most N running at once, keeping result order and stopping on abort.
 * Exports: mapLimit
 * Used by: agent/nodes/search.ts
 */

/**
 * Like Promise.all over `items.map(fn)`, but starts at most `limit` calls at a time and starts no new
 * call once `signal` aborts (the abort reason is thrown). The first error from `fn` rejects the whole call.
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      signal?.throwIfAborted();
      const index = next++;
      results[index] = await fn(items[index] as T, index);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
