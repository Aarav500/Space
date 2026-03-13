/**
 * Data Ingestion Worker
 *
 * Scheduled tasks that poll CelesTrak, NOAA, and compute risk snapshots.
 * Uses node-cron for scheduling.
 *
 * This module exports a `startIngestion()` function called from index.js.
 */

const cron = require("node-cron");
const { query } = require("../db");
const { fetchGPByNoradId, fetchSOCRATES } = require("./celestrak");
const { getCurrentSpaceWeather } = require("./noaa");
const { computeCompositeRisk, computeHourlyPriceCents } = require("./risk-engine");

/**
 * Refresh TLE data for all tracked satellites.
 */
async function refreshTLEData() {
  console.log("[Ingestion] Refreshing TLE data...");
  try {
    const result = await query("SELECT id, norad_id FROM satellites");
    const satellites = result.rows;

    for (const sat of satellites) {
      const gp = await fetchGPByNoradId(sat.norad_id);
      if (gp) {
        await query(
          `UPDATE satellites
           SET name = COALESCE($1, name), tle_line1 = $2, tle_line2 = $3,
               tle_epoch = $4, orbit_type = $5, last_updated = now()
           WHERE id = $6`,
          [gp.name, gp.tleLine1, gp.tleLine2, gp.epoch, gp.orbitType, sat.id]
        );
      }
      // Rate limit: 200ms between requests
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log(`[Ingestion] TLE refresh complete — ${satellites.length} satellites updated`);
  } catch (err) {
    console.error("[Ingestion] TLE refresh error:", err.message);
  }
}

/**
 * Ingest space weather data from NOAA.
 */
async function refreshSpaceWeather() {
  console.log("[Ingestion] Refreshing space weather...");
  try {
    const weather = await getCurrentSpaceWeather();

    await query(
      `INSERT INTO space_weather (observation_time, kp_index, f107_flux, storm_level, raw_data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (observation_time) DO UPDATE
       SET kp_index = EXCLUDED.kp_index, f107_flux = EXCLUDED.f107_flux,
           storm_level = EXCLUDED.storm_level, raw_data = EXCLUDED.raw_data`,
      [
        weather.timestamp,
        weather.kp,
        weather.f107,
        weather.stormLevel,
        JSON.stringify(weather),
      ]
    );

    console.log(`[Ingestion] Space weather updated — Kp=${weather.kp}, storm=${weather.stormLevel || "none"}`);
  } catch (err) {
    console.error("[Ingestion] Space weather error:", err.message);
  }
}

/**
 * Compute and store hourly risk snapshots for all satellites.
 */
async function computeRiskSnapshots() {
  console.log("[Ingestion] Computing risk snapshots...");
  try {
    // Get latest space weather
    const wxResult = await query(
      "SELECT kp_index, f107_flux FROM space_weather ORDER BY observation_time DESC LIMIT 1"
    );
    const weather = wxResult.rows[0] || { kp_index: 2, f107_flux: 100 };

    // Get all satellites
    const satsResult = await query("SELECT id, norad_id FROM satellites");

    for (const sat of satsResult.rows) {
      // Get active conjunctions for this satellite
      const conjResult = await query(
        `SELECT miss_distance_km, relative_velocity_kms
         FROM conjunction_events
         WHERE primary_sat_id = $1 AND status = 'active' AND tca > now()
         ORDER BY collision_probability DESC LIMIT 10`,
        [sat.id]
      );

      const { compositeScore, riskLevel } = computeCompositeRisk(
        conjResult.rows,
        { kp: parseFloat(weather.kp_index), f107: parseFloat(weather.f107_flux) }
      );

      const priceCents = computeHourlyPriceCents(compositeScore);

      // Insert risk snapshot
      await query(
        `INSERT INTO risk_snapshots
         (satellite_id, snapshot_time, risk_score, kp_index, f107_flux, active_conjunctions, pricing_rate_cents)
         VALUES ($1, now(), $2, $3, $4, $5, $6)`,
        [sat.id, compositeScore, weather.kp_index, weather.f107_flux, conjResult.rows.length, priceCents]
      );

      // Update satellite current risk
      await query(
        `UPDATE satellites SET current_risk_score = $1, risk_level = $2, last_updated = now() WHERE id = $3`,
        [compositeScore, riskLevel, sat.id]
      );
    }

    console.log(`[Ingestion] Risk snapshots computed for ${satsResult.rows.length} satellites`);
  } catch (err) {
    console.error("[Ingestion] Risk snapshot error:", err.message);
  }
}

/**
 * Ingest SOCRATES conjunction data.
 */
async function ingestSOCRATES() {
  console.log("[Ingestion] Fetching SOCRATES conjunctions...");
  try {
    const events = await fetchSOCRATES();
    if (events.length === 0) {
      console.log("[Ingestion] No SOCRATES data available");
      return;
    }

    // Match against tracked satellites
    const satsResult = await query("SELECT id, norad_id FROM satellites");
    const noradMap = new Map(satsResult.rows.map((s) => [s.norad_id, s.id]));

    let matched = 0;
    for (const evt of events) {
      const satId = noradMap.get(evt.primaryNoradId) || noradMap.get(evt.secondaryNoradId);
      if (!satId) continue;

      const primarySatId = noradMap.get(evt.primaryNoradId) || satId;
      const secondaryNorad = noradMap.has(evt.primaryNoradId) ? evt.secondaryNoradId : evt.primaryNoradId;

      await query(
        `INSERT INTO conjunction_events
         (primary_sat_id, secondary_norad_id, secondary_name, tca, miss_distance_km,
          relative_velocity_kms, collision_probability, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'celestrak_socrates')
         ON CONFLICT DO NOTHING`,
        [
          primarySatId,
          secondaryNorad,
          evt.secondaryName || evt.primaryName,
          evt.tca || new Date().toISOString(),
          evt.missDistanceKm || 999,
          evt.relativeVelocityKms || 0,
          0, // Will be computed by risk engine
        ]
      );
      matched++;
    }

    console.log(`[Ingestion] SOCRATES: ${events.length} events fetched, ${matched} matched tracked sats`);
  } catch (err) {
    console.error("[Ingestion] SOCRATES error:", err.message);
  }
}

/**
 * Start all scheduled ingestion workers.
 * Call this from index.js after server starts.
 */
function startIngestion() {
  const tleC = process.env.TLE_REFRESH_CRON || "0 */4 * * *";
  const wxC = process.env.WEATHER_REFRESH_CRON || "*/30 * * * *";
  const riskC = process.env.RISK_SNAPSHOT_CRON || "0 * * * *";

  console.log("[Ingestion] Starting scheduled workers...");
  console.log(`  TLE refresh:      ${tleC}`);
  console.log(`  Weather refresh:  ${wxC}`);
  console.log(`  Risk snapshots:   ${riskC}`);

  cron.schedule(tleC, refreshTLEData);
  cron.schedule(wxC, refreshSpaceWeather);
  cron.schedule(riskC, async () => {
    await ingestSOCRATES();
    await computeRiskSnapshots();
  });

  // Run initial ingestion after a short delay
  setTimeout(async () => {
    await refreshSpaceWeather();
    await ingestSOCRATES();
    await computeRiskSnapshots();
  }, 5000);
}

module.exports = {
  startIngestion,
  refreshTLEData,
  refreshSpaceWeather,
  computeRiskSnapshots,
  ingestSOCRATES,
};
