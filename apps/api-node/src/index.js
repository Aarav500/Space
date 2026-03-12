require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

/* ────────────────────────── Middleware ────────────────────────── */
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);

/* ────────────────────────── Health check ──────────────────────── */
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "api-node",
    time: new Date().toISOString(),
  });
});

/* ────────────────────────── API routes ────────────────────────── */
// TODO: Register entity routes here
// Example:
//   const usersRouter = require("./routes/users");
//   app.use("/api/users", usersRouter);

/* ────────────────────────── Error handler ─────────────────────── */
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

/* ────────────────────────── Start server ──────────────────────── */
app.listen(PORT, () => {
  console.log(`✅ api-node running on http://localhost:${PORT}`);
});
