/**
 * Stripe Billing Service
 *
 * Handles customer creation, metered subscriptions, Checkout sessions,
 * and webhook processing for OrbitShield coverage policies.
 *
 * Uses Stripe test mode — set STRIPE_SECRET_KEY to sk_test_...
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Lazy-init Stripe to avoid crashing if key is not set
let stripe = null;
function getStripe() {
  if (!stripe && STRIPE_SECRET_KEY) {
    stripe = require("stripe")(STRIPE_SECRET_KEY);
  }
  return stripe;
}

/**
 * Create or retrieve a Stripe customer for an organization.
 * @param {string} orgId
 * @param {string} email
 * @param {string} name
 * @returns {Promise<string>} Stripe customer ID
 */
async function ensureStripeCustomer(orgId, email, name) {
  const s = getStripe();
  if (!s) throw new Error("Stripe not configured");

  const { query } = require("../db");

  // Check if org already has a Stripe customer
  const result = await query("SELECT stripe_customer_id FROM organizations WHERE id = $1", [orgId]);
  if (result.rows[0]?.stripe_customer_id) {
    return result.rows[0].stripe_customer_id;
  }

  // Create new customer
  const customer = await s.customers.create({
    email,
    name,
    metadata: { orgId },
  });

  // Save to DB
  await query("UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2", [customer.id, orgId]);

  return customer.id;
}

/**
 * Create a Stripe Checkout session for hourly coverage.
 * @param {object} params
 * @param {string} params.customerId - Stripe customer ID
 * @param {string} params.satelliteName - For display
 * @param {number} params.hours - Coverage duration
 * @param {number} params.hourlyCents - Price per hour in cents
 * @param {string} params.orgId
 * @param {string} params.satelliteId
 * @returns {Promise<object>} Stripe session
 */
async function createCoverageCheckout({
  customerId,
  satelliteName,
  hours,
  hourlyCents,
  orgId,
  satelliteId,
}) {
  const s = getStripe();
  if (!s) throw new Error("Stripe not configured");

  const session = await s.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `OrbitShield Collision Coverage — ${satelliteName}`,
            description: `${hours} hours of parametric collision coverage`,
          },
          unit_amount: hourlyCents,
        },
        quantity: hours,
      },
    ],
    metadata: {
      orgId,
      satelliteId,
      hours: String(hours),
      hourlyCents: String(hourlyCents),
      type: "coverage",
    },
    success_url: `${process.env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/coverage?success=true`,
    cancel_url: `${process.env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/coverage?canceled=true`,
  });

  return session;
}

/**
 * Handle Stripe webhook events.
 * @param {object} event - Stripe event object
 * @param {object} db - Database query function
 */
async function handleWebhookEvent(event, db) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.metadata?.type === "coverage") {
        const { orgId, satelliteId, hours, hourlyCents } = session.metadata;
        const coverageStart = new Date();
        const coverageEnd = new Date(Date.now() + parseInt(hours) * 3600000);

        await db.query(
          `INSERT INTO coverage_policies
           (org_id, satellite_id, stripe_subscription_id, coverage_start, coverage_end,
            hourly_premium_cents, max_payout_cents, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
          [
            orgId,
            satelliteId,
            session.id,
            coverageStart.toISOString(),
            coverageEnd.toISOString(),
            parseInt(hourlyCents),
            parseInt(hourlyCents) * parseInt(hours) * 10, // 10x premium as max payout
          ]
        );
      }
      break;
    }
    default:
      // Unhandled event type
      break;
  }
}

module.exports = {
  getStripe,
  ensureStripeCustomer,
  createCoverageCheckout,
  handleWebhookEvent,
};
