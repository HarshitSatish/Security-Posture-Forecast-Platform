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
    }
  ];

  rules.forEach(rule => {
    if (rule.pattern.test(code)) {
      findings.push({
        type: rule.type,
        severity: rule.severity
      });
    }
  });

  res.json({
    service: "sast-scanner",
    scan_type: "SAST",
    status: "completed",
    findings
  });
});