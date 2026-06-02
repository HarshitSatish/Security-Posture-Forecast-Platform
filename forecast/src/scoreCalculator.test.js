/**
 * Basic tests for score calculator
 * Run: node src/scoreCalculator.test.js
 */
const { calculateHealthScore, getRiskZone, forecastScore } = require('./scoreCalculator');

const tests = [
  ['No findings → 100',      () => calculateHealthScore({}) === 100],
  ['1 high → 85',            () => calculateHealthScore({ high: 1 }) === 85],
  ['2 high + 3 medium → 55', () => calculateHealthScore({ high: 2, medium: 3 }) === 55],
  ['Score 95 → Safe',        () => getRiskZone(95) === 'Safe'],
  ['Score 70 → Warning',     () => getRiskZone(70) === 'Warning'],
  ['Score 50 → High Risk',   () => getRiskZone(50) === 'High Risk'],
  ['Forecast declining trend',() => {
    const history = [{ score: 96 }, { score: 92 }, { score: 88 }, { score: 84 }];
    return forecastScore(history) < 80;
  }],
];

let passed = 0;
tests.forEach(([name, fn]) => {
  const ok = fn();
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (ok) passed++;
});
console.log(`\n${passed}/${tests.length} tests passed`);
