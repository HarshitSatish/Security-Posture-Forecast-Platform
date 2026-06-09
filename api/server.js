const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Load mock data
const data = JSON.parse(
  fs.readFileSync("../forecast/mockDynamo.json", "utf-8")
);

// Scores API
app.get("/scores", (req, res) => {
  res.json(data.map(d => ({
    appId: d.appId,
    score: d.score,
    riskLevel: d.riskLevel
  })));
});

// Forecast API
app.get("/forecast", (req, res) => {
  res.json({
    message: "Risk trend analysis running",
    prediction: "APP#1 and APP#3 trending HIGH RISK in 14 days"
  });
});

// Status API
app.get("/status", (req, res) => {
  res.json({
    pipeline: "healthy",
    lastRun: new Date().toISOString(),
    ecs: "not deployed yet"
  });
});

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});
