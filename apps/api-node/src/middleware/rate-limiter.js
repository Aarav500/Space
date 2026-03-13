/**
 * In-Memory Rate Limiter — Sliding Window
 *
 * Per-IP rate limiting for production routes.
 * No external dependencies (no Redis) — suitable for single-instance EC2.
 *
 * Usage:
 *   app.use(rateLimiter({ windowMs: 60000, max: 100 }));
 *   router.post("/checkout", rateLimiter({ windowMs: 60000, max: 5, keyFn: req => req.orgId }), handler);
 */

/**
 * @typedef {object} RateLimitOpts
 * @property {number} [windowMs=60000]  — Window size in ms
 * @property {number} [max=100]         — Max requests per window
 * @property {(req) => string} [keyFn]  — Custom key extraction (default: IP)
 * @property {string} [message]         — Custom error message
 */

/** In-memory store: key → [timestamp, timestamp, ...] */
const stores = new Map();

/** Periodic cleanup every 5 minutes to prevent memory leaks */
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [storeName, store] of stores) {
      for (const [key, timestamps] of store) {
        const filtered = timestamps.filter((t) => now - t < 120_000);
        if (filtered.length === 0) {
          store.delete(key);
        } else {
          store.set(key, filtered);
        }
      }
      if (store.size === 0) stores.delete(storeName);
    }
  }, CLEANUP_INTERVAL);
  // Allow process to exit without waiting for cleanup
  if (cleanupTimer.unref) cleanupTimer.unref();
}

/**
 * Create a rate limiter middleware.
 * @param {RateLimitOpts} [opts]
 * @returns {import("express").RequestHandler}
 */
function rateLimiter(opts = {}) {
  const windowMs = opts.windowMs || 60_000;
  const max = opts.max || 100;
  const keyFn = opts.keyFn || ((req) => req.ip || req.connection?.remoteAddress || "unknown");
  const message = opts.message || "Too many requests, please try again later";

  // Each limiter config gets its own store
  const storeName = `${windowMs}:${max}:${Math.random().toString(36).slice(2, 8)}`;
  const store = new Map();
  stores.set(storeName, store);

  startCleanup();

  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();

    let timestamps = store.get(key) || [];
    // Drop entries outside the window
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      const retryAfterMs = windowMs - (now - timestamps[0]);
      res.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
      res.set("X-RateLimit-Limit", String(max));
      res.set("X-RateLimit-Remaining", "0");
      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      });
    }

    timestamps.push(now);
    store.set(key, timestamps);

    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(max - timestamps.length));
    next();
  };
}

module.exports = { rateLimiter };
