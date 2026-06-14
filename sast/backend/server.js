const express = require("express");
const { persistScanResult } = require("./storage");
const fs = require("fs");
const path = require("path");
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
    { pattern: /localStorage/i, type: "Sensitive Data In Local Storage", severity: "MEDIUM" },
    { pattern: /SELECT\s+\*\s+FROM.+\+/i, type: "Possible SQL Injection", severity: "HIGH" },
{ pattern: /db\.collection\(.*\)\.(find|findOne|deleteOne)\(req\./i, type: "Possible NoSQL Injection", severity: "HIGH" },
{ pattern: /exec\s*\(/i, type: "Command Execution", severity: "HIGH" },
{ pattern: /dangerouslySetInnerHTML/i, type: "React XSS Risk", severity: "HIGH" },
{ pattern: /\.\.\/\.\.\//i, type: "Path Traversal", severity: "HIGH" },
{ pattern: /Math\.random/i, type: "Insecure Randomness", severity: "MEDIUM" },
{ pattern: /console\.log\(.*(password|token|api)/i, type: "Sensitive Data Logging", severity: "MEDIUM" },
{ pattern: /createHash\(['"](md5|sha1)['"]\)/i, type: "Weak Cryptography", severity: "MEDIUM" },
{ pattern: /createCipher\(['"]des['"]/i, type: "Weak Encryption Algorithm", severity: "HIGH" },
{ pattern: /(TODO|FIXME|HACK|XXX).*security/i, type: "Security TODO Comment", severity: "LOW" }
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
  fs.readFileSync(
    path.join(__dirname, "samples", "test-vulnerable.js"),
    "utf8"
  );

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