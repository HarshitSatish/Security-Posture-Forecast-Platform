/**
 * Security Health Score Calculator
 * Owner: Spandan Surdas
 */

const WEIGHTS = { high: 15, medium: 5, low: 1 };

/**
 * Calculate health score from vulnerability counts
 * @param {{ high: number, medium: number, low: number }} findings
 * @returns {number} score 0-100
 */
function calculateHealthScore({ high = 0, medium = 0, low = 0 }) {
  const deduction = (high * WEIGHTS.high) + (medium * WEIGHTS.medium) + (low * WEIGHTS.low);
  return Math.max(0, 100 - deduction);
}

/**
 * Classify score into a risk zone
 * @param {number} score
 * @returns {string}
 */
function getRiskZone(score) {
  if (score >= 80) return 'Safe';
  if (score >= 60) return 'Warning';
  return 'High Risk';
}

/**
 * Project score at day +14 using linear regression over history
 * @param {Array<{ score: number }>} history - oldest first
 * @returns {number} projected score
 */
function forecastScore(history) {
  if (history.length < 2) return history[0]?.score ?? 100;
  const n = history.length;
  const xs = history.map((_, i) => i);
  const ys = history.map(h => h.score);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const slope = xs.reduce((acc, x, i) => acc + (x - xMean) * (ys[i] - yMean), 0)
              / xs.reduce((acc, x) => acc + Math.pow(x - xMean, 2), 0);
  const intercept = yMean - slope * xMean;
  return Math.max(0, Math.min(100, Math.round(intercept + slope * (n + 14))));
}

module.exports = { calculateHealthScore, getRiskZone, forecastScore };
