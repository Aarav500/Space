/**
 * Experiments & Feature Flags Middleware
 *
 * Provides req.flag(key) and req.experiment(key) helpers.
 * Uses an in-memory flag store by default (suitable for single-instance).
 * Replace with DB-backed store for production multi-instance deployments.
 *
 * See: experiments/schema.md for the full data model.
 */

const crypto = require("crypto");

/* ────────────────────────── In-Memory Flag Store ─────────────────── */

const flags = new Map();
const experiments = new Map();
const assignments = new Map(); // key: `${experimentKey}:${userId}` → variant

/**
 * Register or update a feature flag.
 */
function setFlag(key, { enabled = false, rolloutPct = 0, segments = [] } = {}) {
  flags.set(key, { key, enabled, rolloutPct, segments, updatedAt: new Date() });
}

/**
 * Register or update an experiment.
 */
function setExperiment(
  key,
  { variants = [{ name: "control", weight: 50 }, { name: "treatment", weight: 50 }], status = "draft" } = {}
) {
  experiments.set(key, { key, variants, status, updatedAt: new Date() });
}

/**
 * Deterministic hash bucketing: same user+key always gets same 0-99 bucket.
 */
function bucket(key, userId) {
  const hash = crypto.createHash("sha256").update(`${key}:${userId}`).digest();
  return hash.readUInt32BE(0) % 100;
}

/**
 * Evaluate a feature flag for a given user.
 */
function evaluateFlag(key, userId, userMeta = {}) {
  const flag = flags.get(key);
  if (!flag) return false;

  // 1. Master kill switch
  if (!flag.enabled) return false;

  // 2. Segment matching
  if (flag.segments && flag.segments.length > 0) {
    for (const seg of flag.segments) {
      if (seg.type === "user_id" && seg.values.includes(userId)) return true;
      if (seg.type === "role" && seg.values.includes(userMeta.role)) return true;
    }
  }

  // 3. Rollout percentage
  if (flag.rolloutPct > 0) {
    return bucket(key, userId) < flag.rolloutPct;
  }

  return false;
}

/**
 * Evaluate an experiment and return the assigned variant name.
 * Returns "control" if experiment is not running or not found.
 */
function evaluateExperiment(key, userId) {
  const exp = experiments.get(key);
  if (!exp || exp.status !== "running") return "control";

  // Check for existing assignment
  const assignmentKey = `${key}:${userId}`;
  if (assignments.has(assignmentKey)) {
    return assignments.get(assignmentKey);
  }

  // Bucket the user
  const b = bucket(key, userId);
  let cumulative = 0;
  let assignedVariant = "control";

  for (const variant of exp.variants) {
    cumulative += variant.weight;
    if (b < cumulative) {
      assignedVariant = variant.name;
      break;
    }
  }

  // Persist assignment
  assignments.set(assignmentKey, assignedVariant);
  return assignedVariant;
}

/* ────────────────────────── Express Middleware ────────────────────── */

/**
 * Attaches `req.flag(key)` and `req.experiment(key)` to every request.
 */
function experimentsMiddleware(req, _res, next) {
  const userId = req.user?.id || req.headers["x-user-id"] || "anonymous";
  const userMeta = { role: req.user?.role };

  req.flag = (key) => evaluateFlag(key, userId, userMeta);
  req.experiment = (key) => evaluateExperiment(key, userId);

  next();
}

/* ────────────────────────── Flags API Router ─────────────────────── */

const express = require("express");
const router = express.Router();

// GET /api/flags — return all flags evaluated for the current user
router.get("/", (req, res) => {
  const userId = req.user?.id || req.headers["x-user-id"] || "anonymous";
  const userMeta = { role: req.user?.role };
  const result = {};

  for (const [key] of flags) {
    result[key] = evaluateFlag(key, userId, userMeta);
  }

  res.json({ flags: result });
});

// GET /api/flags/:key — evaluate a single flag
router.get("/:key", (req, res) => {
  const userId = req.user?.id || req.headers["x-user-id"] || "anonymous";
  const userMeta = { role: req.user?.role };
  const value = evaluateFlag(req.params.key, userId, userMeta);
  res.json({ key: req.params.key, enabled: value });
});

// GET /api/flags/experiment/:key — get experiment variant for current user
router.get("/experiment/:key", (req, res) => {
  const userId = req.user?.id || req.headers["x-user-id"] || "anonymous";
  const variant = evaluateExperiment(req.params.key, userId);
  res.json({ key: req.params.key, variant });
});

module.exports = {
  experimentsMiddleware,
  flagsRouter: router,
  setFlag,
  setExperiment,
  evaluateFlag,
  evaluateExperiment,
  // Exposed for testing
  _flags: flags,
  _experiments: experiments,
  _assignments: assignments,
};
