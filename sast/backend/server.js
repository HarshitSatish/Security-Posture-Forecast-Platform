const express = require("express");
const { persistScanResult } = require("./storage");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "sast-scanner",
    status: "running"
  });
});

async function runScan(code, targetId = "local-code-scan") {
  const findings = [];

  const rules = [
    { pattern: /password/i, type: "Hardcoded Secret", severity: "HIGH" },
    { pattern: /eval\s*\(/i, type: "Dangerous eval()", severity: "HIGH" },
    { pattern: /document\.write/i, type: "Potential XSS", severity: "MEDIUM" },
    { pattern: /innerHTML/i, type: "Unsafe HTML Injection", severity: "MEDIUM" },
    { pattern: /api[_-]?key/i, type: "Exposed API Key", severity: "HIGH" },
    { pattern: /secret[_-]?key/i, type: "Exposed Secret Key", severity: "HIGH" },
    { pattern: /localStorage/i, type: "Sensitive Data In Local Storage", severity: "MEDIUM" }
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

  const scanResult = {
    scan_id: `sast-${Date.now()}`,
    target_id: targetId,
    timestamp: new Date().toISOString(),
    service: "sast-scanner",
    scan_type: "SAST",
    status: "completed",
    high: findings.filter((f) => f.severity === "HIGH").length,
    medium: findings.filter((f) => f.severity === "MEDIUM").length,
    low: findings.filter((f) => f.severity === "LOW").length,
    findings
  };

  const storage = await persistScanResult(scanResult);

  return {
    ...scanResult,
    storage
  };
}

app.post("/scan/code", async (req, res) => {
  const code = req.body.code || "";
  const targetId = req.body.target_id || "local-code-scan";

  const result = await runScan(code, targetId);
  res.json(result);
});

if (process.env.AUTO_SCAN === "true") {
  console.log("ECS auto-scan mode — starting SAST scan...");

  const sampleCode =
    process.env.SCAN_CODE ||
    'const api_key="demo"; localStorage.setItem("token", "demo");';

  const targetId = process.env.SCAN_TARGET || "ecs-auto-sast-scan";

  runScan(sampleCode, targetId)
    .then((result) => {
      console.log("Auto-scan complete:", JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("Auto-scan failed:", err);
      process.exit(1);
    });
} else if (require.main === module) {
  app.listen(3000, () => {
    console.log("SAST scanner running on port 3000");
  });
}

module.exports = app;
module.exports.runScan = runScan;