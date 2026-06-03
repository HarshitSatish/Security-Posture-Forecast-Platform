# Scanner API Documentation

## SAST Scanner

### Health Check

GET /health

Response:

```json
{
  "service": "sast-scanner",
  "status": "running"
}
```

---

### Scan Code

POST /scan/code

Request:

```json
{
  "code": "const password='admin'; eval(userInput);"
}
```

Response:

```json
{
  "service": "sast-scanner",
  "scan_type": "SAST",
  "status": "completed",
  "findings": [
    {
      "type": "Hardcoded Secret",
      "severity": "HIGH"
    }
  ]
}
```

---

## Pentest Scanner

### Health Check

GET /health

Response:

```json
{
  "service": "pentest-scanner",
  "status": "running"
}
```

---

### Scan Target

POST /scan

Request:

```json
{
  "targetUrl": "http://test-api.local"
}
```

Response:

```json
{
  "service": "pentest-scanner",
  "scan_type": "PENTEST",
  "status": "completed",
  "findings": [
    {
      "type": "Insecure Transport",
      "severity": "HIGH"
    }
  ]
}
```