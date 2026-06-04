# iam.tf
# Using LabRole from AWS Academy

data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

output "lab_role_arn" {
  description = "ARN of the LabRole used by all services"
  value       = data.aws_iam_role.lab_role.arn
}
