const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "sast-scanner",
    status: "running"
  });
});

app.post("/scan/code", (req, res) => {
  const code = req.body.code || "";
  const findings = [];

  if (code.includes("password")) {
    findings.push({
      type: "Hardcoded Secret",
      severity: "HIGH",
      file: "input.js",
      line: 1
    });
  }

  if (code.includes("eval")) {
    findings.push({
      type: "Insecure Function",
      severity: "HIGH",
      file: "input.js",
      line: 1
    });
  }

  res.json({
    service: "sast-scanner",
    scan_type: "SAST",
    status: "completed",
    high: findings.filter(f => f.severity === "HIGH").length,
    medium: 0,
    low: 0,
    findings
  });
});

app.listen(3000, () => {
  console.log("SAST scanner running on port 3000");
});
