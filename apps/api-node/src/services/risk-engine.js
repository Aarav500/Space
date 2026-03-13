/**
 * Risk Scoring Engine
 *
 * Computes satellite collision risk scores from conjunction data and space weather.
 *
 * Phase 1: Rule-based scoring using miss distance, relative velocity, and Kp index.
 * Phase 2: ONNX/LSTM ML model integration (architecture ready).
 *
 * Risk levels:
 *   nominal  — Pc < 1e-6
 *   elevated — 1e-6 ≤ Pc < 1e-5
 *   warning  — 1e-5 ≤ Pc < 1e-4
 *   critical — Pc ≥ 1e-4
 */

const RISK_THRESHOLDS = {
  nominal: 1e-6,
  elevated: 1e-5,
  warning: 1e-4,
};

/**
 * Compute collision probability from conjunction parameters.
 *
 * Uses a simplified Akella-Alfriend model adapted for TLE-level accuracy:
 *   Pc ≈ (hardBodyRadius² / (2π · σ_combined²)) · exp(-d² / (2 · σ_combined²))
 *
 * Where:
 *   d = miss distance
 *   σ_combined = combined position uncertainty (~1 km for TLE, ~100m for SP ephemeris)
 *   hardBodyRadius = effective collision radius (10m default for smallsats)
 *
 * @param {object} params
 * @param {number} params.missDistanceKm - Miss distance in km
 * @param {number} params.relativeVelocityKms - Relative velocity in km/s
 * @param {number} [params.kpIndex=2] - Planetary Kp index (0–9)
 * @param {number} [params.positionUncertaintyKm=1.0] - 1-sigma position uncertainty
 * @param {number} [params.hardBodyRadiusKm=0.01] - Effective collision radius (10m)
 * @returns {{ pc: number, riskLevel: string, factors: object }}
 */
function computeCollisionProbability({
  missDistanceKm,
  relativeVelocityKms = 10,
  kpIndex = 2,
  positionUncertaintyKm = 1.0,
  hardBodyRadiusKm = 0.01,
}) {
  // Space weather modifier: higher Kp = more atmospheric drag = more orbital uncertainty
  const kpModifier = 1 + (kpIndex / 9) * 0.5; // 1.0–1.5x uncertainty inflation
  const sigma = positionUncertaintyKm * kpModifier;

  // Simplified collision probability
  const d = missDistanceKm;
  const r = hardBodyRadiusKm;
  const sigmaSquared = sigma * sigma;

  // Pc = (r² / (2 · σ²)) · exp(-d² / (2 · σ²))
  const exponent = -(d * d) / (2 * sigmaSquared);
  const pc = (r * r) / (2 * sigmaSquared) * Math.exp(exponent);

  // Velocity factor: higher relative velocity = less time to maneuver
  const velocityFactor = Math.min(relativeVelocityKms / 15, 2.0);
  const adjustedPc = Math.min(pc * velocityFactor, 1.0);

  // Clamp to reasonable range
  const finalPc = Math.max(adjustedPc, 1e-10);

  return {
    pc: finalPc,
    riskLevel: classifyRisk(finalPc),
    factors: {
      missDistanceKm: d,
      relativeVelocityKms,
      kpIndex,
      positionUncertaintyKm: sigma,
      kpModifier,
      velocityFactor,
    },
  };
}

/**
 * Compute a composite risk score for a satellite given all its active conjunctions.
 *
 * @param {object[]} conjunctions - Array of { missDistanceKm, relativeVelocityKms }
 * @param {object} spaceWeather - { kp, f107 }
 * @returns {{ compositeScore: number, riskLevel: string, worstEvent: object | null }}
 */
function computeCompositeRisk(conjunctions, spaceWeather = { kp: 2, f107: 100 }) {
  if (!conjunctions || conjunctions.length === 0) {
    return { compositeScore: 1e-10, riskLevel: "nominal", worstEvent: null };
  }

  let worstPc = 0;
  let worstEvent = null;

  // Combined Pc: P(at least one collision) = 1 - Π(1 - Pc_i)
  let pNoCollision = 1.0;

  for (const conj of conjunctions) {
    const result = computeCollisionProbability({
      missDistanceKm: conj.missDistanceKm || conj.miss_distance_km,
      relativeVelocityKms: conj.relativeVelocityKms || conj.relative_velocity_kms || 10,
      kpIndex: spaceWeather.kp,
    });

    pNoCollision *= (1 - result.pc);

    if (result.pc > worstPc) {
      worstPc = result.pc;
      worstEvent = { ...conj, pc: result.pc, riskLevel: result.riskLevel };
    }
  }

  const compositeScore = 1 - pNoCollision;

  return {
    compositeScore: Math.max(compositeScore, 1e-10),
    riskLevel: classifyRisk(compositeScore),
    worstEvent,
  };
}

/**
 * Compute dynamic hourly pricing for collision coverage.
 *
 * Base rate: $1/hour for nominal risk
 * Scales up with risk level:
 *   nominal  → $1/hr
 *   elevated → $5/hr
 *   warning  → $25/hr
 *   critical → $100/hr
 *
 * @param {number} riskScore - Collision probability
 * @returns {number} Price in cents per hour
 */
function computeHourlyPriceCents(riskScore) {
  if (riskScore >= RISK_THRESHOLDS.warning) return 10000; // $100/hr
  if (riskScore >= RISK_THRESHOLDS.elevated) return 2500;  // $25/hr
  if (riskScore >= RISK_THRESHOLDS.nominal) return 500;    // $5/hr
  return 100; // $1/hr
}

/**
 * Generate a mock 72-hour risk forecast.
 * Phase 2: Replace with LSTM inference via ONNX runtime.
 *
 * @param {number} currentPc
 * @param {number} kpIndex
 * @returns {object[]} Array of { hour, predictedPc, riskLevel }
 */
function generate72hForecast(currentPc, kpIndex = 2) {
  const forecast = [];
  let pc = currentPc;

  for (let hour = 1; hour <= 72; hour++) {
    // Simulate risk evolution with some randomness and Kp influence
    const drift = (Math.random() - 0.48) * pc * 0.1;
    const kpPressure = kpIndex > 5 ? pc * 0.02 : -pc * 0.005;
    pc = Math.max(pc + drift + kpPressure, 1e-10);
    pc = Math.min(pc, 0.1);

    forecast.push({
      hour,
      predictedPc: pc,
      riskLevel: classifyRisk(pc),
    });
  }

  return forecast;
}

/**
 * Classify risk level from collision probability.
 * @param {number} pc
 * @returns {string}
 */
function classifyRisk(pc) {
  if (pc >= RISK_THRESHOLDS.warning) return "critical";
  if (pc >= RISK_THRESHOLDS.elevated) return "warning";
  if (pc >= RISK_THRESHOLDS.nominal) return "elevated";
  return "nominal";
}

module.exports = {
  computeCollisionProbability,
  computeCompositeRisk,
  computeHourlyPriceCents,
  generate72hForecast,
  classifyRisk,
  RISK_THRESHOLDS,
};
