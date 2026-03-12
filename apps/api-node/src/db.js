/**
 * Postgres database client
 *
 * Reads DATABASE_URL from environment variables.
 * Usage:
 *   const { query, shutdownDb, pingDb } = require("./db");
 *   const result = await query("SELECT NOW()");
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Sensible defaults for a small app
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err.message);
});

/**
 * Convenience wrapper — runs a parameterized query.
 * Logs SQL in development (not in test or production).
 * @param {string} text  SQL query string
 * @param {any[]}  params  Query parameters
 * @returns {Promise<import("pg").QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    console.log("[DB]", { text, duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
}

/**
 * Close all connections in the pool.
 * Call this during graceful shutdown.
 */
async function shutdownDb() {
  await pool.end();
}

/**
 * Simple connectivity check — SELECT 1.
 * @returns {Promise<boolean>}
 */
async function pingDb() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

module.exports = { pool, query, shutdownDb, pingDb };
