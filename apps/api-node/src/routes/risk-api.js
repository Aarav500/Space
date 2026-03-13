/**
 * Public Risk Score API
 *
 * Route: /api/v1/risk-score/:noradId
 * Auth: API Key header or JWT
 */

const { Router } = require("express");
const { query } = require("../db");
const { apiKeyMiddleware } = require("../middleware/auth");
const { computeCollisionProbability, classifyRisk } = require("../services/risk-engine");

const router = Router();

/* ─── GET /api/v1/risk-score/:noradId ──────────────────────────────── */
router.get("/:noradId", apiKeyMiddleware, async (req, res, next) => {
  try {
    const noradId = parseInt(req.params.noradId);
    if (isNaN(noradId)) {
      return res.status(400).json({ error: "noradId must be a number" });
    }

    const result = await query(
      `SELECT s.norad_id, s.name, s.current_risk_score, s.risk_level, s.orbit_type, s.last_updated
       FROM satellites s WHERE s.norad_id = $1`,
      [noradId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Satellite not found",
        noradId,
        hint: "This satellite may not be tracked. Add it via POST /api/satellites first.",
      });
    }

    const sat = result.rows[0];

    res.json({
      noradId: sat.norad_id,
      name: sat.name,
      riskScore: parseFloat(sat.current_risk_score),
      riskLevel: sat.risk_level,
      orbitType: sat.orbit_type,
      lastUpdated: sat.last_updated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

module.exports = router;
