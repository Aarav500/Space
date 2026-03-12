const request = require("supertest");
const { app } = require("../src/app");

describe("GET /health", () => {
  it("returns 200 with ok: true", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("api-node");
    expect(res.body.time).toBeDefined();
  });

  it("returns a valid ISO time string", async () => {
    const res = await request(app).get("/health");

    const parsed = new Date(res.body.time);
    expect(parsed.toISOString()).toBe(res.body.time);
  });
});

describe("404 handler", () => {
  it("returns 404 JSON for unknown routes", async () => {
    const res = await request(app).get("/no-such-route");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not found");
  });
});
