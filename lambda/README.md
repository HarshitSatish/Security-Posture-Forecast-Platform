# Lambda Orchestrator
Owner: Spandan Surdas

Triggered by EventBridge daily cron. Launches SAST and Pentest ECS Fargate tasks.
Retries up to 2 times on failure, then sends SNS alert.

## Environment Variables
| Variable | Description |
|----------|-------------|
| ECS_CLUSTER | ECS cluster ARN |
| SAST_TASK_DEF | SAST task definition ARN |
| PENTEST_TASK_DEF | Pentest task definition ARN |
| SUBNET_IDS | Private subnet IDs (comma-separated) |
| SECURITY_GROUP_ID | ECS security group ID |
| SNS_ALERT_TOPIC | SNS topic ARN for failure alerts |

## Local Testing
```bash
npm install && node handler.js
```
