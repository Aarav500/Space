/**
 * Alert routes — Hardened
 *
 * Route: /api/alerts
 */

const { Router } = require("express");
const { query } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { validateUUID, validateFloat, validatePositiveInt, validateEnum } = require("../middleware/validate");

const router = Router();
router.use(authMiddleware);

const ALLOWED_CHANNELS = ["email", "sms", "webhook", "slack"];

/* ─── POST /api/alerts/configure ───────────────────────────────────── */
router.post("/configure", async (req, res, next) => {
  try {
    const { satelliteId, pcThreshold, channels } = req.body;

    // Validate pcThreshold
    const { value: validPc, error: pcErr } = validateFloat(pcThreshold, 1e-10, 1.0, "pcThreshold");
    if (pcErr) {
      return res.status(400).json({ error: pcErr });
    }

    // Validate channels
    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ error: "channels must be a non-empty array" });
    }
    for (const ch of channels) {
      const chErr = validateEnum(ch, ALLOWED_CHANNELS);
      if (chErr) {
        return res.status(400).json({ error: `channel '${ch}' ${chErr}` });
      }
    }

    // Validate satelliteId if provided
    if (satelliteId !== undefined && satelliteId !== null) {
      const uuidErr = validateUUID(satelliteId);
      if (uuidErr) {
        return res.status(400).json({ error: `satelliteId ${uuidErr}` });
      }
    }

    const result = await query(
      `INSERT INTO alert_configs (org_id, satellite_id, pc_threshold, channels)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id, satellite_id, pc_threshold, channels, enabled, created_at`,
      [req.orgId, satelliteId || null, validPc, JSON.stringify(channels)]
    );

    if (result.rows.length === 0) {
      // Update existing
      const updated = await query(
        `UPDATE alert_configs SET pc_threshold = $1, channels = $2
         WHERE org_id = $3 AND (satellite_id = $4 OR ($4 IS NULL AND satellite_id IS NULL))
         RETURNING id, satellite_id, pc_threshold, channels, enabled, created_at`,
        [validPc, JSON.stringify(channels), req.orgId, satelliteId || null]
      );
      return res.json({ data: updated.rows[0] });
    }

    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

/* ─── GET /api/alerts ──────────────────────────────────────────────── */
router.get("/", async (req, res, next) => {
  try {
    const { value: limit, error: limitErr } = validatePositiveInt(req.query.limit || "50", 1, 200, "limit");
    if (limitErr) {
      return res.status(400).json({ error: limitErr });
    }

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
