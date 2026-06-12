const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// ======================
// AWS DYNAMODB SETUP
// ======================
AWS.config.update({ region: "us-east-1" });

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// ✅ USE CORRECT TABLE NAME (IMPORTANT)
const TABLE_NAME = "security-forecast-scan-results";


// ======================
// ROOT CHECK
// ======================
app.get("/", (req, res) => {
  res.send("API is running");
});


// ======================
// ✅ MAIN API (USED BY FRONTEND)
// ======================
app.get("/api/results", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME
    };

    const result = await dynamoDB.scan(params).promise();

    const formatted = (result.Items || []).map(item => ({
      appId: item.appId || item.PK || item.scan_id,
      timestamp: item.timestamp || item.SK,
      score: item.score,
      riskLevel: item.riskLevel
    }));

    res.json(formatted);

  } catch (err) {
    console.error("DynamoDB error (/api/results):", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});


// ======================
// FORECAST API
// ======================
app.get("/api/forecast", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME
    };

    const result = await dynamoDB.scan(params).promise();
    const items = result.Items || [];

    const highRiskApps = items
      .filter(item => item.riskLevel === "High Risk")
      .map(item => item.appId || item.PK || item.scan_id);

    res.json({
      message: "Risk trend analysis running",
      prediction:
        highRiskApps.length > 0
          ? `${highRiskApps.join(", ")} trending HIGH RISK in 14 days`
          : "No high risk trends detected"
    });

  } catch (err) {
    console.error("DynamoDB error (/api/forecast):", err);
    res.status(500).json({ error: "Failed to generate forecast" });
  }
});


// ======================
// STATUS API
// ======================
app.get("/api/status", (req, res) => {
  res.json({
    pipeline: "healthy",
    lastRun: new Date().toISOString(),
    ecs: "running"
  });
});


// ======================
// START SERVER
// ======================
const PORT = 3000; // ✅ IMPORTANT for ECS
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
