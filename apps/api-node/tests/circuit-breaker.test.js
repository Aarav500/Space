/**
 * Circuit Breaker Unit Tests
 */

const { CircuitBreaker, STATE } = require("../src/services/circuit-breaker");

describe("CircuitBreaker", () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker("test", {
      failureThreshold: 3,
      resetTimeoutMs: 100, // Short for testing
      requestTimeoutMs: 50,
    });
  });

  /* ─── Initial state ──────────────────────────────────────────────── */

  it("starts in CLOSED state", () => {
    expect(breaker.state).toBe(STATE.CLOSED);
    expect(breaker.failureCount).toBe(0);
  });

  /* ─── Closed → success ───────────────────────────────────────────── */

  it("returns result on success", async () => {
    const result = await breaker.exec(async () => "ok");
    expect(result).toBe("ok");
    expect(breaker.state).toBe(STATE.CLOSED);
  });

  /* ─── Closed → Open (failure threshold) ──────────────────────────── */

  it("opens after reaching failure threshold", async () => {
    for (let i = 0; i < 3; i++) {
      await breaker.exec(async () => { throw new Error("fail"); }, "fallback");
    }
    expect(breaker.state).toBe(STATE.OPEN);
    expect(breaker.failureCount).toBe(3);
  });

  /* ─── Open → returns fallback ────────────────────────────────────── */

  it("returns fallback immediately when open", async () => {
    // Force open
    breaker.state = STATE.OPEN;
    breaker.lastFailureTime = Date.now();

    const result = await breaker.exec(
      async () => { throw new Error("should not execute"); },
      "cached-data"
    );
    expect(result).toBe("cached-data");
  });

  /* ─── Open → Half-Open (after reset timeout) ────────────────────── */

  it("transitions to HALF_OPEN after reset timeout", async () => {
    breaker.state = STATE.OPEN;
    breaker.lastFailureTime = Date.now() - 200; // Exceed 100ms timeout

    const result = await breaker.exec(async () => "recovered");
    expect(result).toBe("recovered");
    expect(breaker.state).toBe(STATE.CLOSED); // success closes it
  });

  /* ─── Half-Open → Open (on failure) ──────────────────────────────── */

  it("reopens from HALF_OPEN on failure", async () => {
    breaker.state = STATE.HALF_OPEN;

    await breaker.exec(async () => { throw new Error("still broken"); }, "fb");
    expect(breaker.state).toBe(STATE.OPEN);
  });

  /* ─── Timeout handling ───────────────────────────────────────────── */

  it("returns fallback on timeout", async () => {
    const result = await breaker.exec(
      () => new Promise((resolve) => setTimeout(() => resolve("too late"), 200)),
      "timeout-fallback"
    );
    expect(result).toBe("timeout-fallback");
    expect(breaker.failureCount).toBeGreaterThan(0);
  });

  /* ─── Status ─────────────────────────────────────────────────────── */

  it("returns status object", () => {
    const status = breaker.status();
    expect(status.name).toBe("test");
    expect(status.state).toBe(STATE.CLOSED);
    expect(status.failureCount).toBe(0);
    expect(status.lastError).toBeNull();
  });

  /* ─── Reset ──────────────────────────────────────────────────────── */

  it("reset restores CLOSED state", () => {
    breaker.state = STATE.OPEN;
    breaker.failureCount = 5;
    breaker.lastError = "some error";

    breaker.reset();
    expect(breaker.state).toBe(STATE.CLOSED);
    expect(breaker.failureCount).toBe(0);
    expect(breaker.lastError).toBeNull();
  });

  /* ─── Partial failures don't open ────────────────────────────────── */

  it("stays closed when failures are below threshold", async () => {
    await breaker.exec(async () => { throw new Error("fail 1"); }, null);
    await breaker.exec(async () => { throw new Error("fail 2"); }, null);
    expect(breaker.state).toBe(STATE.CLOSED);
    expect(breaker.failureCount).toBe(2);
  });

  /* ─── Success resets failure count ───────────────────────────────── */

  it("resets failure count on success", async () => {
    await breaker.exec(async () => { throw new Error("fail"); }, null);
    await breaker.exec(async () => { throw new Error("fail"); }, null);
    expect(breaker.failureCount).toBe(2);

    await breaker.exec(async () => "success");
    expect(breaker.failureCount).toBe(0);
    expect(breaker.state).toBe(STATE.CLOSED);
  });
});
