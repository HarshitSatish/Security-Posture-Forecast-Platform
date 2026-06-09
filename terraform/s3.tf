# s3.tf — add resource blocks here
# s3.tf

resource "aws_s3_bucket" "scan_reports" {
  bucket        = "${var.project_name}-reports-${var.environment}"
  force_destroy = true

  tags = {
    Name = "${var.project_name}-reports"
  }
}

resource "aws_s3_bucket_versioning" "scan_reports" {
  bucket = aws_s3_bucket.scan_reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "scan_reports" {
  bucket = aws_s3_bucket.scan_reports.id

  rule {
    id     = "archive-old-reports"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    filter {
      prefix = ""
    }
  }
}

resource "aws_s3_bucket_public_access_block" "scan_reports" {
  bucket                  = aws_s3_bucket.scan_reports.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
