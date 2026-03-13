/**
 * CelesTrak API Client
 *
 * Fetches TLE/GP orbital data and SOCRATES conjunction reports.
 * No authentication required — free public API.
 *
 * Docs: https://celestrak.org/NORAD/documentation/
 */

const CELESTRAK_BASE = process.env.CELESTRAK_BASE_URL || "https://celestrak.org";

/**
 * Fetch GP data for a satellite by NORAD catalog number.
 * Returns TLE lines and metadata in JSON format.
 * @param {number} noradId
 * @returns {Promise<object|null>}
 */
async function fetchGPByNoradId(noradId) {
  try {
    const url = `${CELESTRAK_BASE}/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=json`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const gp = data[0];
    return {
      noradId: gp.NORAD_CAT_ID,
      name: gp.OBJECT_NAME || `SAT-${noradId}`,
      epoch: gp.EPOCH,
      meanMotion: gp.MEAN_MOTION,
      eccentricity: gp.ECCENTRICITY,
      inclination: gp.INCLINATION,
      raOfAscNode: gp.RA_OF_ASC_NODE,
      argOfPericenter: gp.ARG_OF_PERICENTER,
      meanAnomaly: gp.MEAN_ANOMALY,
      tleLine1: gp.TLE_LINE1,
      tleLine2: gp.TLE_LINE2,
      orbitType: classifyOrbit(gp.MEAN_MOTION, gp.ECCENTRICITY),
    };
  } catch (err) {
    console.error(`[CelesTrak] Error fetching GP for NORAD ${noradId}:`, err.message);
    return null;
  }
}

/**
 * Fetch SOCRATES conjunction data (top close approaches).
 * Returns array of conjunction events from the latest report.
 * @returns {Promise<object[]>}
 */
async function fetchSOCRATES() {
  try {
    const url = `${CELESTRAK_BASE}/SOCRATES/search-results.php?ESSION=&CONSTELLATION=ALL&FORMAT=json`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const text = await res.text();
    // SOCRATES may return CSV or JSON depending on parameters
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) return [];
      return data.map((item) => ({
        primaryNoradId: item.NORAD_CAT_ID_1 || item.SAT1_NORAD,
        secondaryNoradId: item.NORAD_CAT_ID_2 || item.SAT2_NORAD,
        primaryName: item.OBJECT_NAME_1 || item.SAT1_NAME,
        secondaryName: item.OBJECT_NAME_2 || item.SAT2_NAME,
        tca: item.TCA || item.MIN_RNG_TIME,
        missDistanceKm: parseFloat(item.MIN_RNG || item.MISS_DISTANCE || 0),
        relativeVelocityKms: parseFloat(item.REL_VEL || item.RELATIVE_SPEED || 0),
      }));
    } catch {
      return [];
    }
  } catch (err) {
    console.error("[CelesTrak] Error fetching SOCRATES:", err.message);
    return [];
  }
}

/**
 * Classify orbit type based on mean motion and eccentricity.
 */
function classifyOrbit(meanMotion, eccentricity) {
  if (!meanMotion) return "LEO";
  const period = 1440 / meanMotion; // minutes
  if (period < 128) return "LEO";
  if (period > 1380 && period < 1500 && eccentricity < 0.01) return "GEO";
  if (eccentricity > 0.25) return "HEO";
  return "MEO";
}

module.exports = { fetchGPByNoradId, fetchSOCRATES, classifyOrbit };
