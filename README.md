# Security Posture Forecast Platform

> **CS6620 Cloud Computing — Group 12**  

A continuous security scanning and risk forecasting platform built on AWS. The system automatically runs SAST and API penetration testing on target repositories, stores structured results, and surfaces risk trends through a live React dashboard.

---

## Team

| Member | Responsibility |
|--------|---------------|
| **Harshit** | Terraform & AWS Infrastructure (`/terraform`) |
| **Aravind** | SAST/Pentest Scanner Services, GitHub Actions CI/CD |
| **Spandan** | Forecast Engine, React Dashboard, Lambda Orchestrator |

---

## Architecture Overview

```
GitHub Actions (CI/CD)
        │
        ▼
  Lambda Orchestrator
        │
   ┌────┴────┐
   ▼         ▼
ECS SAST   ECS Pentest
Scanner    Scanner
   │         │
   └────┬────┘
        ▼
   S3 (Reports)   DynamoDB (Results)
        │                │
        └────────┬────────┘
                 ▼
          React Dashboard
          (ECS Fargate + ALB)
```

---

## AWS Infrastructure

All resources are provisioned via Terraform targeting `us-east-1`.

| Resource | Purpose |
|----------|---------|
| **VPC** | Isolated network with public/private subnets |
| **ECS Fargate** | Runs SAST scanner, pentest scanner, and React dashboard as containerized tasks |
| **ECR** | Private container registry for all service images |
| **Lambda** | Orchestrates scanner task invocation |
| **DynamoDB** | Stores structured scan results |
| **S3** | Stores raw scan reports (`sast/` and `pentest/` prefixes) + Terraform remote state |
| **ALB** | Exposes the React dashboard publicly |
| **SNS** | Notifications on scan completion |
| **CloudWatch** | Logs and monitoring for all services |
| **IAM (LabRole)** | Pre-existing role used for all AWS service permissions |

---

## Repository Structure

```
.
├── terraform/               # Harshit — all AWS infrastructure as code
│   ├── vpc.tf
│   ├── security_groups.tf
│   ├── iam.tf
│   ├── ecr.tf
│   ├── dynamodb.tf
│   ├── s3.tf
│   ├── sns.tf
│   ├── ecs.tf
│   ├── lambda.tf
│   ├── cloudwatch.tf
│   ├── alb.tf
│   └── outputs.tf
├── scanner/                 # Aravind — SAST & pentest scanner services
├── dashboard/               # Spandan — React frontend
├── lambda/                  # Spandan — orchestrator Lambda function
├── .github/
│   └── workflows/           # Aravind — CI/CD pipeline
└── README.md
```

---

## Getting Started

### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.3
- [AWS CLI](https://aws.amazon.com/cli/) configured
- Docker (for building scanner/dashboard images)
- AWS Academy Learner Lab credentials (refresh before each session)

### 1. Refresh AWS Credentials

In the Learner Lab console, copy the credentials block and export them:

```bash
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

Verify:

```bash
aws sts get-caller-identity
```

### 2. Initialize Terraform

```bash
cd terraform
terraform init -reconfigure
```

> Always run `terraform init -reconfigure` after refreshing credentials.

### 3. Plan & Apply

```bash
terraform plan
terraform apply
```

### 4. Tear Down (between sessions)

```bash
terraform destroy
```

> NAT Gateway is the primary cost driver — destroy infrastructure between sessions to avoid charges.

---

## ⚙️ CI/CD Pipeline

GitHub Actions workflows (managed by Aravind) handle:

- Building and pushing Docker images to ECR
- Triggering Lambda to invoke scanner ECS tasks
- Secrets stored in GitHub Actions Secrets (AWS credentials)

Branch naming convention for Terraform contributions:

```bash
git push origin harshit/terraform:harshit
```

---

## Key Design Decisions

- **LabRole only** — The AWS Academy environment restricts `iam:CreateRole`. All ECS tasks, Lambda, and services use the pre-existing `LabRole` (`arn:aws:iam::685375115461:role/LabRole`).
- **Remote state** — Terraform state is stored in S3 (`group12-tfstate-bucket`) for team consistency.
- **Auto-scan mode** — ECS scanner tasks are configured with `AUTO_SCAN=true` so they run as one-shot batch jobs on invocation.
- **Cost management** — Infrastructure is destroyed between development sessions; NAT Gateway is the primary cost driver.

---

## Dashboard

The React dashboard is deployed to ECS Fargate and exposed via an Application Load Balancer:

```
http://security-forecast-alb-2092382149.us-east-1.elb.amazonaws.com
```

> The ALB URL changes on each `terraform apply`. Check `terraform output` for the current address.

---

## Environment Variables (ECS Task Definitions)

| Variable | Description |
|----------|-------------|
| `AUTO_SCAN` | Set to `true` to run scanner on container start |
| `SCAN_RESULTS_TABLE` | DynamoDB table name for scan results |
| `REPORT_BUCKET` | S3 bucket name for raw reports |
| `AWS_REGION` | AWS region (`us-east-1`) |

---

## Troubleshooting

**Credentials not working after export**
```bash
env | grep AWS   # confirm all three vars are exported
aws sts get-caller-identity
```

**Terraform state backend error**
```bash
terraform init -reconfigure   # always run after credential refresh
```

**Session token newline issue**
Strip any `\n` characters from `AWS_SESSION_TOKEN` before exporting and wrap the value in quotes.

---
