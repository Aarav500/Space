/**
 * NOAA Space Weather Prediction Center Client — Hardened
 *
 * Fetches Kp index, F10.7 solar flux, and geomagnetic storm alerts.
 * All calls protected by circuit breaker with request timeouts.
 * Includes in-memory cache (5 min TTL) for getCurrentSpaceWeather().
 *
 * Docs: https://services.swpc.noaa.gov
 */

const { noaaBreaker } = require("./circuit-breaker");

const NOAA_BASE = process.env.NOAA_SWPC_BASE_URL || "https://services.swpc.noaa.gov";
const REQUEST_TIMEOUT_MS = 10_000;

/* ─── In-memory cache ─────────────────────────────────────────────── */
let weatherCache = { data: null, expiry: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch current planetary Kp index.
 * @returns {Promise<{ kp: number, timestamp: string } | null>}
 */
async function fetchCurrentKp() {
  return noaaBreaker.exec(async () => {
    const url = `${NOAA_BASE}/products/noaa-planetary-k-index.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`NOAA Kp responded with ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return null;

    const latest = data[data.length - 1];
    return {
      kp: parseFloat(latest[1]),
      timestamp: latest[0],
    };
  }, null);
}

/**
 * Fetch current F10.7 solar flux.
 * @returns {Promise<{ f107: number, timestamp: string } | null>}
 */
async function fetchF107Flux() {
  return noaaBreaker.exec(async () => {
    const url = `${NOAA_BASE}/products/solar-wind/mag-5-minute.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`NOAA F10.7 responded with ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return null;

    const latest = data[data.length - 1];
    return {
      f107: parseFloat(latest[6] || 0),
      timestamp: latest[0],
    };
  }, null);
}

/**
 * Fetch geomagnetic storm alerts and warnings.
 * @returns {Promise<object[]>}
 */
async function fetchGeomagAlerts() {
  return noaaBreaker.exec(async () => {
    const url = `${NOAA_BASE}/products/alerts.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`NOAA alerts responded with ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((alert) => {
        const msg = (alert.message || "").toLowerCase();
        return msg.includes("geomagnetic") || msg.includes("g1") || msg.includes("g2") ||
               msg.includes("g3") || msg.includes("g4") || msg.includes("g5");
      })
      .map((alert) => ({
        issueTime: alert.issue_datetime,
        message: alert.message,
        stormLevel: extractStormLevel(alert.message),
      }));
  }, []);
}

/**
 * Get 3-day space weather forecast.
 * @returns {Promise<object[]>}
 */
async function fetch3DayForecast() {
  return noaaBreaker.exec(async () => {
    const url = `${NOAA_BASE}/products/3-day-forecast.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`NOAA 3-day forecast responded with ${res.status}`);

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, []);
}

/**
 * Get all current space weather data in one call.
 * Results are cached for 5 minutes to reduce external API pressure.
 * @returns {Promise<object>}
 */
async function getCurrentSpaceWeather() {
  const now = Date.now();
  if (weatherCache.data && now < weatherCache.expiry) {
    return weatherCache.data;
  }

  const [kpData, f107Data, alerts] = await Promise.all([
    fetchCurrentKp(),
    fetchF107Flux(),
    fetchGeomagAlerts(),
  ]);

  const stormLevel = alerts.length > 0 ? alerts[0].stormLevel : null;

  const result = {
    kp: kpData?.kp ?? 0,
    f107: f107Data?.f107 ?? 0,
    stormLevel,
    timestamp: kpData?.timestamp || new Date().toISOString(),
    alerts,
  };

  // Update cache
  weatherCache = { data: result, expiry: now + CACHE_TTL_MS };

  return result;
}

/**
 * Extract storm level (G1–G5) from alert message text.
 */
function extractStormLevel(message) {
  if (!message) return null;
  const match = message.match(/G([1-5])/i);
  return match ? `G${match[1]}` : null;
}

module.exports = {
  fetchCurrentKp,
  fetchF107Flux,
  fetchGeomagAlerts,
  fetch3DayForecast,
  getCurrentSpaceWeather,
  extractStormLevel,
};
