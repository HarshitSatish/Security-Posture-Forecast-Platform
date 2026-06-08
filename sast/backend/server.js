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

  const rules = [
    {
      pattern: /password/i,
      type: "Hardcoded Secret",
      severity: "HIGH"
    },
    {
      pattern: /eval\s*\(/i,
      type: "Dangerous eval()",
      severity: "HIGH"
    },
    {
      pattern: /document\.write/i,
      type: "Potential XSS",
      severity: "MEDIUM"
    },
    {
      pattern: /innerHTML/i,
      type: "Unsafe HTML Injection",
      severity: "MEDIUM"
    },
    {
      pattern: /api[_-]?key/i,
      type: "Exposed API Key",
      severity: "HIGH"
    },
    {
      pattern: /secret[_-]?key/i,
      type: "Exposed Secret Key",
      severity: "HIGH"
    },
    {
      pattern: /localStorage/i,
      type: "Sensitive Data In Local Storage",
      severity: "MEDIUM"
    }
  ];

  rules.forEach((rule) => {
    if (rule.pattern.test(code)) {
      findings.push({
        type: rule.type,
        severity: rule.severity,
        file: "input.js",
        line: 1
      });
    }
  });

  res.json({
    service: "sast-scanner",
    scan_type: "SAST",
    status: "completed",
    high: findings.filter((f) => f.severity === "HIGH").length,
    medium: findings.filter((f) => f.severity === "MEDIUM").length,
    low: findings.filter((f) => f.severity === "LOW").length,
    findings
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("SAST scanner running on port 3000");
  });
}

module.exports = app;