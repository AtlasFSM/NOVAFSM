# GitHub Actions Workflow Troubleshooting Guide

This guide helps diagnose and fix common issues with the NoVaFSM CI/CD workflows.

## Quick Diagnosis

### Workflow Not Running
**Symptom**: Workflows don't trigger on push or PR

**Solutions**:
1. Check if workflows are enabled in repo settings
2. Verify branch names in workflow trigger configuration
3. Check if `.github/workflows/` directory has correct permissions

### Backend Tests Failing
**Symptom**: `backend-lint-and-test` or `backend-checks` job fails

**Common Causes**:
1. **Missing test files**: Ensure `backend/test/` directory exists with test files
2. **Prisma not generated**: Run `npx prisma generate` locally first
3. **TypeScript errors**: Run `npm run typecheck` locally to see errors
4. **Lint errors**: Run `npm run lint` locally to fix issues

**Fix Steps**:
```bash
cd backend
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm run test
npm run test:integration
```

### Frontend Tests Failing
**Symptom**: `frontend-lint-and-test` or `frontend-checks` job fails

**Common Causes**:
1. **Build errors**: Missing environment variables
2. **TypeScript errors**: Type mismatches
3. **Lint errors**: ESLint violations

**Fix Steps**:
```bash
cd web-dashboard
npm ci
npm run lint
npm run typecheck
npm run build
```

### Integration Tests Failing
**Symptom**: `test:integration` step fails

**Common Causes**:
1. **Missing test directory**: `backend/test/` doesn't exist
2. **Missing jest config**: `test/jest-integration.config.js` not found
3. **Database connection**: Testcontainers not starting

**Fix Steps**:
- Ensure all files in `backend/test/` exist
- Check Docker is available (for testcontainers)
- Review `test/setup-integration.ts` for environment setup

### Security Scan Warnings
**Symptom**: `security-scan` job reports vulnerabilities

**Common Causes**:
1. **Outdated dependencies**: npm packages with known vulnerabilities
2. **High/Critical CVEs**: Security issues in dependencies

**Fix Steps**:
```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# For manual fixes
npm update [package-name]
```

### Docker Build Failing
**Symptom**: `build-and-push-images` job fails

**Common Causes**:
1. **Missing AWS credentials**: Required secrets not set
2. **Dockerfile errors**: Syntax or build issues
3. **ECR repository not exists**: Repository URL incorrect

**Fix Steps**:
1. Test Docker builds locally:
```bash
docker build -t novafsm-api ./backend
docker build -t novafsm-web ./web-dashboard
```

2. Verify GitHub Secrets are set:
   - Go to Settings → Secrets and variables → Actions
   - Required secrets:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `AWS_REGION`
     - `ECR_REPOSITORY_API`
     - `ECR_REPOSITORY_WEB`
     - `EKS_CLUSTER_NAME`

### Deployment Failing
**Symptom**: `deploy-to-staging` or `deploy-to-production` fails

**Common Causes**:
1. **AWS permissions**: IAM role lacks EKS permissions
2. **K8s manifests**: Invalid Kubernetes configurations
3. **Cluster not exists**: EKS cluster name incorrect

**Fix Steps**:
1. Test kubectl connection:
```bash
aws eks update-kubeconfig --name <cluster-name> --region <region>
kubectl cluster-info
```

2. Validate K8s manifests:
```bash
kubectl apply --dry-run=client -f infrastructure/k8s/
```

## Required GitHub Secrets

### Essential (for CI/CD to work)
| Secret | Description | Example |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `ECR_REPOSITORY_API` | ECR URL for API | `123456.dkr.ecr.us-east-1.amazonaws.com/novafsm-api` |
| `ECR_REPOSITORY_WEB` | ECR URL for web | `123456.dkr.ecr.us-east-1.amazonaws.com/novafsm-web` |
| `EKS_CLUSTER_NAME` | EKS cluster name | `novafsm-cluster` |

### Optional (enhance functionality)
| Secret | Description | Used For |
|--------|-------------|----------|
| `SNYK_TOKEN` | Snyk API token | Security scanning |
| `CODECOV_TOKEN` | Codecov token | Coverage reports |
| `SLACK_WEBHOOK_URL` | Slack webhook | Build notifications |

## Workflow Structure

### ci-cd.yml (Main Pipeline)
**Triggers**: Push to `main`, tags starting with `v`

**Jobs**:
1. `backend-lint-and-test` - Backend validation
2. `frontend-lint-and-test` - Frontend validation
3. `security-scan` - Security checks (Snyk, Trivy)
4. `build-and-push-images` - Docker builds to ECR
5. `deploy-to-staging` - Deploy to staging environment
6. `deploy-to-production` - Deploy to production (tags only)
7. `notify-slack` - Send Slack notification

### pr.yml (Pull Request Checks)
**Triggers**: Pull requests to `main`

**Jobs**:
1. `backend-checks` - Backend tests
2. `frontend-checks` - Frontend tests
3. `changed-files` - Detect changed files
4. `security-check` - Quick security scan
5. `pr-comment` - Post results comment
6. `quality-gate` - Final validation

## Testing Workflows Locally

### Using Act (GitHub Actions locally)
```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run PR workflow
act pull_request

# Run specific job
act -j backend-checks
```

### Manual Testing
```bash
# Backend tests
cd backend
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm run test
npm run test:integration

# Frontend tests
cd web-dashboard
npm ci
npm run lint
npm run typecheck
npm run build
```

## Common Error Messages

### "Cannot find module 'test/jest-integration.config.js'"
**Fix**: Ensure `backend/test/jest-integration.config.js` exists

### "Prisma Client not generated"
**Fix**: Run `npx prisma generate` in backend directory

### "Error: No tests found"
**Fix**: Create at least one `*.spec.ts`, `*.integration-spec.ts`, or `*.e2e-spec.ts` file

### "ENOENT: no such file or directory, open 'coverage-summary.json'"
**Fix**: Ensure jest config includes `"json-summary"` in `coverageReporters`

### "RequestError: Not Found"
**Fix**: Check AWS ECR repository URLs in secrets

### "error: You must be logged in to the server (Unauthorized)"
**Fix**: Verify AWS credentials have EKS permissions

## Debugging Tips

1. **Enable debug logging**: Add `ACTIONS_RUNNER_DEBUG=true` to secrets
2. **Check workflow runs**: Go to Actions tab in GitHub
3. **View job logs**: Click on failed job to see detailed logs
4. **Re-run failed jobs**: Click "Re-run failed jobs" button
5. **Test locally first**: Always run tests locally before pushing

## Getting Help

If issues persist:
1. Check GitHub Actions status page
2. Review workflow logs in detail
3. Validate all secrets are correctly set
4. Test Docker builds locally
5. Ensure all test files exist

## Updating Workflows

When modifying workflows:
1. Test changes in a feature branch
2. Create a PR to see workflow results
3. Review workflow syntax with GitHub's validator
4. Document any new secrets required
5. Update this troubleshooting guide

## Maintenance Tasks

### Weekly
- Review failed workflow runs
- Update dependencies if needed
- Check security scan results

### Monthly
- Update GitHub Actions versions
- Review and update secrets
- Test deployment pipelines

### Quarterly
- Audit IAM permissions
- Review and optimize workflow performance
- Update documentation
