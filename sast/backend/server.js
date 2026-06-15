const express = require("express");
const { persistScanResult } = require("./storage");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({
    service: "sast-scanner",
    status: "running"
  });
});

const rules = [
  {
    pattern: /password\s*=\s*["'][^"']+["']/i,
    type: "Hardcoded Password",
    severity: "HIGH",
    cwe: "CWE-798",
    owasp: "A07:2021 Identification and Authentication Failures",
    confidence: "HIGH",
    remediation: "Move passwords to environment variables or AWS Secrets Manager."
  },
  {
    pattern: /api[_-]?key\s*=\s*["'][^"']+["']/i,
    type: "Exposed API Key",
    severity: "HIGH",
    cwe: "CWE-798",
    owasp: "A07:2021 Identification and Authentication Failures",
    confidence: "HIGH",
    remediation: "Do not hardcode API keys. Store them securely in a secrets manager."
  },
  {
    pattern: /secret[_-]?key\s*=\s*["'][^"']+["']/i,
    type: "Exposed Secret Key",
    severity: "HIGH",
    cwe: "CWE-798",
    owasp: "A07:2021 Identification and Authentication Failures",
    confidence: "HIGH",
    remediation: "Store secret keys in a secure secret store instead of source code."
  },
  {
    pattern: /mongodb:\/\/.*:.*@/i,
    type: "Hardcoded Database Credentials",
    severity: "HIGH",
    cwe: "CWE-798",
    owasp: "A07:2021 Identification and Authentication Failures",
    confidence: "HIGH",
    remediation: "Move database credentials to environment variables or AWS Secrets Manager."
  },
  {
    pattern: /AKIA[0-9A-Z]{16}/,
    type: "AWS Access Key Exposure",
    severity: "CRITICAL",
    cwe: "CWE-798",
    owasp: "A07:2021 Identification and Authentication Failures",
    confidence: "HIGH",
    remediation: "Immediately rotate the exposed AWS key and remove it from source code."
  },
  {
    pattern: /eval\s*\(/i,
    type: "Dangerous eval()",
    severity: "HIGH",
    cwe: "CWE-95",
    owasp: "A03:2021 Injection",
    confidence: "HIGH",
    remediation: "Avoid eval(). Use safe parsing or predefined logic instead."
  },
  {
    pattern: /new Function\s*\(/i,
    type: "Dynamic Code Execution",
    severity: "HIGH",
    cwe: "CWE-95",
    owasp: "A03:2021 Injection",
    confidence: "HIGH",
    remediation: "Avoid dynamic function creation from user-controlled data."
  },
  {
    pattern: /exec\s*\(/i,
    type: "Command Execution",
    severity: "HIGH",
    cwe: "CWE-78",
    owasp: "A03:2021 Injection",
    confidence: "MEDIUM",
    remediation: "Avoid passing user input to shell commands. Use safe APIs and validation."
  },
  {
    pattern: /SELECT\s+\*\s+FROM.+\+/i,
    type: "Possible SQL Injection",
    severity: "HIGH",
    cwe: "CWE-89",
    owasp: "A03:2021 Injection",
    confidence: "MEDIUM",
    remediation: "Use parameterized queries or prepared statements."
  },
  {
    pattern: /db\.collection\(.*\)\.(find|findOne|deleteOne)\(req\./i,
    type: "Possible NoSQL Injection",
    severity: "HIGH",
    cwe: "CWE-943",
    owasp: "A03:2021 Injection",
    confidence: "MEDIUM",
    remediation: "Validate and sanitize request objects before using them in database queries."
  },
  {
    pattern: /innerHTML/i,
    type: "Unsafe HTML Injection",
    severity: "MEDIUM",
    cwe: "CWE-79",
    owasp: "A03:2021 Injection",
    confidence: "MEDIUM",
    remediation: "Avoid innerHTML with user input. Use textContent or sanitize HTML."
  },
  {
    pattern: /document\.write/i,
    type: "Potential XSS",
    severity: "MEDIUM",
    cwe: "CWE-79",
    owasp: "A03:2021 Injection",
    confidence: "MEDIUM",
    remediation: "Avoid document.write with dynamic or user-controlled content."
  },
  {
    pattern: /dangerouslySetInnerHTML/i,
    type: "React XSS Risk",
    severity: "HIGH",
    cwe: "CWE-79",
    owasp: "A03:2021 Injection",
    confidence: "HIGH",
    remediation: "Avoid dangerouslySetInnerHTML or sanitize HTML before rendering."
  },
  {
  pattern: /localStorage/i,
  type: "Sensitive Data In Local Storage",
  severity: "MEDIUM",
  cwe: "CWE-922",
  owasp: "A02:2021 Cryptographic Failures",
  confidence: "MEDIUM",
  remediation: "Avoid storing sensitive data in localStorage. Use secure, httpOnly cookies or server-side storage."
},
  {
    pattern: /\.\.\/\.\.\//i,
    type: "Path Traversal",
    severity: "HIGH",
    cwe: "CWE-22",
    owasp: "A01:2021 Broken Access Control",
    confidence: "HIGH",
    remediation: "Normalize and validate file paths. Restrict access to approved directories."
  },
  {
    pattern: /fs\.readFile\(req\./i,
    type: "Unsafe File Read",
    severity: "HIGH",
    cwe: "CWE-22",
    owasp: "A01:2021 Broken Access Control",
    confidence: "MEDIUM",
    remediation: "Do not directly use request input for file paths."
  },
  {
    pattern: /path\.join\(.*req\./i,
    type: "Path Traversal Risk",
    severity: "HIGH",
    cwe: "CWE-22",
    owasp: "A01:2021 Broken Access Control",
    confidence: "MEDIUM",
    remediation: "Validate filenames and prevent directory traversal sequences."
  },
  {
    pattern: /Math\.random/i,
    type: "Insecure Randomness",
    severity: "MEDIUM",
    cwe: "CWE-338",
    owasp: "A02:2021 Cryptographic Failures",
    confidence: "HIGH",
    remediation: "Use crypto.randomBytes() or crypto.randomUUID() for security tokens."
  },
  {
    pattern: /console\.log\(.*(password|token|api|key)/i,
    type: "Sensitive Data Logging",
    severity: "MEDIUM",
    cwe: "CWE-532",
    owasp: "A09:2021 Security Logging and Monitoring Failures",
    confidence: "MEDIUM",
    remediation: "Do not log passwords, tokens, API keys, or sensitive data."
  },
  {
    pattern: /createHash\(['"](md5|sha1)['"]\)/i,
    type: "Weak Cryptography",
    severity: "MEDIUM",
    cwe: "CWE-327",
    owasp: "A02:2021 Cryptographic Failures",
    confidence: "HIGH",
    remediation: "Use stronger algorithms such as bcrypt, Argon2, SHA-256, or SHA-512 depending on the use case."
  },
  {
    pattern: /createCipher\(['"]des['"]/i,
    type: "Weak Encryption Algorithm",
    severity: "HIGH",
    cwe: "CWE-327",
    owasp: "A02:2021 Cryptographic Failures",
    confidence: "HIGH",
    remediation: "Avoid DES. Use AES-256-GCM or another modern authenticated encryption algorithm."
  },
  {
    pattern: /http:\/\//i,
    type: "Insecure HTTP Usage",
    severity: "MEDIUM",
    cwe: "CWE-319",
    owasp: "A02:2021 Cryptographic Failures",
    confidence: "MEDIUM",
    remediation: "Use HTTPS instead of HTTP for network communication."
  },
  {
    pattern: /(TODO|FIXME|HACK|XXX).*security/i,
    type: "Security TODO Comment",
    severity: "LOW",
    cwe: "CWE-546",
    owasp: "A06:2021 Vulnerable and Outdated Components",
    confidence: "LOW",
    remediation: "Track and resolve security-related TODO comments before production release."
  }
];

function calculateRiskScore(findings) {
  const weights = {
    CRITICAL: 10,
    HIGH: 7,
    MEDIUM: 4,
    LOW: 1
  };

  const rawScore = findings.reduce((total, finding) => {
    return total + (weights[finding.severity] || 0);
  }, 0);

  return Math.min(rawScore, 100);
}

function getRiskLevel(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  if (score > 0) return "LOW";
  return "CLEAN";
}

function generateForecast(findings, riskScore) {
  const critical = findings.filter((f) => f.severity === "CRITICAL").length;
  const high = findings.filter((f) => f.severity === "HIGH").length;
  const medium = findings.filter((f) => f.severity === "MEDIUM").length;

  let trend = "Stable";
  let predictedRisk = getRiskLevel(riskScore);
  let priority = "No major issues detected.";

  if (critical > 0 || high >= 5) {
    trend = "Worsening";
    predictedRisk = "CRITICAL";
    priority = "Fix exposed secrets, injection risks, and command execution issues first.";
  } else if (high >= 2) {
    trend = "High risk";
    predictedRisk = "HIGH";
    priority = "Prioritize high severity findings before deployment.";
  } else if (medium >= 3) {
    trend = "Moderate risk";
    predictedRisk = "MEDIUM";
    priority = "Reduce medium severity issues to improve security posture.";
  }

  return {
    current_risk: getRiskLevel(riskScore),
    predicted_risk: predictedRisk,
    trend,
    priority
  };
}

async function runScan(code, targetId = "local-code-scan") {
  const findings = [];
  const lines = code.split(/\r?\n/);

  lines.forEach((lineText, index) => {
    rules.forEach((rule) => {
      if (rule.pattern.test(lineText)) {
        findings.push({
          type: rule.type,
          severity: rule.severity,
          file: "input.js",
          line: index + 1,
          cwe: rule.cwe,
          owasp: rule.owasp,
          confidence: rule.confidence,
          evidence: lineText.trim(),
          remediation: rule.remediation
        });
      }
    });
  });

  const high = findings.filter((f) => f.severity === "HIGH").length;
  const medium = findings.filter((f) => f.severity === "MEDIUM").length;
  const low = findings.filter((f) => f.severity === "LOW").length;
  const critical = findings.filter((f) => f.severity === "CRITICAL").length;

  const riskScore = calculateRiskScore(findings);

  const scanResult = {
    scan_id: `sast-${Date.now()}`,
    target_id: targetId,
    timestamp: new Date().toISOString(),
    service: "sast-scanner",
    scan_type: "SAST",
    status: "completed",

    critical,
    high,
    medium,
    low,

    total_findings: findings.length,
    risk_score: riskScore,
    risk_level: getRiskLevel(riskScore),
    forecast: generateForecast(findings, riskScore),

    findings
  };

  const storage = await persistScanResult(scanResult);

  return {
    ...scanResult,
    storage
  };
}

app.post("/scan/code", async (req, res) => {
  try {
    const code = req.body.code || "";
    const targetId = req.body.target_id || "local-code-scan";

    const result = await runScan(code, targetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      service: "sast-scanner",
      status: "failed",
      error: err.message
    });
  }
});

if (process.env.AUTO_SCAN === "true") {
  console.log("ECS auto-scan mode — starting SAST scan...");

  const samplePath = path.join(__dirname, "samples", "test-vulnerable.js");

  const sampleCode =
    process.env.SCAN_CODE ||
    fs.readFileSync(samplePath, "utf8");

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