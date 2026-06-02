# React Dashboard
Owner: Spandan Surdas

Security posture visibility with 4 views powered by DynamoDB + S3 data.

## Views
1. **Historical trends** — health score over time, vulnerability counts
2. **Forecast view** — predicted risk zone, day +14 projection
3. **Vulnerability view** — top categories, severity distribution
4. **Operational status** — last scan time, ECS health, forecast engine health

## Local Development
```bash
npm install
npm run dev
# Runs on http://localhost:5173
```

## Environment Variables
Create a `.env` file (not committed):
```
VITE_API_BASE_URL=http://localhost:4000
```
