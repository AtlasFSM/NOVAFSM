# NoVaFSM Kubernetes Deployment Guide

Production-ready Kubernetes manifests for deploying NoVaFSM on Amazon EKS.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Pre-Deployment Setup](#pre-deployment-setup)
- [Deployment Steps](#deployment-steps)
- [Configuration](#configuration)
- [Monitoring and Observability](#monitoring-and-observability)
- [Scaling](#scaling)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [Security Best Practices](#security-best-practices)

## Prerequisites

### Required Components

1. **Amazon EKS Cluster** (v1.28+)
   - Properly configured node groups
   - At least 3 nodes across multiple availability zones
   - Instance types: t3.medium or larger (recommended: t3.large)

2. **AWS Load Balancer Controller** (v2.6+)
   ```bash
   # Install AWS Load Balancer Controller
   helm repo add eks https://aws.github.io/eks-charts
   helm repo update
   helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
     -n kube-system \
     --set clusterName=novafsm-prod-cluster \
     --set serviceAccount.create=false \
     --set serviceAccount.name=aws-load-balancer-controller
   ```

3. **Metrics Server** (for HPA)
   ```bash
   kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
   ```

4. **cert-manager** (v1.13+) - Optional if using AWS ACM
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

5. **External Dependencies**
   - Amazon RDS PostgreSQL (v14+)
   - Amazon ElastiCache Redis (v7+)
   - Amazon S3 bucket for uploads
   - Amazon ECR repositories for container images
   - AWS ACM certificate for HTTPS (or cert-manager)

### Required Tools

- `kubectl` v1.28+
- `aws-cli` v2.13+
- `helm` v3.12+
- `eksctl` (optional, for cluster management)

### IAM Permissions

Ensure your EKS cluster has IRSA (IAM Roles for Service Accounts) configured with:
- S3 read/write access
- Secrets Manager access (optional)
- CloudWatch Logs access
- ECR pull access

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet Users                           │
└────────────────────┬───────────────────┬────────────────────┘
                     │                   │
                     │                   │
              ┌──────▼──────┐     ┌──────▼──────┐
              │   Route 53  │     │   Route 53  │
              │ api.novafsm │     │ app.novafsm │
              └──────┬──────┘     └──────┬──────┘
                     │                   │
                     └─────────┬─────────┘
                               │
                      ┌────────▼────────┐
                      │  AWS ALB (443)  │
                      │  ACM TLS Cert   │
                      └────────┬────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
       ┌──────▼──────┐                  ┌──────▼──────┐
       │  API Service│                  │ Web Service │
       │  (ClusterIP)│                  │ (ClusterIP) │
       │  Port: 3000 │                  │ Port: 3001  │
       └──────┬──────┘                  └──────┬──────┘
              │                                 │
       ┌──────▼──────────┐              ┌──────▼──────────┐
       │  API Pods (3-10)│              │  Web Pods (2-5) │
       │  + HPA          │              │  + HPA          │
       │  + PDB          │              │  + PDB          │
       └──────┬──────────┘              └─────────────────┘
              │
    ┌─────────┼─────────────┬───────────┐
    │         │             │           │
┌───▼───┐ ┌───▼────┐ ┌──────▼─────┐ ┌──▼──┐
│  RDS  │ │ Redis  │ │ S3 Uploads │ │OTEL │
│  PG   │ │ Cache  │ │  Bucket    │ │ Coll│
└───────┘ └────────┘ └────────────┘ └─────┘
```

## Pre-Deployment Setup

### 1. Create ECR Repositories and Push Images

```bash
# Create ECR repositories
aws ecr create-repository --repository-name novafsm-api --region us-east-1
aws ecr create-repository --repository-name novafsm-web --region us-east-1

# Get ECR login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push API image
cd backend
docker build -t novafsm-api .
docker tag novafsm-api:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/novafsm-api:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/novafsm-api:latest

# Build and push Web image
cd ../web-dashboard
docker build -t novafsm-web .
docker tag novafsm-web:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/novafsm-web:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/novafsm-web:latest
```

### 2. Update Deployment Manifests

Replace placeholders in the manifests:

1. **ECR Image URLs** in `deployment-api.yml` and `deployment-web.yml`:
   - Replace `ACCOUNT_ID` with your AWS account ID

2. **Certificate ARN** in `ingress.yml`:
   - Replace `ACCOUNT_ID` and `CERTIFICATE_ID` with your ACM certificate ARN
   - Replace security group and subnet IDs

3. **IAM Role ARN** in `serviceaccount.yml`:
   - Replace `ACCOUNT_ID` with your AWS account ID
   - Replace with actual IAM role ARN for IRSA

4. **Email** in `cert-issuer.yml` (if using cert-manager):
   - Replace `devops@novafsm.com` with your actual email

### 3. Create and Configure Secrets

```bash
# Copy the secrets template
cp secrets.example.yml secrets.yml

# Generate JWT keys
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Encode secrets to base64
echo -n "postgresql://user:pass@rds-endpoint:5432/novafsm" | base64
echo -n "redis-endpoint.cache.amazonaws.com" | base64
echo -n "6379" | base64
echo -n "your-redis-password" | base64
cat private.pem | base64 -w 0
cat public.pem | base64 -w 0
echo -n "novafsm-prod-uploads" | base64
openssl rand -hex 32 | tr -d '\n' | base64

# Edit secrets.yml and replace all <BASE64_ENCODED_*> placeholders
vim secrets.yml

# IMPORTANT: Add secrets.yml to .gitignore
echo "infrastructure/k8s/secrets.yml" >> .gitignore
```

### 4. Create S3 Bucket for ALB Logs (Optional)

```bash
aws s3 mb s3://novafsm-alb-logs --region us-east-1

# Enable ALB access logs policy
aws s3api put-bucket-policy --bucket novafsm-alb-logs --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::127311923021:root"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::novafsm-alb-logs/*"
    }
  ]
}'
```

## Deployment Steps

### Step 1: Connect to EKS Cluster

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name novafsm-prod-cluster

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Step 2: Deploy in Order

```bash
# Navigate to k8s directory
cd infrastructure/k8s

# 1. Create namespace
kubectl apply -f namespace.yml

# 2. Create service accounts (IRSA)
kubectl apply -f serviceaccount.yml

# 3. Create ConfigMap
kubectl apply -f configmap.yml

# 4. Create Secrets (NEVER commit secrets.yml!)
kubectl apply -f secrets.yml

# 5. Deploy services
kubectl apply -f service-api.yml
kubectl apply -f service-web.yml

# 6. Deploy applications
kubectl apply -f deployment-api.yml
kubectl apply -f deployment-web.yml

# 7. Create Pod Disruption Budgets
kubectl apply -f pdb-api.yml
kubectl apply -f pdb-web.yml

# 8. Create Horizontal Pod Autoscalers
kubectl apply -f hpa-api.yml
kubectl apply -f hpa-web.yml

# 9. Deploy Ingress (creates ALB)
kubectl apply -f ingress.yml

# 10. Optional: Deploy cert-manager ClusterIssuer (if not using ACM)
# kubectl apply -f cert-issuer.yml
```

### Step 3: Verify Deployment

```bash
# Check namespace
kubectl get ns production

# Check pods
kubectl get pods -n production
kubectl get pods -n production -w  # Watch mode

# Check services
kubectl get svc -n production

# Check deployments
kubectl get deployments -n production

# Check HPA
kubectl get hpa -n production

# Check PDB
kubectl get pdb -n production

# Check ingress and get ALB DNS
kubectl get ingress -n production
kubectl describe ingress novafsm-ingress -n production

# Check pod logs
kubectl logs -n production -l app=novafsm,component=api --tail=100
kubectl logs -n production -l app=novafsm,component=web --tail=100

# Check events for issues
kubectl get events -n production --sort-by='.lastTimestamp'
```

### Step 4: Configure DNS

```bash
# Get the ALB DNS name
ALB_DNS=$(kubectl get ingress novafsm-ingress -n production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB DNS: $ALB_DNS"

# Create Route 53 records (or use your DNS provider)
aws route53 change-resource-record-sets --hosted-zone-id ZXXXXXXXXXXXXX --change-batch '{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.novafsm.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$ALB_DNS'"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.novafsm.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$ALB_DNS'"}]
      }
    }
  ]
}'
```

### Step 5: Verify HTTPS Access

```bash
# Wait for DNS propagation (may take 5-10 minutes)
# Test API health endpoint
curl -I https://api.novafsm.com/api/v1/health

# Test Web dashboard
curl -I https://app.novafsm.com

# If using cert-manager, verify certificate
kubectl get certificate -n production
kubectl describe certificate novafsm-tls-cert -n production
```

## Configuration

### Environment Variables

All configuration is managed through:
- **ConfigMap** (`configmap.yml`): Non-sensitive configuration
- **Secrets** (`secrets.yml`): Sensitive data (passwords, keys, etc.)

To update configuration:

```bash
# Edit ConfigMap
kubectl edit configmap novafsm-config -n production

# Or apply updated file
kubectl apply -f configmap.yml

# Restart pods to pick up changes
kubectl rollout restart deployment/novafsm-api -n production
kubectl rollout restart deployment/novafsm-web -n production
```

### Updating Secrets

```bash
# NEVER edit secrets directly in the cluster
# Always update secrets.yml and reapply

# 1. Update secrets.yml with new base64 encoded values
# 2. Apply changes
kubectl apply -f secrets.yml

# 3. Restart deployments
kubectl rollout restart deployment/novafsm-api -n production
kubectl rollout restart deployment/novafsm-web -n production
```

## Monitoring and Observability

### Health Checks

```bash
# Check pod health
kubectl get pods -n production
kubectl describe pod POD_NAME -n production

# Check liveness/readiness probes
kubectl describe pod POD_NAME -n production | grep -A 10 "Liveness\|Readiness"

# Manual health check
kubectl exec -it POD_NAME -n production -- curl localhost:3000/api/v1/health
```

### Logs

```bash
# View API logs
kubectl logs -n production -l app=novafsm,component=api -f

# View Web logs
kubectl logs -n production -l app=novafsm,component=web -f

# View logs from all containers in a pod
kubectl logs -n production POD_NAME --all-containers=true

# View previous container logs (if pod crashed)
kubectl logs -n production POD_NAME --previous

# Export logs to file
kubectl logs -n production -l app=novafsm,component=api --since=1h > api-logs.txt
```

### Metrics

```bash
# View pod resource usage
kubectl top pods -n production

# View node resource usage
kubectl top nodes

# View HPA metrics
kubectl get hpa -n production
kubectl describe hpa novafsm-api-hpa -n production
```

### CloudWatch Integration

Set up Fluent Bit for log aggregation:

```bash
# Install Fluent Bit
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluent-bit-quickstart.yaml

# View logs in CloudWatch
# Go to AWS Console → CloudWatch → Log Groups → /aws/eks/novafsm-prod-cluster
```

### Prometheus & Grafana (Optional)

```bash
# Install Prometheus & Grafana using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Default credentials: admin / prom-operator
```

## Scaling

### Manual Scaling

```bash
# Scale API deployment
kubectl scale deployment/novafsm-api -n production --replicas=5

# Scale Web deployment
kubectl scale deployment/novafsm-web -n production --replicas=3

# Verify
kubectl get deployments -n production
```

### Automatic Scaling (HPA)

HPA is already configured. Monitor it:

```bash
# Watch HPA in real-time
kubectl get hpa -n production -w

# View HPA events
kubectl describe hpa novafsm-api-hpa -n production

# Edit HPA thresholds
kubectl edit hpa novafsm-api-hpa -n production
```

### Cluster Autoscaler (Optional)

For node-level autoscaling:

```bash
# Install Cluster Autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

# Configure for your cluster
kubectl -n kube-system edit deployment cluster-autoscaler
# Add: --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/novafsm-prod-cluster
```

## Maintenance

### Rolling Updates

```bash
# Update to new image version
kubectl set image deployment/novafsm-api novafsm-api=ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/novafsm-api:v1.2.0 -n production

# Watch rollout status
kubectl rollout status deployment/novafsm-api -n production

# View rollout history
kubectl rollout history deployment/novafsm-api -n production
```

### Database Migrations

Migrations run automatically via initContainer in `deployment-api.yml`.

To run manually:

```bash
# Run migration job
kubectl exec -it deployment/novafsm-api -n production -- npm run migrate:deploy

# View migration status
kubectl logs -n production -l app=novafsm,component=api -c migrate
```

### Backup and Restore

```bash
# Backup all manifests
kubectl get all,cm,secrets,pdb,hpa,ingress -n production -o yaml > backup-$(date +%Y%m%d).yaml

# Backup specific resources
kubectl get deployment novafsm-api -n production -o yaml > backup-api-deployment.yaml

# Restore from backup
kubectl apply -f backup-20250101.yaml
```

### Certificate Renewal

**Using AWS ACM**: Automatic renewal

**Using cert-manager**: Automatic renewal (30 days before expiry)

```bash
# Force certificate renewal (cert-manager)
kubectl delete certificate novafsm-tls-cert -n production
kubectl apply -f ingress.yml
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n production
kubectl describe pod POD_NAME -n production

# Common issues:
# 1. Image pull errors → Check ECR permissions
# 2. CrashLoopBackOff → Check logs: kubectl logs POD_NAME -n production
# 3. Pending → Check node resources: kubectl describe node NODE_NAME
```

### Ingress/ALB Issues

```bash
# Check ingress
kubectl describe ingress novafsm-ingress -n production

# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller -f

# Verify security groups allow traffic on ports 80/443
# Verify subnets are properly tagged for ALB
```

### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it deployment/novafsm-api -n production -- sh
# Inside pod:
nc -zv RDS_ENDPOINT 5432
curl -v telnet://RDS_ENDPOINT:5432

# Check secrets
kubectl get secret novafsm-secrets -n production -o jsonpath='{.data.DATABASE_URL}' | base64 -d
```

### Redis Connection Issues

```bash
# Test Redis connectivity
kubectl exec -it deployment/novafsm-api -n production -- sh
# Inside pod:
nc -zv REDIS_ENDPOINT 6379

# Check Redis password
kubectl get secret novafsm-secrets -n production -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d
```

### HPA Not Scaling

```bash
# Check metrics server
kubectl get deployment metrics-server -n kube-system

# Check HPA status
kubectl describe hpa novafsm-api-hpa -n production

# View current metrics
kubectl get hpa -n production
kubectl top pods -n production
```

### PDB Blocking Node Drains

```bash
# Check PDB status
kubectl get pdb -n production
kubectl describe pdb novafsm-api-pdb -n production

# Temporarily disable PDB (not recommended)
kubectl delete pdb novafsm-api-pdb -n production

# Re-enable after maintenance
kubectl apply -f pdb-api.yml
```

## Rollback Procedures

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/novafsm-api -n production

# Rollback to previous version
kubectl rollout undo deployment/novafsm-api -n production

# Rollback to specific revision
kubectl rollout undo deployment/novafsm-api -n production --to-revision=2

# Verify rollback
kubectl rollout status deployment/novafsm-api -n production
```

### Emergency Rollback

```bash
# Scale down new version immediately
kubectl scale deployment/novafsm-api -n production --replicas=0

# Restore from backup
kubectl apply -f backup-api-deployment.yaml

# Scale up old version
kubectl scale deployment/novafsm-api -n production --replicas=3
```

### Database Rollback

```bash
# Prisma migrations can't be easily rolled back
# Use database snapshots for critical changes

# Restore RDS snapshot (AWS Console or CLI)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier novafsm-restored \
  --db-snapshot-identifier snapshot-before-migration

# Update DATABASE_URL to point to restored instance
kubectl edit secret novafsm-secrets -n production
```

## Security Best Practices

### 1. Secrets Management

- ✅ **DO**: Use Kubernetes Secrets or AWS Secrets Manager
- ✅ **DO**: Rotate secrets regularly (JWT keys, session secrets)
- ✅ **DO**: Use IRSA instead of hardcoded AWS credentials
- ❌ **DON'T**: Commit secrets to Git
- ❌ **DON'T**: Hardcode secrets in manifests

### 2. Network Security

```bash
# Create NetworkPolicies to restrict pod-to-pod communication
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: novafsm
      component: api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
      - podSelector:
          matchLabels:
            app: aws-load-balancer-controller
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
      - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 5432  # PostgreSQL
        - protocol: TCP
          port: 6379  # Redis
        - protocol: TCP
          port: 443   # HTTPS
EOF
```

### 3. RBAC

```bash
# Create read-only role for developers
kubectl create role developer --verb=get,list,watch --resource=pods,deployments,services -n production
kubectl create rolebinding developer-binding --role=developer --user=developer@example.com -n production
```

### 4. Pod Security Standards

```bash
# Enable Pod Security Standards for namespace
kubectl label namespace production pod-security.kubernetes.io/enforce=restricted
kubectl label namespace production pod-security.kubernetes.io/audit=restricted
kubectl label namespace production pod-security.kubernetes.io/warn=restricted
```

### 5. Image Scanning

```bash
# Scan images for vulnerabilities before deployment
aws ecr start-image-scan --repository-name novafsm-api --image-id imageTag=latest

# View scan results
aws ecr describe-image-scan-findings --repository-name novafsm-api --image-id imageTag=latest
```

### 6. Audit Logging

Enable EKS control plane logging:

```bash
aws eks update-cluster-config \
  --name novafsm-prod-cluster \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
```

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Prometheus Operator](https://prometheus-operator.dev/)

## Support

For issues or questions:
1. Check logs: `kubectl logs -n production POD_NAME`
2. Check events: `kubectl get events -n production`
3. Review troubleshooting section above
4. Contact DevOps team: devops@novafsm.com

---

**Last Updated**: 2025-11-04
**Version**: 1.0.0
**Maintained By**: NoVaFSM DevOps Team
