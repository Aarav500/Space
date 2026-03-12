/**
 * Example CRUD route — demonstrates the standard pattern.
 *
 * Route: /api/examples
 *
 * Requires the `examples` table in Postgres:
 *
 *   CREATE TABLE IF NOT EXISTS examples (
 *     id         SERIAL PRIMARY KEY,
 *     name       VARCHAR(255) NOT NULL,
 *     created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
 *   );
 */

const { Router } = require("express");
const { query } = require("../db");

const router = Router();

/* ─── Validation helper ─────────────────────────────────────────────── */

/**
 * Validates the `name` field from the request body.
 * Returns an error string or null if valid.
 * @param {any} name
 * @returns {string | null}
 */
function validateName(name) {
  if (name === undefined || name === null) {
    return "Field 'name' is required";
  }
  if (typeof name !== "string") {
    return "Field 'name' must be a string";
  }
  if (name.trim().length < 3) {
    return "Field 'name' must be at least 3 characters (after trimming)";
  }
  return null;
}

/* ─── GET /api/examples ─────────────────────────────────────────────── */

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      "SELECT id, name, created_at FROM examples ORDER BY id DESC"
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

/* ─── POST /api/examples ────────────────────────────────────────────── */

router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;

    const validationError = validateName(name);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const trimmedName = name.trim();

    const result = await query(
      "INSERT INTO examples (name) VALUES ($1) RETURNING id, name, created_at",
      [trimmedName]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Export the validation helper for unit testing
module.exports = router;
module.exports.validateName = validateName;
