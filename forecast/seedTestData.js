const { calculateHealthScore, getRiskZone } = require("./src/scoreCalculator");

const fs = require("fs");

const testData = [
  {
    appId: "APP#1",
    sastFindings: 2,
    pentestFindings: 1,
    timestamp: new Date().toISOString()
  },
  {
    appId: "APP#2",
    sastFindings: 0,
    pentestFindings: 0,
    timestamp: new Date().toISOString()
  },
  {
    appId: "APP#3",
    sastFindings: 5,
    pentestFindings: 3,
    timestamp: new Date().toISOString()
  }
];

// Convert to expected format

const results = testData.map(item => {
  const score = calculateHealthScore({
    high: item.sastFindings + item.pentestFindings,
    medium: 0,
    low: 0
  });

  const riskLevel = getRiskZone(score);

  return {
    ...item,
    score,
    riskLevel
  };
});

console.log("Processed Data with Scores:");
console.log(JSON.stringify(results, null, 2));

fs.writeFileSync("mockDynamo.json", JSON.stringify(results, null, 2));

console.log("Data stored in mockDynamo.json");

results.forEach(item => {
  if (item.riskLevel === "High Risk") {
    console.log(`ALERT: ${item.appId} is HIGH RISK`);
  }
});
