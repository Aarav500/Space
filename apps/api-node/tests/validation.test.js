/**
 * Validation Middleware Unit Tests
 */

const {
  validateUUID,
  validateNoradId,
  validatePositiveInt,
  validateFloat,
  validateEnum,
  sanitizeString,
} = require("../src/middleware/validate");

/* ─── validateUUID ─────────────────────────────────────────────────── */

describe("validateUUID()", () => {
  it("returns null for valid UUID", () => {
    expect(validateUUID("550e8400-e29b-41d4-a716-446655440000")).toBeNull();
    expect(validateUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBeNull();
  });

  it("rejects empty/null/undefined", () => {
    expect(validateUUID(null)).not.toBeNull();
    expect(validateUUID(undefined)).not.toBeNull();
    expect(validateUUID("")).not.toBeNull();
  });

  it("rejects non-UUID strings", () => {
    expect(validateUUID("not-a-uuid")).not.toBeNull();
    expect(validateUUID("12345")).not.toBeNull();
    expect(validateUUID("550e8400-e29b-41d4-a716")).not.toBeNull(); // too short
  });

  it("rejects non-string types", () => {
    expect(validateUUID(123)).not.toBeNull();
    expect(validateUUID({})).not.toBeNull();
  });
});

/* ─── validateNoradId ──────────────────────────────────────────────── */

describe("validateNoradId()", () => {
  it("returns value for valid NORAD IDs", () => {
    expect(validateNoradId(25544)).toEqual({ value: 25544, error: null });
    expect(validateNoradId(1)).toEqual({ value: 1, error: null });
    expect(validateNoradId(999999)).toEqual({ value: 999999, error: null });
  });

  it("parses string NORAD IDs", () => {
    expect(validateNoradId("25544")).toEqual({ value: 25544, error: null });
  });

  it("rejects out-of-range values", () => {
    expect(validateNoradId(0).error).not.toBeNull();
    expect(validateNoradId(-1).error).not.toBeNull();
    expect(validateNoradId(1000000).error).not.toBeNull();
  });

  it("rejects non-numeric values", () => {
    expect(validateNoradId("abc").error).not.toBeNull();
    expect(validateNoradId(NaN).error).not.toBeNull();
    expect(validateNoradId(Infinity).error).not.toBeNull();
  });

  it("rejects floats", () => {
    expect(validateNoradId(25544.5).error).not.toBeNull();
  });
});

/* ─── validatePositiveInt ──────────────────────────────────────────── */

describe("validatePositiveInt()", () => {
  it("returns value for valid bounded integer", () => {
    expect(validatePositiveInt(5, 1, 100)).toEqual({ value: 5, error: null });
    expect(validatePositiveInt("50", 1, 100)).toEqual({ value: 50, error: null });
  });

  it("rejects out-of-range values", () => {
    expect(validatePositiveInt(0, 1, 100).error).not.toBeNull();
    expect(validatePositiveInt(101, 1, 100).error).not.toBeNull();
  });

  it("rejects non-integers", () => {
    expect(validatePositiveInt("abc", 1, 100).error).not.toBeNull();
    expect(validatePositiveInt(NaN, 1, 100).error).not.toBeNull();
  });

  it("includes field name in error", () => {
    const result = validatePositiveInt(-1, 1, 100, "hours");
    expect(result.error).toContain("hours");
  });
});

/* ─── validateFloat ────────────────────────────────────────────────── */

describe("validateFloat()", () => {
  it("returns value for valid bounded float", () => {
    expect(validateFloat(0.5, 0, 1)).toEqual({ value: 0.5, error: null });
    expect(validateFloat("0.001", 0, 1)).toEqual({ value: 0.001, error: null });
  });

  it("rejects out-of-range values", () => {
    expect(validateFloat(-0.1, 0, 1).error).not.toBeNull();
    expect(validateFloat(1.1, 0, 1).error).not.toBeNull();
  });

  it("rejects NaN/Infinity", () => {
    expect(validateFloat(NaN, 0, 1).error).not.toBeNull();
    expect(validateFloat(Infinity, 0, 1).error).not.toBeNull();
  });
});

/* ─── validateEnum ─────────────────────────────────────────────────── */

describe("validateEnum()", () => {
  const allowed = ["email", "sms", "webhook"];

  it("returns null for valid values", () => {
    expect(validateEnum("email", allowed)).toBeNull();
    expect(validateEnum("sms", allowed)).toBeNull();
  });

  it("returns error for invalid values", () => {
    expect(validateEnum("phone", allowed)).not.toBeNull();
    expect(validateEnum("", allowed)).not.toBeNull();
  });
});

/* ─── sanitizeString ───────────────────────────────────────────────── */

describe("sanitizeString()", () => {
  it("returns trimmed string", () => {
    expect(sanitizeString("  hello  ")).toEqual({ value: "hello", error: null });
  });

  it("strips HTML tags", () => {
    expect(sanitizeString("<script>alert('xss')</script>hello")).toEqual(
      { value: "alert('xss')hello", error: null }
    );
    expect(sanitizeString("<b>bold</b>")).toEqual({ value: "bold", error: null });
  });

  it("enforces max length", () => {
    const long = "a".repeat(300);
    const result = sanitizeString(long, 255);
    expect(result.value.length).toBe(255);
    expect(result.error).toBeNull();
  });

  it("rejects empty/null", () => {
    expect(sanitizeString(null).error).not.toBeNull();
    expect(sanitizeString("").error).not.toBeNull();
    expect(sanitizeString("   ").error).not.toBeNull();
  });

  it("rejects non-strings", () => {
    expect(sanitizeString(123).error).not.toBeNull();
    expect(sanitizeString({}).error).not.toBeNull();
  });
});
