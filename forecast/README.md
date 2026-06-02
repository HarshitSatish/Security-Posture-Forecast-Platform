# Forecast Engine Service
Owner: Spandan Surdas

Reads historical security scores from DynamoDB, detects trends, predicts future risk zones.

## Scoring Formula
```
Health Score = 100 - (high × 15) - (medium × 5) - (low × 1)
Minimum = 0
```

## Risk Zones
| Score | Zone |
|-------|------|
| 80–100 | Safe |
| 60–79  | Warning |
| 0–59   | High Risk |

## Forecast Logic
Linear regression over last 7 days → projected score at day +14.
Projected score < 60 → SNS HIGH RISK alert.

## Local Development
```bash
npm install && npm start
```
