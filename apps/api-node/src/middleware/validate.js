/**
 * Shared Input Validators
 *
 * Reusable validation helpers for all critical-path routes.
 * Zero external dependencies.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HTML_TAG_RE = /<[^>]*>/g;

/**
 * Validate UUID v4 format.
 * @param {*} value
 * @returns {string|null} Error message or null if valid.
 */
function validateUUID(value) {
  if (!value || typeof value !== "string") return "must be a non-empty string";
  if (!UUID_RE.test(value)) return "must be a valid UUID";
  return null;
}

/**
 * Validate NORAD catalog ID (1–999999).
 * @param {*} value
 * @returns {{ value: number, error: string|null }}
 */
function validateNoradId(value) {
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { value: NaN, error: "noradId must be an integer" };
  }
  if (n < 1 || n > 999999) {
    return { value: n, error: "noradId must be between 1 and 999999" };
  }
  return { value: n, error: null };
}

/**
 * Validate a positive integer within bounds.
 * @param {*} value
 * @param {number} min
 * @param {number} max
 * @param {string} [fieldName="value"]
 * @returns {{ value: number, error: string|null }}
 */
function validatePositiveInt(value, min, max, fieldName = "value") {
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { value: NaN, error: `${fieldName} must be an integer` };
  }
  if (n < min || n > max) {
    return { value: n, error: `${fieldName} must be between ${min} and ${max}` };
  }
  return { value: n, error: null };
}

/**
 * Validate a finite float within bounds.
 * @param {*} value
 * @param {number} min
 * @param {number} max
 * @param {string} [fieldName="value"]
 * @returns {{ value: number, error: string|null }}
 */
function validateFloat(value, min, max, fieldName = "value") {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (!Number.isFinite(n)) {
    return { value: NaN, error: `${fieldName} must be a finite number` };
  }
  if (n < min || n > max) {
    return { value: n, error: `${fieldName} must be between ${min} and ${max}` };
  }
  return { value: n, error: null };
}

/**
 * Validate value is in an allowed set.
 * @param {*} value
 * @param {string[]} allowed
 * @returns {string|null} Error message or null.
 */
function validateEnum(value, allowed) {
  if (!allowed.includes(value)) {
    return `must be one of: ${allowed.join(", ")}`;
  }
  return null;
}

/**
 * Sanitize a string: trim, strip HTML tags, enforce max length.
 * @param {*} value
 * @param {number} [maxLen=255]
 * @returns {{ value: string, error: string|null }}
 */
function sanitizeString(value, maxLen = 255) {
  if (value === undefined || value === null) {
    return { value: "", error: "must be a non-empty string" };
  }
  if (typeof value !== "string") {
    return { value: "", error: "must be a string" };
  }
  let cleaned = value.trim().replace(HTML_TAG_RE, "");
  if (cleaned.length === 0) {
    return { value: "", error: "must be a non-empty string" };
  }
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen);
  }
  return { value: cleaned, error: null };
}

module.exports = {
  validateUUID,
  validateNoradId,
  validatePositiveInt,
  validateFloat,
  validateEnum,
  sanitizeString,
};
