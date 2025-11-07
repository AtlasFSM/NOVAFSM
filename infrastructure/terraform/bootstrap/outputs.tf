# Outputs for Terraform Backend Bootstrap

output "s3_bucket_id" {
  description = "The ID of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.arn
}

output "s3_bucket_region" {
  description = "The region of the S3 bucket"
  value       = aws_s3_bucket.terraform_state.region
}

output "dynamodb_table_id" {
  description = "The ID of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_locks.id
}

output "dynamodb_table_arn" {
  description = "The ARN of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_locks.arn
}

output "backend_configuration" {
  description = "Backend configuration to use in main Terraform"
  value = {
    bucket         = aws_s3_bucket.terraform_state.id
    region         = var.aws_region
    dynamodb_table = aws_dynamodb_table.terraform_locks.id
    encrypt        = true
  }
}

output "next_steps" {
  description = "Instructions for next steps"
  value = <<-EOT
    ✅ Terraform backend resources created successfully!

    Next steps:
    1. The main Terraform configuration in ../provider.tf already references these resources
    2. Navigate to ../
    3. Run: terraform init
    4. Run: terraform plan
    5. Run: terraform apply

    Your state will now be stored remotely in:
    - S3 Bucket: ${aws_s3_bucket.terraform_state.id}
    - Region: ${var.aws_region}
    - DynamoDB Lock Table: ${aws_dynamodb_table.terraform_locks.id}
  EOT
}
