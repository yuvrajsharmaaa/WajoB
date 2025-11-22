# 🚀 WajoB Backend - Complete Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Platform-Specific Guides](#platform-specific-guides)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Services

- [ ] **Node.js** >= 20.x
- [ ] **PostgreSQL** >= 16.x
- [ ] **Redis** >= 7.x
- [ ] **Telegram Bot Token** (from @BotFather)
- [ ] **TON Smart Contracts** (deployed to testnet/mainnet)

### Optional Tools

- [ ] **Docker** & **Docker Compose**
- [ ] **kubectl** (for Kubernetes)
- [ ] **Git**

---

## Local Development Setup

### Step 1: Clone and Install

```bash
cd backend

# Install dependencies
npm install

# Or use the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Required Configuration:**

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=wagob_user
DB_PASSWORD=your_secure_password
DB_DATABASE=wagob_db
DB_SYNCHRONIZE=false  # NEVER true in production!
DB_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Telegram (Get from @BotFather)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ

# TON Blockchain (Update after contract deployment)
TON_NETWORK=testnet
CONTRACT_JOB_REGISTRY=EQD...
CONTRACT_ESCROW=EQD...
CONTRACT_REPUTATION=EQD...

# JWT (Generate random secret)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# CORS (Your frontend URL)
CORS_ORIGIN=http://localhost:3000,https://your-vercel-app.vercel.app
```

### Step 3: Start Services

#### Option A: Docker Compose (Recommended)

```bash
# Start PostgreSQL + Redis
docker-compose up -d postgres redis

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f
```

#### Option B: Manual Installation

**Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt install postgresql-16

# macOS (Homebrew)
brew install postgresql@16

# Start service
sudo systemctl start postgresql  # Linux
brew services start postgresql@16  # macOS
```

**Install Redis:**
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS (Homebrew)
brew install redis

# Start service
sudo systemctl start redis  # Linux
brew services start redis  # macOS
```

### Step 4: Database Setup

```bash
# Create database (if not using Docker)
createdb -U postgres wagob_db

# Run migrations
npm run migration:run

# (Optional) Seed initial data
npm run seed
```

### Step 5: Start Development Server

```bash
npm run start:dev
```

**Server URLs:**
- API: http://localhost:3001
- Swagger Docs: http://localhost:3001/api/v1/docs
- Health Check: http://localhost:3001/api/v1/health

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured (`.env.production`)
- [ ] Database migrations tested
- [ ] Smart contracts deployed to mainnet
- [ ] Contract addresses updated in config
- [ ] Telegram bot configured with webhook
- [ ] SSL certificates ready (for HTTPS)
- [ ] Monitoring tools set up (optional)

### Environment Configuration

Create `.env.production`:

```bash
NODE_ENV=production
PORT=3001

# Database (Use production credentials)
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_USERNAME=wagob_prod
DB_PASSWORD=super_secure_password_here
DB_DATABASE=wagob_production
DB_SYNCHRONIZE=false  # CRITICAL: Never true!
DB_LOGGING=false

# Redis (Production endpoint)
REDIS_HOST=your-redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_here

# Telegram
TELEGRAM_BOT_TOKEN=your_production_bot_token
TELEGRAM_WEBHOOK_URL=https://api.wagob.com/api/v1/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=$(openssl rand -base64 32)

# TON Blockchain (MAINNET!)
TON_NETWORK=mainnet
TON_TONCENTER_API_URL=https://toncenter.com/api/v2
CONTRACT_JOB_REGISTRY=EQD...  # Production contract
CONTRACT_ESCROW=EQD...
CONTRACT_REPUTATION=EQD...

# Security
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
CORS_ORIGIN=https://wagob.com,https://app.wagob.com

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

---

## Platform-Specific Guides

### 🐳 Docker Deployment

#### Build Production Image

```bash
docker build -t wagob-backend:latest --target production .
```

#### Run Container

```bash
docker run -d \
  --name wagob-backend \
  -p 3001:3001 \
  --env-file .env.production \
  --restart unless-stopped \
  wagob-backend:latest
```

#### Docker Compose Production

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### ☸️ Kubernetes Deployment

#### 1. Create Secrets

```bash
kubectl create secret generic wagob-secrets \
  --from-literal=db-host=your-db-host \
  --from-literal=db-username=wagob_user \
  --from-literal=db-password=your-password \
  --from-literal=db-database=wagob_db \
  --from-literal=redis-host=your-redis-host \
  --from-literal=redis-password=redis-password \
  --from-literal=telegram-bot-token=your-bot-token \
  --from-literal=jwt-secret=your-jwt-secret
```

#### 2. Apply Deployment

```bash
kubectl apply -f k8s/deployment.yml

# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/wagob-backend
```

#### 3. Scale Deployment

```bash
# Scale to 5 replicas
kubectl scale deployment wagob-backend --replicas=5

# Auto-scaling (HPA)
kubectl autoscale deployment wagob-backend \
  --cpu-percent=70 \
  --min=3 \
  --max=10
```

### 🚂 Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Add environment variables
railway variables set DB_HOST=...
railway variables set TELEGRAM_BOT_TOKEN=...
# ... (add all variables)

# Deploy
railway up
```

### 🌊 DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm run start:prod`
3. Add environment variables in dashboard
4. Configure database (Managed PostgreSQL)
5. Configure Redis (Managed Redis)
6. Deploy!

### ☁️ AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Build and push Docker image**:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t wagob-backend:latest --target production .
docker tag wagob-backend:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/wagob-backend:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/wagob-backend:latest
```

2. **Create RDS PostgreSQL instance**
3. **Create ElastiCache Redis cluster**
4. **Create ECS Task Definition** (use provided JSON)
5. **Create ECS Service**
6. **Configure Application Load Balancer**

### 🟦 Azure Deployment

```bash
# Login
az login

# Create resource group
az group create --name wagob-rg --location eastus

# Create container registry
az acr create --resource-group wagob-rg \
  --name wagobregistry --sku Basic

# Build and push
az acr build --registry wagobregistry \
  --image wagob-backend:latest \
  --file Dockerfile .

# Deploy to Container Instances
az container create \
  --resource-group wagob-rg \
  --name wagob-backend \
  --image wagobregistry.azurecr.io/wagob-backend:latest \
  --cpu 2 --memory 4 \
  --ports 3001 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3001 \
  --secure-environment-variables \
    DB_PASSWORD=... \
    JWT_SECRET=...
```

### 🔴 GCP Deployment (Cloud Run)

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT-ID/wagob-backend

# Deploy to Cloud Run
gcloud run deploy wagob-backend \
  --image gcr.io/PROJECT-ID/wagob-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars PORT=8080 \
  --set-secrets DB_PASSWORD=db-password:latest \
  --max-instances 10 \
  --memory 512Mi
```

---

## Post-Deployment

### 1. Run Database Migrations

```bash
# Docker
docker exec -it wagob-backend npm run migration:run

# Kubernetes
kubectl exec -it deployment/wagob-backend -- npm run migration:run

# SSH to server
ssh user@your-server
cd /app
npm run migration:run
```

### 2. Configure Telegram Webhook

```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.wagob.com/api/v1/telegram/webhook",
    "secret_token": "your-webhook-secret"
  }'

# Verify webhook
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

### 3. Test Telegram Bot

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Should receive welcome message

### 4. Verify Blockchain Indexer

```bash
# Check indexer status
curl https://api.wagob.com/api/v1/blockchain/status

# Trigger manual sync (if needed)
curl -X POST https://api.wagob.com/api/v1/blockchain/sync \
  -H "Authorization: Bearer <admin-token>"
```

### 5. Health Check

```bash
curl https://api.wagob.com/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "blockchain": "synced"
}
```

---

## Monitoring & Maintenance

### Logging

#### View Application Logs

```bash
# Docker
docker logs -f wagob-backend

# Kubernetes
kubectl logs -f deployment/wagob-backend

# PM2 (Node.js)
pm2 logs wagob-backend
```

#### Centralized Logging (Recommended)

**Option 1: ELK Stack**
- Elasticsearch
- Logstash
- Kibana

**Option 2: Cloud Services**
- AWS CloudWatch
- GCP Cloud Logging
- Azure Monitor

### Monitoring Tools

#### Prometheus + Grafana

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'wagob-backend'
    static_configs:
      - targets: ['localhost:3001']
```

#### Sentry (Error Tracking)

```bash
# Install Sentry
npm install @sentry/node

# Configure in main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Database Backups

#### PostgreSQL Backups

```bash
# Manual backup
pg_dump -U wagob_user -h localhost wagob_db > backup_$(date +%Y%m%d).sql

# Automated daily backups (cron)
0 2 * * * pg_dump -U wagob_user wagob_db > /backups/wagob_$(date +\%Y\%m\%d).sql
```

#### Restore from Backup

```bash
psql -U wagob_user -h localhost wagob_db < backup_20240101.sql
```

### Redis Backups

```bash
# Manual snapshot
redis-cli BGSAVE

# Configure automatic snapshots in redis.conf
save 900 1
save 300 10
save 60 10000
```

### Update Deployment

#### Zero-Downtime Update (Kubernetes)

```bash
# Update image
kubectl set image deployment/wagob-backend \
  backend=wagob/backend:v1.1.0

# Monitor rollout
kubectl rollout status deployment/wagob-backend

# Rollback if needed
kubectl rollout undo deployment/wagob-backend
```

#### Docker Update

```bash
# Pull new image
docker pull wagob/backend:latest

# Stop old container
docker stop wagob-backend

# Remove old container
docker rm wagob-backend

# Start new container
docker run -d --name wagob-backend ...
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -h DB_HOST -U DB_USERNAME -d DB_DATABASE

# Check firewall rules
# Ensure port 5432 is open for your server IP
```

### Redis Connection Issues

```bash
# Test connection
redis-cli -h REDIS_HOST -p 6379 ping

# Should return: PONG
```

### Telegram Webhook Not Working

```bash
# Check webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Remove webhook (use polling instead)
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Verify your server is accessible
curl https://api.wagob.com/api/v1/health
```

### Blockchain Indexer Not Syncing

- Verify contract addresses in `.env`
- Check TON network status
- Review indexer logs
- Ensure TON API is accessible

---

## Security Checklist

- [ ] Use HTTPS (SSL/TLS certificates)
- [ ] Enable database SSL connections
- [ ] Use strong passwords (min 32 characters)
- [ ] Rotate JWT secrets regularly
- [ ] Enable database backups
- [ ] Set up rate limiting
- [ ] Use environment variables (never hardcode secrets)
- [ ] Enable CORS with specific origins
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Use Docker security scanning
- [ ] Enable firewall rules
- [ ] Set up DDoS protection (Cloudflare)

---

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_escrow_status ON escrows(status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM jobs WHERE status = 'posted';
```

### Redis Caching Strategy

```typescript
// Cache job listings for 5 minutes
const cacheKey = `jobs:${status}:${category}`;
const cached = await cacheManager.get(cacheKey);

if (cached) return cached;

const jobs = await jobRepository.find(...);
await cacheManager.set(cacheKey, jobs, 300);
```

### Load Balancing

Use multiple instances behind a load balancer (Nginx, AWS ALB, etc.)

```nginx
# nginx.conf
upstream wagob_backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

server {
    location / {
        proxy_pass http://wagob_backend;
    }
}
```

---

## 📞 Support

- **Documentation**: [README.md](./README.md)
- **API Docs**: [API.md](./API.md)
- **GitHub Issues**: [Create Issue](https://github.com/your-repo/issues)
- **Email**: devops@wagob.com

---

**Deployment successful! 🎉**

Your WajoB backend is now live and ready to serve users!
