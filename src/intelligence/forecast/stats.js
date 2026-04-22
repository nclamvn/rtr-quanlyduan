// ═══════════════════════════════════════════════════════════
// Statistical utilities for forecast layer
// Pure functions, no IO, no state
// ═══════════════════════════════════════════════════════════

/**
 * Simple moving average over the last `window` values.
 * @param {number[]} series
 * @param {number} window
 * @returns {number} average of last `window` values
 */
export function movingAverage(series, window) {
  if (series.length === 0) return 0;
  const slice = series.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/**
 * OLS linear regression on (x, y) points.
 * Points: [{x, y}] or uses index as x if array of numbers.
 * @param {Array<{x: number, y: number}> | number[]} points
 * @returns {{ slope: number, intercept: number, r_squared: number }}
 */
export function linearTrend(points) {
  const data = Array.isArray(points[0])
    ? points.map(([x, y]) => ({ x, y }))
    : typeof points[0] === "number"
      ? points.map((y, i) => ({ x: i, y }))
      : points;

  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.y || 0, r_squared: 0 };

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;
  for (const { x, y } of data) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r_squared: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  let ssTot = 0,
    ssRes = 0;
  for (const { x, y } of data) {
    ssTot += (y - yMean) ** 2;
    ssRes += (y - (slope * x + intercept)) ** 2;
  }
  const r_squared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r_squared };
}

/**
 * Welford online mean + variance.
 * @param {number[]} series
 * @returns {{ mean: number, variance: number, stdev: number, count: number }}
 */
export function welfordOnline(series) {
  let count = 0,
    mean = 0,
    m2 = 0;
  for (const x of series) {
    count++;
    const delta = x - mean;
    mean += delta / count;
    m2 += delta * (x - mean);
  }
  const variance = count > 1 ? m2 / (count - 1) : 0;
  return { mean, variance, stdev: Math.sqrt(variance), count };
}

/**
 * Confidence interval around an estimate.
 * @param {number} estimate
 * @param {number} stdError
 * @param {number} level - 0.95 default (uses z=1.96)
 * @returns {{ lower: number, upper: number }}
 */
export function confidenceInterval(estimate, stdError, level = 0.95) {
  // z-scores for common levels
  const z = level >= 0.99 ? 2.576 : level >= 0.95 ? 1.96 : level >= 0.9 ? 1.645 : 1.0;
  return {
    lower: estimate - z * stdError,
    upper: estimate + z * stdError,
  };
}

/**
 * Extrapolate from a linear trend result.
 * @param {{ slope: number, intercept: number }} trend - from linearTrend
 * @param {number} daysAhead
 * @param {number} currentX - current x position (last index)
 * @returns {number} predicted y value
 */
export function extrapolate(trend, daysAhead, currentX = 0) {
  return trend.slope * (currentX + daysAhead) + trend.intercept;
}
