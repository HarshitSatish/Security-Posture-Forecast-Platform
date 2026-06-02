# Deployment Guide

## Prerequisites
- AWS CLI configured with Learner Lab credentials
- Terraform >= 1.5.0 installed
- Docker Desktop running
- Node.js 18+

## Step 1 — Remote state bucket (one-time manual setup)
1. Open AWS Console → S3
2. Create bucket: `group12-tfstate-bucket` in `us-east-1`
3. Enable versioning

## Step 2 — Provision AWS infrastructure
```bash
cd terraform
terraform init
terraform plan
terraform apply
```
Note the outputs: ECR URLs, ECS cluster name, DynamoDB table name.

## Step 3 — Build and push Docker images
```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# SAST image
cd sast
docker build -t sast-scanner .
docker tag sast-scanner:latest <ecr-sast-url>:latest
docker push <ecr-sast-url>:latest

# Pentest image
cd ../pentest
docker build -t pentest-scanner .
docker tag pentest-scanner:latest <ecr-pentest-url>:latest
docker push <ecr-pentest-url>:latest
```

## Step 4 — Deploy Lambda
```bash
cd lambda && npm install
zip -r function.zip . -x "*.git*"
aws lambda update-function-code \
  --function-name security-forecast-orchestrator \
  --zip-file fileb://function.zip
```

## Step 5 — Validate end-to-end
```bash
# Manually trigger the Lambda
aws lambda invoke --function-name security-forecast-orchestrator out.json
cat out.json

# Tail ECS logs
aws logs tail /ecs/sast-scanner --follow
aws logs tail /ecs/pentest-scanner --follow
```

## Step 6 — Seed test data for demo
```bash
cd forecast && node src/seedTestData.js
```

## Teardown
```bash
cd terraform && terraform destroy
```
