/**
 * NOAA Service Unit Tests
 */

const { extractStormLevel } = require("../src/services/noaa");

describe("extractStormLevel()", () => {
  it("extracts G1 from message", () => {
    expect(extractStormLevel("Geomagnetic Storm Warning: G1 Minor expected")).toBe("G1");
  });

  it("extracts G5 from message", () => {
    expect(extractStormLevel("EXTREME G5 GEOMAGNETIC STORM")).toBe("G5");
  });

  it("returns null for non-storm message", () => {
    expect(extractStormLevel("Solar wind normal conditions")).toBeNull();
  });

  it("returns null for empty/null input", () => {
    expect(extractStormLevel(null)).toBeNull();
    expect(extractStormLevel("")).toBeNull();
  });
});
