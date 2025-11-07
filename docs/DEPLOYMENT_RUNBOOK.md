# NoVaFSM Production Deployment Runbook

**Version:** 1.0.0
**Last Updated:** 2025-11-07
**Maintainer:** DevOps Team

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Application Deployment](#application-deployment)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Troubleshooting](#troubleshooting)
7. [Emergency Contacts](#emergency-contacts)

---

## 🔍 Pre-Deployment Checklist

### Code Readiness
- [ ] All tests passing (backend ≥80% coverage)
- [ ] No critical/high security vulnerabilities (run `npm audit`)
- [ ] Code reviewed and approved
- [ ] CHANGELOG.md updated with release notes
- [ ] Git tag created (e.g., `v1.0.0`)

### Environment Preparation
- [ ] AWS credentials configured
- [ ] Terraform state backend initialized
- [ ] Secrets created in AWS Secrets Manager
- [ ] Database backup completed (if updating existing deployment)
- [ ] Maintenance window scheduled (if required)
- [ ] Stakeholders notified

### Required Tools
```bash
# Verify required tools are installed
terraform --version    # >= 1.6.0
kubectl version       # >= 1.28.0
aws --version         # >= 2.x
docker --version      # >= 24.x
```

---

## 🏗️ Infrastructure Setup

### Step 1: Initialize Terraform Backend

```bash
cd infrastructure/terraform

# Initialize Terraform (first time only)
terraform init

# Review the execution plan
terraform plan -out=tfplan

# Apply infrastructure changes
terraform apply tfplan
```

**Expected Duration:** 30-45 minutes (first deployment)

**Resources Created:**
- VPC with public/private subnets (Multi-AZ)
- EKS cluster with managed node groups
- RDS PostgreSQL 15 (Multi-AZ, encrypted)
- ElastiCache Redis (Multi-AZ, encrypted)
- S3 bucket for file storage
- ECR repositories (backend, web-dashboard)
- AWS Secrets Manager secrets

### Step 2: Configure kubectl

```bash
# Update kubeconfig for EKS cluster
aws eks update-kubeconfig \
  --name novafsm-production \
  --region us-east-1 \
  --alias novafsm-prod

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Step 3: Create Kubernetes Secrets

```bash
cd infrastructure/k8s

# Create production namespace
kubectl create namespace production

# Create secrets from AWS Secrets Manager
kubectl create secret generic novafsm-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=jwt-private-key="$JWT_PRIVATE_KEY" \
  --from-literal=jwt-public-key="$JWT_PUBLIC_KEY" \
  --from-literal=redis-url="$REDIS_URL" \
  -n production

# Verify secrets created
kubectl get secrets -n production
```

---

## 🚀 Application Deployment

### Step 1: Build and Push Docker Images

```bash
# Set variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1
export IMAGE_TAG=$(git rev-parse --short HEAD)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend
cd backend
docker build -t novafsm-api:$IMAGE_TAG .
docker tag novafsm-api:$IMAGE_TAG \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/novafsm-api:$IMAGE_TAG
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/novafsm-api:$IMAGE_TAG

# Build and push web dashboard
cd ../web-dashboard
docker build -t novafsm-web:$IMAGE_TAG .
docker tag novafsm-web:$IMAGE_TAG \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/novafsm-web:$IMAGE_TAG
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/novafsm-web:$IMAGE_TAG
```

**Expected Duration:** 10-15 minutes

### Step 2: Run Database Migrations

```bash
# Port-forward to RDS via bastion (if using bastion)
# Or use VPN/direct connection

cd backend

# Run migrations
DATABASE_URL="$PRODUCTION_DATABASE_URL" npm run db:migrate

# Verify migration status
DATABASE_URL="$PRODUCTION_DATABASE_URL" npx prisma migrate status

# Optional: Seed initial data (first deployment only)
DATABASE_URL="$PRODUCTION_DATABASE_URL" npm run seed
```

**Expected Duration:** 2-5 minutes

### Step 3: Deploy Kubernetes Manifests

```bash
cd infrastructure/k8s

# Apply ConfigMap
kubectl apply -f configmap.yml -n production

# Apply Deployments
kubectl apply -f deployment-api.yml -n production
kubectl apply -f deployment-web.yml -n production

# Apply Services
kubectl apply -f service-api.yml -n production
kubectl apply -f service-web.yml -n production

# Apply Ingress
kubectl apply -f ingress.yml -n production

# Apply HPA (Horizontal Pod Autoscaler)
kubectl apply -f hpa-api.yml -n production
kubectl apply -f hpa-web.yml -n production

# Apply PDB (Pod Disruption Budget)
kubectl apply -f pdb-api.yml -n production
kubectl apply -f pdb-web.yml -n production
```

**Expected Duration:** 3-5 minutes

### Step 4: Wait for Rollout

```bash
# Wait for API rollout
kubectl rollout status deployment/novafsm-api -n production --timeout=10m

# Wait for Web rollout
kubectl rollout status deployment/novafsm-web -n production --timeout=5m

# Check pod status
kubectl get pods -n production
```

**Expected Output:**
```
NAME                            READY   STATUS    RESTARTS   AGE
novafsm-api-xxxxx-xxxxx        1/1     Running   0          2m
novafsm-api-xxxxx-xxxxx        1/1     Running   0          2m
novafsm-api-xxxxx-xxxxx        1/1     Running   0          2m
novafsm-web-xxxxx-xxxxx        1/1     Running   0          2m
novafsm-web-xxxxx-xxxxx        1/1     Running   0          2m
```

---

## ✅ Post-Deployment Verification

### Health Checks

```bash
# Get service endpoints
kubectl get ingress -n production

# Health check endpoints
API_URL=$(kubectl get ingress novafsm-ingress -n production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Liveness probe
curl -f https://$API_URL/api/v1/health/liveness

# Readiness probe
curl -f https://$API_URL/api/v1/health/readiness

# Full health check
curl -f https://$API_URL/api/v1/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2025-11-07T12:00:00Z",
  "uptime": 120,
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": "OK",
    "redis": "OK"
  }
}
```

### Smoke Tests

```bash
# Test authentication
curl -X POST https://$API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.ca","password":"Password123!"}'

# Test API endpoints (use token from above)
TOKEN="<jwt_token>"

# Get organizations
curl https://$API_URL/api/v1/organizations \
  -H "Authorization: Bearer $TOKEN"

# Get customers
curl https://$API_URL/api/v1/customers \
  -H "Authorization: Bearer $TOKEN"
```

### Web Dashboard Test

1. Open browser: `https://<your-domain>/login`
2. Login with test credentials
3. Verify dashboard loads
4. Test navigation to Customers, Jobs, Quotes
5. Verify real-time updates (WebSocket)

### Database Verification

```bash
# Connect to database
psql "$DATABASE_URL"

# Check tables exist
\dt

# Check record counts
SELECT 'organizations' as table, COUNT(*) FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'customers', COUNT(*) FROM customers;

# Exit
\q
```

### Monitoring & Logs

```bash
# Check pod logs
kubectl logs -l app=novafsm-api -n production --tail=100

# Check recent events
kubectl get events -n production --sort-by='.lastTimestamp'

# Monitor pod metrics
kubectl top pods -n production
```

---

## ⏮️ Rollback Procedures

### Quick Rollback (Kubernetes)

```bash
# Rollback API deployment to previous version
kubectl rollout undo deployment/novafsm-api -n production

# Rollback Web deployment
kubectl rollout undo deployment/novafsm-web -n production

# Check rollback status
kubectl rollout status deployment/novafsm-api -n production
kubectl rollout status deployment/novafsm-web -n production
```

**Duration:** 2-3 minutes

### Database Rollback

```bash
# List available migrations
npx prisma migrate status

# Rollback to specific migration
# Note: Prisma doesn't support automatic rollback
# Manual rollback required

# 1. Restore from backup
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier novafsm-production \
  --target-db-instance-identifier novafsm-production-restored \
  --restore-time 2025-11-07T10:00:00Z

# 2. Or manually revert migrations
# Create down migration scripts in prisma/migrations
```

### Infrastructure Rollback

```bash
cd infrastructure/terraform

# Rollback to previous Terraform state
terraform plan -destroy -target=<resource>

# Or revert to previous git commit
git revert <commit-hash>
terraform apply
```

---

## 🔧 Troubleshooting

### Issue: Pods not starting

**Symptoms:**
- Pods in `CrashLoopBackOff` or `Error` state
- `kubectl get pods` shows unhealthy pods

**Diagnosis:**
```bash
# Check pod logs
kubectl logs <pod-name> -n production

# Describe pod
kubectl describe pod <pod-name> -n production

# Check events
kubectl get events -n production --field-selector involvedObject.name=<pod-name>
```

**Common Causes:**
1. **Database connection failure**
   - Verify `DATABASE_URL` secret is correct
   - Check RDS security group allows EKS traffic
   - Verify database is running: `aws rds describe-db-instances`

2. **Missing secrets**
   - Verify secrets exist: `kubectl get secrets -n production`
   - Check secret values: `kubectl describe secret novafsm-secrets -n production`

3. **Image pull errors**
   - Verify ECR permissions
   - Check image exists: `aws ecr describe-images --repository-name novafsm-api`

### Issue: High error rate

**Symptoms:**
- 500 errors in API responses
- High pod restart count

**Diagnosis:**
```bash
# Check error logs
kubectl logs -l app=novafsm-api -n production --tail=1000 | grep ERROR

# Check pod resource usage
kubectl top pods -n production

# Check database connections
# Connect to pod
kubectl exec -it <api-pod-name> -n production -- /bin/sh
# Inside pod
ps aux | grep node
```

**Solutions:**
1. Scale up pods if resource constrained
2. Check database connection pool settings
3. Review recent code changes for bugs

### Issue: Slow response times

**Symptoms:**
- API latency > 2s
- Web dashboard slow to load

**Diagnosis:**
```bash
# Check pod CPU/memory
kubectl top pods -n production

# Check HPA status
kubectl get hpa -n production

# Check database performance
# RDS Performance Insights dashboard
aws rds describe-db-instances \
  --db-instance-identifier novafsm-production \
  --query 'DBInstances[0].PerformanceInsightsEnabled'
```

**Solutions:**
1. Scale up HPA: `kubectl scale deployment novafsm-api --replicas=5 -n production`
2. Add database indexes (after analysis)
3. Enable Redis caching for frequently accessed data

### Issue: Database migration failed

**Symptoms:**
- Migration command exits with error
- Application crashes on startup

**Diagnosis:**
```bash
# Check migration status
DATABASE_URL="$PRODUCTION_DATABASE_URL" npx prisma migrate status

# Check migration history
DATABASE_URL="$PRODUCTION_DATABASE_URL" npx prisma migrate resolve --preview-feature
```

**Solutions:**
1. **Mark migration as applied** (if already applied manually):
   ```bash
   npx prisma migrate resolve --applied <migration-name>
   ```

2. **Mark migration as rolled back**:
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Restore database from backup** and retry

---

## 📞 Emergency Contacts

### On-Call Engineers
- **Primary:** DevOps Lead (+1-555-0100)
- **Secondary:** Backend Lead (+1-555-0101)
- **Escalation:** CTO (+1-555-0200)

### External Contacts
- **AWS Support:** Use AWS Console → Support → Create Case
- **Datadog (if enabled):** support@datadog.com
- **Sentry (if enabled):** support@sentry.io

### Incident Management
1. Create incident ticket in project management tool
2. Notify #incidents Slack channel
3. Start incident war room if P0/P1
4. Follow incident response playbook
5. Post-mortem within 48 hours

---

## 📊 Key Metrics to Monitor

### Application Metrics
- **Response Time:** < 500ms (p95)
- **Error Rate:** < 0.1%
- **Availability:** > 99.9%

### Infrastructure Metrics
- **Pod CPU:** < 70% average
- **Pod Memory:** < 80% average
- **Database Connections:** < 80% of max
- **Redis Memory:** < 80% of max

### Business Metrics
- **Active Users:** Monitor login rate
- **Jobs Created:** Track business activity
- **API Requests:** Monitor traffic patterns

---

## 📝 Post-Deployment Tasks

### Immediately After Deployment
- [ ] Update deployment log with version and timestamp
- [ ] Notify stakeholders of successful deployment
- [ ] Monitor metrics for 30 minutes
- [ ] Update status page (if applicable)

### Within 24 Hours
- [ ] Review error logs for any new issues
- [ ] Check performance metrics vs. baseline
- [ ] Verify backup jobs completed successfully
- [ ] Document any issues encountered

### Within 1 Week
- [ ] Schedule post-deployment review meeting
- [ ] Update runbook based on lessons learned
- [ ] Review and optimize resource allocation
- [ ] Plan next release

---

## 🔐 Security Checklist

- [ ] All secrets rotated in last 90 days
- [ ] TLS certificates valid (check expiry)
- [ ] WAF rules reviewed and updated
- [ ] Security groups follow least privilege
- [ ] Database encryption at rest enabled
- [ ] Database encryption in transit enabled
- [ ] Audit logs enabled and monitored
- [ ] No sensitive data in logs

---

## 📚 Additional Resources

- **Architecture Diagrams:** `/docs/diagrams/`
- **API Documentation:** `https://<domain>/docs`
- **Monitoring Dashboard:** AWS CloudWatch / Grafana
- **Incident Playbooks:** `/docs/incidents/`
- **Terraform Docs:** `/infrastructure/terraform/README.md`
- **K8s Manifests:** `/infrastructure/k8s/README.md`

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-07
**Next Review:** 2025-12-07
