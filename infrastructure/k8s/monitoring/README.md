# NoVaFSM Monitoring Stack

This directory contains the complete monitoring and observability stack for NoVaFSM, including **Prometheus** for metrics collection and **Grafana** for visualization.

## 📊 Components

### Prometheus
- **Metrics collection and storage**
- Scrapes metrics from:
  - Kubernetes API server
  - Kubernetes nodes (cAdvisor)
  - NoVaFSM API pods
  - NoVaFSM Web Dashboard pods
  - Custom application metrics
- **Alerting rules** for critical issues
- **30-day retention** with 50GB storage
- **Cluster-wide RBAC** for service discovery

### Grafana
- **Visualization and dashboards**
- Pre-configured dashboards:
  - NoVaFSM API Metrics (request rate, errors, latency, database)
  - NoVaFSM Infrastructure (CPU, memory, network, pod health)
- **Prometheus datasource** pre-configured
- **Persistent storage** for dashboard customizations
- **Admin access** with default credentials (change in production!)

## 🚀 Quick Start

### Step 1: Deploy Monitoring Stack

```bash
# Create monitoring namespace
kubectl apply -f namespace.yml

# Deploy Prometheus
kubectl apply -f prometheus/rbac.yml
kubectl apply -f prometheus/configmap.yml
kubectl apply -f prometheus/deployment.yml
kubectl apply -f prometheus/service.yml

# Deploy Grafana
kubectl apply -f grafana/rbac.yml
kubectl apply -f grafana/configmap.yml
kubectl apply -f grafana/deployment.yml
kubectl apply -f grafana/service.yml

# Deploy Grafana Dashboards
kubectl apply -f dashboards/novafsm-api-dashboard.yml
kubectl apply -f dashboards/novafsm-infrastructure-dashboard.yml

# (Optional) Deploy Ingress for external access
kubectl apply -f ingress.yml
```

**Expected deployment time:** 2-3 minutes

### Step 2: Verify Deployment

```bash
# Check pods are running
kubectl get pods -n monitoring

# Expected output:
# NAME                          READY   STATUS    RESTARTS   AGE
# prometheus-xxxxx-xxxxx        1/1     Running   0          2m
# grafana-xxxxx-xxxxx           1/1     Running   0          2m

# Check services
kubectl get svc -n monitoring

# Expected output:
# NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
# prometheus   ClusterIP   10.100.xxx.xxx   <none>        9090/TCP   2m
# grafana      ClusterIP   10.100.xxx.xxx   <none>        80/TCP     2m
```

### Step 3: Access Dashboards

#### Option 1: Port Forwarding (Development)

```bash
# Access Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open: http://localhost:9090

# Access Grafana
kubectl port-forward -n monitoring svc/grafana 3000:80
# Open: http://localhost:3000
# Default credentials: admin / admin
```

#### Option 2: Ingress (Production)

Deploy the Ingress resource (requires ingress controller):

```bash
kubectl apply -f ingress.yml

# Get Ingress endpoints
kubectl get ingress -n monitoring
```

Access:
- **Prometheus:** `https://prometheus.your-domain.com`
- **Grafana:** `https://grafana.your-domain.com`

## 📈 Pre-Configured Dashboards

### 1. NoVaFSM API Metrics Dashboard

**Metrics displayed:**
- ✅ Request rate (requests/second)
- ✅ Error rate (% of 4xx/5xx errors)
- ✅ Response time percentiles (p50, p95, p99)
- ✅ Requests by endpoint (top 10)
- ✅ Active pods count
- ✅ Database connection pool status
- ✅ Database query duration
- ✅ HTTP status code distribution

**Alerts configured:**
- High error rate (> 1%)
- Slow response time (p95 > 2s)
- Database connection errors

**Access:** Grafana → Dashboards → NoVaFSM → NoVaFSM API Metrics

### 2. NoVaFSM Infrastructure Dashboard

**Metrics displayed:**
- ✅ Pod CPU usage per pod
- ✅ Pod memory usage per pod
- ✅ Network I/O (receive/transmit)
- ✅ Pod restart counts
- ✅ Total pods running
- ✅ Cluster CPU/Memory usage
- ✅ Pod status distribution
- ✅ Persistent volume usage
- ✅ HPA (autoscaling) status
- ✅ Disk I/O

**Alerts configured:**
- High CPU usage (> 80%)
- High memory usage (> 80%)
- Pod restart loop
- Insufficient replicas

**Access:** Grafana → Dashboards → NoVaFSM → NoVaFSM Infrastructure Metrics

## 🔔 Alerting

### Configured Alerts

Prometheus has the following alerting rules configured:

#### API Alerts
1. **HighErrorRate** - Triggers when error rate > 1% for 5 minutes
2. **HighLatency** - Triggers when p95 latency > 2s for 5 minutes
3. **APIPodDown** - Triggers when any API pod is down for 2 minutes
4. **InsufficientAPIReplicas** - Triggers when < 2 API pods running for 5 minutes

#### Infrastructure Alerts
5. **HighCPUUsage** - Triggers when pod CPU > 80% for 10 minutes
6. **HighMemoryUsage** - Triggers when pod memory > 80% for 10 minutes
7. **PodRestartLoop** - Triggers when pod restarts frequently

#### Database Alerts
8. **DatabaseConnectionErrors** - Triggers when connection errors > 0.1/sec for 3 minutes
9. **SlowDatabaseQueries** - Triggers when p95 query time > 1s for 5 minutes

### Viewing Alerts

```bash
# View active alerts in Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open: http://localhost:9090/alerts
```

### Integrating with Alertmanager (Optional)

To send alerts to Slack, PagerDuty, email, etc., deploy Alertmanager:

1. Create Alertmanager deployment
2. Configure alert receivers (Slack webhook, PagerDuty API key)
3. Uncomment alerting section in `prometheus/configmap.yml`
4. Apply changes: `kubectl apply -f prometheus/configmap.yml`
5. Reload Prometheus: `kubectl rollout restart deployment/prometheus -n monitoring`

## 📝 Application Instrumentation

### Adding Metrics to Your Application

For Prometheus to scrape your application, add the following annotations to your pod spec:

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
    prometheus.io/path: "/metrics"
```

### Metrics Endpoint Format

Your application should expose metrics at `/metrics` in Prometheus format:

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/v1/customers",status="200"} 1234

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 500
http_request_duration_seconds_bucket{le="0.5"} 1000
http_request_duration_seconds_bucket{le="1.0"} 1200
http_request_duration_seconds_sum 1234.5
http_request_duration_seconds_count 1234
```

### Using Prometheus Client Libraries

Install the Prometheus client for your language:

**Node.js (NestJS):**
```bash
npm install prom-client
```

```typescript
import { register, Counter, Histogram } from 'prom-client';

// Counter for HTTP requests
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'endpoint', 'status'],
});

// Histogram for request duration
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Expose /metrics endpoint
@Controller()
export class MetricsController {
  @Get('/metrics')
  async getMetrics() {
    return register.metrics();
  }
}
```

## 🔧 Configuration

### Prometheus Configuration

Edit `prometheus/configmap.yml` to:
- Adjust scrape intervals
- Add new scrape targets
- Modify alerting rules
- Change retention period

After making changes:
```bash
kubectl apply -f prometheus/configmap.yml
kubectl rollout restart deployment/prometheus -n monitoring
```

### Grafana Configuration

**Change admin password:**

```bash
# Port-forward to Grafana
kubectl port-forward -n monitoring svc/grafana 3000:80

# Login with admin/admin
# Go to: Profile → Change Password
```

**Or via kubectl:**

```bash
kubectl exec -it -n monitoring deployment/grafana -- grafana-cli admin reset-admin-password newpassword
```

**Add datasources:**

Edit `grafana/configmap.yml` datasources section, then:
```bash
kubectl apply -f grafana/configmap.yml
kubectl rollout restart deployment/grafana -n monitoring
```

**Import community dashboards:**

1. Open Grafana
2. Go to Dashboards → Import
3. Enter dashboard ID from [Grafana Dashboard Library](https://grafana.com/grafana/dashboards/)

Recommended dashboards:
- **1860** - Node Exporter Full
- **3662** - Prometheus 2.0 Stats
- **6417** - Kubernetes Cluster Monitoring

## 📊 Storage and Retention

### Prometheus Storage

- **Volume:** 50GB PersistentVolumeClaim
- **Retention time:** 30 days
- **Retention size:** 45GB

To adjust retention:

Edit `prometheus/deployment.yml`:
```yaml
args:
  - '--storage.tsdb.retention.time=60d'  # Change to 60 days
  - '--storage.tsdb.retention.size=45GB'
```

Apply:
```bash
kubectl apply -f prometheus/deployment.yml
```

### Grafana Storage

- **Volume:** 10GB PersistentVolumeClaim
- Stores: Dashboard customizations, user settings, annotations

## 🔐 Security Best Practices

### 1. Change Default Passwords

**CRITICAL:** Change Grafana admin password immediately!

```bash
kubectl create secret generic grafana-admin -n monitoring \
  --from-literal=admin-user=admin \
  --from-literal=admin-password=$(openssl rand -base64 32)
```

Update `grafana/deployment.yml` to use secret:
```yaml
env:
  - name: GF_SECURITY_ADMIN_PASSWORD
    valueFrom:
      secretKeyRef:
        name: grafana-admin
        key: admin-password
```

### 2. Enable TLS

Add TLS to Ingress:
```yaml
spec:
  tls:
    - hosts:
        - grafana.your-domain.com
      secretName: grafana-tls
```

### 3. Restrict Access

Use Kubernetes Network Policies to restrict access:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: monitoring-network-policy
  namespace: monitoring
spec:
  podSelector:
    matchLabels:
      component: monitoring
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: production
```

### 4. Enable Authentication

Configure OAuth in Grafana:

Edit `grafana/configmap.yml`:
```ini
[auth.google]
enabled = true
client_id = YOUR_CLIENT_ID
client_secret = YOUR_CLIENT_SECRET
allowed_domains = your-company.com
```

## 🧹 Maintenance

### Backing Up Dashboards

```bash
# Export all dashboards
kubectl exec -it -n monitoring deployment/grafana -- \
  grafana-cli admin data-migration export --path /tmp/dashboards

# Copy to local machine
kubectl cp monitoring/grafana-xxxxx:/tmp/dashboards ./dashboards-backup
```

### Upgrading Prometheus

```bash
# Update image version in deployment.yml
kubectl set image deployment/prometheus -n monitoring \
  prometheus=prom/prometheus:v2.49.0

# Verify rollout
kubectl rollout status deployment/prometheus -n monitoring
```

### Cleaning Up Old Data

Prometheus automatically deletes data based on retention settings. To manually clear:

```bash
kubectl exec -it -n monitoring deployment/prometheus -- \
  promtool tsdb analyze /prometheus
```

## 📊 Monitoring the Monitoring

Monitor Prometheus itself:

```bash
# Check Prometheus health
kubectl exec -it -n monitoring deployment/prometheus -- \
  wget -O- http://localhost:9090/-/healthy

# Check Prometheus metrics
kubectl exec -it -n monitoring deployment/prometheus -- \
  wget -O- http://localhost:9090/metrics | grep prometheus_
```

## 🐛 Troubleshooting

### Prometheus Not Scraping Targets

```bash
# Check Prometheus logs
kubectl logs -n monitoring deployment/prometheus

# View targets in Prometheus UI
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open: http://localhost:9090/targets
```

**Common issues:**
- ServiceAccount lacks RBAC permissions → Check `prometheus/rbac.yml`
- Pods missing annotations → Add `prometheus.io/scrape: "true"`
- Network policy blocking → Check NetworkPolicies

### Grafana Can't Connect to Prometheus

```bash
# Test connectivity from Grafana pod
kubectl exec -it -n monitoring deployment/grafana -- \
  wget -O- http://prometheus:9090/api/v1/status/config
```

**If fails:** Check that Prometheus service exists and is accessible

### High Memory Usage

```bash
# Check Prometheus memory usage
kubectl top pod -n monitoring

# Reduce retention or increase limits in deployment.yml
```

### PersistentVolume Issues

```bash
# Check PVC status
kubectl get pvc -n monitoring

# Describe for errors
kubectl describe pvc prometheus-storage -n monitoring
```

## 📚 Additional Resources

- **Prometheus Documentation:** https://prometheus.io/docs/
- **Grafana Documentation:** https://grafana.com/docs/
- **PromQL Tutorial:** https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Grafana Dashboard Library:** https://grafana.com/grafana/dashboards/

## 🔄 Next Steps

1. ✅ **Configure Alertmanager** for alert notifications
2. ✅ **Add custom dashboards** for business metrics
3. ✅ **Enable distributed tracing** (Jaeger/Tempo)
4. ✅ **Add log aggregation** (Loki or Fluent Bit → CloudWatch)
5. ✅ **Implement SLO/SLI tracking** using Prometheus rules

---

**Created:** 2025-11-07
**Version:** 1.0.0
**Maintainer:** DevOps Team
