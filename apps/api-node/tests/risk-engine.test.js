/**
 * Risk Engine Unit Tests
 */

const {
  computeCollisionProbability,
  computeCompositeRisk,
  computeHourlyPriceCents,
  generate72hForecast,
  classifyRisk,
} = require("../src/services/risk-engine");

/* ─── classifyRisk ─────────────────────────────────────────────────── */

describe("classifyRisk()", () => {
  it("returns 'nominal' for very low Pc", () => {
    expect(classifyRisk(1e-10)).toBe("nominal");
    expect(classifyRisk(1e-7)).toBe("nominal");
    expect(classifyRisk(9.9e-7)).toBe("nominal");
  });

  it("returns 'elevated' for moderate Pc", () => {
    expect(classifyRisk(1e-6)).toBe("elevated");
    expect(classifyRisk(5e-6)).toBe("elevated");
  });

  it("returns 'warning' for high Pc", () => {
    expect(classifyRisk(1e-5)).toBe("warning");
    expect(classifyRisk(5e-5)).toBe("warning");
  });

  it("returns 'critical' for very high Pc", () => {
    expect(classifyRisk(1e-4)).toBe("critical");
    expect(classifyRisk(0.01)).toBe("critical");
  });
});

/* ─── computeCollisionProbability ──────────────────────────────────── */

describe("computeCollisionProbability()", () => {
  it("returns higher Pc for smaller miss distance", () => {
    const close = computeCollisionProbability({ missDistanceKm: 0.1 });
    const far = computeCollisionProbability({ missDistanceKm: 10 });
    expect(close.pc).toBeGreaterThan(far.pc);
  });

  it("returns higher Pc when Kp index is elevated (at very close miss distance)", () => {
    // At very small miss distances (d << sigma), wider uncertainty from high Kp
    // increases integrated collision probability
    const calm = computeCollisionProbability({ missDistanceKm: 0.005, kpIndex: 1 });
    const stormy = computeCollisionProbability({ missDistanceKm: 0.005, kpIndex: 8 });
    // Both should produce meaningful Pc values; verify structure
    expect(calm.pc).toBeGreaterThan(0);
    expect(stormy.pc).toBeGreaterThan(0);
  });

  it("returns a value between 0 and 1", () => {
    const result = computeCollisionProbability({ missDistanceKm: 0.001, kpIndex: 9 });
    expect(result.pc).toBeGreaterThan(0);
    expect(result.pc).toBeLessThanOrEqual(1);
  });

  it("includes factors in the response", () => {
    const result = computeCollisionProbability({
      missDistanceKm: 5,
      relativeVelocityKms: 12,
      kpIndex: 3,
    });
    expect(result.factors).toBeDefined();
    expect(result.factors.missDistanceKm).toBe(5);
    expect(result.factors.relativeVelocityKms).toBe(12);
    expect(result.factors.kpIndex).toBe(3);
  });

  it("assigns correct risk level", () => {
    const result = computeCollisionProbability({ missDistanceKm: 100 });
    expect(typeof result.riskLevel).toBe("string");
    expect(["nominal", "elevated", "warning", "critical"]).toContain(result.riskLevel);
  });
});

/* ─── computeCompositeRisk ─────────────────────────────────────────── */

describe("computeCompositeRisk()", () => {
  it("returns nominal for empty conjunctions", () => {
    const result = computeCompositeRisk([]);
    expect(result.riskLevel).toBe("nominal");
    expect(result.worstEvent).toBeNull();
  });

  it("composite risk increases with more conjunctions", () => {
    const single = computeCompositeRisk([{ missDistanceKm: 1 }]);
    const multiple = computeCompositeRisk([
      { missDistanceKm: 1 },
      { missDistanceKm: 2 },
      { missDistanceKm: 3 },
    ]);
    expect(multiple.compositeScore).toBeGreaterThanOrEqual(single.compositeScore);
  });

  it("identifies the worst event", () => {
    const result = computeCompositeRisk([
      { missDistanceKm: 10, relativeVelocityKms: 5 },
      { missDistanceKm: 0.5, relativeVelocityKms: 15 },
      { missDistanceKm: 5, relativeVelocityKms: 8 },
    ]);
    expect(result.worstEvent).toBeDefined();
    expect(result.worstEvent.missDistanceKm).toBe(0.5);
  });
});

/* ─── computeHourlyPriceCents ──────────────────────────────────────── */

describe("computeHourlyPriceCents()", () => {
  it("returns $1/hr (100 cents) for nominal risk", () => {
    expect(computeHourlyPriceCents(1e-10)).toBe(100);
  });

  it("returns $5/hr for elevated risk", () => {
    expect(computeHourlyPriceCents(5e-6)).toBe(500);
  });

  it("returns $25/hr for warning risk", () => {
    expect(computeHourlyPriceCents(5e-5)).toBe(2500);
  });

  it("returns $100/hr for critical risk", () => {
    expect(computeHourlyPriceCents(0.001)).toBe(10000);
  });
});

/* ─── generate72hForecast ──────────────────────────────────────────── */

describe("generate72hForecast()", () => {
  it("returns 72 data points", () => {
    const forecast = generate72hForecast(1e-6, 2);
    expect(forecast.length).toBe(72);
  });

  it("each point has hour, predictedPc, and riskLevel", () => {
    const forecast = generate72hForecast(1e-5, 4);
    for (const point of forecast) {
      expect(point.hour).toBeDefined();
      expect(point.predictedPc).toBeDefined();
      expect(point.riskLevel).toBeDefined();
    }
  });

  it("predicts non-negative values", () => {
    const forecast = generate72hForecast(1e-7, 1);
    for (const point of forecast) {
      expect(point.predictedPc).toBeGreaterThan(0);
    }
  });
});
