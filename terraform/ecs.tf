# ecs.tf

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

resource "aws_ecs_task_definition" "sast_scanner" {
  family                   = "${var.project_name}-sast-scanner"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "sast-scanner"
    image     = "${aws_ecr_repository.sast_scanner.repository_url}:latest"
    essential = true

    environment = [
      { name = "AUTO_SCAN",           value = "true" },
      { name = "AWS_REGION",          value = var.aws_region },
      { name = "SCAN_RESULTS_TABLE",  value = "${var.project_name}-scan-results" },
      { name = "REPORT_BUCKET",       value = "${var.project_name}-reports-${var.environment}" }
    ]

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/sast-scanner"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = {
    Name = "${var.project_name}-sast-task"
  }
}

resource "aws_ecs_task_definition" "pentest_scanner" {
  family                   = "${var.project_name}-pentest-scanner"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "pentest-scanner"
    image     = "${aws_ecr_repository.pentest_scanner.repository_url}:latest"
    essential = true

    environment = [
      { name = "AUTO_SCAN",           value = "true" },
      { name = "AWS_REGION",          value = var.aws_region },
      { name = "SCAN_RESULTS_TABLE",  value = "${var.project_name}-scan-results" },
      { name = "REPORT_BUCKET",       value = "${var.project_name}-reports-${var.environment}" },
      { name = "SCAN_TARGET_URL",     value = "http://localhost:4000" }
    ]

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/pentest-scanner"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = {
    Name = "${var.project_name}-pentest-task"
  }
}

resource "aws_ecs_task_definition" "dashboard" {
  family                   = "${var.project_name}-dashboard"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "dashboard"
    image     = "${aws_ecr_repository.dashboard.repository_url}:latest"
    essential = true

    environment = [
      { name = "AWS_REGION",         value = var.aws_region },
      { name = "SCAN_RESULTS_TABLE", value = "${var.project_name}-scan-results" },
      { name = "REPORT_BUCKET",      value = "${var.project_name}-reports-${var.environment}" }
    ]

    portMappings = [{
      containerPort = 80
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/dashboard"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = {
    Name = "${var.project_name}-dashboard-task"
  }
}

resource "aws_ecs_service" "dashboard" {
  name            = "${var.project_name}-dashboard"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.dashboard.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  tags = {
    Name = "${var.project_name}-dashboard-service"
  }
}

resource "aws_ecs_service" "dashboard_alb" {
  name            = "${var.project_name}-dashboard-alb"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.dashboard.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.dashboard.arn
    container_name   = "dashboard"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.dashboard]

  tags = {
    Name = "${var.project_name}-dashboard-alb-service"
  }
}
