/**
 * Centralized API configuration for OrbitShield frontend.
 *
 * Uses `||` (not `??`) so that an empty-string env var also falls through
 * to the default.  The default "/api" is a relative path that works in
 * production behind nginx, which proxies /api → Express:4000.
 *
 * In local development, set NEXT_PUBLIC_API_URL=http://localhost:4000 in
 * your .env.local file.
 */

export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL || "/api";

/* ── Runtime guard ──────────────────────────────────────────────────
 * Warns during development if API_BASE still points at localhost while
 * the page is served from a non-localhost host (i.e. deployed but
 * misconfigured).  This check only runs in the browser.
 */
if (typeof window !== "undefined") {
  const isApiLocalhost = API_BASE.includes("localhost");
  const isPageLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isApiLocalhost && !isPageLocalhost) {
    console.warn(
      `[OrbitShield] API_BASE is "${API_BASE}" but the page is served ` +
        `from "${window.location.host}". The client bundle may be ` +
        `calling localhost instead of the production API. Set ` +
        `NEXT_PUBLIC_API_URL to the correct production URL and rebuild.`,
    );
  }
}
