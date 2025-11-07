#!/bin/bash
# NoVaFSM Production Deployment Script
# Generated: 2025-11-07
# Execute from repository root

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================="
echo "NoVaFSM PRODUCTION DEPLOYMENT"
echo -e "==================================${NC}"
echo ""

# Validate prerequisites
echo -e "${YELLOW}⚙️  Validating prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Install: https://aws.amazon.com/cli/${NC}"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform not found. Install: https://www.terraform.io/downloads${NC}"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Install: https://kubernetes.io/docs/tasks/tools/${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Install: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Check AWS credentials
echo -e "${YELLOW}🔐 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run: aws configure${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
echo -e "${GREEN}✅ AWS Account: $AWS_ACCOUNT_ID${NC}"
echo -e "${GREEN}✅ AWS Region: $AWS_REGION${NC}"
echo ""

# Confirmation prompt
echo -e "${YELLOW}⚠️  This will deploy NoVaFSM to PRODUCTION${NC}"
echo -e "${YELLOW}   - Region: $AWS_REGION${NC}"
echo -e "${YELLOW}   - Account: $AWS_ACCOUNT_ID${NC}"
echo ""
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi
echo ""

# ===== STEP 1: Terraform Backend Bootstrap =====
echo -e "${BLUE}📦 STEP 1/11: Terraform Backend Bootstrap${NC}"
cd infrastructure/terraform/bootstrap || exit 1

if [ ! -f terraform.tfvars ]; then
    echo -e "${YELLOW}Creating terraform.tfvars from example...${NC}"
    cp terraform.tfvars.example terraform.tfvars
    echo -e "${YELLOW}⚠️  Please review terraform.tfvars and update if needed${NC}"
    read -p "Press enter to continue..."
fi

terraform init
terraform plan -out=tfplan
terraform apply tfplan
rm -f tfplan

echo -e "${GREEN}✅ Terraform backend bootstrapped${NC}"
echo ""

# ===== STEP 2: Provision Infrastructure =====
echo -e "${BLUE}🏗️  STEP 2/11: Provision AWS Infrastructure${NC}"
cd ../ || exit 1

terraform init
terraform plan -out=tfplan
terraform apply tfplan
rm -f tfplan

echo -e "${GREEN}✅ Infrastructure provisioned${NC}"
echo ""

# ===== STEP 3: Configure kubectl =====
echo -e "${BLUE}⚙️  STEP 3/11: Configure kubectl for EKS${NC}"
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "novafsm-production")
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"

echo -e "${GREEN}✅ kubectl configured${NC}"
echo ""

# ===== STEP 4: Deploy Monitoring Stack =====
echo -e "${BLUE}📊 STEP 4/11: Deploy Monitoring Stack (Prometheus + Grafana)${NC}"
cd ../k8s || exit 1

kubectl apply -f monitoring/namespace.yml
kubectl apply -f monitoring/prometheus/rbac.yml
kubectl apply -f monitoring/prometheus/configmap.yml
kubectl apply -f monitoring/prometheus/deployment.yml
kubectl apply -f monitoring/prometheus/service.yml
kubectl apply -f monitoring/grafana/rbac.yml
kubectl apply -f monitoring/grafana/configmap.yml
kubectl apply -f monitoring/grafana/deployment.yml
kubectl apply -f monitoring/grafana/service.yml
kubectl apply -f monitoring/dashboards/

echo -e "${GREEN}✅ Monitoring stack deployed${NC}"
echo ""

# ===== STEP 5: Deploy Logging Stack =====
echo -e "${BLUE}📝 STEP 5/11: Deploy Logging Stack (Fluent Bit)${NC}"

kubectl apply -f logging/rbac.yml
kubectl apply -f logging/configmap.yml
kubectl apply -f logging/daemonset.yml
kubectl apply -f logging/service.yml

echo -e "${GREEN}✅ Logging stack deployed${NC}"
echo ""

# ===== STEP 6: Database Migrations =====
echo -e "${BLUE}🗄️  STEP 6/11: Run Database Migrations${NC}"
cd ../../backend || exit 1

DB_HOST=$(cd ../infrastructure/terraform && terraform output -raw db_endpoint)
DB_NAME=$(cd ../infrastructure/terraform && terraform output -raw db_name)
export DATABASE_URL="postgresql://novafsm:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}"

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ DB_PASSWORD environment variable not set${NC}"
    exit 1
fi

npm ci
npx prisma migrate deploy

echo -e "${GREEN}✅ Database migrations complete${NC}"
echo ""

# ===== STEP 7: Build and Push Docker Images =====
echo -e "${BLUE}🐳 STEP 7/11: Build and Push Docker Images${NC}"
cd .. || exit 1

IMAGE_TAG=$(git rev-parse --short HEAD)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# ECR login
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Backend API
echo "Building novafsm-api:$IMAGE_TAG..."
docker build -t "novafsm-api:$IMAGE_TAG" ./backend
docker tag "novafsm-api:$IMAGE_TAG" "${ECR_REGISTRY}/novafsm-api:$IMAGE_TAG"
docker tag "novafsm-api:$IMAGE_TAG" "${ECR_REGISTRY}/novafsm-api:latest"
docker push "${ECR_REGISTRY}/novafsm-api:$IMAGE_TAG"
docker push "${ECR_REGISTRY}/novafsm-api:latest"

# Web Dashboard
echo "Building novafsm-web:$IMAGE_TAG..."
docker build -t "novafsm-web:$IMAGE_TAG" ./web-dashboard
docker tag "novafsm-web:$IMAGE_TAG" "${ECR_REGISTRY}/novafsm-web:$IMAGE_TAG"
docker tag "novafsm-web:$IMAGE_TAG" "${ECR_REGISTRY}/novafsm-web:latest"
docker push "${ECR_REGISTRY}/novafsm-web:$IMAGE_TAG"
docker push "${ECR_REGISTRY}/novafsm-web:latest"

echo -e "${GREEN}✅ Docker images built and pushed${NC}"
echo ""

# ===== STEP 8: Update Kubernetes Manifests =====
echo -e "${BLUE}🔧 STEP 8/11: Update Kubernetes Manifests with Image Tags${NC}"
cd infrastructure/k8s || exit 1

# Update image tags in deployments
sed -i.bak "s|image: .*novafsm-api:.*|image: ${ECR_REGISTRY}/novafsm-api:${IMAGE_TAG}|g" deployment-api.yml
sed -i.bak "s|image: .*novafsm-web:.*|image: ${ECR_REGISTRY}/novafsm-web:${IMAGE_TAG}|g" deployment-web.yml

echo -e "${GREEN}✅ Manifests updated${NC}"
echo ""

# ===== STEP 9: Deploy to Kubernetes =====
echo -e "${BLUE}☸️  STEP 9/11: Deploy Applications to Kubernetes${NC}"

kubectl apply -f namespace.yml
kubectl apply -f configmap.yml
kubectl apply -f serviceaccount.yml

# Create secrets (use secrets.example.yml as template)
if [ ! -f secrets.yml ]; then
    echo -e "${YELLOW}⚠️  Please create secrets.yml from secrets.example.yml${NC}"
    exit 1
fi
kubectl apply -f secrets.yml

kubectl apply -f deployment-api.yml
kubectl apply -f deployment-web.yml
kubectl apply -f service-api.yml
kubectl apply -f service-web.yml
kubectl apply -f hpa-api.yml
kubectl apply -f hpa-web.yml
kubectl apply -f pdb-api.yml
kubectl apply -f pdb-web.yml
kubectl apply -f ingress.yml

echo -e "${GREEN}✅ Applications deployed${NC}"
echo ""

# ===== STEP 10: Wait for Rollout =====
echo -e "${BLUE}⏳ STEP 10/11: Wait for Deployment Rollout${NC}"

kubectl rollout status deployment/novafsm-api -n production --timeout=10m
kubectl rollout status deployment/novafsm-web -n production --timeout=10m

echo -e "${GREEN}✅ Deployments rolled out successfully${NC}"
echo ""

# ===== STEP 11: Health Checks & Verification =====
echo -e "${BLUE}🏥 STEP 11/11: Health Checks & Verification${NC}"

echo "Checking pod status..."
kubectl get pods -n production

echo ""
echo "Checking services..."
kubectl get svc -n production

echo ""
echo "Checking ingress..."
kubectl get ingress -n production

echo ""
echo "Recent API logs:"
kubectl logs -n production -l app=novafsm-api --tail=20

echo ""
echo "Testing API health endpoint..."
API_URL=$(kubectl get ingress -n production novafsm-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
if curl -f -s "https://${API_URL}/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ API health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  API health check pending (LoadBalancer may still be provisioning)${NC}"
fi

echo ""
echo -e "${GREEN}=================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo -e "==================================${NC}"
echo ""
echo -e "${BLUE}📊 Monitoring Access:${NC}"
echo "  Grafana:    kubectl port-forward -n monitoring svc/grafana 3000:80"
echo "             Then open: http://localhost:3000 (admin/admin)"
echo "  Prometheus: kubectl port-forward -n monitoring svc/prometheus 9090:9090"
echo "             Then open: http://localhost:9090"
echo ""
echo -e "${BLUE}🔍 Logging:${NC}"
echo "  CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logsV2:log-groups"
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "  API:       https://${API_URL}"
echo "  Dashboard: https://${API_URL}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "  1. Verify all pods are running: kubectl get pods -n production"
echo "  2. Check application logs: kubectl logs -n production -l app=novafsm-api -f"
echo "  3. Access Grafana dashboards for monitoring"
echo "  4. Review CloudWatch logs in AWS Console"
echo "  5. Run smoke tests against API endpoints"
echo ""
echo -e "${GREEN}Deployment completed at: $(date)${NC}"
