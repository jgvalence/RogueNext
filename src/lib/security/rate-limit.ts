type RateLimitInput = {
  key: string;
  max: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type Store = {
  buckets: Map<string, Bucket>;
  lastSweepAt: number;
};

const STORE_KEY = "__rogue_next_rate_limit_store__";
const MAX_BUCKETS = 10_000;
const SWEEP_INTERVAL_MS = 60_000;

function getStore(): Store {
  const globalRef = globalThis as Record<string, unknown>;
  const existing = globalRef[STORE_KEY] as Store | undefined;
  if (existing) return existing;
  const created: Store = {
    buckets: new Map<string, Bucket>(),
    lastSweepAt: 0,
  };
  globalRef[STORE_KEY] = created;
  return created;
}

function sweepExpired(store: Store, now: number) {
  if (store.lastSweepAt > 0 && now - store.lastSweepAt < SWEEP_INTERVAL_MS) {
    return;
  }
  for (const [key, bucket] of store.buckets.entries()) {
    if (bucket.resetAt <= now) {
      store.buckets.delete(key);
    }
  }
  store.lastSweepAt = now;
}

function consumeToken({ key, max, windowMs }: RateLimitInput): boolean {
  const store = getStore();
  const now = Date.now();
  sweepExpired(store, now);
  const current = store.buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (store.buckets.size >= MAX_BUCKETS) {
      // Last resort pressure relief: drop oldest-looking expired entries first.
      sweepExpired(store, now + SWEEP_INTERVAL_MS);
      if (store.buckets.size >= MAX_BUCKETS) return false;
    }
    store.buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  store.buckets.set(key, current);
  return true;
}

export function assertRateLimit(input: RateLimitInput) {
  const ok = consumeToken(input);
  if (!ok) {
    throw new Error("Too many requests. Please retry shortly.");
  }
}
