import { describe, it, expect } from "vitest";
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateStringLength,
  validateNumber,
  validateDate,
  sanitizeHtml,
  checkRateLimit,
  ValidationError,
} from "@/lib/validation";

describe("ValidationError", () => {
  it("is an instance of Error with the right message", () => {
    const err = new ValidationError("oops");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("oops");
    expect(err.name).toBe("ValidationError");
  });
});

describe("validateRequired", () => {
  it("throws for empty string", () => {
    expect(() => validateRequired("", "Name")).toThrow("Name is required");
  });

  it("throws for whitespace-only string", () => {
    expect(() => validateRequired("   ", "Name")).toThrow("Name is required");
  });

  it("throws for null/undefined", () => {
    expect(() => validateRequired(null, "Field")).toThrow("Field is required");
    expect(() => validateRequired(undefined, "Field")).toThrow("Field is required");
  });

  it("returns trimmed value", () => {
    expect(validateRequired("  Alice  ", "Name")).toBe("Alice");
  });

  it("returns non-string values as-is", () => {
    expect(validateRequired(42, "Count")).toBe(42);
  });
});

describe("validateEmail", () => {
  it("throws for invalid format", () => {
    expect(() => validateEmail("notanemail")).toThrow("Invalid email format");
    expect(() => validateEmail("missing@tld")).toThrow("Invalid email format");
  });

  it("throws for empty email", () => {
    expect(() => validateEmail("")).toThrow("Email is required");
  });

  it("returns clean email for valid input", () => {
    expect(validateEmail("  user@example.com  ")).toBe("user@example.com");
  });
});

describe("validatePhone", () => {
  it("throws for invalid phone", () => {
    expect(() => validatePhone("abc")).toThrow("Invalid phone number format");
  });

  it("throws for empty phone", () => {
    expect(() => validatePhone("")).toThrow("Phone number is required");
  });

  it("accepts valid US phone", () => {
    expect(() => validatePhone("+15005550001")).not.toThrow();
  });

  it("accepts 10-digit phone", () => {
    expect(() => validatePhone("5005550001")).not.toThrow();
  });
});

describe("validateStringLength", () => {
  it("throws when value is shorter than min", () => {
    expect(() => validateStringLength("ab", "Field", 3, 10)).toThrow("Field must be at least 3 characters");
  });

  it("throws when value exceeds max", () => {
    expect(() => validateStringLength("abcde", "Field", 1, 3)).toThrow("Field must be less than 3 characters");
  });

  it("does not throw for value within range", () => {
    expect(() => validateStringLength("abc", "Field", 1, 5)).not.toThrow();
  });

  it("returns the trimmed value", () => {
    expect(validateStringLength("  hi  ", "Field", 1, 10)).toBe("hi");
  });
});

describe("validateNumber", () => {
  it("throws for NaN", () => {
    expect(() => validateNumber("abc", "Seats")).toThrow("Seats must be a valid number");
  });

  it("throws when below min", () => {
    expect(() => validateNumber(0, "Seats", 1, 6)).toThrow("Seats must be at least 1");
  });

  it("throws when above max", () => {
    expect(() => validateNumber(7, "Seats", 1, 6)).toThrow("Seats must be at most 6");
  });

  it("accepts boundary values", () => {
    expect(validateNumber(1, "Seats", 1, 6)).toBe(1);
    expect(validateNumber(6, "Seats", 1, 6)).toBe(6);
  });

  it("accepts value with no min/max", () => {
    expect(validateNumber(999, "Count")).toBe(999);
  });
});

describe("validateDate", () => {
  it("throws for invalid date string", () => {
    expect(() => validateDate("not-a-date", "Departure")).toThrow("Invalid Departure format");
  });

  it("throws for past date", () => {
    const past = new Date(Date.now() - 60000).toISOString();
    expect(() => validateDate(past, "Departure")).toThrow("cannot be in the past");
  });

  it("returns a Date object for a valid future date", () => {
    const future = new Date(Date.now() + 60000).toISOString();
    const result = validateDate(future, "Departure");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("sanitizeHtml", () => {
  it("removes script tags", () => {
    expect(sanitizeHtml('<script>alert("xss")</script>hello')).toBe("hello");
  });

  it("removes HTML tags", () => {
    expect(sanitizeHtml("<b>bold</b>")).toBe("bold");
  });

  it("trims whitespace", () => {
    expect(sanitizeHtml("  hello  ")).toBe("hello");
  });

  it("returns plain text unchanged", () => {
    expect(sanitizeHtml("plain text")).toBe("plain text");
  });
});

describe("checkRateLimit", () => {
  it("returns true when under the limit", () => {
    expect(checkRateLimit("test-id-unique-1", 5)).toBe(true);
  });

  it("returns false when limit is exceeded", () => {
    const id = "test-id-unique-2";
    for (let i = 0; i < 3; i++) checkRateLimit(id, 3);
    expect(checkRateLimit(id, 3)).toBe(false);
  });

  it("returns true for different identifiers independently", () => {
    checkRateLimit("id-a", 1);
    expect(checkRateLimit("id-b", 1)).toBe(true);
  });
});
