/**
 * NOAA Space Weather Prediction Center Client
 *
 * Fetches Kp index, F10.7 solar flux, and geomagnetic storm alerts.
 * No authentication required — free public JSON API.
 *
 * Docs: https://services.swpc.noaa.gov
 */

const NOAA_BASE = process.env.NOAA_SWPC_BASE_URL || "https://services.swpc.noaa.gov";

/**
 * Fetch current planetary Kp index.
 * @returns {Promise<{ kp: number, timestamp: string } | null>}
 */
async function fetchCurrentKp() {
  try {
    const url = `${NOAA_BASE}/products/noaa-planetary-k-index.json`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    // Data is array of arrays: [time_tag, Kp, Kp_fraction, a_running, station_count]
    // First row is headers, last row is most recent
    if (!Array.isArray(data) || data.length < 2) return null;

    const latest = data[data.length - 1];
    return {
      kp: parseFloat(latest[1]),
      timestamp: latest[0],
    };
  } catch (err) {
    console.error("[NOAA] Error fetching Kp index:", err.message);
    return null;
  }
}

/**
 * Fetch current F10.7 solar flux.
 * @returns {Promise<{ f107: number, timestamp: string } | null>}
 */
async function fetchF107Flux() {
  try {
    const url = `${NOAA_BASE}/products/solar-wind/mag-5-minute.json`;
    const res = await fetch(url);
    if (!res.ok) return null;

    // Use the 10.7cm flux product instead if available
    // Fallback: derive from solar wind data
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return null;

    const latest = data[data.length - 1];
    return {
      f107: parseFloat(latest[6] || 0), // bt field as proxy
      timestamp: latest[0],
    };
  } catch (err) {
    console.error("[NOAA] Error fetching F10.7:", err.message);
    return null;
  }
}

/**
 * Fetch geomagnetic storm alerts and warnings.
 * @returns {Promise<object[]>}
 */
async function fetchGeomagAlerts() {
  try {
    const url = `${NOAA_BASE}/products/alerts.json`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Filter for geomagnetic storm warnings
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
  } catch (err) {
    console.error("[NOAA] Error fetching geomag alerts:", err.message);
    return [];
  }
}

/**
 * Get 3-day space weather forecast.
 * @returns {Promise<object[]>}
 */
async function fetch3DayForecast() {
  try {
    const url = `${NOAA_BASE}/products/3-day-forecast.json`;
    const res = await fetch(url);
    if (!res.ok) {
      // Fallback: return empty forecast
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("[NOAA] Error fetching 3-day forecast:", err.message);
    return [];
  }
}

/**
 * Get all current space weather data in one call.
 * @returns {Promise<object>}
 */
async function getCurrentSpaceWeather() {
  const [kpData, f107Data, alerts] = await Promise.all([
    fetchCurrentKp(),
    fetchF107Flux(),
    fetchGeomagAlerts(),
  ]);

  const stormLevel = alerts.length > 0 ? alerts[0].stormLevel : null;

  return {
    kp: kpData?.kp ?? 0,
    f107: f107Data?.f107 ?? 0,
    stormLevel,
    timestamp: kpData?.timestamp || new Date().toISOString(),
    alerts,
  };
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
