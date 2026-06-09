# cloudwatch.tf — add resource blocks here
# cloudwatch.tf

resource "aws_cloudwatch_log_group" "sast_scanner" {
  name              = "/ecs/sast-scanner"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "pentest_scanner" {
  name              = "/ecs/pentest-scanner"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "dashboard" {
  name              = "/ecs/dashboard"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-orchestrator"
  retention_in_days = 30
}

resource "aws_cloudwatch_metric_alarm" "sast_cpu" {
  alarm_name          = "${var.project_name}-sast-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "SAST scanner CPU above 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = "${var.project_name}-sast-scanner"
  }
}

resource "aws_cloudwatch_metric_alarm" "sast_memory" {
  alarm_name          = "${var.project_name}-sast-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "SAST scanner memory above 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = "${var.project_name}-sast-scanner"
  }
}

resource "aws_cloudwatch_metric_alarm" "pentest_cpu" {
  alarm_name          = "${var.project_name}-pentest-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Pentest scanner CPU above 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = "${var.project_name}-pentest-scanner"
  }
}

resource "aws_cloudwatch_metric_alarm" "pentest_memory" {
  alarm_name          = "${var.project_name}-pentest-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Pentest scanner memory above 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = "${var.project_name}-pentest-scanner"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Lambda orchestrator execution failed"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.orchestrator.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "scan_not_executed" {
  alarm_name          = "${var.project_name}-scan-not-executed"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Invocations"
  namespace           = "AWS/Lambda"
  period              = 86400
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Daily scan did not execute in the last 24 hours"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    FunctionName = aws_lambda_function.orchestrator.function_name
  }
}
