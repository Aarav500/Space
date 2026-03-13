/**
 * Rate Limiter Unit Tests
 */

const { rateLimiter } = require("../src/middleware/rate-limiter");

/**
 * Helper: create mock req/res/next
 */
function createMocks(ip = "127.0.0.1") {
  const req = {
    ip,
    connection: { remoteAddress: ip },
  };
  const headers = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    set: jest.fn((key, val) => { headers[key] = val; }),
    _headers: headers,
  };
  const next = jest.fn();
  return { req, res, next, headers };
}

describe("rateLimiter()", () => {
  /* ─── Allows requests within limit ───────────────────────────────── */

  it("allows requests within the limit", () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 5 });
    const { req, res, next } = createMocks();

    for (let i = 0; i < 5; i++) {
      next.mockClear();
      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  /* ─── Blocks requests over limit ─────────────────────────────────── */

  it("blocks requests over the limit with 429", () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 3 });
    const { req, res, next } = createMocks();

    // Use up the limit
    for (let i = 0; i < 3; i++) {
      limiter(req, res, next);
    }

    // 4th request should be blocked
    next.mockClear();
    limiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  /* ─── Per-IP isolation ───────────────────────────────────────────── */

  it("tracks limits per IP", () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 2 });
    const m1 = createMocks("1.1.1.1");
    const m2 = createMocks("2.2.2.2");

    // Exhaust IP 1
    limiter(m1.req, m1.res, m1.next);
    limiter(m1.req, m1.res, m1.next);
    m1.next.mockClear();
    limiter(m1.req, m1.res, m1.next);
    expect(m1.next).not.toHaveBeenCalled();

    // IP 2 should still be allowed
    limiter(m2.req, m2.res, m2.next);
    expect(m2.next).toHaveBeenCalled();
  });

  /* ─── Sets rate limit headers ────────────────────────────────────── */

  it("sets X-RateLimit headers", () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 10 });
    const { req, res, next } = createMocks();

    limiter(req, res, next);
    expect(res.set).toHaveBeenCalledWith("X-RateLimit-Limit", "10");
    expect(res.set).toHaveBeenCalledWith("X-RateLimit-Remaining", "9");
  });

  /* ─── Sets Retry-After on block ──────────────────────────────────── */

  it("sets Retry-After header when rate limited", () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 1 });
    const { req, res, next } = createMocks();

    limiter(req, res, next); // Use up limit
    limiter(req, res, next); // Should be blocked

    expect(res.set).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  /* ─── Custom key function ────────────────────────────────────────── */

  it("supports custom key function", () => {
    const limiter = rateLimiter({
      windowMs: 60000,
      max: 1,
      keyFn: (req) => req.orgId,
    });

    const m1 = createMocks();
    m1.req.orgId = "org-1";
    const m2 = createMocks();
    m2.req.orgId = "org-2";

    limiter(m1.req, m1.res, m1.next);
    expect(m1.next).toHaveBeenCalled();

    // Same org, different request
    m1.next.mockClear();
    limiter(m1.req, m1.res, m1.next);
    expect(m1.next).not.toHaveBeenCalled(); // blocked

    // Different org should be allowed
    limiter(m2.req, m2.res, m2.next);
    expect(m2.next).toHaveBeenCalled();
  });

  /* ─── Custom error message ───────────────────────────────────────── */

  it("uses custom error message", () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 1, message: "slow down" });
    const { req, res, next } = createMocks();

    limiter(req, res, next); // Use up
    limiter(req, res, next); // Blocked

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "slow down" })
    );
  });
});
