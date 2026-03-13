/**
 * Dashboard routes
 *
 * Route: /api/dashboard
 */

const { Router } = require("express");
const { query } = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = Router();
router.use(authMiddleware);

/* ─── GET /api/dashboard/overview ──────────────────────────────────── */
router.get("/overview", async (req, res, next) => {
  try {
    // Total satellites
    const satsResult = await query(
      "SELECT COUNT(*)::int as total FROM satellites WHERE org_id = $1",
      [req.orgId]
    );

    // Average risk score
    const avgResult = await query(
      "SELECT AVG(current_risk_score)::float as avg_risk FROM satellites WHERE org_id = $1",
      [req.orgId]
    );

    // Critical/warning count
    const criticalResult = await query(
      "SELECT COUNT(*)::int as count FROM satellites WHERE org_id = $1 AND risk_level IN ('critical', 'warning')",
      [req.orgId]
    );

    // Recent alerts
    const alertsResult = await query(
      `SELECT a.id, a.alert_type, a.message, a.severity, a.created_at,
              s.name as satellite_name, s.norad_id
       FROM alerts a
       LEFT JOIN satellites s ON a.satellite_id = s.id
       WHERE a.org_id = $1
       ORDER BY a.created_at DESC LIMIT 10`,
      [req.orgId]
    );

    // Active policies count
    const policiesResult = await query(
      "SELECT COUNT(*)::int as count FROM coverage_policies WHERE org_id = $1 AND status = 'active'",
      [req.orgId]
    );

    // Risk distribution
    const distResult = await query(
      `SELECT risk_level, COUNT(*)::int as count
       FROM satellites WHERE org_id = $1
       GROUP BY risk_level`,
      [req.orgId]
    );

    res.json({
      totalSats: satsResult.rows[0]?.total || 0,
      avgRisk: avgResult.rows[0]?.avg_risk || 0,
      criticalCount: criticalResult.rows[0]?.count || 0,
      activePolicies: policiesResult.rows[0]?.count || 0,
      riskDistribution: distResult.rows,
      recentAlerts: alertsResult.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
