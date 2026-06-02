output "dashboard_url" {
  description = "Public URL for the React dashboard"
  value       = "http://${aws_lb.dashboard.dns_name}"
}

output "ecr_sast_url" {
  description = "ECR URL for SAST scanner image"
  value       = aws_ecr_repository.sast_scanner.repository_url
}

output "ecr_pentest_url" {
  description = "ECR URL for Pentest scanner image"
  value       = aws_ecr_repository.pentest_scanner.repository_url
}

output "dynamodb_table_name" {
  description = "DynamoDB scan results table"
  value       = aws_dynamodb_table.scan_results.name
}

output "s3_reports_bucket" {
  description = "S3 bucket for full scan reports"
  value       = aws_s3_bucket.scan_reports.bucket
}
