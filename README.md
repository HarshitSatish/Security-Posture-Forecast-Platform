<<<<<<< HEAD
# Security-Posture-Forecast-Platform
Responsible for vulnerability management across dozens of internal apps. Need to report posture trends to leadership, not just today's findings.
=======
# Security Posture Forecast Platform
CS6620 · Summer 2026 · Group 12

Continuous scanning, trend analytics, and risk forecasting using cloud-native SAST and API pentesting on AWS.

## Team
| Member | Ownership |
|--------|-----------|
| Harshit Satishkumar | Terraform + AWS infrastructure |
| Aravind Shyam Kattepur | SAST + Pentest scanner services + Docker |
| Spandan Surdas | Dashboard + Forecast engine + Lambda |

## Architecture
- **EventBridge** → daily cron trigger
- **Lambda** → orchestrates ECS tasks
- **ECS Fargate** → SAST scanner + Pentest scanner (separate services)
- **DynamoDB + S3** → scan history, scores, full reports
- **Forecast Engine** → trend analysis, risk prediction
- **SNS + CloudWatch** → alerts + monitoring
- **React Dashboard** → 4 views: history, forecast, vulns, status

## Quick Start
```bash
# Clone
git clone <repo-url>
cd group12-security-platform

# Run SAST locally
cd sast/backend && npm install && npm start

# Run Pentest locally (two terminals)
cd pentest/backend && node test-target.js   # terminal 1
cd pentest/backend && npm start             # terminal 2
```

## Deployment
See [docs/deployment.md](docs/deployment.md) for full AWS deployment steps.

## Cost Estimate
~$15–30/month on AWS Learner Lab (scale-to-zero Fargate, DynamoDB on-demand, S3 lifecycle)
>>>>>>> 4dfe216 (chore: initial repo scaffold with ownership structure)

fix ci
