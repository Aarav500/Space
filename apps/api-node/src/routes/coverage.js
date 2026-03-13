/**
 * Coverage / Insurance routes — Hardened
 *
 * Route: /api/coverage
 */

const { Router } = require("express");
const { query } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { computeHourlyPriceCents } = require("../services/risk-engine");
const { ensureStripeCustomer, createCoverageCheckout } = require("../services/stripe-billing");
const { validateUUID, validatePositiveInt } = require("../middleware/validate");
const { rateLimiter } = require("../middleware/rate-limiter");

const router = Router();
router.use(authMiddleware);

/* ─── POST /api/coverage/quote ─────────────────────────────────────── */
router.post("/quote", async (req, res, next) => {
  try {
    const { satelliteId, hours } = req.body;

    // Validate satelliteId as UUID
    const uuidErr = validateUUID(satelliteId);
    if (uuidErr) {
      return res.status(400).json({ error: `satelliteId ${uuidErr}` });
    }

    // Validate hours as bounded integer
    const { value: validHours, error: hoursErr } = validatePositiveInt(hours, 1, 8760, "hours");
    if (hoursErr) {
      return res.status(400).json({ error: hoursErr });
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
    const totalCents = hourlyCents * validHours;
    const maxPayoutCents = totalCents * 10; // 10x premium

    res.json({
      satelliteId,
      satelliteName: sat.name,
      noradId: sat.norad_id,
      currentRiskScore: sat.current_risk_score,
      hours: validHours,
      hourlyCents,
      totalCents,
      maxPayoutCents,
      currency: "usd",
    });
  } catch (err) { next(err); }
});

/* ─── POST /api/coverage/checkout ──────────────────────────────────── */
const checkoutLimiter = rateLimiter({
  windowMs: 60_000,
  max: 5,
  keyFn: (req) => req.orgId || req.ip,
  message: "Too many checkout attempts, please slow down",
});

router.post("/checkout", checkoutLimiter, async (req, res, next) => {
  try {
    const { satelliteId, hours } = req.body;

    // Validate inputs
    const uuidErr = validateUUID(satelliteId);
    if (uuidErr) {
      return res.status(400).json({ error: `satelliteId ${uuidErr}` });
    }
    const { value: validHours, error: hoursErr } = validatePositiveInt(hours, 1, 8760, "hours");
    if (hoursErr) {
      return res.status(400).json({ error: hoursErr });
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
    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }
    const org = orgResult.rows[0];

    // Compute price
    const hourlyCents = computeHourlyPriceCents(parseFloat(sat.current_risk_score));
    if (hourlyCents <= 0) {
      return res.status(500).json({ error: "Invalid pricing calculation" });
    }

    // Ensure Stripe customer
    const customerId = await ensureStripeCustomer(req.orgId, org.email, org.name);

    // Create Checkout session
    const session = await createCoverageCheckout({
      customerId,
      satelliteName: sat.name,
      hours: validHours,
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
