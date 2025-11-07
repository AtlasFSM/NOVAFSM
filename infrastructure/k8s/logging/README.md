# NoVaFSM Centralized Logging Stack

This directory contains the centralized logging solution for NoVaFSM using **Fluent Bit** to collect container logs and forward them to **AWS CloudWatch Logs**.

## 📋 Overview

### Architecture

```
┌─────────────────┐
│  Kubernetes     │
│  Container Logs │
│  /var/log/      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fluent Bit     │
│  (DaemonSet)    │
│  - Parse JSON   │
│  - Add metadata │
│  - Filter       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AWS CloudWatch │
│  Log Groups:    │
│  /aws/eks/...   │
└─────────────────┘
```

### Components

1. **Fluent Bit DaemonSet**
   - Runs on every node
   - Collects logs from `/var/log/containers/`
   - Enriches with Kubernetes metadata
   - Forwards to CloudWatch Logs

2. **CloudWatch Log Groups**
   - `/aws/eks/novafsm-production/application` - Application logs (API, Web)
   - `/aws/eks/novafsm-production/cluster` - System logs (kubelet, docker)
   - `/aws/eks/novafsm-production/dataplane` - Other Kubernetes logs

3. **IAM Roles for Service Accounts (IRSA)**
   - Secure credential management
   - No need for AWS access keys
   - Automatic credential rotation

## 🚀 Quick Start

### Prerequisites

1. **EKS Cluster** with IRSA enabled
2. **OIDC Provider** associated with your EKS cluster
3. **IAM permissions** to create policies and roles
4. **eksctl** or **AWS CLI** installed

### Step 1: Create IAM Policy and Role

#### Option 1: Using eksctl (Recommended)

```bash
# Create IAM policy and role with IRSA
eksctl create iamserviceaccount \
  --name fluent-bit \
  --namespace kube-system \
  --cluster novafsm-production \
  --region us-east-1 \
  --attach-policy-arn arn:aws:iam::ACCOUNT_ID:policy/FluentBitCloudWatchPolicy \
  --approve \
  --override-existing-serviceaccounts
```

#### Option 2: Using AWS CLI (Manual)

```bash
# 1. Create IAM policy
aws iam create-policy \
  --policy-name FluentBitCloudWatchPolicy \
  --policy-document file://iam-policy.json

# 2. Get OIDC provider URL
OIDC_PROVIDER=$(aws eks describe-cluster \
  --name novafsm-production \
  --region us-east-1 \
  --query "cluster.identity.oidc.issuer" \
  --output text | sed -e "s/^https:\/\///")

# 3. Create IAM role trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/${OIDC_PROVIDER}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "${OIDC_PROVIDER}:sub": "system:serviceaccount:kube-system:fluent-bit",
          "${OIDC_PROVIDER}:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
EOF

# 4. Create IAM role
aws iam create-role \
  --role-name FluentBitCloudWatchRole \
  --assume-role-policy-document file://trust-policy.json

# 5. Attach policy to role
aws iam attach-role-policy \
  --role-name FluentBitCloudWatchRole \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/FluentBitCloudWatchPolicy

# 6. Annotate ServiceAccount
kubectl annotate serviceaccount fluent-bit \
  -n kube-system \
  eks.amazonaws.com/role-arn=arn:aws:iam::ACCOUNT_ID:role/FluentBitCloudWatchRole
```

### Step 2: Deploy Fluent Bit

```bash
# Deploy RBAC
kubectl apply -f rbac.yml

# Deploy ConfigMap
kubectl apply -f configmap.yml

# Deploy DaemonSet
kubectl apply -f daemonset.yml

# (Optional) Deploy Service for metrics
kubectl apply -f service.yml
```

**Expected deployment time:** 1-2 minutes

### Step 3: Verify Deployment

```bash
# Check DaemonSet status
kubectl get daemonset fluent-bit -n kube-system

# Expected output:
# NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR
# fluent-bit   3         3         3       3            3           <none>

# Check pods are running on all nodes
kubectl get pods -n kube-system -l app=fluent-bit -o wide

# Check pod logs
kubectl logs -n kube-system -l app=fluent-bit --tail=50

# Should see messages like:
# [2025/11/07 12:00:00] [ info] [input:tail:tail.0] inotify_fs_add(): inode=...
# [2025/11/07 12:00:00] [ info] [output:cloudwatch_logs:cloudwatch_logs.0] Created log stream...
```

### Step 4: Verify CloudWatch Logs

```bash
# List log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/eks/novafsm-production

# List log streams (API logs)
aws logs describe-log-streams \
  --log-group-name /aws/eks/novafsm-production/application \
  --max-items 10

# View recent logs
aws logs tail /aws/eks/novafsm-production/application --follow
```

**Or via AWS Console:**
1. Open CloudWatch → Logs → Log groups
2. Navigate to `/aws/eks/novafsm-production/application`
3. Click on a log stream to view logs

## 📊 Log Groups and Streams

### Log Group Structure

| Log Group | Purpose | Retention | Log Streams |
|-----------|---------|-----------|-------------|
| `/aws/eks/novafsm-production/application` | Application logs (API, Web) | 30 days | `api-<pod-name>`, `web-<pod-name>` |
| `/aws/eks/novafsm-production/cluster` | System logs (kubelet, docker) | 7 days | `systemd-<node-name>` |
| `/aws/eks/novafsm-production/dataplane` | Other K8s logs | 7 days | `<node-name>-<namespace>.<pod-name>` |

### Log Format

Logs are enriched with Kubernetes metadata:

```json
{
  "log": "2025-11-07T12:00:00.123Z [info] User login successful",
  "stream": "stdout",
  "time": "2025-11-07T12:00:00.123456789Z",
  "kubernetes": {
    "pod_name": "novafsm-api-7d8f9b6c5d-abc12",
    "namespace_name": "production",
    "pod_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "labels": {
      "app": "novafsm-api",
      "version": "v1.0.0"
    },
    "host": "ip-10-0-1-100.ec2.internal",
    "container_name": "novafsm-api"
  },
  "cluster_name": "novafsm-production",
  "environment": "production",
  "region": "us-east-1"
}
```

## 🔍 Querying Logs

### CloudWatch Logs Insights

Navigate to CloudWatch → Logs → Insights, select log groups, and run queries:

#### Example 1: Find all errors in the last hour

```
fields @timestamp, kubernetes.pod_name, log
| filter log like /ERROR|error|Error/
| sort @timestamp desc
| limit 100
```

#### Example 2: Count errors by pod

```
fields kubernetes.pod_name
| filter log like /ERROR|error|Error/
| stats count() by kubernetes.pod_name
```

#### Example 3: API response times

```
fields @timestamp, log
| filter log like /response_time/
| parse log /response_time=(?<duration>\d+)/
| stats avg(duration), max(duration), min(duration), count() by bin(5m)
```

#### Example 4: Failed login attempts

```
fields @timestamp, kubernetes.pod_name, log
| filter log like /login failed|authentication failed/
| sort @timestamp desc
| limit 50
```

#### Example 5: Database errors

```
fields @timestamp, log
| filter log like /database error|connection refused|timeout/
| sort @timestamp desc
```

### AWS CLI Queries

```bash
# Get logs from last 1 hour
aws logs filter-log-events \
  --log-group-name /aws/eks/novafsm-production/application \
  --start-time $(date -u -d '1 hour ago' +%s)000

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/eks/novafsm-production/application \
  --filter-pattern "ERROR"

# Tail logs (follow)
aws logs tail /aws/eks/novafsm-production/application --follow --format short
```

## 📈 Monitoring Fluent Bit

### Metrics Endpoint

Fluent Bit exposes Prometheus metrics on port 2020:

```bash
# Port-forward to Fluent Bit pod
kubectl port-forward -n kube-system \
  $(kubectl get pods -n kube-system -l app=fluent-bit -o jsonpath='{.items[0].metadata.name}') \
  2020:2020

# View metrics
curl http://localhost:2020/api/v1/metrics/prometheus
```

**Key Metrics:**
- `fluentbit_input_records_total` - Total records processed
- `fluentbit_output_proc_records_total` - Records sent to output
- `fluentbit_output_errors_total` - Output errors
- `fluentbit_output_retries_total` - Retry attempts

### Grafana Dashboard

If you have Prometheus scraping Fluent Bit, import the official Fluent Bit dashboard:
- Dashboard ID: **7752**
- URL: https://grafana.com/grafana/dashboards/7752

## 🔧 Configuration

### Adjusting Log Retention

Edit `configmap.yml` and change `log_retention_days`:

```yaml
[OUTPUT]
    Name                cloudwatch_logs
    log_retention_days  30  # Change to desired retention
```

Apply changes:
```bash
kubectl apply -f configmap.yml
kubectl rollout restart daemonset/fluent-bit -n kube-system
```

### Adding Custom Parsers

Add parsers to `parsers.conf` section in `configmap.yml`:

```yaml
parsers.conf: |
  [PARSER]
      Name                my-custom-parser
      Format              regex
      Regex               ^(?<time>[^ ]+) (?<level>[^ ]+) (?<message>.*)$
      Time_Key            time
      Time_Format         %Y-%m-%dT%H:%M:%S.%L%z
```

### Filtering Logs

Exclude logs from specific namespaces by uncommenting the filter in `filter-kubernetes.conf`:

```yaml
[FILTER]
    Name                grep
    Match               kube.*
    Exclude             kubernetes.namespace_name (kube-system|kube-public|kube-node-lease)
```

### Changing Flush Interval

Edit `fluent-bit.conf` in `configmap.yml`:

```yaml
[SERVICE]
    Flush    5  # Change to desired seconds (default: 5)
```

## 💰 Cost Optimization

### Estimated Costs

**Assumptions:**
- 3 nodes, 10 pods total
- ~100 log lines/second
- ~1KB average log size

**Monthly costs:**
- Ingestion: ~260GB × $0.50/GB = **$130**
- Storage (30 days): ~7,800GB × $0.03/GB = **$234**
- **Total: ~$364/month**

### Cost Reduction Strategies

1. **Reduce retention:**
   ```yaml
   log_retention_days  7  # Instead of 30
   ```
   Savings: ~75% of storage costs

2. **Filter unnecessary logs:**
   ```yaml
   [FILTER]
       Name    grep
       Match   kube.*
       Exclude log (healthcheck|readiness|liveness)
   ```

3. **Sample logs (high-volume endpoints):**
   ```yaml
   [FILTER]
       Name    sample
       Match   kube.*
       Rate    10  # Keep 1 in 10 logs
   ```

4. **Use S3 for long-term storage:**
   - Export logs to S3 after 7 days
   - S3 storage: $0.023/GB vs CloudWatch: $0.03/GB

## 🔐 Security Best Practices

### 1. Use IRSA (IAM Roles for Service Accounts)

✅ **DO:** Use IRSA for AWS credentials
❌ **DON'T:** Use static AWS access keys

### 2. Principle of Least Privilege

IAM policy grants only necessary permissions:
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

No permission to:
- Delete log groups
- Modify other AWS resources

### 3. Encrypt Logs at Rest

Enable CloudWatch Logs encryption:

```bash
aws logs associate-kms-key \
  --log-group-name /aws/eks/novafsm-production/application \
  --kms-key-id arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID
```

### 4. Network Policies

Restrict Fluent Bit egress (optional):

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: fluent-bit-egress
  namespace: kube-system
spec:
  podSelector:
    matchLabels:
      app: fluent-bit
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443  # HTTPS to AWS APIs
```

### 5. Audit Access

Enable CloudWatch Logs data access logging:

```bash
aws logs put-resource-policy \
  --policy-name FluentBitAuditPolicy \
  --policy-document file://cloudwatch-audit-policy.json
```

## 🐛 Troubleshooting

### Logs Not Appearing in CloudWatch

**Check 1: Fluent Bit pods running?**
```bash
kubectl get pods -n kube-system -l app=fluent-bit
```

**Check 2: Fluent Bit logs for errors**
```bash
kubectl logs -n kube-system -l app=fluent-bit --tail=100 | grep -i error
```

**Common errors:**
- `AccessDenied` → IAM role/policy misconfigured
- `InvalidParameter` → Wrong region or log group name
- `ResourceNotFoundException` → Log group doesn't exist (should auto-create)

**Check 3: IRSA annotation present?**
```bash
kubectl describe sa fluent-bit -n kube-system | grep role-arn
```

Should show: `eks.amazonaws.com/role-arn: arn:aws:iam::...`

**Check 4: Test IAM permissions**
```bash
kubectl exec -it -n kube-system \
  $(kubectl get pods -n kube-system -l app=fluent-bit -o jsonpath='{.items[0].metadata.name}') \
  -- sh

# Inside pod
apk add --no-cache curl
curl -H "Authorization: Bearer $(cat /var/run/secrets/eks.amazonaws.com/serviceaccount/token)" \
  https://sts.amazonaws.com/?Action=GetCallerIdentity
```

### High Memory Usage

Fluent Bit consuming too much memory:

**Solution 1: Reduce buffer size**

Edit `configmap.yml`:
```yaml
[INPUT]
    Mem_Buf_Limit    5MB  # Reduce from 50MB
```

**Solution 2: Increase resource limits**

Edit `daemonset.yml`:
```yaml
resources:
  limits:
    memory: 1Gi  # Increase from 512Mi
```

### Duplicate Logs

**Cause:** Multiple Fluent Bit instances on same node

**Solution:** Ensure DaemonSet, not Deployment

```bash
kubectl get daemonset fluent-bit -n kube-system
# Should show DESIRED = number of nodes
```

### Logs Missing Kubernetes Metadata

**Cause:** Kubernetes filter not working

**Check:** RBAC permissions
```bash
kubectl auth can-i get pods --as=system:serviceaccount:kube-system:fluent-bit
# Should return: yes
```

## 📚 Additional Resources

- **Fluent Bit Documentation:** https://docs.fluentbit.io/
- **AWS Fluent Bit for CloudWatch:** https://github.com/aws/aws-for-fluent-bit
- **CloudWatch Logs Insights:** https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html
- **EKS IRSA Setup:** https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html

## 🔄 Next Steps

1. ✅ **Create CloudWatch Alarms** for critical errors
2. ✅ **Set up Log Insights Saved Queries** for common searches
3. ✅ **Export logs to S3** for long-term archival
4. ✅ **Integrate with Lambda** for automated incident response
5. ✅ **Add custom parsers** for application-specific log formats

---

**Created:** 2025-11-07
**Version:** 1.0.0
**Maintainer:** DevOps Team
