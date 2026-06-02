# Individual Contributions — Group 12

## Harshit Satishkumar
**Owns:** `/terraform`

Responsibilities:
- All Terraform resource definitions (VPC, subnets, NAT Gateway, security groups)
- ECS cluster, ECR repositories, Lambda function deployment
- DynamoDB tables, S3 buckets, SNS topics, EventBridge rules
- IAM roles and least-privilege policies
- CloudWatch dashboards, alarms (including Fargate CPU/memory monitors)
- Remote state configuration (S3 backend)

## Aravind Shyam Kattepur
**Owns:** `/sast`, `/pentest`

Responsibilities:
- Extend SAST scanner: add JSON scoring output, severity weighting
- Extend Pentest scanner: add JSON scoring output, severity weighting
- Write Dockerfiles for both services
- Push images to ECR, register ECS task definitions
- Add retry logic and exit code handling for failed tasks
- Test both scanners end-to-end in containers

## Spandan Surdas
**Owns:** `/forecast`, `/dashboard`, `/lambda`

Responsibilities:
- Forecast engine: trend analysis, risk zone prediction
- Security health score calculation service
- Lambda orchestrator: triggers ECS SAST + Pentest tasks
- React dashboard: 4 views (history, forecast, vulns, status)
- Dashboard API layer
- Seed DynamoDB with test scan history for demo

---
_Each member commits only to their owned folders. PRs require 1 review before merging to main._
