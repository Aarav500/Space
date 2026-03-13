/**
 * Auth routes — registration and login
 *
 * Route: /api/auth
 */

const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { generateToken } = require("../middleware/auth");

const router = Router();

/* ─── POST /api/auth/register ──────────────────────────────────────── */

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, orgName } = req.body;

    if (!email || !password || !orgName) {
      return res.status(400).json({ error: "email, password, and orgName are required" });
    }
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Check if email already exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Create organization
    const orgResult = await query(
      "INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING id, name, email, plan, created_at",
      [orgName.trim(), email.toLowerCase()]
    );
    const org = orgResult.rows[0];

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await query(
      "INSERT INTO users (org_id, email, password_hash, role) VALUES ($1, $2, $3, 'admin') RETURNING id, email, role, created_at",
      [org.id, email.toLowerCase(), passwordHash]
    );
    const user = userResult.rows[0];

    const token = generateToken({
      id: user.id,
      email: user.email,
      orgId: org.id,
      role: user.role,
    });

    res.status(201).json({ user, org, token });
  } catch (err) {
    next(err);
  }
});

/* ─── POST /api/auth/login ─────────────────────────────────────────── */

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const result = await query(
      "SELECT u.id, u.email, u.password_hash, u.role, u.org_id FROM users u WHERE u.email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      orgId: user.org_id,
      role: user.role,
    });

    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
