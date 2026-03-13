/**
 * Space Weather routes — Hardened
 *
 * Route: /api/space-weather
 */

const { Router } = require("express");
const { query } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { getCurrentSpaceWeather, fetch3DayForecast } = require("../services/noaa");
const { validatePositiveInt } = require("../middleware/validate");

const router = Router();
router.use(authMiddleware);

/* ─── GET /api/space-weather/current ───────────────────────────────── */
router.get("/current", async (req, res, next) => {
  try {
    // Try DB first (cached)
    const cached = await query(
      "SELECT kp_index, f107_flux, storm_level, observation_time FROM space_weather ORDER BY observation_time DESC LIMIT 1"
    );

    if (cached.rows.length > 0) {
      const row = cached.rows[0];
      // Cache for 5 minutes — weather updates every 30 min
      res.set("Cache-Control", "public, max-age=300");
      return res.json({
        kp: parseFloat(row.kp_index),
        f107: parseFloat(row.f107_flux) || 0,
        stormLevel: row.storm_level,
        timestamp: row.observation_time,
        source: "cached",
      });
    }

    // Fallback: live fetch
    const weather = await getCurrentSpaceWeather();
    res.json({ ...weather, source: "live" });
  } catch (err) { next(err); }
});

/* ─── GET /api/space-weather/forecast ──────────────────────────────── */
router.get("/forecast", async (req, res, next) => {
  try {
    const forecast = await fetch3DayForecast();
    // Cache for 30 minutes
    res.set("Cache-Control", "public, max-age=1800");
    res.json({ data: forecast });
  } catch (err) { next(err); }
});

/* ─── GET /api/space-weather/history ───────────────────────────────── */
router.get("/history", async (req, res, next) => {
  try {
    const { value: hours, error: hoursErr } = validatePositiveInt(req.query.hours || "72", 1, 720, "hours");
    if (hoursErr) {
      return res.status(400).json({ error: hoursErr });
    }

    const result = await query(
      `SELECT observation_time, kp_index, f107_flux, storm_level
       FROM space_weather
       ORDER BY observation_time DESC
       LIMIT $1`,
      [hours]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
