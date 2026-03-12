/**
 * Server entry point
 *
 * Imports the Express app from ./app and starts the HTTP server.
 * Handles graceful shutdown for PM2 compatibility (SIGTERM + SIGINT).
 */

const { app } = require("./app");
const { shutdownDb } = require("./db");

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`✅ api-node running on http://localhost:${PORT}`);
});

/* ────────────────────────── Graceful shutdown ─────────────────────── */

let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n⏳ Received ${signal}. Shutting down gracefully...`);

  // 1. Stop accepting new connections
  server.close(async () => {
    console.log("   HTTP server closed.");

    // 2. Close DB pool
    try {
      await shutdownDb();
      console.log("   DB pool closed.");
    } catch (err) {
      console.error("   Error closing DB pool:", err.message);
    }

    console.log("👋 Shutdown complete.");
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown stalls
  setTimeout(() => {
    console.error("⚠️  Forced exit after 10s timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
