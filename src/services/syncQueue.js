/**
 * Background Sync Queue
 * Queues mutations when offline, replays when back online.
 * Uses localStorage as simple persistence (IndexedDB for production).
 */

const QUEUE_KEY = "rtr-sync-queue";

export function getSyncQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSyncQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueMutation(mutation) {
  const queue = getSyncQueue();
  queue.push({
    id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...mutation,
    queuedAt: new Date().toISOString(),
    retries: 0,
  });
  saveSyncQueue(queue);

  // Request background sync if available
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.sync.register("rtr-mutation-sync").catch(() => {});
    });
  }
}

export async function processSyncQueue(executors) {
  const queue = getSyncQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  const remaining = [];

  for (const mutation of queue) {
    const executor = executors[mutation.type];
    if (!executor) {
      remaining.push(mutation);
      continue;
    }

    try {
      await executor(mutation.payload);
      processed++;
    } catch (err) {
      mutation.retries++;
      mutation.lastError = err.message;
      if (mutation.retries < 3) {
        remaining.push(mutation);
      }
      failed++;
    }
  }

  saveSyncQueue(remaining);
  return { processed, failed, remaining: remaining.length };
}

export function clearSyncQueue() {
  saveSyncQueue([]);
}

export function getSyncQueueSize() {
  return getSyncQueue().length;
}
