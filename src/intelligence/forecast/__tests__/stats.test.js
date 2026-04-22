import { describe, it, expect } from "vitest";
import { movingAverage, linearTrend, welfordOnline, confidenceInterval, extrapolate } from "../stats.js";

describe("movingAverage", () => {
  it("computes average of last N values", () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toBe(4); // (3+4+5)/3
  });

  it("handles window larger than series", () => {
    expect(movingAverage([10, 20], 5)).toBe(15);
  });

  it("returns 0 for empty series", () => {
    expect(movingAverage([], 3)).toBe(0);
  });
});

describe("linearTrend", () => {
  it("finds positive slope for increasing series", () => {
    const result = linearTrend([0, 1, 2, 3, 4]);
    expect(result.slope).toBe(1);
    expect(result.intercept).toBe(0);
    expect(result.r_squared).toBeCloseTo(1.0, 5);
  });

  it("returns 0 slope for constant series", () => {
    const result = linearTrend([5, 5, 5, 5]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(5);
  });
});

describe("welfordOnline", () => {
  it("computes mean and stdev correctly", () => {
    const result = welfordOnline([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result.mean).toBe(5);
    expect(result.stdev).toBeCloseTo(2.0, 0);
    expect(result.count).toBe(8);
  });

  it("handles single value", () => {
    const result = welfordOnline([42]);
    expect(result.mean).toBe(42);
    expect(result.variance).toBe(0);
  });
});

describe("confidenceInterval", () => {
  it("computes 95% CI bounds", () => {
    const ci = confidenceInterval(10, 2, 0.95);
    expect(ci.lower).toBeCloseTo(6.08, 1);
    expect(ci.upper).toBeCloseTo(13.92, 1);
  });
});

describe("extrapolate", () => {
  it("projects forward from trend", () => {
    const trend = { slope: 2, intercept: 10 };
    expect(extrapolate(trend, 5, 0)).toBe(20); // 2*5 + 10
    expect(extrapolate(trend, 3, 10)).toBe(36); // 2*13 + 10
  });
});
