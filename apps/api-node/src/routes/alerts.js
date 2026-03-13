/**
 * Alert routes
 *
 * Route: /api/alerts
 */

const { Router } = require("express");
const { query } = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = Router();
router.use(authMiddleware);

/* ─── POST /api/alerts/configure ───────────────────────────────────── */
router.post("/configure", async (req, res, next) => {
  try {
    const { satelliteId, pcThreshold, channels } = req.body;

    if (!pcThreshold || typeof pcThreshold !== "number") {
      return res.status(400).json({ error: "pcThreshold (number) is required" });
    }
    if (!channels || !Array.isArray(channels)) {
      return res.status(400).json({ error: "channels (array) is required" });
    }

    const result = await query(
      `INSERT INTO alert_configs (org_id, satellite_id, pc_threshold, channels)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id, satellite_id, pc_threshold, channels, enabled, created_at`,
      [req.orgId, satelliteId || null, pcThreshold, JSON.stringify(channels)]
    );

    if (result.rows.length === 0) {
      // Update existing
      const updated = await query(
        `UPDATE alert_configs SET pc_threshold = $1, channels = $2
         WHERE org_id = $3 AND (satellite_id = $4 OR ($4 IS NULL AND satellite_id IS NULL))
         RETURNING id, satellite_id, pc_threshold, channels, enabled, created_at`,
        [pcThreshold, JSON.stringify(channels), req.orgId, satelliteId || null]
      );
      return res.json({ data: updated.rows[0] });
    }

    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

/* ─── GET /api/alerts ──────────────────────────────────────────────── */
router.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await query(
      `SELECT a.id, a.alert_type, a.message, a.severity, a.acknowledged, a.created_at,
              s.name as satellite_name, s.norad_id
       FROM alerts a
       LEFT JOIN satellites s ON a.satellite_id = s.id
       WHERE a.org_id = $1
       ORDER BY a.created_at DESC LIMIT $2`,
      [req.orgId, limit]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

/* ─── GET /api/alerts/config ───────────────────────────────────────── */
router.get("/config", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, satellite_id, pc_threshold, channels, enabled, created_at
       FROM alert_configs WHERE org_id = $1`,
      [req.orgId]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
