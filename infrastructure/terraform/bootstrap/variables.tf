# Variables for Terraform Backend Bootstrap

variable "aws_region" {
  description = "AWS region for backend resources"
  type        = string
  default     = "us-east-1"
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state storage"
  type        = string
  default     = "novafsm-terraform-state"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.state_bucket_name))
    error_message = "Bucket name must be lowercase alphanumeric with hyphens, and cannot start or end with a hyphen."
  }

  validation {
    condition     = length(var.state_bucket_name) >= 3 && length(var.state_bucket_name) <= 63
    error_message = "Bucket name must be between 3 and 63 characters long."
  }
}

variable "lock_table_name" {
  description = "Name of the DynamoDB table for state locking"
  type        = string
  default     = "novafsm-terraform-locks"

  validation {
    condition     = can(regex("^[a-zA-Z0-9_.-]+$", var.lock_table_name))
    error_message = "Table name must contain only alphanumeric characters, underscores, hyphens, and periods."
  }

  validation {
    condition     = length(var.lock_table_name) >= 3 && length(var.lock_table_name) <= 255
    error_message = "Table name must be between 3 and 255 characters long."
  }
}
