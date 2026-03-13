/**
 * JWT Authentication Middleware
 *
 * Verifies Bearer tokens and attaches req.user and req.orgId.
 * Usage: router.get("/protected", authMiddleware, handler);
 */

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * Generate a JWT for a user.
 * @param {{ id: string, email: string, orgId: string, role: string }} payload
 * @returns {string}
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

/**
 * Express middleware — validates Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    req.orgId = decoded.orgId;
    next();
  } catch (err) {
    const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ error: message });
  }
}

/**
 * API Key middleware — validates X-API-Key header against org API keys.
 * Falls back to JWT auth if no API key provided.
 */
async function apiKeyMiddleware(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return authMiddleware(req, res, next);
  }

  try {
    const { query } = require("../db");
    const result = await query(
      "SELECT id, org_id FROM users WHERE id = $1",
      [apiKey]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    req.user = { id: result.rows[0].id };
    req.orgId = result.rows[0].org_id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid API key" });
  }
}

module.exports = { authMiddleware, apiKeyMiddleware, generateToken, JWT_SECRET };
