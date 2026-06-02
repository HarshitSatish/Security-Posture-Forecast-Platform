# Terraform — Infrastructure as Code
Owner: Harshit Satishkumar

Provisions the entire AWS environment for the Security Posture Forecast Platform.

## Resources Created
- VPC, public/private subnets, NAT Gateway, route tables
- Security groups (ECS, Lambda, dashboard)
- ECS cluster + ECR repositories
- Lambda function (orchestrator)
- DynamoDB tables, S3 buckets, SNS topics, EventBridge rule
- IAM roles (scanner, forecast, notification, dashboard)
- CloudWatch dashboards + alarms (Fargate CPU/memory monitors)

## Usage
```bash
cd terraform
terraform init
terraform plan
terraform apply
terraform destroy
```

## Files
| File | Purpose |
|------|---------|
| main.tf | Provider config + S3 remote backend |
| variables.tf | Input variables |
| outputs.tf | Output values (URLs, ARNs) |
| vpc.tf | VPC, subnets, NAT, route tables |
| security_groups.tf | Security group rules |
| ecs.tf | ECS cluster + task definitions |
| ecr.tf | ECR repositories |
| lambda.tf | Lambda function + EventBridge rule |
| dynamodb.tf | DynamoDB tables |
| s3.tf | S3 buckets + lifecycle policies |
| sns.tf | SNS topics + subscriptions |
| iam.tf | IAM roles + policies |
| cloudwatch.tf | Dashboards, log groups, alarms |
