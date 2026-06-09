# outputs.tf
# Owner: Harshit Satishkumar

output "ecr_sast_url" {
  description = "ECR URL for SAST scanner image"
  value       = aws_ecr_repository.sast_scanner.repository_url
}

output "ecr_pentest_url" {
  description = "ECR URL for Pentest scanner image"
  value       = aws_ecr_repository.pentest_scanner.repository_url
}

output "ecr_dashboard_url" {
  description = "ECR URL for dashboard image"
  value       = aws_ecr_repository.dashboard.repository_url
}
