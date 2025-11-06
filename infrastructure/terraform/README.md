# NoVaFSM Terraform Infrastructure

This directory contains Terraform configurations for deploying NoVaFSM infrastructure on AWS.

## Architecture

- **VPC**: Multi-AZ VPC with public and private subnets, NAT gateways
- **EKS**: Kubernetes cluster for container orchestration with auto-scaling node groups
- **RDS**: PostgreSQL 15 with multi-AZ deployment, automated backups, encryption at rest
- **ElastiCache**: Redis cluster for caching and session management
- **S3**: Versioned bucket for file uploads with lifecycle policies
- **ECR**: Container registries for backend, web, and mobile images
- **Secrets Manager**: Secure storage for database credentials and app secrets

## Prerequisites

- Terraform >= 1.6.0
- AWS CLI configured with appropriate credentials
- S3 bucket and DynamoDB table for Terraform state (see backend configuration)

## Setup

1. **Initialize Backend**:
   ```bash
   # Create S3 bucket for state
   aws s3 mb s3://novafsm-terraform-state --region us-east-1
   
   # Create DynamoDB table for state locking
   aws dynamodb create-table \
     --table-name novafsm-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region us-east-1
   ```

2. **Configure Variables**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Initialize Terraform**:
   ```bash
   terraform init
   ```

4. **Plan Deployment**:
   ```bash
   terraform plan
   ```

5. **Apply Infrastructure**:
   ```bash
   terraform apply
   ```

## Validation

```bash
# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Show outputs
terraform output
```

## Modules

- `modules/vpc`: VPC, subnets, NAT gateways, route tables
- `modules/eks`: EKS cluster, node groups, IRSA
- `modules/rds`: PostgreSQL RDS instance with security groups
- `modules/redis`: ElastiCache Redis replication group
- `modules/s3`: S3 buckets with encryption and versioning
- `modules/ecr`: ECR repositories for container images
- `modules/secrets`: Secrets Manager for sensitive configuration

## Outputs

- `vpc_id`: VPC identifier
- `eks_cluster_endpoint`: Kubernetes API server endpoint
- `rds_endpoint`: PostgreSQL connection endpoint
- `redis_endpoint`: Redis connection endpoint
- `s3_uploads_bucket`: S3 bucket name for uploads
- `ecr_repository_urls`: ECR repository URLs for CI/CD
- `app_secrets_arn`: Secrets Manager ARN for application

## Security

- All resources deployed in private subnets
- Encryption at rest for RDS, Redis, and S3
- Transit encryption for Redis
- IAM roles with least privilege
- Security groups with minimal ingress rules
- Secrets stored in AWS Secrets Manager

## Cost Optimization

- Auto-scaling EKS nodes (2-10 nodes)
- RDS storage auto-scaling
- S3 lifecycle policies for old versions
- ECR image retention policy (keep last 10)

## Disaster Recovery

- RDS automated backups (7-day retention)
- Redis snapshots
- S3 versioning enabled
- Multi-AZ deployments for RDS and Redis

## Maintenance

- RDS maintenance window: Monday 04:00-05:00 UTC
- RDS backup window: 03:00-04:00 UTC
- Redis snapshot window: 03:00-05:00 UTC
