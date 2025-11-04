# GitHub Actions CI/CD Setup Checklist

Use this checklist to configure the CI/CD pipeline for NoVaFSM.

## Prerequisites Checklist

### AWS Infrastructure
- [ ] AWS Account created
- [ ] AWS CLI installed and configured locally
- [ ] IAM user created for GitHub Actions
- [ ] IAM user has ECR permissions (push/pull images)
- [ ] IAM user has EKS permissions (describe cluster)
- [ ] ECR repository created for API: `novafsm-api`
- [ ] ECR repository created for Web: `novafsm-web`
- [ ] EKS cluster created and running
- [ ] kubectl configured for EKS cluster
- [ ] Kubernetes namespaces created: `staging`, `production`

### GitHub Repository Configuration
- [ ] GitHub repository exists
- [ ] You have admin access to the repository
- [ ] Branch protection rules configured for `main` branch
- [ ] Required status checks enabled (optional)

### External Services (Optional)
- [ ] Codecov account created
- [ ] Codecov repository added
- [ ] Snyk account created
- [ ] Snyk organization configured
- [ ] Slack workspace available for notifications
- [ ] Slack incoming webhook created

## GitHub Secrets Configuration

### Required Secrets (Must Have)
Navigate to: `Repository → Settings → Secrets and variables → Actions → New repository secret`

- [ ] `AWS_ACCESS_KEY_ID` - AWS access key ID
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- [ ] `AWS_REGION` - AWS region (e.g., `us-east-1`)
- [ ] `ECR_REPOSITORY_API` - Full ECR URL for API (e.g., `123456789.dkr.ecr.us-east-1.amazonaws.com/novafsm-api`)
- [ ] `ECR_REPOSITORY_WEB` - Full ECR URL for web (e.g., `123456789.dkr.ecr.us-east-1.amazonaws.com/novafsm-web`)
- [ ] `EKS_CLUSTER_NAME` - Name of your EKS cluster

### Optional Secrets (Recommended)
- [ ] `CODECOV_TOKEN` - Codecov upload token
- [ ] `SNYK_TOKEN` - Snyk API token
- [ ] `SLACK_WEBHOOK_URL` - Slack incoming webhook URL

## Kubernetes Configuration

### Staging Namespace
```bash
# Create staging namespace
kubectl create namespace staging

# Verify
kubectl get namespace staging
```

### Production Namespace
```bash
# Create production namespace
kubectl create namespace production

# Verify
kubectl get namespace production
```

### Kubernetes Manifests
- [ ] Kubernetes manifests exist in `infrastructure/k8s/`
- [ ] Manifests include: deployments, services, ingress, configmaps
- [ ] Manifests tested locally with `kubectl apply --dry-run=client`

## Environment Protection Rules

### Staging Environment
Navigate to: `Repository → Settings → Environments → New environment`

1. [ ] Create environment named `staging`
2. [ ] Set environment URL: `https://staging-api.novafsm.com`
3. [ ] Configure protection rules (optional):
   - [ ] Required reviewers (if needed)
   - [ ] Wait timer (if needed)

### Production Environment
1. [ ] Create environment named `production`
2. [ ] Set environment URL: `https://api.novafsm.com`
3. [ ] Configure protection rules (REQUIRED):
   - [x] **Enable Required reviewers** (at least 1)
   - [ ] Add required reviewers
   - [ ] Enable prevent self-review (recommended)
   - [ ] Enable wait timer: 5 minutes (recommended)

## Verification Steps

### 1. Test Workflow Syntax
```bash
# Install actionlint (workflow linter)
brew install actionlint  # macOS
# or
go install github.com/rhysd/actionlint@latest  # Go

# Lint workflows
actionlint .github/workflows/*.yml
```

### 2. Test PR Workflow
```bash
# Create a test branch
git checkout -b test/ci-setup

# Make a small change
echo "# CI/CD Test" >> TEST.md
git add TEST.md
git commit -m "test: verify CI/CD pipeline"

# Push and create PR
git push origin test/ci-setup
gh pr create --title "Test: CI/CD Pipeline" --body "Testing workflow"
```

- [ ] PR workflow triggered automatically
- [ ] All jobs completed successfully
- [ ] PR comment posted with test results
- [ ] No errors in workflow logs

### 3. Test Main CI/CD Workflow
```bash
# Merge test PR to main
gh pr merge test/ci-setup --squash

# Or push directly to main (if allowed)
git checkout main
git pull
git merge test/ci-setup
git push origin main
```

- [ ] CI/CD workflow triggered on push to main
- [ ] Backend tests passed
- [ ] Frontend tests passed
- [ ] Security scan completed
- [ ] Docker images built and pushed to ECR
- [ ] Deployment to staging succeeded
- [ ] Smoke tests passed

### 4. Verify ECR Images
```bash
# List images in ECR
aws ecr describe-images --repository-name novafsm-api --region us-east-1
aws ecr describe-images --repository-name novafsm-web --region us-east-1
```

- [ ] API image exists with commit SHA tag
- [ ] API image exists with `latest` tag
- [ ] Web image exists with commit SHA tag
- [ ] Web image exists with `latest` tag

### 5. Verify Staging Deployment
```bash
# Check staging deployments
kubectl get deployments -n staging
kubectl get pods -n staging
kubectl get services -n staging

# Test API health endpoint
kubectl port-forward deployment/novafsm-api 3000:3000 -n staging
curl http://localhost:3000/api/v1/health
```

- [ ] Deployments are running
- [ ] Pods are in Ready state
- [ ] Services are accessible
- [ ] Health endpoint returns 200 OK

### 6. Test Production Deployment
```bash
# Create a version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

- [ ] Production deployment workflow triggered
- [ ] Manual approval required
- [ ] Can approve deployment in GitHub Actions UI
- [ ] Deployment to production succeeded
- [ ] GitHub release created with changelog

## Troubleshooting

If any step fails, refer to the [troubleshooting guide](README.md#troubleshooting) in the main README.

### Common Issues Quick Fixes

**Issue:** AWS authentication fails
```bash
# Test AWS credentials locally
aws sts get-caller-identity
aws ecr describe-repositories --region us-east-1
```

**Issue:** kubectl can't connect to EKS
```bash
# Update kubeconfig
aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION

# Test connection
kubectl cluster-info
kubectl get nodes
```

**Issue:** Docker build fails
```bash
# Test backend Dockerfile locally
cd backend
docker build -t test-api .

# Test web Dockerfile locally
cd web-dashboard
docker build -t test-web .
```

**Issue:** Tests fail in CI but pass locally
- Check Node.js versions match (should be 20)
- Verify environment variables are set
- Review testcontainers setup for integration tests

## Post-Setup Tasks

### Monitoring Setup
- [ ] Set up CloudWatch logs for EKS
- [ ] Configure application monitoring (Datadog, New Relic, etc.)
- [ ] Set up alerts for failed deployments
- [ ] Configure uptime monitoring (Pingdom, UptimeRobot, etc.)

### Documentation
- [ ] Document custom secrets in team wiki
- [ ] Share AWS credentials securely with team
- [ ] Create runbook for common operations
- [ ] Document rollback procedures for team

### Security
- [ ] Enable Dependabot for automated dependency updates
- [ ] Configure secret scanning in GitHub
- [ ] Set up code scanning (CodeQL)
- [ ] Schedule regular security audits

### Team Training
- [ ] Train team on PR workflow
- [ ] Document deployment approval process
- [ ] Share rollback procedures
- [ ] Create incident response plan

## Maintenance Reminders

### Weekly
- [ ] Review failed workflows
- [ ] Check security scan results
- [ ] Monitor test coverage trends

### Monthly
- [ ] Update GitHub Actions versions
- [ ] Review and rotate AWS credentials
- [ ] Audit IAM permissions
- [ ] Check ECR image retention policy

### Quarterly
- [ ] Update Node.js version if new LTS available
- [ ] Review and optimize workflow performance
- [ ] Update documentation
- [ ] Conduct security audit

---

## Need Help?

- Read the [main documentation](README.md)
- Check the [troubleshooting guide](README.md#troubleshooting)
- Review [GitHub Actions docs](https://docs.github.com/en/actions)
- Contact DevOps team

---

**Setup Date:** _______________
**Completed By:** _______________
**Verified By:** _______________
