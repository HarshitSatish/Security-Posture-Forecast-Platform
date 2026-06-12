# ecr.tf — add resource blocks here
# ecr.tf
# Owner: Harshit Satishkumar

resource "aws_ecr_repository" "sast_scanner" {
  name                 = "${var.project_name}-sast-scanner"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project_name}-sast-scanner" }
}

resource "aws_ecr_repository" "pentest_scanner" {
  name                 = "${var.project_name}-pentest-scanner"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project_name}-pentest-scanner" }
}

resource "aws_ecr_repository" "dashboard" {
  name                 = "${var.project_name}-dashboard"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project_name}-dashboard" }
}

resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}-api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project_name}-api" }
}
