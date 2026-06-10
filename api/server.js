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

// Table name (from Terraform)
const TABLE_NAME = "spandan-security-forecast-scan-results";


// ======================
// SCORES API (DYNAMODB)
// ======================
app.get("/scores", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME
    };

    const result = await dynamoDB.scan(params).promise();

    const formatted = result.Items.map(item => ({
      appId: item.appId || item.scan_id,
      score: item.score,
      riskLevel: item.riskLevel
    }));

    res.json(formatted);

  } catch (err) {
    console.error("DynamoDB error (/scores):", err);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});


// ======================
// FORECAST API (DYNAMIC)
// ======================
app.get("/forecast", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME
    };

    const result = await dynamoDB.scan(params).promise();

    const items = result.Items || [];

    const highRiskApps = items
      .filter(item => item.riskLevel === "High Risk")
      .map(item => item.appId || item.scan_id);

    res.json({
      message: "Risk trend analysis running",
      prediction:
        highRiskApps.length > 0
          ? `${highRiskApps.join(" and ")} trending HIGH RISK in 14 days`
          : "No high risk trends detected"
    });

  } catch (err) {
    console.error("DynamoDB error (/forecast):", err);
    res.status(500).json({ error: "Failed to generate forecast" });
  }
});


// ======================
// STATUS API
// ======================
app.get("/status", (req, res) => {
  res.json({
    pipeline: "healthy",
    lastRun: new Date().toISOString(),
    ecs: "not deployed yet"
  });
});


// ======================
// START SERVER
// ======================
app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});
