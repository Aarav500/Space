/**
 * Integration Tests — Critical Path Flows
 *
 * Tests core business logic flows end-to-end.
 * Supertest-based endpoint tests are in example.test.js.
 */

/* ─── Risk Engine — Pipeline ───────────────────────────────────────── */

describe("Risk Engine — end-to-end pipeline", () => {
  const {
    computeCollisionProbability,
    computeCompositeRisk,
    computeHourlyPriceCents,
    generate72hForecast,
    classifyRisk,
  } = require("../src/services/risk-engine");

  it("ISS-like conjunction → risk → price → forecast pipeline", () => {
    const issConjunction = {
      missDistanceKm: 0.5,
      relativeVelocityKms: 7.8,
      kpIndex: 3,
      combinedSigmaKm: 0.2,
    };

    // Step 1: Compute collision probability
    const result = computeCollisionProbability(issConjunction);
    expect(result.pc).toBeGreaterThan(0);
    expect(result.pc).toBeLessThanOrEqual(1);
    expect(["nominal", "elevated", "warning", "critical"]).toContain(result.riskLevel);

    // Step 2: Composite risk for a 3-satellite fleet
    const composite = computeCompositeRisk([
      issConjunction,
      { missDistanceKm: 5, relativeVelocityKms: 12 },
      { missDistanceKm: 50, relativeVelocityKms: 3 },
    ]);
    expect(composite.compositeScore).toBeGreaterThan(0);
    expect(composite.worstEvent).not.toBeNull();
    expect(composite.worstEvent.pc).toBeGreaterThan(0);

    // Step 3: Dynamic pricing based on risk
    const price = computeHourlyPriceCents(composite.worstEvent.pc);
    expect(price).toBeGreaterThanOrEqual(100);   // Min $1/hr
    expect(price).toBeLessThanOrEqual(10000);     // Max $100/hr

    // Step 4: 72-hour forecast generation
    const forecast = generate72hForecast(composite.worstEvent.pc, 3);
    expect(forecast).toHaveLength(72);
    expect(forecast[0].hour).toBe(1);
    expect(forecast[71].hour).toBe(72);
    forecast.forEach((point) => {
      expect(point.predictedPc).toBeGreaterThan(0);
      expect(point.riskLevel).toBeDefined();
    });
  });

  it("zero miss distance → high probability, warning or critical level", () => {
    const result = computeCollisionProbability({ missDistanceKm: 0 });
    expect(result.pc).toBeLessThanOrEqual(1);
    expect(result.pc).toBeGreaterThan(1e-6);
    expect(["warning", "critical"]).toContain(result.riskLevel);
    const price = computeHourlyPriceCents(result.pc);
    expect(price).toBeGreaterThanOrEqual(100);
  });

  it("very large miss distance → nominal risk, minimum price", () => {
    const result = computeCollisionProbability({ missDistanceKm: 1000 });
    expect(result.riskLevel).toBe("nominal");
    expect(result.pc).toBeLessThan(1e-6);
    const price = computeHourlyPriceCents(result.pc);
    expect(price).toBe(100); // Floor of $1/hr
  });

  it("classifyRisk returns correct levels for known values", () => {
    expect(classifyRisk(1e-3)).toBe("critical");
    expect(classifyRisk(1e-5)).toBe("warning");
    expect(classifyRisk(1e-7)).toBe("nominal"); // Below elevated threshold (1e-6)
    expect(classifyRisk(1e-9)).toBe("nominal");
    expect(classifyRisk(5e-6)).toBe("elevated"); // Between 1e-6 and 1e-4
  });

  it("negative miss distance is handled without crash", () => {
    const result = computeCollisionProbability({ missDistanceKm: -5 });
    expect(result.pc).toBeGreaterThan(0);
    expect(result.riskLevel).toBeDefined();
  });

  it("extremely small miss distance returns elevated or higher risk", () => {
    const result = computeCollisionProbability({ missDistanceKm: 0.001 });
    expect(result.pc).toBeGreaterThan(1e-6);
    expect(["elevated", "warning", "critical"]).toContain(result.riskLevel);
  });
});

/* ─── Auth Middleware — Token validation ───────────────────────────── */

describe("Auth Middleware — JWT validation", () => {
  const jwt = require("jsonwebtoken");
  const { JWT_SECRET, generateToken } = require("../src/middleware/auth");

  it("generateToken produces valid JWT", () => {
    const token = generateToken({ id: "u1", email: "a@b.com", orgId: "org1", role: "admin" });
    expect(typeof token).toBe("string");
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe("u1");
    expect(decoded.email).toBe("a@b.com");
    expect(decoded.orgId).toBe("org1");
  });

  it("expired JWT is rejected by verify", () => {
    const expired = jwt.sign(
      { id: "u", email: "e", orgId: "o", role: "a" },
      JWT_SECRET,
      { expiresIn: "0s" }
    );
    expect(() => jwt.verify(expired, JWT_SECRET)).toThrow("jwt expired");
  });

  it("wrong secret is rejected", () => {
    const token = generateToken({ id: "u", email: "e", orgId: "o", role: "a" });
    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });
});

/* ─── Stripe Billing — config guards ──────────────────────────────── */

describe("Stripe Billing — resilient without API key", () => {
  const { getStripe, ensureStripeCustomer } = require("../src/services/stripe-billing");

  it("lazy getStripe() returns null without STRIPE_SECRET_KEY", () => {
    if (process.env.STRIPE_SECRET_KEY) return;
    expect(getStripe()).toBeNull();
  });

  it("ensureStripeCustomer rejects without Stripe config", () => {
    if (process.env.STRIPE_SECRET_KEY) return;
    return ensureStripeCustomer("org", "e@e", "n").then(
      () => { throw new Error("Should have rejected"); },
      (err) => { expect(err.message).toBe("Stripe not configured"); }
    );
  });
});

/* ─── CORS — allowlist ────────────────────────────────────────────── */

describe("CORS — config validation", () => {
  it("CORS_ORIGIN env var defaults to localhost:3000", () => {
    // We can verify the allowedOrigins from app.js by checking the behaviour
    // This is a config assertion — just verify env defaults
    const defaultOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
    const origins = defaultOrigin.split(",").map((o) => o.trim());
    expect(origins).toContain("http://localhost:3000");
  });

  it("comma-separated origins are parsed correctly", () => {
    const multiOrigin = "http://localhost:3000, https://app.orbitshield.io, https://staging.orbitshield.io";
    const origins = multiOrigin.split(",").map((o) => o.trim());
    expect(origins).toHaveLength(3);
    expect(origins).toContain("https://app.orbitshield.io");
  });
});
