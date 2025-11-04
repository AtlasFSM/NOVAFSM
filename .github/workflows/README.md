# NoVaFSM CI/CD Workflows Documentation

This directory contains GitHub Actions workflows for the NoVaFSM project, providing comprehensive CI/CD automation for testing, security scanning, building, and deploying the application.

## Table of Contents

- [Workflow Overview](#workflow-overview)
- [Prerequisites](#prerequisites)
- [Required Secrets Setup](#required-secrets-setup)
- [Workflows](#workflows)
  - [Main CI/CD Pipeline](#main-cicd-pipeline)
  - [Pull Request Checks](#pull-request-checks)
- [Deployment Process](#deployment-process)
- [Triggering Deployments](#triggering-deployments)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Workflow Overview

### Workflow Files

1. **ci-cd.yml** - Main CI/CD pipeline with build, test, security scanning, and deployment
2. **pr.yml** - Pull request validation with automated test results and coverage reporting

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Push to main branch                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │         Parallel Execution               │
        ├──────────────┬──────────────┬───────────┤
        │              │              │           │
        ▼              ▼              ▼           ▼
 ┌──────────┐  ┌──────────┐  ┌──────────┐   ┌──────────┐
 │ Backend  │  │ Frontend │  │ Security │   │  Tests   │
 │  Lint &  │  │  Lint &  │  │   Scan   │   │          │
 │   Test   │  │  Build   │  │          │   │          │
 └──────────┘  └──────────┘  └──────────┘   └──────────┘
        │              │              │           │
        └──────────────┴──────────────┴───────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Build & Push     │
                    │ Docker Images    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Deploy to        │
                    │ Staging          │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Smoke Tests      │
                    └──────────────────┘
                              │
                              ▼ (only on tags v*)
                    ┌──────────────────┐
                    │ Deploy to        │
                    │ Production       │
                    │ (Manual Approve) │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Create GitHub    │
                    │ Release          │
                    └──────────────────┘
```

## Prerequisites

Before setting up the CI/CD workflows, ensure you have:

1. **AWS Account** with:
   - Amazon ECR repositories for container images
   - Amazon EKS cluster for Kubernetes deployments
   - IAM user with appropriate permissions

2. **GitHub Repository** with:
   - Admin access to configure secrets
   - Branch protection rules configured for `main` branch

3. **External Services** (optional):
   - Codecov account for coverage tracking
   - Snyk account for security scanning
   - Slack workspace for notifications

4. **Kubernetes Cluster**:
   - EKS cluster properly configured
   - Namespaces created: `staging`, `production`
   - Kubernetes manifests in `infrastructure/k8s/` directory

## Required Secrets Setup

### Setting up GitHub Secrets

Navigate to: `Settings → Secrets and variables → Actions → New repository secret`

### AWS Deployment Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key with ECR and EKS permissions | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region where resources are deployed | `us-east-1` |
| `ECR_REPOSITORY_API` | Full ECR repository URL for API | `123456789.dkr.ecr.us-east-1.amazonaws.com/novafsm-api` |
| `ECR_REPOSITORY_WEB` | Full ECR repository URL for web dashboard | `123456789.dkr.ecr.us-east-1.amazonaws.com/novafsm-web` |
| `EKS_CLUSTER_NAME` | Name of your EKS cluster | `novafsm-production-cluster` |

### Security & Monitoring Secrets (Optional but Recommended)

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `CODECOV_TOKEN` | Token for uploading coverage reports | [codecov.io](https://codecov.io) → Settings → Copy token |
| `SNYK_TOKEN` | Token for security vulnerability scanning | [snyk.io](https://snyk.io) → Settings → API Token |
| `SLACK_WEBHOOK_URL` | Webhook URL for Slack notifications | Slack → Apps → Incoming Webhooks |

### IAM Permissions Required

The AWS IAM user needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

## Workflows

### Main CI/CD Pipeline

**File:** `.github/workflows/ci-cd.yml`

#### Triggers

- **Push to main branch:** Runs full pipeline including deployment to staging
- **Pull requests to main:** Runs tests and security scans (no deployment)
- **Tags matching v*:** Triggers production deployment

#### Jobs Breakdown

##### 1. Backend Lint and Test
- Installs Node.js 20 and backend dependencies
- Generates Prisma client
- Runs ESLint for code quality
- Performs TypeScript type checking
- Executes unit tests with coverage
- Runs integration tests using Testcontainers
- Uploads coverage to Codecov

##### 2. Frontend Lint and Test
- Installs Node.js 20 and frontend dependencies
- Runs ESLint for Next.js code
- Performs TypeScript type checking
- Builds production bundle to verify build success
- Archives build artifacts

##### 3. Security Scan
- Runs Snyk security scan on both backend and frontend dependencies
- Executes Trivy filesystem scan for vulnerabilities
- Uploads SARIF results to GitHub Security tab
- Continues on errors to avoid blocking pipeline

##### 4. Build and Push Images
- Only runs on push to main branch
- Configures AWS credentials and logs into ECR
- Builds Docker images for backend and web dashboard
- Tags images with commit SHA and "latest"
- Pushes images to ECR
- Uses BuildKit cache for faster builds

##### 5. Deploy to Staging
- Deploys to staging environment after successful build
- Updates EKS kubeconfig
- Applies Kubernetes manifests
- Updates deployment images to new SHA
- Waits for rollout completion
- Runs smoke tests to verify deployment

##### 6. Deploy to Production
- Only runs on version tags (v*)
- Requires manual approval (GitHub environment protection)
- Deploys to production namespace
- Runs production smoke tests
- Creates GitHub release with changelog

##### 7. Slack Notification
- Runs after all jobs complete
- Sends detailed status notification to Slack
- Includes test results, coverage, and deployment status

### Pull Request Checks

**File:** `.github/workflows/pr.yml`

#### Features

- **Automated Testing:** Runs all linting, type checking, and tests
- **Coverage Reporting:** Posts test coverage in PR comments
- **Changed Files Detection:** Identifies which parts of the codebase changed
- **Security Checks:** Quick Trivy scan for critical vulnerabilities
- **PR Comments:** Automated comments with test results and status
- **Quality Gate:** Blocks merge if tests fail

#### PR Comment Example

```markdown
## 🚀 Pull Request Checks Summary

### Status Overview
| Check | Status |
|-------|--------|
| ✅ Backend Tests | success |
| ✅ Frontend Tests | success |
| ✅ Security Check | success |

### Test Coverage (Backend)
| Metric | Coverage |
|--------|----------|
| Lines | 87.5% |
| Statements | 86.3% |
| Functions | 82.1% |
| Branches | 79.8% |

### Changed Files
- Backend: ✅ Modified
- Frontend: ⬜ No changes
- Infrastructure: ⬜ No changes
```

## Deployment Process

### Staging Deployment (Automatic)

Staging deployments happen automatically when code is pushed to the `main` branch:

```bash
# Make your changes
git add .
git commit -m "feat: add new feature"
git push origin main
```

The workflow will:
1. Run all tests and security scans
2. Build Docker images
3. Push to ECR
4. Deploy to staging environment
5. Run smoke tests
6. Send Slack notification

### Production Deployment (Manual)

Production deployments require creating a version tag:

```bash
# Create and push a version tag
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```

The workflow will:
1. Deploy to staging first (validation)
2. Wait for manual approval in GitHub Actions
3. Deploy to production environment
4. Run production smoke tests
5. Create GitHub release
6. Send Slack notification

### Manual Approval

1. Navigate to: `Actions → CI/CD Pipeline → [Your workflow run]`
2. Look for the "Deploy to Production Environment" job
3. Click "Review deployments"
4. Review the changes and click "Approve and deploy"

## Triggering Deployments

### Trigger Staging Deployment

```bash
# Option 1: Direct push to main
git push origin main

# Option 2: Merge a pull request to main
gh pr merge 123 --squash
```

### Trigger Production Deployment

```bash
# Create a version tag
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```

### Manual Workflow Trigger (Optional)

You can add manual workflow trigger to `ci-cd.yml`:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        type: choice
        options:
          - staging
          - production
```

## Rollback Procedures

### Quick Rollback (Recommended)

Use Kubernetes rollout undo for immediate rollback:

```bash
# Configure kubectl
aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION

# Rollback API deployment
kubectl rollout undo deployment/novafsm-api -n production

# Rollback Web deployment
kubectl rollout undo deployment/novafsm-web -n production

# Verify rollback
kubectl rollout status deployment/novafsm-api -n production
kubectl rollout status deployment/novafsm-web -n production
```

### Rollback to Specific Version

```bash
# View rollout history
kubectl rollout history deployment/novafsm-api -n production

# Rollback to specific revision
kubectl rollout undo deployment/novafsm-api -n production --to-revision=5
```

### Rollback via Re-deployment

Deploy a previous version by re-triggering the workflow:

```bash
# Find the previous working commit
git log --oneline

# Create a new tag from that commit
git tag -a v1.2.4-rollback -m "Rollback to stable version" <commit-sha>
git push origin v1.2.4-rollback
```

### Emergency Rollback

If automated rollback fails:

```bash
# Set image to previous working version
kubectl set image deployment/novafsm-api \
  novafsm-api=$ECR_REPOSITORY_API:<previous-sha> \
  -n production

kubectl set image deployment/novafsm-web \
  novafsm-web=$ECR_REPOSITORY_WEB:<previous-sha> \
  -n production

# Scale down if critical issue
kubectl scale deployment/novafsm-api --replicas=0 -n production
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors with AWS

**Error:** `Unable to locate credentials`

**Solution:**
```bash
# Verify secrets are set
# Go to: Settings → Secrets → Actions
# Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are configured

# Test AWS credentials locally
aws sts get-caller-identity
```

#### 2. ECR Push Failures

**Error:** `denied: Your authorization token has expired`

**Solution:**
- Check ECR repository exists and matches the secret value
- Verify IAM permissions include ECR access
- Ensure region matches between secret and ECR repository

#### 3. EKS Deployment Failures

**Error:** `error: You must be logged in to the server (Unauthorized)`

**Solution:**
```bash
# Update kubeconfig
aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION

# Verify cluster access
kubectl cluster-info

# Check IAM permissions
aws eks describe-cluster --name $EKS_CLUSTER_NAME
```

#### 4. Test Failures in CI

**Error:** Tests pass locally but fail in CI

**Solution:**
- Check environment variables in workflow
- Verify testcontainers has Docker access
- Review logs: `Actions → [Workflow Run] → [Job] → [Step]`
- Download artifacts to inspect coverage reports

#### 5. Build Size Too Large

**Error:** `Build exceeds maximum size`

**Solution:**
```bash
# Analyze Next.js bundle
cd web-dashboard
npm run build

# Review .next build analyzer
npx @next/bundle-analyzer
```

#### 6. Smoke Tests Failing

**Error:** `Health check failed`

**Solution:**
```bash
# Check pod status
kubectl get pods -n staging

# View pod logs
kubectl logs deployment/novafsm-api -n staging

# Describe pod for events
kubectl describe pod <pod-name> -n staging

# Test health endpoint manually
kubectl port-forward deployment/novafsm-api 3000:3000 -n staging
curl http://localhost:3000/api/v1/health
```

### Debugging Workflows

#### View Workflow Logs

```bash
# Using GitHub CLI
gh run list
gh run view <run-id>
gh run view <run-id> --log
```

#### Re-run Failed Jobs

```bash
# Re-run failed jobs only
gh run rerun <run-id> --failed

# Re-run entire workflow
gh run rerun <run-id>
```

#### Download Artifacts

```bash
# Download all artifacts
gh run download <run-id>

# Download specific artifact
gh run download <run-id> -n backend-coverage
```

### Getting Help

1. **Check Workflow Logs:** Most issues have detailed error messages in logs
2. **Review Secret Configuration:** Ensure all required secrets are set correctly
3. **Verify Prerequisites:** Check AWS resources exist and are accessible
4. **Test Locally:** Run the same commands locally to isolate CI-specific issues
5. **GitHub Discussions:** Check repository discussions for similar issues

## Best Practices

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Develop and Test Locally**
   ```bash
   cd backend && npm test
   cd ../web-dashboard && npm run build
   ```

3. **Create Pull Request**
   - PR checks will run automatically
   - Review PR comment with test results
   - Address any failing checks

4. **Merge to Main**
   - After approval, merge PR
   - Automatic staging deployment will trigger
   - Monitor deployment in Actions tab

5. **Promote to Production**
   - After staging validation, create version tag
   - Approve production deployment
   - Monitor production rollout

### Security Best Practices

1. **Never commit secrets** to the repository
2. **Use environment protection** for production deployments
3. **Enable branch protection rules** on main branch
4. **Review security scan results** regularly
5. **Keep dependencies updated** to patch vulnerabilities
6. **Use least privilege** for AWS IAM permissions
7. **Rotate credentials** periodically

### Monitoring and Observability

1. **Enable Codecov Integration** for coverage tracking
2. **Review Security Tab** in GitHub for vulnerabilities
3. **Set up Slack Notifications** for build failures
4. **Monitor EKS cluster** health and resource usage
5. **Set up application monitoring** (Datadog, New Relic, etc.)
6. **Configure log aggregation** (CloudWatch, ELK, etc.)

### Performance Optimization

1. **Use caching** for dependencies (`cache: 'npm'`)
2. **Run independent jobs in parallel**
3. **Use BuildKit cache** for Docker builds
4. **Minimize Docker image sizes** with multi-stage builds
5. **Use `npm ci`** instead of `npm install` for reproducible builds

### Maintenance

1. **Update GitHub Actions** to latest versions regularly
2. **Review and update Node.js version** when new LTS releases
3. **Monitor workflow run times** and optimize slow jobs
4. **Archive old workflow runs** to save storage
5. **Document custom scripts** and non-obvious configurations

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NestJS Deployment](https://docs.nestjs.com/deployment)

---

**Last Updated:** 2025-11-04
**Maintainer:** NoVaFSM Team
