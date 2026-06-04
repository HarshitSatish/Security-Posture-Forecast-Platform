# dynamodb.tf — add resource blocks here
# dynamodb.tf

resource "aws_dynamodb_table" "scan_results" {
  name         = "${var.project_name}-scan-results"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "scan_id"
  range_key    = "timestamp"

  attribute {
    name = "scan_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  tags = {
    Name = "${var.project_name}-scan-results"
  }
}

resource "aws_dynamodb_table" "forecast_scores" {
  name         = "${var.project_name}-forecast-scores"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "target_id"
  range_key    = "forecast_date"

  attribute {
    name = "target_id"
    type = "S"
  }

  attribute {
    name = "forecast_date"
    type = "S"
  }

  tags = {
    Name = "${var.project_name}-forecast-scores"
  }
}
