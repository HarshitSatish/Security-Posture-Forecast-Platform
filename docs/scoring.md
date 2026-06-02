# Security Health Score — Formula and Risk Zones

## Score Calculation
```
Health Score = 100
             - (high_count   × 15)
             - (medium_count ×  5)
             - (low_count    ×  1)
Minimum = 0
```
SAST and Pentest scores are calculated independently, then averaged.

## Risk Zones
| Score | Zone | SNS Alert |
|-------|------|-----------|
| 80–100 | Safe | No |
| 60–79 | Warning | No |
| 0–59 | High Risk | Yes |

## Forecast
Linear regression over last 7 days of scores.
Projects score at day +14. If projected < 60 → SNS HIGH RISK alert.

## DynamoDB Schema — scan-results table
| Attribute | Type | Notes |
|-----------|------|-------|
| scan_id (PK) | String | UUID |
| timestamp (SK) | String | ISO 8601 |
| scan_type | String | SAST or PENTEST |
| health_score | Number | 0–100 |
| high_count | Number | |
| medium_count | Number | |
| low_count | Number | |
| s3_report_key | String | S3 path to full JSON report |
| risk_zone | String | Safe / Warning / High Risk |
