/**
 * Auth Middleware Unit Tests
 */

const jwt = require("jsonwebtoken");
const { generateToken, JWT_SECRET } = require("../src/middleware/auth");

describe("generateToken()", () => {
  it("returns a valid JWT string", () => {
    const token = generateToken({ id: "user-1", email: "test@test.com", orgId: "org-1", role: "admin" });
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  it("embeds the payload in the token", () => {
    const payload = { id: "user-1", email: "test@test.com", orgId: "org-1", role: "member" };
    const token = generateToken(payload);
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe("user-1");
    expect(decoded.email).toBe("test@test.com");
    expect(decoded.orgId).toBe("org-1");
    expect(decoded.role).toBe("member");
  });
});

/* ─── Auth route validation tests ──────────────────────────────────── */

const request = require("supertest");
const { app } = require("../src/app");

describe("POST /api/auth/register — validation (no DB)", () => {
  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: "12345678", orgName: "Test Org" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it("returns 400 when password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", password: "short", orgName: "Org" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  it("returns 400 when orgName is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", password: "12345678" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/orgName/i);
  });
});

describe("POST /api/auth/login — validation (no DB)", () => {
  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "12345678" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });
});

/* ─── Protected route access tests ─────────────────────────────────── */

describe("Protected routes — auth enforcement", () => {
  it("returns 401 when no auth header on /api/satellites", async () => {
    const res = await request(app).get("/api/satellites");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token on /api/dashboard/overview", async () => {
    const res = await request(app)
      .get("/api/dashboard/overview")
      .set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(401);
  });

  it("returns 401 with expired token", async () => {
    const expiredToken = jwt.sign(
      { id: "u1", email: "e@e.com", orgId: "o1", role: "admin" },
      JWT_SECRET,
      { expiresIn: "0s" }
    );
    // Small delay to ensure token is expired
    await new Promise(r => setTimeout(r, 100));
    const res = await request(app)
      .get("/api/satellites")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });
});
