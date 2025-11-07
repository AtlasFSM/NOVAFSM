# Bootstrap Configuration for Terraform Backend State
# This creates the S3 bucket and DynamoDB table required for Terraform remote state management
# Run this ONCE before initializing the main Terraform configuration

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # NOTE: This bootstrap config uses LOCAL state
  # After running this, the main config will use the remote S3 backend
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "NoVaFSM"
      Environment = "Infrastructure"
      ManagedBy   = "Terraform-Bootstrap"
      Purpose     = "Backend-State-Management"
    }
  }
}

# S3 Bucket for Terraform State Storage
resource "aws_s3_bucket" "terraform_state" {
  bucket = var.state_bucket_name

  # Prevent accidental deletion of state bucket
  lifecycle {
    prevent_destroy = false  # Set to true in production after initial setup
  }

  tags = {
    Name        = "Terraform State Bucket"
    Description = "Stores Terraform state files for NoVaFSM infrastructure"
  }
}

# Enable versioning to protect against accidental deletions
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable lifecycle policy to manage old versions
resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# DynamoDB Table for State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = var.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Enable encryption at rest
  server_side_encryption {
    enabled = true
  }

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = false  # Set to true in production after initial setup
  }

  tags = {
    Name        = "Terraform State Lock Table"
    Description = "Provides state locking for NoVaFSM Terraform operations"
  }
}

# Create initial state file directory structure
resource "aws_s3_object" "state_directories" {
  for_each = toset([
    "prod/",
    "staging/",
    "dev/",
  ])

  bucket       = aws_s3_bucket.terraform_state.id
  key          = each.value
  content      = ""
  content_type = "application/x-directory"
}

# S3 Bucket Policy for Secure Access
resource "aws_s3_bucket_policy" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnforcedTLS"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.terraform_state.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "AES256"
          }
        }
      }
    ]
  })
}
