# Terraform Backend Bootstrap

This directory contains the bootstrap configuration to initialize Terraform remote state management for NoVaFSM.

## 🎯 Purpose

Before you can use Terraform with remote state (S3 + DynamoDB), you need to create the S3 bucket and DynamoDB table that will store and lock the state. This is a "chicken and egg" problem - you can't use Terraform with remote state until the remote state infrastructure exists.

This bootstrap configuration solves this by:
1. Using **local state** to create the S3 bucket and DynamoDB table
2. Once created, the main Terraform configuration can use these resources for remote state

## 📋 Prerequisites

Before running this bootstrap:

1. **AWS CLI configured** with appropriate credentials:
   ```bash
   aws configure
   # Verify credentials work
   aws sts get-caller-identity
   ```

2. **Terraform installed** (>= 1.6.0):
   ```bash
   terraform --version
   ```

3. **Permissions required**:
   - `s3:CreateBucket`
   - `s3:PutBucketVersioning`
   - `s3:PutBucketEncryption`
   - `s3:PutBucketPublicAccessBlock`
   - `s3:PutBucketPolicy`
   - `dynamodb:CreateTable`
   - `dynamodb:DescribeTable`

## 🚀 Usage

### Step 1: Review and Customize Variables (Optional)

If you want to customize the bucket or table names:

```bash
# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your preferred names
nano terraform.tfvars
```

**Important:** S3 bucket names must be **globally unique** across all AWS accounts. If you get a "BucketAlreadyExists" error, change the `state_bucket_name` in `terraform.tfvars`.

Default values:
- **S3 Bucket:** `novafsm-terraform-state`
- **DynamoDB Table:** `novafsm-terraform-locks`
- **Region:** `us-east-1`

### Step 2: Initialize Terraform

```bash
# From this directory (infrastructure/terraform/bootstrap/)
terraform init
```

This will download the AWS provider.

### Step 3: Review the Plan

```bash
terraform plan
```

Expected resources to be created:
- ✅ S3 bucket with versioning enabled
- ✅ S3 bucket encryption configuration (AES256)
- ✅ S3 bucket public access block (all public access blocked)
- ✅ S3 bucket lifecycle rules (delete old versions after 90 days)
- ✅ S3 bucket policy (enforce TLS, deny unencrypted uploads)
- ✅ DynamoDB table with PAY_PER_REQUEST billing
- ✅ DynamoDB table encryption enabled
- ✅ DynamoDB point-in-time recovery enabled
- ✅ S3 directory structure (prod/, staging/, dev/)

**Total:** 9-11 resources

### Step 4: Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted.

**Expected duration:** 30-60 seconds

### Step 5: Verify Resources Created

```bash
# Check S3 bucket
aws s3 ls | grep novafsm-terraform-state

# Check DynamoDB table
aws dynamodb describe-table --table-name novafsm-terraform-locks --query 'Table.TableStatus'
```

### Step 6: Note the Outputs

After apply completes, Terraform will display:

```
Outputs:

backend_configuration = {
  "bucket" = "novafsm-terraform-state"
  "dynamodb_table" = "novafsm-terraform-locks"
  "encrypt" = true
  "region" = "us-east-1"
}

next_steps = <<EOT
✅ Terraform backend resources created successfully!
...
EOT
```

### Step 7: Initialize Main Terraform Configuration

Now that the backend resources exist, you can initialize the main Terraform configuration:

```bash
# Navigate to parent directory
cd ..

# Initialize with remote backend
terraform init

# You should see: "Successfully configured the backend "s3"!"
```

Terraform will ask if you want to migrate the existing local state to S3. Type `yes`.

## 🔒 Security Features

This bootstrap configuration implements AWS best practices:

### S3 Bucket Security
- ✅ **Versioning enabled** - Protects against accidental deletions
- ✅ **Encryption at rest** - AES256 server-side encryption
- ✅ **Block all public access** - No public ACLs or policies allowed
- ✅ **TLS enforcement** - Denies non-HTTPS requests
- ✅ **Encrypted uploads only** - Denies unencrypted object uploads
- ✅ **Lifecycle management** - Deletes old versions after 90 days

### DynamoDB Table Security
- ✅ **Encryption at rest** - Uses AWS managed keys
- ✅ **Point-in-time recovery** - Enables backup/restore
- ✅ **Pay-per-request billing** - No capacity planning needed

### IAM Considerations
- State files may contain **sensitive data** (database passwords, API keys)
- Restrict access using IAM policies
- Example IAM policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::novafsm-terraform-state",
        "arn:aws:s3:::novafsm-terraform-state/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/novafsm-terraform-locks"
    }
  ]
}
```

## 🔄 State Management

### Where is the Bootstrap State Stored?

The bootstrap configuration uses **local state** stored in `terraform.tfstate` in this directory. This file is **not committed to git** (excluded in .gitignore).

**Important:** Keep the bootstrap state file safe! You'll need it if you ever need to destroy or modify the backend resources.

**Best practices:**
1. Back up `terraform.tfstate` to a secure location
2. Store in a password manager or secure S3 bucket
3. Do not commit to version control

### Main Terraform State

After bootstrap, the main Terraform configuration (in parent directory) will use **remote state** stored in the S3 bucket you just created.

## 🗑️ Destroying Resources

**⚠️ WARNING:** Destroying the backend resources will make your main Terraform state **inaccessible**. Only do this if:
- You're tearing down the entire project
- You've backed up all state files
- You understand the consequences

To destroy:

```bash
# From this directory
terraform destroy
```

## 🐛 Troubleshooting

### Error: "BucketAlreadyExists"

**Problem:** S3 bucket names are globally unique. Someone else is using this bucket name.

**Solution:** Change the bucket name in `terraform.tfvars`:
```hcl
state_bucket_name = "your-company-novafsm-terraform-state-unique-suffix"
```

### Error: "AccessDenied"

**Problem:** Your AWS credentials don't have sufficient permissions.

**Solution:**
1. Check your AWS credentials: `aws sts get-caller-identity`
2. Verify your IAM user/role has S3 and DynamoDB permissions
3. Contact your AWS administrator to grant required permissions

### Error: "InvalidClientTokenId"

**Problem:** AWS credentials not configured or invalid.

**Solution:**
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### Backend Initialization Failed in Main Config

**Problem:** After bootstrap, `terraform init` in parent directory fails.

**Solution:**
1. Verify resources were created:
   ```bash
   aws s3 ls | grep terraform-state
   aws dynamodb list-tables | grep terraform-locks
   ```
2. Verify the bucket and table names in `../provider.tf` match what you created
3. Ensure your AWS credentials have access to these resources

## 📚 Additional Resources

- [Terraform S3 Backend Documentation](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [Terraform State Management](https://www.terraform.io/docs/language/state/index.html)

## 🔐 Production Recommendations

Before deploying to production:

1. **Enable prevent_destroy:**
   - Edit `main.tf`
   - Set `prevent_destroy = true` in lifecycle blocks
   - This prevents accidental deletion via Terraform

2. **Enable S3 MFA Delete:**
   - Requires MFA to delete objects or disable versioning
   - Must be enabled via AWS CLI (not Terraform)
   ```bash
   aws s3api put-bucket-versioning \
     --bucket novafsm-terraform-state \
     --versioning-configuration Status=Enabled,MFADelete=Enabled \
     --mfa "arn:aws:iam::ACCOUNT_ID:mfa/root-account-mfa-device 123456"
   ```

3. **Setup CloudTrail Logging:**
   - Monitor all S3 API calls
   - Alert on unexpected state modifications

4. **Implement Backup Strategy:**
   - S3 versioning provides protection
   - Consider S3 Cross-Region Replication for DR
   - Regularly test state restoration

5. **Access Control:**
   - Use IAM roles, not IAM users
   - Implement least privilege access
   - Enable MFA for sensitive operations
   - Use AWS Organizations Service Control Policies (SCPs)

## ✅ Verification Checklist

After bootstrap completes, verify:

- [ ] S3 bucket exists and is in the correct region
- [ ] S3 bucket versioning is enabled
- [ ] S3 bucket encryption is enabled
- [ ] S3 bucket blocks all public access
- [ ] DynamoDB table exists and is ACTIVE
- [ ] DynamoDB table has encryption enabled
- [ ] DynamoDB table has point-in-time recovery enabled
- [ ] Bootstrap state file exists locally (`terraform.tfstate`)
- [ ] Main Terraform can initialize with remote backend
- [ ] IAM permissions are properly configured

## 📝 Notes

- **Run once per AWS account/region:** You only need to bootstrap once per environment
- **Multi-environment:** If you have separate AWS accounts for dev/staging/prod, run bootstrap in each
- **Cost:** S3 and DynamoDB (on-demand) costs are minimal (typically < $1/month for state storage)
- **State locking:** DynamoDB ensures only one person can modify infrastructure at a time

---

**Created:** 2025-11-07
**Version:** 1.0.0
**Maintainer:** DevOps Team
