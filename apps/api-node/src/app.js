require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const exampleRouter = require("./routes/example");
const { experimentsMiddleware, flagsRouter } = require("./middleware/experiments");

const app = express();

/* ────────────────────────── Observability: Config ─────────────────── */
const SERVICE_NAME = process.env.SERVICE_NAME || "api-node";
const SERVICE_VERSION = process.env.SERVICE_VERSION || "0.0.0";
const ENVIRONMENT = process.env.NODE_ENV || "development";

/* ────────────────────────── Observability: Metrics store ──────────── */
const metrics = {
  requests: 0,
  errors: 0,
  latencySum: 0,
  latencyBuckets: { 50: 0, 100: 0, 250: 0, 500: 0, 1000: 0, Infinity: 0 },
  byRoute: {},
};

function recordMetrics(method, url, statusCode, durationMs) {
  metrics.requests++;
  if (statusCode >= 400) metrics.errors++;
  metrics.latencySum += durationMs;

  // Histogram buckets
  for (const bucket of [50, 100, 250, 500, 1000, Infinity]) {
    if (durationMs <= bucket) {
      metrics.latencyBuckets[bucket]++;
      break;
    }
  }

  // Per-route breakdown
  const key = `${method} ${url}`;
  if (!metrics.byRoute[key]) {
    metrics.byRoute[key] = { count: 0, errors: 0, latencySum: 0 };
  }
  metrics.byRoute[key].count++;
  if (statusCode >= 400) metrics.byRoute[key].errors++;
  metrics.byRoute[key].latencySum += durationMs;
}

/* ────────────────────────── Middleware: Request ID ────────────────── */
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
});

/* ────────────────────────── Middleware: JSON body & CORS ──────────── */
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);

/* ────────────────────────── Middleware: Experiments & Flags ────────── */
app.use(experimentsMiddleware);

/* ────────────────────────── Middleware: Structured logging ────────── */
app.use((req, res, next) => {
  const start = Date.now();

  // Capture when response finishes
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const statusCode = res.statusCode;

    // Record metrics
    recordMetrics(req.method, req.route?.path || req.path, statusCode, durationMs);

    // Structured JSON log (skip in test to keep output clean)
    if (ENVIRONMENT !== "test") {
      const logEntry = {
        level: statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        service: { name: SERVICE_NAME, version: SERVICE_VERSION },
        environment: ENVIRONMENT,
        http: {
          method: req.method,
          url: req.originalUrl,
          route: req.route?.path || null,
          statusCode,
          durationMs,
        },
      };
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
});

/* ────────────────────────── Health check ──────────────────────────── */
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    time: new Date().toISOString(),
  });
});

/* ────────────────────────── Metrics endpoint ─────────────────────── */
app.get("/metrics", (_req, res) => {
  const avgLatency = metrics.requests > 0
    ? Math.round(metrics.latencySum / metrics.requests)
    : 0;
  const errorRate = metrics.requests > 0
    ? +(metrics.errors / metrics.requests * 100).toFixed(2)
    : 0;

  res.json({
    service: SERVICE_NAME,
    uptime: process.uptime(),
    totals: {
      requests: metrics.requests,
      errors: metrics.errors,
      avgLatencyMs: avgLatency,
      errorRatePct: errorRate,
    },
    latencyBuckets: metrics.latencyBuckets,
    byRoute: metrics.byRoute,
  });
});

/* ────────────────────────── API routes ────────────────────────────── */
app.use("/api/examples", exampleRouter);
app.use("/api/flags", flagsRouter);

// TODO: Register additional entity routes here
// Example:
//   const usersRouter = require("./routes/users");
//   app.use("/api/users", usersRouter);

/* ────────────────────────── 404 handler ──────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ error: "Not found", requestId: req.requestId });
});

/* ────────────────────────── Error handler ─────────────────────────── */
// Express requires all 4 params to recognize this as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || 500;

  if (ENVIRONMENT !== "test") {
    const errorLog = {
      level: "error",
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      service: { name: SERVICE_NAME, version: SERVICE_VERSION },
      environment: ENVIRONMENT,
      error: {
        message: err.message,
        name: err.name || "Error",
        stack: ENVIRONMENT === "development" ? err.stack : undefined,
      },
      http: {
        method: req.method,
        url: req.originalUrl,
        statusCode: status,
      },
    };
    console.error(JSON.stringify(errorLog));
  }

  res.status(status).json({
    error: err.message || "Internal server error",
    requestId: req.requestId,
  });
});

module.exports = { app };
