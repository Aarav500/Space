/**
 * Satellite routes — Hardened
 *
 * Route: /api/satellites
 * All routes require JWT auth.
 */

const { Router } = require("express");
const { query } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { fetchGPByNoradId } = require("../services/celestrak");
const { computeCompositeRisk, generate72hForecast, classifyRisk } = require("../services/risk-engine");
const { getCurrentSpaceWeather } = require("../services/noaa");
const { validateNoradId, validatePositiveInt, sanitizeString } = require("../middleware/validate");

const router = Router();
router.use(authMiddleware);

/* ─── GET /api/satellites ──────────────────────────────────────────── */
router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, norad_id, name, orbit_type, current_risk_score, risk_level, last_updated, created_at
       FROM satellites WHERE org_id = $1 ORDER BY risk_level DESC, name ASC`,
      [req.orgId]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

/* ─── POST /api/satellites ─────────────────────────────────────────── */
router.post("/", async (req, res, next) => {
  try {
    const { noradId, name } = req.body;

    // Validate noradId
    const { value: validNorad, error: noradErr } = validateNoradId(noradId);
    if (noradErr) {
      return res.status(400).json({ error: noradErr });
    }

    // Sanitize name if provided
    let satName = null;
    if (name !== undefined && name !== null) {
      const { value: cleanName, error: nameErr } = sanitizeString(name, 255);
      if (nameErr) {
        return res.status(400).json({ error: `name ${nameErr}` });
      }
      satName = cleanName;
    }

    // Check if already tracked by this org
    const existing = await query(
      "SELECT id FROM satellites WHERE norad_id = $1",
      [validNorad]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Satellite already tracked" });
    }

    // Fetch TLE from CelesTrak
    const gp = await fetchGPByNoradId(validNorad);
    const finalName = satName || gp?.name || `SAT-${validNorad}`;
    const orbitType = gp?.orbitType || "LEO";

    const result = await query(
      `INSERT INTO satellites (org_id, norad_id, name, orbit_type, tle_line1, tle_line2, tle_epoch)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, norad_id, name, orbit_type, current_risk_score, risk_level, created_at`,
      [req.orgId, validNorad, finalName, orbitType, gp?.tleLine1 || null, gp?.tleLine2 || null, gp?.epoch || null]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

/* ─── DELETE /api/satellites/:id ────────────────────────────────────── */
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query(
      "DELETE FROM satellites WHERE id = $1 AND org_id = $2 RETURNING id",
      [req.params.id, req.orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Satellite not found" });
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

/* ─── GET /api/satellites/:id/risk ──────────────────────────────────── */
router.get("/:id/risk", async (req, res, next) => {
  try {
    const satResult = await query(
      "SELECT id, norad_id, current_risk_score, risk_level FROM satellites WHERE id = $1 AND org_id = $2",
      [req.params.id, req.orgId]
    );
    if (satResult.rows.length === 0) {
      return res.status(404).json({ error: "Satellite not found" });
    }
    const sat = satResult.rows[0];

    // Get active conjunctions
    const conjResult = await query(
      `SELECT id, secondary_norad_id, secondary_name, tca, miss_distance_km,
              relative_velocity_kms, collision_probability, source, status
       FROM conjunction_events
       WHERE primary_sat_id = $1 AND status = 'active' AND tca > now()
       ORDER BY collision_probability DESC LIMIT 10`,
      [sat.id]
    );

    // Generate 72h forecast
    const forecast = generate72hForecast(
      parseFloat(sat.current_risk_score) || 1e-8,
      2
    );

    res.json({
      riskScore: sat.current_risk_score,
      riskLevel: sat.risk_level,
      forecast72h: forecast,
      conjunctions: conjResult.rows,
    });
  } catch (err) { next(err); }
});

/* ─── GET /api/satellites/:id/conjunctions ─────────────────────────── */
router.get("/:id/conjunctions", async (req, res, next) => {
  try {
    const { value: days, error: daysErr } = validatePositiveInt(req.query.days || "7", 1, 365, "days");
    if (daysErr) {
      return res.status(400).json({ error: daysErr });
    }

    const result = await query(
      `SELECT id, secondary_norad_id, secondary_name, tca, miss_distance_km,
              relative_velocity_kms, collision_probability, source, status, created_at
       FROM conjunction_events
       WHERE primary_sat_id = $1 AND tca > now() - ($2 || ' days')::interval
       ORDER BY tca ASC`,
      [req.params.id, String(days)]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

/* ─── GET /api/satellites/:id/risk-history ──────────────────────────── */
router.get("/:id/risk-history", async (req, res, next) => {
  try {
    const { value: hours, error: hoursErr } = validatePositiveInt(req.query.hours || "168", 1, 8760, "hours");
    if (hoursErr) {
      return res.status(400).json({ error: hoursErr });
    }

    const result = await query(
      `SELECT snapshot_time, risk_score, ml_prediction_72h, kp_index, f107_flux,
              active_conjunctions, pricing_rate_cents
       FROM risk_snapshots
       WHERE satellite_id = $1
       ORDER BY snapshot_time DESC LIMIT $2`,
      [req.params.id, hours]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
