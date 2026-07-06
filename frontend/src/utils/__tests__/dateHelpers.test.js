import { calculateAge } from "../dateHelpers";

describe("calculateAge", () => {
  it("returns null for null input", () => {
    expect(calculateAge(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(calculateAge(undefined)).toBeNull();
  });

  it("calculates age correctly for a 30-year-old", () => {
    const thirtyYearsAgo = new Date();
    thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
    const result = calculateAge(thirtyYearsAgo.toISOString());
    expect(result).toBe(30);
  });

  it("returns null for a birthday that hasn't happened yet (future date in same year)", () => {
    const today = new Date();
    const future = new Date(today.getFullYear() + 1, 0, 1);
    const age = calculateAge(future.toISOString());
    expect(age).toBeNull();
  });

  it("returns null for future date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const age = calculateAge(future.toISOString());
    expect(age).toBeNull();
  });

  it("handles ISO date string", () => {
    const age = calculateAge("1990-06-15");
    expect(typeof age).toBe("number");
    expect(age).toBeGreaterThan(30);
  });

  it("handles invalid date string", () => {
    expect(calculateAge("not-a-date")).toBeNull();
  });
});
