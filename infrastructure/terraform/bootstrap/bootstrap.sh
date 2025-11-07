#!/usr/bin/env bash

# Terraform Backend Bootstrap Script
# This script automates the creation of S3 bucket and DynamoDB table for Terraform state management

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     NoVaFSM Terraform Backend Bootstrap Script            ║"
echo "║     Creates S3 bucket and DynamoDB table for state        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists terraform; then
    print_error "Terraform is not installed. Please install Terraform >= 1.6.0"
    exit 1
fi

if ! command_exists aws; then
    print_error "AWS CLI is not installed. Please install AWS CLI"
    exit 1
fi

print_success "Terraform found: $(terraform version -json | grep -o '"terraform_version":"[^"]*' | cut -d'"' -f4)"
print_success "AWS CLI found: $(aws --version | cut -d' ' -f1)"

# Verify AWS credentials
print_info "Verifying AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    print_error "AWS credentials are not configured or invalid"
    echo "Please run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_USER=$(aws sts get-caller-identity --query Arn --output text)
print_success "AWS credentials valid"
print_info "Account ID: ${AWS_ACCOUNT_ID}"
print_info "User/Role: ${AWS_USER}"

# Check if terraform.tfvars exists
if [ -f "${SCRIPT_DIR}/terraform.tfvars" ]; then
    print_info "Using existing terraform.tfvars"
else
    print_warning "No terraform.tfvars found. Using default values."
    print_info "Bucket: novafsm-terraform-state"
    print_info "Table: novafsm-terraform-locks"
    print_info "Region: us-east-1"
    echo ""
    echo "To customize, copy terraform.tfvars.example to terraform.tfvars"
    echo ""
fi

# Prompt for confirmation
echo -e "${YELLOW}"
echo "This script will create:"
echo "  • S3 bucket for Terraform state storage (with versioning and encryption)"
echo "  • DynamoDB table for state locking"
echo ""
echo "Estimated cost: < $1/month"
echo -e "${NC}"

read -p "Do you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_warning "Bootstrap cancelled by user"
    exit 0
fi

# Change to script directory
cd "${SCRIPT_DIR}"

# Initialize Terraform
print_info "Initializing Terraform..."
if terraform init; then
    print_success "Terraform initialized"
else
    print_error "Terraform initialization failed"
    exit 1
fi

# Validate configuration
print_info "Validating Terraform configuration..."
if terraform validate; then
    print_success "Configuration is valid"
else
    print_error "Configuration validation failed"
    exit 1
fi

# Plan
print_info "Creating execution plan..."
if terraform plan -out=tfplan; then
    print_success "Plan created successfully"
else
    print_error "Planning failed"
    exit 1
fi

# Show plan summary
echo ""
print_info "Review the plan above. This will create approximately 9-11 resources."
echo ""

read -p "Apply this plan? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_warning "Bootstrap cancelled by user"
    rm -f tfplan
    exit 0
fi

# Apply
print_info "Applying Terraform configuration..."
if terraform apply tfplan; then
    rm -f tfplan
    print_success "Backend resources created successfully!"
else
    print_error "Apply failed"
    rm -f tfplan
    exit 1
fi

# Display outputs
echo ""
print_info "Retrieving outputs..."
terraform output -json > outputs.json

BUCKET_NAME=$(terraform output -raw s3_bucket_id 2>/dev/null || echo "unknown")
TABLE_NAME=$(terraform output -raw dynamodb_table_id 2>/dev/null || echo "unknown")
REGION=$(terraform output -raw s3_bucket_region 2>/dev/null || echo "unknown")

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  Bootstrap Complete! ✅                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
print_info "Backend Configuration:"
echo "  S3 Bucket: ${BUCKET_NAME}"
echo "  DynamoDB Table: ${TABLE_NAME}"
echo "  Region: ${REGION}"
echo ""

# Verify resources
print_info "Verifying resources..."

if aws s3 ls "s3://${BUCKET_NAME}" >/dev/null 2>&1; then
    print_success "S3 bucket verified"
else
    print_warning "S3 bucket verification failed (might be eventual consistency)"
fi

if aws dynamodb describe-table --table-name "${TABLE_NAME}" >/dev/null 2>&1; then
    print_success "DynamoDB table verified"
else
    print_warning "DynamoDB table verification failed (might be eventual consistency)"
fi

# Next steps
echo ""
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      Next Steps                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "1. Navigate to the main Terraform directory:"
echo "   ${GREEN}cd ..${NC}"
echo ""
echo "2. Initialize Terraform with remote backend:"
echo "   ${GREEN}terraform init${NC}"
echo ""
echo "3. When prompted, type 'yes' to migrate state to S3"
echo ""
echo "4. Verify backend configuration:"
echo "   ${GREEN}terraform plan${NC}"
echo ""
echo "5. Apply the infrastructure:"
echo "   ${GREEN}terraform apply${NC}"
echo ""
print_warning "IMPORTANT: Keep the bootstrap state file (terraform.tfstate) in a secure location!"
print_info "This file is needed if you ever need to modify/destroy the backend resources."
echo ""
print_success "Bootstrap complete! Your Terraform backend is ready for production use."
