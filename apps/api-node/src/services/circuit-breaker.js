/**
 * Circuit Breaker — Lightweight Implementation
 *
 * Protects external API calls (CelesTrak, NOAA, SpaceTrack) from cascading
 * failures. Zero external dependencies.
 *
 * States:
 *   CLOSED    → Normal operation. Tracks consecutive failures.
 *   OPEN      → Rejects calls immediately. Returns fallback/cached data.
 *   HALF_OPEN → Allows one probe request. Success → CLOSED, Failure → OPEN.
 */

const STATE = { CLOSED: "CLOSED", OPEN: "OPEN", HALF_OPEN: "HALF_OPEN" };

class CircuitBreaker {
  /**
   * @param {string} name — Human-readable name (e.g. "celestrak", "noaa")
   * @param {object} [opts]
   * @param {number} [opts.failureThreshold=5]  — Failures before opening
   * @param {number} [opts.resetTimeoutMs=30000] — Time in OPEN before probing
   * @param {number} [opts.requestTimeoutMs=10000] — Per-request timeout
   */
  constructor(name, opts = {}) {
    this.name = name;
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 30_000;
    this.requestTimeoutMs = opts.requestTimeoutMs ?? 10_000;

    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.lastError = null;
  }

  /**
   * Execute a function through the circuit breaker.
   * @param {() => Promise<*>} fn — The async function to protect
   * @param {*} [fallback=null] — Value to return if circuit is OPEN
   * @returns {Promise<*>}
   */
  async exec(fn, fallback = null) {
    if (this.state === STATE.OPEN) {
      // Check if reset timeout has elapsed → move to HALF_OPEN
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = STATE.HALF_OPEN;
      } else {
        return fallback;
      }
    }

    try {
      // Race the function against the request timeout
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`CircuitBreaker[${this.name}]: request timeout (${this.requestTimeoutMs}ms)`)),
            this.requestTimeoutMs)
        ),
      ]);

      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure(err);
      return fallback;
    }
  }

  /** @private */
  _onSuccess() {
    this.failureCount = 0;
    this.state = STATE.CLOSED;
    this.lastError = null;
  }

  /** @private */
  _onFailure(err) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.lastError = err.message;

    if (this.failureCount >= this.failureThreshold || this.state === STATE.HALF_OPEN) {
      this.state = STATE.OPEN;
      console.error(`[CircuitBreaker:${this.name}] OPEN — ${this.failureCount} failures. Last: ${err.message}`);
    }
  }

  /** Get current state info for health endpoint. */
  status() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastError: this.lastError,
    };
  }

  /** Force reset (e.g. from admin endpoint). */
  reset() {
    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.lastError = null;
  }
}

/* ─── Pre-configured breakers for external APIs ──────────────────────── */

const celestrakBreaker = new CircuitBreaker("celestrak", {
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
  requestTimeoutMs: 10_000,
});

const noaaBreaker = new CircuitBreaker("noaa", {
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
  requestTimeoutMs: 10_000,
});

module.exports = {
  CircuitBreaker,
  STATE,
  celestrakBreaker,
  noaaBreaker,
};
