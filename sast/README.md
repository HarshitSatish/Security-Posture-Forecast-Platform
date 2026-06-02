# SAST Scanner Service
Owner: Aravind Shyam Kattepur

Static Application Security Testing — scans JavaScript source code for vulnerabilities.

## Local Development
```bash
cd backend && npm install && npm start
# Runs on http://localhost:3000
```

## Endpoints
- `POST /scan/code` — scan a code snippet
- `POST /scan/file` — scan a file path
- `POST /scan/directory` — scan a directory
- `GET  /vulnerabilities` — list vulnerability types
- `GET  /health` — health check

## Docker
```bash
docker build -t sast-scanner .
docker run -p 3000:3000 sast-scanner
curl http://localhost:3000/health
```
