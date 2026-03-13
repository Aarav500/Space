/**
 * Coverage / Insurance routes
 *
 * Route: /api/coverage
 */

const { Router } = require("express");
const { query } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { computeHourlyPriceCents } = require("../services/risk-engine");
const { ensureStripeCustomer, createCoverageCheckout } = require("../services/stripe-billing");

const router = Router();
router.use(authMiddleware);

/* ─── POST /api/coverage/quote ─────────────────────────────────────── */
router.post("/quote", async (req, res, next) => {
  try {
    const { satelliteId, hours } = req.body;

    if (!satelliteId) {
      return res.status(400).json({ error: "satelliteId is required" });
    }
    if (!hours || typeof hours !== "number" || hours < 1 || hours > 8760) {
      return res.status(400).json({ error: "hours must be between 1 and 8760" });
    }

    // Get satellite risk score
    const satResult = await query(
      "SELECT current_risk_score, name, norad_id FROM satellites WHERE id = $1 AND org_id = $2",
      [satelliteId, req.orgId]
    );
    if (satResult.rows.length === 0) {
      return res.status(404).json({ error: "Satellite not found" });
    }

    const sat = satResult.rows[0];
    const hourlyCents = computeHourlyPriceCents(parseFloat(sat.current_risk_score));
    const totalCents = hourlyCents * hours;
    const maxPayoutCents = totalCents * 10; // 10x premium

    res.json({
      satelliteId,
      satelliteName: sat.name,
      noradId: sat.norad_id,
      currentRiskScore: sat.current_risk_score,
      hours,
      hourlyCents,
      totalCents,
      maxPayoutCents,
      currency: "usd",
    });
  } catch (err) { next(err); }
});

/* ─── POST /api/coverage/checkout ──────────────────────────────────── */
router.post("/checkout", async (req, res, next) => {
  try {
    const { satelliteId, hours } = req.body;

    if (!satelliteId || !hours) {
      return res.status(400).json({ error: "satelliteId and hours are required" });
    }

    // Get satellite
    const satResult = await query(
      "SELECT id, name, norad_id, current_risk_score FROM satellites WHERE id = $1 AND org_id = $2",
      [satelliteId, req.orgId]
    );
    if (satResult.rows.length === 0) {
      return res.status(404).json({ error: "Satellite not found" });
    }
    const sat = satResult.rows[0];

    // Get org info
    const orgResult = await query("SELECT name, email FROM organizations WHERE id = $1", [req.orgId]);
    const org = orgResult.rows[0];

    // Compute price
    const hourlyCents = computeHourlyPriceCents(parseFloat(sat.current_risk_score));

    // Ensure Stripe customer
    const customerId = await ensureStripeCustomer(req.orgId, org.email, org.name);

    // Create Checkout session
    const session = await createCoverageCheckout({
      customerId,
      satelliteName: sat.name,
      hours: parseInt(hours),
      hourlyCents,
      orgId: req.orgId,
      satelliteId: sat.id,
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) { next(err); }
});

/* ─── GET /api/coverage/policies ───────────────────────────────────── */
router.get("/policies", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT cp.id, cp.coverage_start, cp.coverage_end, cp.hourly_premium_cents,
              cp.max_payout_cents, cp.trigger_pc_threshold, cp.status, cp.created_at,
              s.name as satellite_name, s.norad_id
       FROM coverage_policies cp
       JOIN satellites s ON cp.satellite_id = s.id
       WHERE cp.org_id = $1
       ORDER BY cp.created_at DESC`,
      [req.orgId]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
