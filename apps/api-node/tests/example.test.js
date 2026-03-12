const request = require("supertest");
const { app } = require("../src/app");
const { validateName } = require("../src/routes/example");

/* ─── Unit tests: validation helper ─────────────────────────────────── */

describe("validateName()", () => {
  it("returns error when name is undefined", () => {
    expect(validateName(undefined)).toBe("Field 'name' is required");
  });

  it("returns error when name is null", () => {
    expect(validateName(null)).toBe("Field 'name' is required");
  });

  it("returns error when name is not a string", () => {
    expect(validateName(123)).toBe("Field 'name' must be a string");
    expect(validateName(true)).toBe("Field 'name' must be a string");
    expect(validateName({})).toBe("Field 'name' must be a string");
  });

  it("returns error when trimmed name is too short", () => {
    expect(validateName("")).toMatch(/at least 3/);
    expect(validateName("ab")).toMatch(/at least 3/);
    expect(validateName("   ab   ")).toMatch(/at least 3/);
  });

  it("returns null for valid names", () => {
    expect(validateName("abc")).toBeNull();
    expect(validateName("Hello World")).toBeNull();
    expect(validateName("   valid   ")).toBeNull();
  });
});

/* ─── Integration tests: POST /api/examples validation ──────────────── */

describe("POST /api/examples — validation (no DB)", () => {
  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/examples")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it("returns 400 when name is not a string", async () => {
    const res = await request(app)
      .post("/api/examples")
      .send({ name: 42 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/string/i);
  });

  it("returns 400 when name is too short", async () => {
    const res = await request(app)
      .post("/api/examples")
      .send({ name: "ab" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 3/i);
  });
});

/* ─── Integration tests: DB-dependent (skipped) ─────────────────────── */

// TODO: Enable these tests when a test database is available.
// Set DATABASE_URL to a test database and remove .skip.
//
// describe("GET /api/examples (DB)", () => {
//   it("returns an array of examples", async () => {
//     const res = await request(app).get("/api/examples");
//     expect(res.status).toBe(200);
//     expect(Array.isArray(res.body.data)).toBe(true);
//   });
// });
//
// describe("POST /api/examples (DB)", () => {
//   it("creates a new example and returns 201", async () => {
//     const res = await request(app)
//       .post("/api/examples")
//       .send({ name: "Test Example" });
//     expect(res.status).toBe(201);
//     expect(res.body.data.name).toBe("Test Example");
//     expect(res.body.data.id).toBeDefined();
//   });
// });
