# 🚀 Deployment Guide

Complete guide for deploying WajoB to production.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Smart Contract Deployment](#smart-contract-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Monitoring Setup](#monitoring-setup)
7. [Post-Deployment Verification](#post-deployment-verification)

---

## Pre-Deployment Checklist

### ✅ Requirements

**Infrastructure:**
- [ ] Domain name configured (e.g., wagob.io)
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Server instances provisioned
  - Backend: 2+ instances (min 2GB RAM, 2 vCPU each)
  - Database: PostgreSQL 15+ (4GB RAM, 2 vCPU)
  - Redis: 1GB RAM, 1 vCPU
- [ ] Load balancer configured
- [ ] CDN setup (Cloudflare recommended)

**Services:**
- [ ] Telegram Bot token obtained from @BotFather
- [ ] TON RPC endpoint (use public or deploy own)
- [ ] Monitoring tools ready (Prometheus, Grafana)
- [ ] Log aggregation setup (ELK stack or similar)
- [ ] Error tracking service (Sentry)

**Secrets:**
- [ ] PostgreSQL credentials
- [ ] Redis connection string
- [ ] JWT secret (256-bit random)
- [ ] Telegram bot token
- [ ] TON wallet seed phrases (for platform wallet)
- [ ] API keys for external services

---

## Smart Contract Deployment

### 1. Prepare Contracts

```bash
cd contract

# Install dependencies
npm install

# Compile contracts
npx blueprint build JobRegistryOptimized
npx blueprint build EscrowOptimized
npx blueprint build ReputationOptimized
```

**Verify compilation:**
```bash
# Check build artifacts
ls -la build/

# Should see:
# - JobRegistryOptimized.compiled.json
# - EscrowOptimized.compiled.json
# - ReputationOptimized.compiled.json
```

### 2. Deploy to Testnet (Required First)

```bash
# Deploy JobRegistry
npx blueprint run deployJobRegistryOptimized --testnet

# Note the contract address
# Example output: EQDf2tKn3XEJKIATQF5u...8vPB

# Deploy Escrow
npx blueprint run deployEscrowOptimized --testnet

# Deploy Reputation
npx blueprint run deployReputationOptimized --testnet
```

**Save contract addresses:**
```bash
# Create deployment record
cat > deployments/testnet.json <<EOF
{
  "network": "testnet",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "jobRegistry": "EQDf2tKn3XEJKIATQF5u...8vPB",
    "escrow": "EQBx7xkCPHh5qBn0x...3Yz",
    "reputation": "EQC5d1bF0Km4kP...7Gk"
  }
}
EOF
```

### 3. Test on Testnet

```bash
# Run comprehensive tests
npm test

# Run integration tests
npm run test:integration

# Manual testing checklist:
# - Create job
# - Fund escrow
# - Assign worker
# - Complete job
# - Release payment
# - Submit rating
```

**Verify gas costs:**
```bash
npx ts-node scripts/profileGas.ts

# Expected results:
# Create job: ~0.005 TON
# Fund escrow: ~0.008 TON
# Release payment: ~0.010 TON
# Submit rating: ~0.004 TON
```

### 4. Deploy to Mainnet

⚠️ **CRITICAL**: Only deploy after thorough testnet testing!

```bash
# Switch to production wallet
# NEVER use development wallets in production!

# Deploy contracts
npx blueprint run deployJobRegistryOptimized --mainnet

# Wait for confirmation
# Monitor on: https://tonscan.org

# Verify deployment
npx blueprint run verifyJobRegistry --mainnet

# Save mainnet addresses
cat > deployments/mainnet.json <<EOF
{
  "network": "mainnet",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "jobRegistry": "MAINNET_JOB_REGISTRY_ADDRESS",
    "escrow": "MAINNET_ESCROW_ADDRESS",
    "reputation": "MAINNET_REPUTATION_ADDRESS"
  },
  "deployer": "DEPLOYER_WALLET_ADDRESS",
  "txHashes": {
    "jobRegistry": "TX_HASH_1",
    "escrow": "TX_HASH_2",
    "reputation": "TX_HASH_3"
  }
}
EOF
```

### 5. Configure Contract Access

```bash
# Set admin addresses
npx ts-node scripts/setAdmin.ts \
  --contract EQDf2tKn3... \
  --admin ADMIN_WALLET_ADDRESS \
  --network mainnet

# Configure platform fee wallet
npx ts-node scripts/setFeeWallet.ts \
  --contract EQBx7xkCPHh... \
  --wallet PLATFORM_FEE_WALLET \
  --network mainnet
```

---

## Backend Deployment

### 1. Prepare Environment

**Production .env file:**
```bash
# backend/.env.production

# Server
NODE_ENV=production
PORT=3001
API_BASE_URL=https://api.wagob.io

# Database
DATABASE_URL=postgresql://user:pass@db.wagob.io:5432/wagob
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# Redis
REDIS_URL=redis://redis.wagob.io:6379
REDIS_PASSWORD=STRONG_PASSWORD
REDIS_TLS=true

# JWT
JWT_SECRET=GENERATE_WITH_openssl_rand_base64_32
JWT_EXPIRES_IN=30d

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=WajoBBot

# TON Blockchain
TON_NETWORK=mainnet
TON_RPC_ENDPOINT=https://toncenter.com/api/v2/jsonRPC
TON_API_KEY=YOUR_TON_API_KEY

# Smart Contracts (from deployment)
CONTRACT_JOB_REGISTRY=EQDf2tKn3...8vPB
CONTRACT_ESCROW=EQBx7xkCPHh...3Yz
CONTRACT_REPUTATION=EQC5d1bF0Km...7Gk

# Platform Wallet
PLATFORM_WALLET_ADDRESS=EQC5d...7Gk
PLATFORM_WALLET_SECRET=ENCRYPTED_SEED_PHRASE

# Monitoring
SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# CORS
CORS_ORIGIN=https://wagob.io,https://t.me
```

### 2. Build Application

```bash
cd backend

# Install production dependencies only
npm ci --production

# Build TypeScript
npm run build

# Verify build
ls -la dist/
```

### 3. Database Migration

```bash
# Run migrations
npm run migration:run

# Verify database schema
npm run migration:show

# Create indexes
psql $DATABASE_URL < sql/indexes.sql

# Seed initial data (if any)
npm run seed:production
```

### 4. Deploy with Docker

**Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/main.js"]
```

**Build and push:**
```bash
# Build image
docker build -t wagob/backend:v1.0.0 -f backend/Dockerfile .

# Tag as latest
docker tag wagob/backend:v1.0.0 wagob/backend:latest

# Push to registry
docker push wagob/backend:v1.0.0
docker push wagob/backend:latest
```

### 5. Kubernetes Deployment

**k8s/deployment.yml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wagob-backend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wagob-backend
  template:
    metadata:
      labels:
        app: wagob-backend
    spec:
      containers:
      - name: backend
        image: wagob/backend:v1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: wagob-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: wagob-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: wagob-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: wagob-backend
  namespace: production
spec:
  selector:
    app: wagob-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: wagob-backend-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: wagob-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Deploy:**
```bash
# Create secrets
kubectl create secret generic wagob-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=redis-url="$REDIS_URL" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --namespace=production

# Apply deployment
kubectl apply -f k8s/deployment.yml

# Verify
kubectl get pods -n production
kubectl logs -f deployment/wagob-backend -n production
```

### 6. Nginx Reverse Proxy

**nginx.conf:**
```nginx
upstream wagob_backend {
    least_conn;
    server backend-1:3001;
    server backend-2:3001;
    server backend-3:3001;
}

server {
    listen 80;
    server_name api.wagob.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.wagob.io;

    ssl_certificate /etc/letsencrypt/live/api.wagob.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.wagob.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API endpoints
    location /v1 {
        proxy_pass http://wagob_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://wagob_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://wagob_backend;
    }
}
```

---

## Frontend Deployment

### 1. Build for Production

```bash
cd ../  # Root directory

# Install dependencies
npm ci

# Create production .env
cat > .env.production <<EOF
REACT_APP_API_URL=https://api.wagob.io/v1
REACT_APP_WS_URL=https://api.wagob.io
REACT_APP_TON_NETWORK=mainnet
REACT_APP_SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX
EOF

# Build application
npm run build

# Verify build
ls -la build/
du -sh build/  # Should be < 5MB
```

### 2. Optimize Build

```bash
# Analyze bundle size
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json

# Check for optimizations:
# - Code splitting ✅
# - Tree shaking ✅
# - Minification ✅
# - Compression ✅
```

### 3. Deploy to Netlify

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://api.wagob.io/v1/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Deploy:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy to production
netlify deploy --prod --dir=build

# Configure custom domain
netlify domains:add wagob.io
```

### 4. Deploy to Vercel

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      },
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "https://api.wagob.io/v1",
    "REACT_APP_WS_URL": "https://api.wagob.io"
  }
}
```

**Deploy:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Add custom domain
vercel domains add wagob.io
```

### 5. CDN Configuration (Cloudflare)

```bash
# Add site to Cloudflare
# 1. Add DNS records:
#    - A record: wagob.io → Netlify/Vercel IP
#    - CNAME: www → wagob.io
#    - CNAME: api → backend-load-balancer

# 2. Configure caching rules:
#    - Cache static assets: /static/*
#    - Cache images: *.jpg, *.png, *.svg
#    - Bypass cache: /api/*, /socket.io/*

# 3. Enable optimizations:
#    - Auto Minify (HTML, CSS, JS)
#    - Brotli compression
#    - HTTP/2
#    - HTTP/3 (QUIC)

# 4. Security:
#    - SSL/TLS: Full (strict)
#    - Always Use HTTPS: On
#    - HSTS: Max Age 12 months
#    - Minimum TLS: 1.2
```

---

## Database Setup

### 1. PostgreSQL Production Setup

```bash
# Create production database
createdb -h db.wagob.io -U postgres wagob_production

# Create dedicated user
psql -h db.wagob.io -U postgres <<EOF
CREATE USER wagob_app WITH PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE wagob_production TO wagob_app;
EOF

# Configure connection pooling (PgBouncer)
cat > /etc/pgbouncer/pgbouncer.ini <<EOF
[databases]
wagob = host=localhost port=5432 dbname=wagob_production

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
EOF
```

### 2. Run Migrations

```bash
# Export database URL
export DATABASE_URL="postgresql://wagob_app:STRONG_PASSWORD@db.wagob.io:5432/wagob_production"

# Run migrations
cd backend
npm run migration:run

# Verify
npm run migration:show

# Create indexes
psql $DATABASE_URL -f sql/indexes.sql
psql $DATABASE_URL -f sql/functions.sql
```

### 3. Database Backups

**Automated backup script:**
```bash
#!/bin/bash
# /usr/local/bin/backup-wagob-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/wagob"
BACKUP_FILE="$BACKUP_DIR/wagob_$DATE.sql.gz"

# Create backup
pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://wagob-backups/database/

# Keep only last 30 days locally
find $BACKUP_DIR -name "wagob_*.sql.gz" -mtime +30 -delete

# Log
echo "$(date): Backup completed: $BACKUP_FILE" >> /var/log/wagob-backup.log
```

**Cron job:**
```bash
# Daily backups at 2 AM
0 2 * * * /usr/local/bin/backup-wagob-db.sh
```

---

## Monitoring Setup

### 1. Prometheus Configuration

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'wagob-backend'
    static_configs:
      - targets: ['backend-1:3001', 'backend-2:3001', 'backend-3:3001']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 2. Grafana Dashboards

Import pre-built dashboards:
- **NestJS Dashboard**: ID 14151
- **PostgreSQL Dashboard**: ID 9628
- **Redis Dashboard**: ID 11835
- **Node Exporter**: ID 1860

**Custom WajoB Dashboard:**
```json
{
  "dashboard": {
    "title": "WajoB Platform Metrics",
    "panels": [
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "wagob_active_users"
          }
        ]
      },
      {
        "title": "Jobs Created (1h)",
        "targets": [
          {
            "expr": "rate(wagob_jobs_created_total[1h])"
          }
        ]
      },
      {
        "title": "Escrow Volume",
        "targets": [
          {
            "expr": "wagob_escrow_total_value"
          }
        ]
      }
    ]
  }
}
```

---

## Post-Deployment Verification

### Checklist

```bash
# 1. Smart Contracts
✓ Contracts deployed to mainnet
✓ Contract addresses saved
✓ Admin permissions set
✓ Platform fee wallet configured
✓ Gas costs verified (<0.01 TON per tx)

# 2. Backend
✓ All instances running (kubectl get pods)
✓ Health check passing (curl https://api.wagob.io/health)
✓ Database connected
✓ Redis connected
✓ WebSocket working
✓ Rate limiting active
✓ CORS configured correctly

# 3. Frontend
✓ Build deployed successfully
✓ Custom domain working (https://wagob.io)
✓ SSL certificate valid
✓ API calls working
✓ Wallet connection working
✓ Performance metrics good (Lighthouse score >90)

# 4. Integration
✓ Create test job (with real funds!)
✓ Fund escrow
✓ Assign worker
✓ Release payment
✓ Submit rating
✓ Verify on blockchain explorer

# 5. Monitoring
✓ Prometheus scraping metrics
✓ Grafana dashboards showing data
✓ Sentry receiving errors (test with sample error)
✓ Logs aggregating correctly
✓ Alerts configured

# 6. Security
✓ Secrets not exposed
✓ HTTPS enforced
✓ Rate limiting working
✓ SQL injection protected
✓ XSS protection enabled
✓ CSRF protection enabled
```

---

**Deployment complete!** 🎉

Monitor for the first 24 hours and be ready to rollback if needed.

---

*Last updated: November 23, 2025 • [Report deployment issue](https://github.com/yuvrajsharmaaa/WajoB/issues)*
