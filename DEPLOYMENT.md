# 🚀 WajoB Deployment Best Practices

## Overview

This guide provides comprehensive deployment strategies for all components of the WajoB ecosystem across development, staging, and production environments.

---

## 🏗️ Multi-Stage Environment Setup

### Environment Structure

```
Development (Local)
├── Frontend: localhost:3000
├── Backend: localhost:3001
├── TON Network: Testnet
├── Database: Local PostgreSQL
└── Redis: Local instance

Staging (Testnet)
├── Frontend: https://staging.wagob.com
├── Backend: https://api-staging.wagob.com
├── TON Network: Testnet
├── Database: Cloud PostgreSQL (staging)
└── Redis: Cloud Redis (staging)

Production (Mainnet)
├── Frontend: https://wagob.com
├── Backend: https://api.wagob.com
├── TON Network: Mainnet
├── Database: Cloud PostgreSQL (production)
└── Redis: Cloud Redis (production)
```

### Environment Variables Management

```bash
# .env.development
NODE_ENV=development
TON_NETWORK=testnet
TON_API_ENDPOINT=https://testnet.toncenter.com/api/v2
DATABASE_URL=postgresql://localhost:5432/wagob_dev
REDIS_URL=redis://localhost:6379
TELEGRAM_BOT_TOKEN=<dev_bot_token>
FRONTEND_URL=http://localhost:3000

# .env.staging
NODE_ENV=staging
TON_NETWORK=testnet
TON_API_ENDPOINT=https://testnet.toncenter.com/api/v2
DATABASE_URL=postgresql://user:pass@staging-db.cloud.com:5432/wagob
REDIS_URL=redis://:password@staging-redis.cloud.com:6379
TELEGRAM_BOT_TOKEN=<staging_bot_token>
FRONTEND_URL=https://staging.wagob.com

# .env.production
NODE_ENV=production
TON_NETWORK=mainnet
TON_API_ENDPOINT=https://toncenter.com/api/v2
DATABASE_URL=postgresql://user:pass@prod-db.cloud.com:5432/wagob
REDIS_URL=redis://:password@prod-redis.cloud.com:6379
TELEGRAM_BOT_TOKEN=<prod_bot_token>
FRONTEND_URL=https://wagob.com
```

---

## 📜 Smart Contract Deployment

### 1. Testnet Deployment

```bash
#!/bin/bash
# scripts/deploy-contracts-testnet.sh

set -e

echo "🚀 Deploying WajoB contracts to TON Testnet..."

# Build contracts
echo "📦 Building contracts..."
cd contract
npm run build

# Run tests
echo "🧪 Running tests..."
npm run test

# Deploy JobRegistry
echo "📝 Deploying JobRegistry..."
npx blueprint run deployDeployJobRegistry --network testnet

# Deploy Escrow
echo "💰 Deploying Escrow..."
npx blueprint run deployDeployEscrow --network testnet

# Deploy Reputation
echo "⭐ Deploying Reputation..."
npx blueprint run deployDeployReputation --network testnet

# Save addresses
echo "💾 Saving contract addresses..."
cat > ../backend/src/config/contracts.testnet.json << EOF
{
  "jobRegistry": "$(cat temp/testnet/DeployJobRegistry.address)",
  "escrow": "$(cat temp/testnet/DeployEscrow.address)",
  "reputation": "$(cat temp/testnet/DeployReputation.address)",
  "network": "testnet",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Testnet deployment complete!"
echo "📍 JobRegistry: $(cat temp/testnet/DeployJobRegistry.address)"
echo "📍 Escrow: $(cat temp/testnet/DeployEscrow.address)"
echo "📍 Reputation: $(cat temp/testnet/DeployReputation.address)"
```

### 2. Contract Testing Checklist

```typescript
// contract/tests/integration.spec.ts
import { Blockchain } from '@ton/sandbox';
import { toNano } from '@ton/core';

describe('WajoB Integration Tests', () => {
  let blockchain: Blockchain;
  let jobRegistry: any;
  let escrow: any;
  let reputation: any;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    // Deploy contracts...
  });

  describe('Gas Usage Tests', () => {
    it('should create job within gas limit', async () => {
      const result = await jobRegistry.sendCreateJob({
        jobId: 1,
        wages: toNano('100'),
        duration: 8,
      });
      
      // Verify gas usage
      expect(result.transactions).toHaveTransaction({
        success: true,
        op: 0x7362d09c,
      });
      
      const gasUsed = result.transactions[0].totalFees;
      expect(gasUsed).toBeLessThan(toNano('0.1'));
      
      console.log(`Gas used for job creation: ${gasUsed}`);
    });

    it('should handle batch operations efficiently', async () => {
      // Test batch ratings submission
      const startGas = await blockchain.getBalance();
      
      for (let i = 0; i < 10; i++) {
        await reputation.sendSubmitRating({
          jobId: i,
          rating: 5,
        });
      }
      
      const endGas = await blockchain.getBalance();
      const avgGasPerRating = (startGas - endGas) / 10n;
      
      console.log(`Average gas per rating: ${avgGasPerRating}`);
      expect(avgGasPerRating).toBeLessThan(toNano('0.05'));
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle out-of-gas gracefully', async () => {
      const result = await escrow.sendReleaseFunds({
        jobId: 1,
        value: toNano('0.001'),  // Insufficient gas
      });
      
      expect(result.transactions).toHaveTransaction({
        success: false,
        exitCode: 13,  // Out of gas
      });
      
      // Verify state wasn't corrupted
      const escrowData = await escrow.getEscrowData(1);
      expect(escrowData.status).toBe(EscrowStatus.LOCKED);
    });

    it('should prevent reentrancy attacks', async () => {
      // Deploy malicious contract attempting reentrancy
      const attacker = await blockchain.deployContract(MaliciousContract);
      
      const result = await escrow.sendWithdraw({
        from: attacker.address,
      });
      
      expect(result.transactions).toHaveTransaction({
        success: false,
        exitCode: 401,  // Reentrancy detected
      });
    });
  });

  describe('Concurrency Tests', () => {
    it('should handle concurrent job applications', async () => {
      const worker1 = await blockchain.treasury('worker1');
      const worker2 = await blockchain.treasury('worker2');
      
      // Both workers try to accept same job simultaneously
      const [result1, result2] = await Promise.all([
        jobRegistry.sendAcceptJob({ from: worker1, jobId: 1 }),
        jobRegistry.sendAcceptJob({ from: worker2, jobId: 1 }),
      ]);
      
      // Only one should succeed
      const successes = [result1, result2].filter(r => 
        r.transactions.find(tx => tx.success)
      );
      
      expect(successes).toHaveLength(1);
    });

    it('should handle double-spend attempts', async () => {
      // Try to release escrow funds twice
      const result1 = await escrow.sendReleaseFunds({ jobId: 1 });
      const result2 = await escrow.sendReleaseFunds({ jobId: 1 });
      
      expect(result1.transactions).toHaveTransaction({ success: true });
      expect(result2.transactions).toHaveTransaction({ 
        success: false,
        exitCode: 402,  // Already released
      });
    });
  });
});
```

### 3. Mainnet Deployment

```bash
#!/bin/bash
# scripts/deploy-contracts-mainnet.sh

set -e

echo "⚠️  MAINNET DEPLOYMENT - This will cost real TON!"
echo "Contract addresses from testnet:"
cat contract/temp/testnet/*.address
echo ""
read -p "Have these contracts been audited? (yes/no): " audited

if [ "$audited" != "yes" ]; then
  echo "❌ Deployment aborted. Contracts must be audited before mainnet deployment."
  exit 1
fi

read -p "Continue with mainnet deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

echo "🚀 Deploying to MAINNET..."

# Set mainnet configuration
export TON_NETWORK=mainnet
export TON_API_KEY=$MAINNET_API_KEY

# Build with production optimizations
npm run build:production

# Deploy contracts
npx blueprint run deployDeployJobRegistry --network mainnet
npx blueprint run deployDeployEscrow --network mainnet
npx blueprint run deployDeployReputation --network mainnet

# Save production addresses
cat > ../backend/src/config/contracts.mainnet.json << EOF
{
  "jobRegistry": "$(cat temp/mainnet/DeployJobRegistry.address)",
  "escrow": "$(cat temp/mainnet/DeployEscrow.address)",
  "reputation": "$(cat temp/mainnet/DeployReputation.address)",
  "network": "mainnet",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployedBy": "$(git config user.email)"
}
EOF

echo "✅ MAINNET deployment complete!"
echo "⚠️  DO NOT LOSE THESE ADDRESSES:"
cat ../backend/src/config/contracts.mainnet.json

# Create backup
cp ../backend/src/config/contracts.mainnet.json \
   "../backups/contracts.mainnet.$(date +%Y%m%d_%H%M%S).json"
```

---

## 🌐 Frontend Deployment (Vercel/Netlify)

### Vercel Deployment

```json
// vercel.json
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
      }
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@api-url",
    "REACT_APP_TON_NETWORK": "@ton-network"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "ALLOW-FROM https://t.me"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

```bash
#!/bin/bash
# scripts/deploy-frontend-vercel.sh

# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel --env REACT_APP_TON_NETWORK=testnet \
       --env REACT_APP_API_URL=https://api-staging.wagob.com \
       --token $VERCEL_TOKEN

# Deploy to production
vercel --prod \
       --env REACT_APP_TON_NETWORK=mainnet \
       --env REACT_APP_API_URL=https://api.wagob.com \
       --token $VERCEL_TOKEN
```

### Netlify Deployment

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build"
  
[build.environment]
  NODE_VERSION = "20"
  REACT_APP_TON_NETWORK = "mainnet"

[[redirects]]
  from = "/api/*"
  to = "https://api.wagob.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "ALLOW-FROM https://t.me"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://telegram.org; connect-src 'self' https://api.wagob.com https://api.ton.org"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 🖥️ Backend Deployment

### Docker Production Image

```dockerfile
# backend/Dockerfile.production
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-bookworm-slim AS production

# Security: Create non-root user
RUN groupadd -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup nestjs

WORKDIR /app

# Install dumb-init and security updates
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy dependencies and built app
COPY --from=builder --chown=nestjs:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:appgroup /app/dist ./dist
COPY --from=builder --chown=nestjs:appgroup /app/package.json ./

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start app
CMD ["node", "dist/main.js"]
```

### Railway Deployment

```bash
#!/bin/bash
# scripts/deploy-backend-railway.sh

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Set environment variables
railway variables set NODE_ENV=production
railway variables set TON_NETWORK=mainnet
railway variables set PORT=3001

# Deploy
railway up

# Get deployment URL
railway domain

echo "✅ Backend deployed to Railway!"
```

### AWS ECS Deployment

```yaml
# backend/aws/task-definition.json
{
  "family": "wagob-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/wagobBackendRole",
  "containerDefinitions": [
    {
      "name": "wagob-backend",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/wagob-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "TON_NETWORK",
          "value": "mainnet"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:wagob/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:wagob/jwt-secret"
        },
        {
          "name": "TELEGRAM_BOT_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:wagob/telegram-token"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/wagob-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3001/api/v1/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

```bash
#!/bin/bash
# scripts/deploy-backend-aws.sh

# Build and push Docker image
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

docker build -t wagob-backend -f Dockerfile.production .
docker tag wagob-backend:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/wagob-backend:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/wagob-backend:latest

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://aws/task-definition.json

# Update service
aws ecs update-service \
  --cluster wagob-cluster \
  --service wagob-backend \
  --task-definition wagob-backend \
  --force-new-deployment

echo "✅ Backend deployed to AWS ECS!"
```

### Google Cloud Run

```bash
#!/bin/bash
# scripts/deploy-backend-gcp.sh

# Build container
gcloud builds submit \
  --tag gcr.io/PROJECT_ID/wagob-backend \
  --project PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy wagob-backend \
  --image gcr.io/PROJECT_ID/wagob-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,TON_NETWORK=mainnet \
  --set-secrets DATABASE_URL=wagob-database-url:latest,\
JWT_SECRET=wagob-jwt-secret:latest,\
TELEGRAM_BOT_TOKEN=wagob-telegram-token:latest \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi \
  --timeout 60s \
  --project PROJECT_ID

echo "✅ Backend deployed to Google Cloud Run!"
```

---

## 🤖 Telegram Bot Deployment

### Webhook Configuration

```typescript
// backend/src/modules/telegram/telegram.service.ts
export class TelegramService implements OnModuleInit {
  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') {
      await this.setWebhook();
    } else {
      await this.startPolling();
    }
  }

  private async setWebhook() {
    const webhookUrl = `${process.env.BACKEND_URL}/api/v1/telegram/webhook`;
    
    try {
      await this.bot.setWebHook(webhookUrl, {
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: [
          'message',
          'callback_query',
          'inline_query'
        ],
        drop_pending_updates: true,
      });
      
      this.logger.log(`Webhook set: ${webhookUrl}`);
    } catch (error) {
      this.logger.error('Failed to set webhook:', error);
      throw error;
    }
  }

  private async startPolling() {
    this.logger.log('Starting polling mode (development)');
    await this.bot.startPolling({
      polling: {
        interval: 1000,
        timeout: 30,
      },
    });
  }
}
```

---

## 🔄 CI/CD Pipelines

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy WajoB

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run linter
        run: |
          cd backend
          npm run lint
      
      - name: Run tests
        run: |
          cd backend
          npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Run E2E tests
        run: |
          cd backend
          npm run test:e2e
  
  test-contracts:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install contract dependencies
        run: |
          cd contract
          npm ci
      
      - name: Build contracts
        run: |
          cd contract
          npm run build
      
      - name: Test contracts
        run: |
          cd contract
          npm run test

  deploy-staging:
    needs: [test, test-contracts]
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Frontend to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
          vercel-args: '--env REACT_APP_TON_NETWORK=testnet'
      
      - name: Deploy Backend to Railway (Staging)
        run: |
          npm i -g @railway/cli
          railway up --service backend-staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-production:
    needs: [test, test-contracts]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Frontend to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod --env REACT_APP_TON_NETWORK=mainnet'
      
      - name: Build and Push Docker Image
        run: |
          docker build -t wagob-backend:${{ github.sha }} -f backend/Dockerfile.production backend/
          docker tag wagob-backend:${{ github.sha }} wagob-backend:latest
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push wagob-backend:${{ github.sha }}
          docker push wagob-backend:latest
      
      - name: Deploy to Cloud Provider
        run: |
          # Deploy to your chosen provider (AWS/GCP/Azure/Railway)
          echo "Deploying to production..."
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
      
      - name: Notify Deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### Rollback Strategy

```bash
#!/bin/bash
# scripts/rollback.sh

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./rollback.sh <version>"
  exit 1
fi

echo "⚠️  Rolling back to version $VERSION"

# Rollback frontend
vercel rollback $VERSION --token $VERCEL_TOKEN

# Rollback backend (example for Railway)
railway rollback $VERSION

# Rollback database migrations
cd backend
npm run migration:revert

echo "✅ Rollback complete to version $VERSION"
```

---

## 📊 Monitoring & Logging

### Application Monitoring (Sentry)

```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Don't send sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
      }
      return event;
    },
  });
}
```

### Logging Configuration

```typescript
// backend/src/config/logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `${timestamp} [${context}] ${level}: ${message}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});
```

### Smart Contract Monitoring

```typescript
// backend/src/modules/monitoring/contract-monitor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ContractMonitorService {
  private readonly logger = new Logger(ContractMonitorService.name);

  @Cron('*/5 * * * *')  // Every 5 minutes
  async monitorContracts() {
    try {
      // Check contract balances
      const balances = await this.checkBalances();
      
      for (const [contract, balance] of Object.entries(balances)) {
        if (balance < MIN_BALANCE) {
          await this.alertLowBalance(contract, balance);
        }
      }

      // Check for unusual transaction patterns
      const unusualActivity = await this.detectUnusualActivity();
      
      if (unusualActivity.length > 0) {
        await this.alertSecurity(unusualActivity);
      }

      // Check contract states
      await this.verifyContractStates();
      
    } catch (error) {
      this.logger.error('Contract monitoring failed:', error);
    }
  }

  private async alertLowBalance(contract: string, balance: bigint) {
    // Send alert via Slack/Email
    this.logger.warn(`Low balance alert: ${contract} has ${balance} TON`);
  }

  private async alertSecurity(events: any[]) {
    // Send security alert
    this.logger.error('Unusual activity detected:', events);
  }
}
```

---

## 📋 Deployment Checklist

### Pre-Deployment

**Smart Contracts:**
- [ ] All contracts audited by professional firm
- [ ] Testnet deployment successful
- [ ] All tests passing (unit, integration, gas, concurrency)
- [ ] Contract addresses documented
- [ ] Backup/recovery plan documented

**Frontend:**
- [ ] Build succeeds without errors
- [ ] All environment variables configured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Performance optimized (Lighthouse score > 90)
- [ ] TON Connect integration tested

**Backend:**
- [ ] All tests passing (unit, integration, E2E)
- [ ] Database migrations prepared
- [ ] Redis configured and tested
- [ ] Environment variables secured
- [ ] API documentation updated
- [ ] Rate limiting configured
- [ ] Health check endpoint working

**Infrastructure:**
- [ ] Database backups automated
- [ ] Monitoring/alerting configured
- [ ] Logging centralized
- [ ] SSL certificates valid
- [ ] DNS records configured
- [ ] CDN configured (if applicable)

### Post-Deployment

- [ ] Verify all services healthy
- [ ] Test critical user flows end-to-end
- [ ] Verify Telegram bot responding
- [ ] Check blockchain transactions processing
- [ ] Monitor error rates
- [ ] Verify notifications sending
- [ ] Test rollback procedure
- [ ] Update status page
- [ ] Notify stakeholders

---

**Next: Set up monitoring dashboards and alert rules**
