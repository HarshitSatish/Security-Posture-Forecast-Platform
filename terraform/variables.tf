variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "security-forecast"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "alert_email" {
  description = "Email address for SNS security alerts"
  type        = string
  # Set in terraform.tfvars (not committed — add to .gitignore)
}

variable "scan_schedule" {
  description = "EventBridge cron for daily scan trigger"
  type        = string
  default     = "cron(0 8 * * ? *)"
}
