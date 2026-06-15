# lambda.tf — add resource blocks here
# lambda.tf

resource "aws_lambda_function" "orchestrator" {
  function_name = "${var.project_name}-orchestrator"
  role          = data.aws_iam_role.lab_role.arn
  package_type  = "Zip"
  filename      = "${path.module}/../lambda/function.zip"
  handler       = "handler.handler"
  runtime       = "nodejs18.x"
  timeout       = 180

  environment {
    variables = {
      ECS_CLUSTER       = aws_ecs_cluster.main.id
      SAST_TASK_DEF     = aws_ecs_task_definition.sast_scanner.arn
      PENTEST_TASK_DEF  = aws_ecs_task_definition.pentest_scanner.arn
      SUBNET_IDS        = "${aws_subnet.private_1.id},${aws_subnet.private_2.id}"
      SECURITY_GROUP_ID = aws_security_group.ecs.id
      SNS_ALERT_TOPIC   = aws_sns_topic.alerts.arn
    }
  }

  tags = {
    Name = "${var.project_name}-orchestrator"
  }
}

resource "aws_cloudwatch_event_rule" "daily_scan" {
  name                = "${var.project_name}-daily-scan"
  description         = "Triggers security scan daily at 8 AM UTC"
  schedule_expression = var.scan_schedule

  tags = {
    Name = "${var.project_name}-daily-scan"
  }
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.daily_scan.name
  target_id = "LambdaOrchestrator"
  arn       = aws_lambda_function.orchestrator.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orchestrator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_scan.arn
}
