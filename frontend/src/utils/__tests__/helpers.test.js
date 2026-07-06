import {
  formatCurrency,
  formatPhoneNumber,
  isValidAadhaar,
  convertTo12Hour,
  getBMICategory,
  getBPCategory,
  capitalize,
  truncate,
  getInitials,
  groupBy,
  sortBy,
} from "../helpers";

describe("formatCurrency", () => {
  it("formats number with rupee symbol", () => {
    expect(formatCurrency(500)).toBe("₹500.00");
  });

  it("formats without symbol", () => {
    expect(formatCurrency(500, false)).toBe("500.00");
  });

  it("handles null and undefined", () => {
    expect(formatCurrency(null)).toBe("₹0");
    expect(formatCurrency(undefined)).toBe("₹0");
  });

  it("handles NaN", () => {
    expect(formatCurrency(NaN)).toBe("₹0");
  });
});

describe("formatPhoneNumber", () => {
  it("formats 10-digit Indian number", () => {
    expect(formatPhoneNumber("9876543210")).toBe("+91 98765 43210");
  });

  it("formats 12-digit number with 91 prefix", () => {
    expect(formatPhoneNumber("919876543210")).toBe("+91 98765 43210");
  });

  it("returns original for unknown format", () => {
    expect(formatPhoneNumber("123")).toBe("123");
  });
});

describe("isValidAadhaar", () => {
  it("accepts valid 12-digit aadhaar", () => {
    expect(isValidAadhaar("123456789012")).toBe(true);
  });

  it("rejects short aadhaar", () => {
    expect(isValidAadhaar("12345678")).toBe(false);
  });

  it("rejects aadhaar with letters", () => {
    expect(isValidAadhaar("12345678901a")).toBe(false);
  });

  it("rejects non-digits", () => {
    expect(isValidAadhaar("abcd efgh ijkl")).toBe(false);
  });
});

describe("convertTo12Hour", () => {
  it("converts 00:00 to 12:00 AM", () => {
    expect(convertTo12Hour("00:00")).toBe("12:00 AM");
  });

  it("converts 12:00 to 12:00 PM", () => {
    expect(convertTo12Hour("12:00")).toBe("12:00 PM");
  });

  it("converts 09:30 to 09:30 AM", () => {
    expect(convertTo12Hour("09:30")).toBe("09:30 AM");
  });

  it("converts 15:45 to 03:45 PM", () => {
    expect(convertTo12Hour("15:45")).toBe("03:45 PM");
  });
});

describe("getBMICategory", () => {
  it("returns underweight for BMI < 18.5", () => {
    expect(getBMICategory(16)).toBe("Underweight");
  });

  it("returns normal for BMI 18.5-24.9", () => {
    expect(getBMICategory(22)).toBe("Normal");
  });

  it("returns overweight for BMI 25-29.9", () => {
    expect(getBMICategory(27)).toBe("Overweight");
  });

  it("returns obese for BMI >= 30", () => {
    expect(getBMICategory(32)).toBe("Obese");
  });
});

describe("getBPCategory", () => {
  it("returns normal for 110/70", () => {
    expect(getBPCategory(110, 70)).toBe("Normal");
  });

  it("returns elevated for 125/79", () => {
    expect(getBPCategory(125, 79)).toBe("Elevated");
  });

  it("returns High (Stage 1) for 125/80", () => {
    expect(getBPCategory(125, 80)).toBe("High (Stage 1)");
  });

  it("returns High (Stage 1) for 135/85", () => {
    expect(getBPCategory(135, 85)).toBe("High (Stage 1)");
  });

  it("returns High (Stage 2) for 150/95", () => {
    expect(getBPCategory(150, 95)).toBe("High (Stage 2)");
  });
});

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });
});

describe("truncate", () => {
  it("truncates long string", () => {
    expect(truncate("Hello world this is long", 10)).toBe("Hello w...");
  });

  it("returns full string if under max", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("uses default maxLength of 50", () => {
    const long = "a".repeat(100);
    expect(truncate(long)).toBe("a".repeat(47) + "...");
  });
});

describe("getInitials", () => {
  it("returns initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns single letter for one-word name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("handles empty name", () => {
    expect(getInitials("")).toBe("");
  });
});

describe("groupBy", () => {
  const items = [
    { type: "A", value: 1 },
    { type: "B", value: 2 },
    { type: "A", value: 3 },
  ];

  it("groups items by key", () => {
    const result = groupBy(items, "type");
    expect(result.A).toHaveLength(2);
    expect(result.B).toHaveLength(1);
  });

  it("returns empty object for empty array", () => {
    expect(groupBy([], "type")).toEqual({});
  });
});

describe("sortBy", () => {
  it("sorts ascending by default", () => {
    const items = [{ name: "C" }, { name: "A" }, { name: "B" }];
    expect(sortBy(items, "name")).toEqual([{ name: "A" }, { name: "B" }, { name: "C" }]);
  });

  it("sorts descending", () => {
    const items = [{ n: 1 }, { n: 3 }, { n: 2 }];
    expect(sortBy(items, "n", "desc")).toEqual([{ n: 3 }, { n: 2 }, { n: 1 }]);
  });
});
