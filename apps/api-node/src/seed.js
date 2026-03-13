#!/usr/bin/env node

/**
 * Seed script — creates a default admin user if none exists.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node src/seed.js
 *
 * Idempotent — safe to run multiple times.
 */

const bcrypt = require("bcryptjs");
const { query, shutdownDb } = require("./db");

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@orbitshield.io";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "orbitshield";
const ADMIN_ORG = process.env.SEED_ADMIN_ORG || "OrbitShield HQ";

async function seed() {
  console.log("[seed] Checking for existing admin user...");

  const existing = await query("SELECT id FROM users WHERE email = $1", [
    ADMIN_EMAIL,
  ]);

  if (existing.rows.length > 0) {
    console.log(`[seed] Admin user ${ADMIN_EMAIL} already exists — skipping.`);
    return;
  }

  // Create organization
  const orgResult = await query(
    "INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING id",
    [ADMIN_ORG, ADMIN_EMAIL]
  );
  const orgId = orgResult.rows[0].id;

  // Create admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await query(
    "INSERT INTO users (org_id, email, password_hash, role) VALUES ($1, $2, $3, 'admin')",
    [orgId, ADMIN_EMAIL, passwordHash]
  );

  console.log(`[seed] Created admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`[seed] Organization: ${ADMIN_ORG} (${orgId})`);
}

seed()
  .then(() => {
    console.log("[seed] Done.");
    return shutdownDb();
  })
  .catch((err) => {
    console.error("[seed] Error:", err.message);
    process.exit(1);
  });
